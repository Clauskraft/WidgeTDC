// Multi-Agent Orchestrator for WidgeTDC PowerPoint Generation
// Coordinates all agents and manages the generation pipeline

import { EventEmitter } from 'events';
import { OutlineAgent } from './outline-agent';
import { ResearchAgent } from './research-agent';
import { PPTGenAgent } from './ppt-gen-agent';
import { QualityCheckerAgent } from './quality-checker-agent';

export class MultiAgentOrchestrator extends EventEmitter {
  private agents: Map<string, any> = new Map();
  private isRunning = false;
  private currentProgress = 0;

  constructor() {
    super();
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Initialize all agents
    this.agents.set('outline', new OutlineAgent());
    this.agents.set('research-1', new ResearchAgent('research-1'));
    this.agents.set('research-2', new ResearchAgent('research-2'));
    this.agents.set('research-3', new ResearchAgent('research-3'));
    this.agents.set('ppt-gen', new PPTGenAgent());
    this.agents.set('quality-checker', new QualityCheckerAgent());
  }

  /**
   * Main generation pipeline
   */
  async generatePresentation(input: GenerationInput): Promise<GenerationResult> {
    this.isRunning = true;
    this.currentProgress = 0;

    try {
      // Stage 1: Generate outline
      this.updateProgress('outline', 0);
      const outline = await this.runOutlineAgent(input.topic, input.requirements);
      this.updateProgress('outline', 100, outline);

      // Stage 2: Parallel research
      this.updateProgress('research', 0);
      const researchResults = await this.runParallelResearch(outline.sections);
      this.updateProgress('research', 100, researchResults);

      // Stage 3: Generate slides with quality loop
      this.updateProgress('generation', 0);
      const slides = await this.runPPTGeneration(outline, researchResults);
      this.updateProgress('generation', 100, slides);

      // Stage 4: Final assembly and export
      this.updateProgress('export', 0);
      const filePath = await this.exportPresentation(slides, input);
      this.updateProgress('export', 100, { filePath });

      this.isRunning = false;
      this.emit('complete', { filePath, outline, slides });

      return {
        success: true,
        filePath,
        outline,
        slides,
        qualityScores: await this.calculateQualityScores(slides)
      };
    } catch (error) {
      this.isRunning = false;
      this.emit('error', error);
      throw error;
    }
  }

  private async runOutlineAgent(topic: string, requirements?: string): Promise<Outline> {
    const agent = this.agents.get('outline');
    return await agent.generate(topic, requirements);
  }

  private async runParallelResearch(sections: Section[]): Promise<ResearchResult[]> {
    const researchAgents = [
      this.agents.get('research-1'),
      this.agents.get('research-2'),
      this.agents.get('research-3')
    ];

    const promises = sections.map((section, idx) => {
      const agent = researchAgents[idx % 3];
      return agent.research(section.topic);
    });

    return await Promise.all(promises);
  }

  private async runPPTGeneration(outline: Outline, research: ResearchResult[]): Promise<Slide[]> {
    const pptAgent = this.agents.get('ppt-gen');
    const checkerAgent = this.agents.get('quality-checker');
    const slides: Slide[] = [];

    for (let i = 0; i < outline.sections.length; i++) {
      const section = outline.sections[i];
      let slide: Slide;
      let attempts = 0;
      let isQualityOk = false;

      while (!isQualityOk && attempts < 3) {
        slide = await pptAgent.generateSlide(section, research[i]);
        const checkResult = await checkerAgent.checkSlide(slide);
        isQualityOk = checkResult.passed;

        if (!isQualityOk && attempts < 2) {
          console.log(`🔄 Retrying slide ${i + 1} (attempt ${attempts + 2}/3)`);
        }
        attempts++;
      }

      slides.push(slide!);
      this.emit('slide-generated', { slide, index: i + 1, total: outline.sections.length });
      this.updateProgress('generation', Math.round(((i + 1) / outline.sections.length) * 100));
    }

    return slides;
  }

  private async exportPresentation(slides: Slide[], input: GenerationInput): Promise<string> {
    // Call export service (python-pptx backend)
    const response = await fetch(`${process.env.MULTIAGENT_DOWNLOAD_URL}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slides, title: input.topic })
    });

    const result = await response.json();
    return result.file_path;
  }

  private async calculateQualityScores(slides: Slide[]): Promise<QualityScores> {
    const checkerAgent = this.agents.get('quality-checker');
    const scores = await Promise.all(slides.map(s => checkerAgent.checkSlide(s)));

    const avgContent = scores.reduce((sum, s) => sum + s.contentScore, 0) / scores.length;
    const avgDesign = scores.reduce((sum, s) => sum + s.designScore, 0) / scores.length;
    const avgCoherence = scores.reduce((sum, s) => sum + s.coherenceScore, 0) / scores.length;

    return { content: avgContent, design: avgDesign, coherence: avgCoherence };
  }

  private updateProgress(stage: string, progress: number, data?: any): void {
    this.currentProgress = progress;
    this.emit('progress', { stage, progress, data, timestamp: Date.now() });
  }

  public getStatus(): OrchestratorStatus {
    return {
      isRunning: this.isRunning,
      currentProgress: this.currentProgress,
      agents: Array.from(this.agents.keys())
    };
  }
}

// Interfaces
export interface GenerationInput {
  topic: string;
  requirements?: string;
  document?: string;
  templateId?: string;
}

export interface GenerationResult {
  success: boolean;
  filePath: string;
  outline: Outline;
  slides: Slide[];
  qualityScores: QualityScores;
}

export interface Outline {
  title: string;
  sections: Section[];
}

export interface Section {
  topic: string;
  title: string;
  subsections: string[];
  keyPoints: string[];
}

export interface ResearchResult {
  topic: string;
  findings: string[];
  data: any[];
  visualSuggestions: string[];
  references: string[];
}

export interface Slide {
  type: 'title' | 'content' | 'chart' | 'image' | 'table';
  title: string;
  content?: string;
  bullets?: string[];
  chart?: ChartData;
  image?: ImageData;
  table?: TableData;
  layout: string;
  notes?: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  data: any[];
  labels: string[];
}

export interface ImageData {
  url: string;
  caption?: string;
  position: 'center' | 'left' | 'right';
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface QualityScores {
  content: number;
  design: number;
  coherence: number;
}

export interface OrchestratorStatus {
  isRunning: boolean;
  currentProgress: number;
  agents: string[];
}
