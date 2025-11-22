typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useMCP } from '../useMCP';

describe('useMCP hook', () => {
  const originalFetch = globalThis.fetch;
  const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  let fetchMock: vi.Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, messageId: 'server-id' }),
    });
    globalThis.fetch = fetchMock;

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      enumerable: true,
      value: {
        randomUUID: vi.fn().mockReturnValue('test-uuid'),
      },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    
    if (originalCryptoDescriptor) {
      Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor);
    } else {
      delete globalThis.crypto;
    }
    
    vi.restoreAllMocks();
  });

  const getFetchCallBody = (callIndex = 0): any => {
    const [, requestInit] = fetchMock.mock.calls[callIndex];
    return JSON.parse(requestInit.body);
  };

  it('posts MCP messages to the middleware route by default', async () => {
    const { result } = renderHook(() => useMCP());

    await act(async () => {
      await result.current.send('memory-service', 'memory.get', { orgId: 'org-1' });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/mcp/route',
      expect.objectContaining({
        method: 'POST',
      }),
    );

    const body = getFetchCallBody();
    expect(body.sourceId).toBe('widget');
    expect(body.targetId).toBe('memory-service');
    expect(body.tool).toBe('memory.get');
  });

  it('allows overriding the sourceId and returns the server response', async () => {
    const responsePayload = { success: true, messageId: 'server-123', result: { ok: true } };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responsePayload),
    });

    const { result } = renderHook(() => useMCP());

    let response: any;
    await act(async () => {
      response = await result.current.send(
        'cma',
        'cma.context',
        { query: 'hello' },
        { sourceId: 'mcp-inspector', routePath: '/api/mcp/route' },
      );
    });

    const body = getFetchCallBody();
    expect(body.sourceId).toBe('mcp-inspector');
    expect(body.targetId).toBe('cma');
    expect(response).toEqual(responsePayload);
  });
});