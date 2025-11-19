import type { GenerativeModel } from '@google/generative-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_MODEL = process.env.GENAI_MODEL ?? 'gemini-1.5-pro';

let customModelProvider: (() => GenerativeModel) | null = null;

export const setGenerativeModelProvider = (provider: (() => GenerativeModel) | null) => {
  customModelProvider = provider;
};

const resolveModel = (): GenerativeModel => {
  if (customModelProvider) {
    return customModelProvider();
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is required for Evolution code generation.');
  }

  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: DEFAULT_MODEL });
};

const buildPrompt = (spec: string, testPlan: string, kpiThreshold: number): string => `You are the Evolution Agent.
Generate modern, secure TypeScript that satisfies the following product specification:
${spec}

Acceptance criteria & test plan:
${testPlan}

Constraints:
- Only output executable TypeScript (no markdown fences, no commentary)
- Include exported functions/classes so tests can import them
- Target KPI coverage >= ${kpiThreshold}%
- Prefer pure functions and dependency injection
`;

export async function generateCode(spec: string, testPlan: string, kpiThreshold = 80): Promise<string> {
  const model = resolveModel();
  const prompt = buildPrompt(spec, testPlan, kpiThreshold);

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  });

  const code = result.response.text().trim();

  if (!code) {
    throw new Error('Model returned empty code.');
  }

  if (!code.includes('export')) {
    throw new Error('Generated code must export at least one symbol.');
  }

  if (/throw\s+new\s+Error\('placeholder'\)/i.test(code)) {
    throw new Error('Model produced placeholder content.');
  }

  return code;
}

export async function refineCode(code: string, errorLog: string): Promise<string> {
  const model = resolveModel();
  const prompt = `You previously generated the following code:\n${code}\nIt failed with:\n${errorLog}\nReturn ONLY the corrected code.`;

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  });

  const refined = result.response.text().trim();
  if (!refined) {
    throw new Error('Model returned empty refinement.');
  }

  return refined;
}
