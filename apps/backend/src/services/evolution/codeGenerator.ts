// Agent-driven code generation service
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EvolutionPromptVersion } from '../../types';  // From shared

type GenerativeModel = {
  generateContent: (prompt: string) => Promise<{ response: { text: () => Promise<string> | string } }>;
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let cachedModel: GenerativeModel | null = null;

function getDefaultModel(): GenerativeModel | null {
  if (cachedModel) {
    return cachedModel;
  }

  if (!GEMINI_API_KEY) {
    return null;
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  cachedModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  return cachedModel;
}

async function resolveText(result: { text: () => Promise<string> | string }): Promise<string> {
  const value = result.text();
  return value instanceof Promise ? await value : value;
}

export async function generateCode(
  spec: string,
  testPlan: string,
  kpiThreshold = 80,
  generativeModel: GenerativeModel | null = getDefaultModel()
): Promise<string> {
  if (!generativeModel) {
    throw new Error('Gemini model not configured. Set GEMINI_API_KEY to enable code generation.');
  }

  const prompt = `You are Evolution Agent. Generate TypeScript code for: ${spec}.
  Follow testplan: ${testPlan}.
  Ensure: TS types, integration with MCP/personal_entities/4-layer.
  Output ONLY code - no explanations.
  KPI: Coverage >${kpiThreshold}%, no errors.`;

  const result = await generativeModel.generateContent(prompt);
  const code = await resolveText(result.response);

  // Post-process: Validate syntax (simple check)
  if (!code.includes('export') || code.includes('error')) {
    throw new Error('Generated code invalid - retrying...');
  }

  // Log run for Evolution
  // await reportRun('code-gen', { kpi: coverage });  // Placeholder

  return code;
}

export async function refineCode(
  code: string,
  errorLog: string,
  generativeModel: GenerativeModel | null = getDefaultModel()
): Promise<string> {
  const refinePrompt = `Refine this code:\n${code}\nFix these errors: ${errorLog}.\nReturn ONLY the corrected code.`;

  if (!generativeModel) {
    return `${code}\n// TODO: ${errorLog}`;
  }

  const result = await generativeModel.generateContent(refinePrompt);
  return resolveText(result.response);
}
