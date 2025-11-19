import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCode, refineCode, setEvolutionModelOverride } from './codeGenerator';

const mockModel = {
  generateContent: vi.fn(),
};

describe('CodeGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModel.generateContent.mockReset();
    setEvolutionModelOverride(mockModel as any);
  });

  afterEach(() => {
    setEvolutionModelOverride(null);
  });

  it('generates valid TS code', async () => {
    mockModel.generateContent.mockResolvedValue({
      response: { text: () => 'export function aulaPoller() { return true; }' },
    });
    const code = await generateCode('test spec', 'test plan');
    expect(code).toContain('export function aulaPoller');
    expect(mockModel.generateContent).toHaveBeenCalled();
  });

  it('refines code on error', async () => {
    mockModel.generateContent.mockResolvedValue({
      response: { text: () => 'export const fixed = true;' },
    });
    const refined = await refineCode('bad code', 'Syntax error');
    expect(refined).toContain('export const fixed');
  });
});
