import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { pollAula, __setAulaModel } from './aulaPoller';
import { PersonalEntityRepository } from '../personal/personalRepository';
import { mcpEmitter } from '../../mcp/gateway';
import { logAudit } from '../../utils/audit';

vi.mock('axios');
vi.mock('../personal/personalRepository', () => ({
  PersonalEntityRepository: {
    findByUserAndType: vi.fn(),
    updateCreds: vi.fn(),
    getUsersWithAulaConsent: vi.fn(),
  },
}));
vi.mock('../../mcp/gateway', () => ({
  mcpEmitter: {
    emit: vi.fn(),
  },
}));
vi.mock('../../utils/audit', () => ({
  logAudit: vi.fn(),
}));
vi.mock('../auth/aulaOAuth', () => ({
  refreshToken: vi.fn().mockResolvedValue('refreshed-token'),
}));

const mockModel = {
  generateContent: vi.fn().mockResolvedValue({
    response: {
      text: () => 'Personlig resumé',
    },
  }),
};

describe('AulaPoller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModel.generateContent.mockClear();
    __setAulaModel(mockModel as any);
  });

  afterEach(() => {
    __setAulaModel(null);
  });

  it('emits MCP alerts for high-priority Aula messages', async () => {
    vi.mocked(PersonalEntityRepository.findByUserAndType).mockImplementation(async (_userId: string, types: any) => {
      if (Array.isArray(types)) {
        return [
          {
            user_id: 'user1',
            org_id: 'org1',
            entity_type: 'self',
            consent_given: true,
            preferences: { skole: 'high' },
          },
        ];
      }
      return {
        user_id: 'user1',
        org_id: 'org1',
        entity_type: 'aula-credentials',
        consent_given: true,
        creds: {
          access_token: 'token',
          expires_at: new Date(Date.now() + 60_000).toISOString(),
        },
      };
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: {
        messages: [
          { id: '1', title: 'Test', body: 'Akut info', priority: 'high', timestamp: 'now' },
        ],
      },
    } as any);

    await pollAula('user1', 'org1');

    expect(axios.get).toHaveBeenCalled();
    expect(mcpEmitter.emit).toHaveBeenCalledWith(
      'aula-alert',
      expect.objectContaining({
        user_id: 'user1',
        org_id: 'org1',
        body: 'Personlig resumé',
      })
    );
    expect(logAudit).toHaveBeenCalledWith('org1', 'user1', 'aula_notification_sent', expect.any(Object));
  });

  it('skips processing when consent is missing', async () => {
    vi.mocked(PersonalEntityRepository.findByUserAndType).mockResolvedValue([
      { consent_given: false },
    ] as any);

    vi.mocked(axios.get).mockResolvedValue({
      data: { messages: [{ id: '1', title: 'info', body: 'body', priority: 'high', timestamp: 'now' }] },
    } as any);

    await pollAula('user1', 'org1', { accessToken: 'token' });

    expect(mcpEmitter.emit).not.toHaveBeenCalled();
    expect(logAudit).not.toHaveBeenCalled();
  });

  it('logs errors when Aula API call fails', async () => {
    vi.mocked(PersonalEntityRepository.findByUserAndType).mockResolvedValue({
      user_id: 'user1',
      org_id: 'org1',
      entity_type: 'aula-credentials',
      consent_given: true,
      creds: {
        access_token: 'expired',
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
    } as any);
    vi.mocked(axios.get).mockRejectedValue(new Error('Network fail'));

    await expect(pollAula('user1', 'org1')).resolves.toBeUndefined();
  });
});
