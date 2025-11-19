import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { pollAula } from './aulaPoller';
import { PersonalEntityRepository } from '../personal/personalRepository';
import { mcpEmitter } from '../../mcp/gateway';
import { logAudit } from '../../utils/audit';

vi.mock('axios');
vi.mock('../personal/personalRepository', () => ({
  PersonalEntityRepository: {
    findByUserAndType: vi.fn(),
    findManyByUserAndTypes: vi.fn(),
    updateCreds: vi.fn(),
    getUsersWithAulaConsent: vi.fn(),
    storeTempState: vi.fn(),
    getTempState: vi.fn(),
  },
}));
vi.mock('../../mcp/gateway', () => ({
  mcpEmitter: { emit: vi.fn() },
}));
vi.mock('../../utils/audit', () => ({
  logAudit: vi.fn(),
}));
vi.mock('@google/generative-ai', () => ({
  genAI: {
    getGenerativeModel: () => ({
      generateContent: vi.fn().mockResolvedValue({ response: { text: () => 'Personlig resumé' } }),
    }),
  },
}));
vi.mock('../auth/aulaOAuth', () => ({
  refreshToken: vi.fn().mockResolvedValue('new-token'),
}));

describe('AulaPoller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(PersonalEntityRepository.findByUserAndType).mockResolvedValue({
      user_id: 'user1',
      org_id: 'org1',
      entity_type: 'aula-credentials',
      consent_given: true,
      creds: {
        access_token: 'access-token',
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
    } as any);
    vi.mocked(PersonalEntityRepository.findManyByUserAndTypes).mockResolvedValue([
      { consent_given: true, preferences: { priority: 'high' } },
    ] as any);
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        messages: [
          { id: '1', title: 'Test', body: 'Akut info', priority: 'high', timestamp: 'now' },
          { id: '2', title: 'Low', body: 'Info', priority: 'low', timestamp: 'now' },
        ],
      },
    });
  });

  it('emits alerts for high priority messages', async () => {
    await pollAula('user1', 'org1');

    expect(mcpEmitter.emit).toHaveBeenCalledWith(
      'aula-alert',
      expect.objectContaining({
        title: expect.stringContaining('Akut Aula'),
        body: 'Personlig resumé',
      })
    );
    expect(logAudit).toHaveBeenCalledWith('org1', 'user1', 'aula_notification_sent', expect.any(Object));
  });

  it('skips when no consent is available', async () => {
    vi.mocked(PersonalEntityRepository.findManyByUserAndTypes).mockResolvedValue([] as any);

    await pollAula('user1', 'org1');

    expect(mcpEmitter.emit).not.toHaveBeenCalled();
  });

  it('handles network errors without throwing', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('network fail'));

    await expect(pollAula('user1', 'org1')).resolves.toBeUndefined();
  });
});