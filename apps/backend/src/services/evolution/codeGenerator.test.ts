import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCode, refineCode } from './codeGenerator';

const mockModel = {
  generateContent: vi.fn(),
};

describe('CodeGenerator', () => {
  beforeEach(() => {
    mockModel.generateContent.mockReset();
  });

  it('generates valid TS code', async () => {
    mockModel.generateContent.mockResolvedValue({
      response: { text: () => 'export function aulaPoller() { /* code */ }' },
    });
    const code = await generateCode('test spec', 'test plan', 80, mockModel);
    expect(code).toContain('export');
    expect(code).not.toContain('error');
  });

  it('refines code on error', async () => {
    mockModel.generateContent.mockResolvedValue({
      response: { text: () => 'export const refined = true;' },
    });

    const refined = await refineCode('bad code', 'Syntax error', mockModel);
    expect(refined).toContain('export const refined');
  });
});
