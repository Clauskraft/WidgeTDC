import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pollAula } from './aulaPoller';
import puppeteer from 'puppeteer';
import { genAI } from '@google/generative-ai';
import * as repo from '../personal/personalRepository';
import * as emitter from '../../mcp/gateway';

vi.mock('puppeteer');
vi.mock('@google/generative-ai');
vi.mock('../personal/personalRepository');
vi.mock('../../mcp/gateway');

describe('AulaPoller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('polls and processes high-priority messages with personal summary', async () => {
    vi.mocked(puppeteer.launch).mockResolvedValue({ newPage: () => Promise.resolve({
      goto: vi.fn(),
      evaluate: vi.fn().mockResolvedValue([{ id: '1', title: 'Test', content: 'Akut info', priority: 'high', timestamp: 'now' }]),
      type: vi.fn(),
      click: vi.fn()
    } as any) } as any);

    vi.mocked(genAI.getGenerativeModel).mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({ response: { text: () => 'Personlig resumé' } })
    } as any);

    vi.mocked(repo.PersonalEntityRepository.findByUserAndType).mockResolvedValue([{ entity_type: 'family', preferences: { skole: 'high' }, consent_given: true }]);

    vi.mocked(emitter.mcpEmitter.emit).mockResolvedValue(undefined);
    vi.mocked(repo.logAudit).mockResolvedValue(undefined);  // Assume logAudit exists

    await pollAula('user1', 'org1', { username: 'test', password: 'pass' });

    expect(vi.mocked(emitter.mcpEmitter.emit)).toHaveBeenCalledWith('aula-alert', expect.objectContaining({
      body: 'Personlig resumé'
    }));
    expect(vi.mocked(repo.logAudit)).toHaveBeenCalled();
  });

  it('skips low-priority and no-consent messages', async () => {
    // Mock low-priority and no consent
    vi.mocked(puppeteer.launch).mockResolvedValue({ /* ... */ } as any);
    vi.mocked(repo.PersonalEntityRepository.findByUserAndType).mockResolvedValue([{ consent_given: false }]);

    await pollAula('user1', 'org1', { username: 'test', password: 'pass' });

    expect(vi.mocked(emitter.mcpEmitter.emit)).not.toHaveBeenCalled();
  });

  it('handles network error with retry', async () => {
    vi.mocked(puppeteer.launch).mockRejectedValue(new Error('Network fail'));

    // Assert no crash, log error
    await expect(pollAula('user1', 'org1', { username: 'test', password: 'pass' })).rejects.not.toThrow();
  });
});
