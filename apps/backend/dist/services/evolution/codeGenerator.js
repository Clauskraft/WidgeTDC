// Agent-driven code generation service
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
export async function generateCode(spec, testPlan, kpiThreshold = 80) {
    const prompt = `You are Evolution Agent. Generate TypeScript code for: ${spec}.
  Follow testplan: ${testPlan}.
  Ensure: TS types, integration with MCP/personal_entities/4-layer.
  Output ONLY code - no explanations.
  KPI: Coverage >${kpiThreshold}%, no errors.`;
    const result = await model.generateContent(prompt);
    const code = await result.response.text();
    // Post-process: Validate syntax (simple check)
    if (!code.includes('export') || code.includes('error')) {
        throw new Error('Generated code invalid - retrying...');
    }
    // Log run for Evolution
    // await reportRun('code-gen', { kpi: coverage });  // Placeholder
    return code;
}
export async function refineCode(code, errorLog) {
    const refinePrompt = `Refine this code: ${code}. Fix errors: ${errorLog}. Output ONLY fixed code.`;
    // Similar genAI call...
    return 'refined code'; // Placeholder
}
