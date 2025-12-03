// PPTAgent Service - Integration with icip-cas/PPTAgent
// Handles 2-stage generation and PPTEval quality assessment

export class PPTAgentService {
  private apiBase: string;
  private dockerContainer: string = 'pptagent';

  constructor() {
    this.apiBase = process.env.PPTAGENT_URL || 'http://localhost:9297';
  }

  /**
   * Stage 1: Analyze reference presentations to learn patterns
   */
  async analyzeReferences(referenceFiles: string[]): Promise<AnalysisResult> {
    const response = await fetch(`${this.apiBase}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ references: referenceFiles })
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Stage 2: Generate presentation with learned patterns
   */
  async generatePresentation(input: GenerationInput): Promise<string> {
    const response = await fetch(`${this.apiBase}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: input.sourceDocument,
        outline: input.outline,
        style_patterns: input.learnedPatterns,
        language_model: process.env.PPTAGENT_LANGUAGE_MODEL,
        vision_model: process.env.PPTAGENT_VISION_MODEL
      })
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.presentation_path;
  }

  /**
   * Evaluate presentation using PPTEval framework
   */
  async evaluatePresentation(pptxPath: string): Promise<PPTEvalResult> {
    const response = await fetch(`${this.apiBase}/api/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presentation_path: pptxPath })
    });

    if (!response.ok) {
      throw new Error(`Evaluation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBase}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Interfaces
export interface GenerationInput {
  sourceDocument: string;
  outline: string;
  learnedPatterns?: any;
}

export interface AnalysisResult {
  slide_roles: string[];
  structural_patterns: any;
  content_schemas: any;
}

export interface PPTEvalResult {
  content: number;
  design: number;
  coherence: number;
  suggestions: string[];
}
