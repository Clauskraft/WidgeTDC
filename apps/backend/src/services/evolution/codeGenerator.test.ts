import { describe, it, expect, vi } from 'vitest';
import { generateCode, refineCode } from './codeGenerator';
import { genAI } from '@google/generative-ai';  // Mock

vi.mock('@google/generative-ai');

describe('CodeGenerator', () => {
  it('generates valid TS code', async () => {
    vi.mocked(genAI.getGenerativeModel).mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => 'export function aulaPoller() { /* code */ }' }
      })
    });
    const code = await generateCode('test spec', 'test plan');
    expect(code).toContain('export');
    expect(code).not.toContain('error');
  });

  it('refines code on error', async () => {
    // Test refineCode
    const refined = await refineCode('bad code', 'Syntax error');
    expect(refined).toContain('export');  // Placeholder assert
  });
});
