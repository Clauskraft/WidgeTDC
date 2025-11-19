import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

let cachedModel: GenerativeModel | null = null;
let modelOverride: GenerativeModel | null = null;

function resolveModel(): GenerativeModel {
  if (modelOverride) {
    return modelOverride;
  }

  if (cachedModel) {
    return cachedModel;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Provide it or inject a mock via setEvolutionModelOverride.');
  }

  const client = new GoogleGenerativeAI(apiKey);
  cachedModel = client.getGenerativeModel({ model: 'gemini-pro' });
  return cachedModel;
}

export function setEvolutionModelOverride(model: GenerativeModel | null): void {
  modelOverride = model;
  cachedModel = model;
}

export async function generateCode(spec: string, testPlan: string, kpiThreshold = 80): Promise<string> {
  const prompt = `You are Evolution Agent (prompt v1.0).
Generate TypeScript code for: ${spec}.
Follow this test plan: ${testPlan}.
Ensure strong typing, MCP integration, and readiness for automated smoke/integration tests.
Respond with CODE ONLY. KPI: Coverage > ${kpiThreshold}% and zero TypeScript errors.`;

  const model = resolveModel();
  const result = await model.generateContent(prompt);
  const code = await result.response.text();

  if (!code.includes('export') || /error/i.test(code)) {
    throw new Error('Generated code failed validation');
  }

  return code;
}

export async function refineCode(code: string, errorLog: string): Promise<string> {
  const prompt = `You are Evolution Agent. Refine the following TypeScript code:\n${code}\nFix these issues:\n${errorLog}\nReturn code only.`;
  const model = resolveModel();
  const result = await model.generateContent(prompt);
  return await result.response.text();
}
