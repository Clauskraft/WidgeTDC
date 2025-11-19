import type { GenerativeModel } from '@google/generative-ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateCode, refineCode, setGenerativeModelProvider } from './codeGenerator';

const createMockModel = (output: string): GenerativeModel => ({
  generateContent: vi.fn().mockResolvedValue({
    response: {
      text: () => output,
    },
  }),
} as unknown as GenerativeModel);

describe('CodeGenerator', () => {
  beforeEach(() => {
    setGenerativeModelProvider(null);
  });

  it('generates valid TS code', async () => {
    const mockModel = createMockModel('export function aulaPoller() { return true; }');
    setGenerativeModelProvider(() => mockModel);

    const code = await generateCode('test spec', 'test plan');

    expect(code).toContain('export');
    expect(mockModel.generateContent).toHaveBeenCalled();
  });

  it('refines code on error', async () => {
    const mockModel = createMockModel('export const fixed = true;');
    setGenerativeModelProvider(() => mockModel);

    const refined = await refineCode('bad code', 'Syntax error');

    expect(refined).toContain('export');
    expect(mockModel.generateContent).toHaveBeenCalled();
  });
});
