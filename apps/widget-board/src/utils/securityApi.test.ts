import { describe, it, expect, vi } from 'vitest';
import { fetchSecurityFeeds, ingestFeed, pollCertEu } from '../../utils/securityApi';
import axios from 'axios';
import { mcpClient } from '../mcpClient';  // Mock

vi.mock('axios');
vi.mock('../mcpClient');

describe('SecurityApi', () => {
  it('fetches real feeds via MCP, falls back on error', async () => {
    vi.mocked(mcpClient.call).mockResolvedValue({ payload: { feeds: [] } });
    const data = await fetchSecurityFeeds();
    expect(data).toHaveProperty('feeds');

    vi.mocked(mcpClient.call).mockRejectedValue(new Error('Fail'));
      const fallback = await fetchSecurityFeeds();
      expect(fallback.metrics).toHaveProperty('documentsIndexed', 98231);  // From fallback
  });

  it('ingests feed with dedupe and emits event', async () => {
    vi.mocked(mcpClient.call).mockResolvedValue({ payload: { deduped: true } });
    vi.mocked(mcpClient.emit).mockResolvedValue(undefined);

    await ingestFeed('test-feed', { data: 'test' });
    expect(vi.mocked(mcpClient.call)).toHaveBeenCalledWith('srag.dedupe', expect.any(Object));
    expect(vi.mocked(mcpClient.emit)).toHaveBeenCalledWith('feed-update', expect.objectContaining({ type: 'personal-hybrid' }));
  });

  it('polls CERT-EU RSS', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: '<rss><item><title>Test Advisory</title></item></rss>' });
    const items = await pollCertEu();
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveProperty('title', 'Test Advisory');
  });
});
