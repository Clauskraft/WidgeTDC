/**
 * Document Generation Service
 * Unified service for generating PowerPoint, Word, and Excel documents
 */

import { eventBus } from '../../mcp/EventBus.js';
import { logger } from '../../utils/logger.js';
import { getMCPPowerPointBackend } from './MCPPowerPointBackend.js';

// ============================================================================
// TYPES
// ============================================================================

interface DocumentJob {
  id: string;
  type: 'powerpoint' | 'word' | 'excel';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  config: any;
  result?: {
    filePath: string;
    fileSize?: number;
    metadata?: Record<string, unknown>;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface PowerPointConfig {
  title: string;
  topic: string;
  audience?: string;
  duration?: number;
  theme?: string;
  includeImages?: boolean;
}

interface WordConfig {
  title: string;
  type: 'report' | 'manual' | 'analysis' | 'proposal' | 'whitepaper' | 'sop';
  topic: string;
  targetWordCount?: number;
  includeExecutiveSummary?: boolean;
  includeTables?: boolean;
  tone?: 'formal' | 'professional' | 'casual' | 'technical';
}

interface ExcelConfig {
  title: string;
  analysisType: 'financial' | 'statistical' | 'comparison' | 'forecast' | 'dashboard';
  dataSource?: string;
  includeCharts?: boolean;
  includeFormulas?: boolean;
  includeDashboard?: boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

class DocumentGenerationService {
  private jobs: Map<string, DocumentJob> = new Map();
  private processingQueue: string[] = [];
  private isProcessing = false;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // PowerPoint events
    eventBus.on('docgen:powerpoint:create', async (data) => {
      await this.createPowerPointJob(data.presentationId, data);
    });

    // Word events
    eventBus.on('docgen:word:create', async (data) => {
      await this.createWordJob(data.documentId, data);
    });

    // Excel events
    eventBus.on('docgen:excel:create', async (data) => {
      await this.createExcelJob(data.workbookId, data);
    });
  }

  // ============================================================================
  // POWERPOINT GENERATION
  // ============================================================================

  async createPowerPointJob(id: string, config: PowerPointConfig): Promise<DocumentJob> {
    const job: DocumentJob = {
      id,
      type: 'powerpoint',
      status: 'pending',
      progress: 0,
      config,
      createdAt: new Date()
    };

    this.jobs.set(id, job);
    this.processingQueue.push(id);
    this.processQueue();

    return job;
  }

  private async processPowerPoint(job: DocumentJob): Promise<void> {
    const config = job.config as PowerPointConfig;
    const backend = getMCPPowerPointBackend();

    try {
      // Initialize if needed
      await backend.initialize();

      // Create presentation
      job.progress = 10;
      await backend.createPresentation({
        name: job.id,
        title: config.title,
        theme: config.theme || 'corporate'
      });

      // Calculate slides
      const duration = config.duration || 15;
      const slideCount = Math.ceil(duration * 1.5);

      // Add title slide
      job.progress = 20;
      await backend.addSlide(job.id, 'title', {
        title: config.title,
        content: [config.topic, `Prepared for ${config.audience || 'audience'}`]
      });

      // Add content slides
      for (let i = 0; i < slideCount - 2; i++) {
        job.progress = 20 + ((i / (slideCount - 2)) * 60);
        await backend.addSlide(job.id, 'content', {
          title: `Section ${i + 1}`,
          content: [`Key point about ${config.topic}`, 'Additional details', 'Supporting information']
        });
      }

      // Add conclusion slide
      job.progress = 85;
      await backend.addSlide(job.id, 'bullet', {
        title: 'Key Takeaways',
        content: ['Summary point 1', 'Summary point 2', 'Summary point 3']
      });

      // Save presentation
      job.progress = 95;
      const filePath = await backend.savePresentation(job.id);

      job.status = 'completed';
      job.progress = 100;
      job.result = { filePath };
      job.completedAt = new Date();

      eventBus.emit('docgen:powerpoint:completed', {
        jobId: job.id,
        filePath
      });

    } catch (error) {
      job.status = 'failed';
      job.error = String(error);
      logger.error(`PowerPoint generation failed for ${job.id}:`, error);

      eventBus.emit('docgen:powerpoint:failed', {
        jobId: job.id,
        error: job.error
      });
    }
  }

  // ============================================================================
  // WORD GENERATION
  // ============================================================================

  async createWordJob(id: string, config: WordConfig): Promise<DocumentJob> {
    const job: DocumentJob = {
      id,
      type: 'word',
      status: 'pending',
      progress: 0,
      config,
      createdAt: new Date()
    };

    this.jobs.set(id, job);
    this.processingQueue.push(id);
    this.processQueue();

    return job;
  }

  private async processWord(job: DocumentJob): Promise<void> {
    const config = job.config as WordConfig;

    try {
      // Simulate document generation
      const sections = this.generateWordSections(config);

      for (let i = 0; i < sections.length; i++) {
        job.progress = Math.round((i / sections.length) * 90);
        await this.delay(100); // Simulate processing time
      }

      job.progress = 100;
      job.status = 'completed';
      job.result = {
        filePath: `/documents/${job.id}.docx`,
        metadata: {
          sections: sections.length,
          wordCount: config.targetWordCount || 3000
        }
      };
      job.completedAt = new Date();

      eventBus.emit('docgen:word:completed', {
        jobId: job.id,
        filePath: job.result.filePath
      });

    } catch (error) {
      job.status = 'failed';
      job.error = String(error);
      logger.error(`Word generation failed for ${job.id}:`, error);

      eventBus.emit('docgen:word:failed', {
        jobId: job.id,
        error: job.error
      });
    }
  }

  private generateWordSections(config: WordConfig): string[] {
    const baseSections = ['Introduction', 'Background', 'Methodology'];

    const typeSections: Record<string, string[]> = {
      report: ['Findings', 'Analysis', 'Discussion', 'Conclusion', 'Recommendations'],
      manual: ['Getting Started', 'Core Features', 'Advanced Topics', 'Troubleshooting'],
      analysis: ['Current State', 'Gap Analysis', 'Strategic Options', 'Recommendations'],
      proposal: ['Problem Statement', 'Proposed Solution', 'Timeline', 'Investment'],
      whitepaper: ['Industry Context', 'Technical Deep Dive', 'Case Studies', 'Future Outlook'],
      sop: ['Procedure Overview', 'Step-by-Step', 'Quality Control', 'Documentation']
    };

    const sections = [...baseSections, ...(typeSections[config.type] || typeSections.report)];

    if (config.includeExecutiveSummary) {
      sections.unshift('Executive Summary');
    }

    return sections;
  }

  // ============================================================================
  // EXCEL GENERATION
  // ============================================================================

  async createExcelJob(id: string, config: ExcelConfig): Promise<DocumentJob> {
    const job: DocumentJob = {
      id,
      type: 'excel',
      status: 'pending',
      progress: 0,
      config,
      createdAt: new Date()
    };

    this.jobs.set(id, job);
    this.processingQueue.push(id);
    this.processQueue();

    return job;
  }

  private async processExcel(job: DocumentJob): Promise<void> {
    const config = job.config as ExcelConfig;

    try {
      // Simulate workbook generation
      const sheets = this.generateExcelSheets(config);

      for (let i = 0; i < sheets.length; i++) {
        job.progress = Math.round((i / sheets.length) * 90);
        await this.delay(100); // Simulate processing time
      }

      job.progress = 100;
      job.status = 'completed';
      job.result = {
        filePath: `/spreadsheets/${job.id}.xlsx`,
        metadata: {
          sheets: sheets.length,
          hasCharts: config.includeCharts,
          hasFormulas: config.includeFormulas
        }
      };
      job.completedAt = new Date();

      eventBus.emit('docgen:excel:completed', {
        jobId: job.id,
        filePath: job.result.filePath
      });

    } catch (error) {
      job.status = 'failed';
      job.error = String(error);
      logger.error(`Excel generation failed for ${job.id}:`, error);

      eventBus.emit('docgen:excel:failed', {
        jobId: job.id,
        error: job.error
      });
    }
  }

  private generateExcelSheets(config: ExcelConfig): string[] {
    const baseSheets = config.includeDashboard ? ['Dashboard'] : [];

    const typeSheets: Record<string, string[]> = {
      financial: ['Income Statement', 'Balance Sheet', 'Cash Flow', 'Ratios'],
      statistical: ['Descriptive Stats', 'Correlation', 'Regression'],
      comparison: ['Comparison Matrix', 'Variance Analysis', 'Trend Analysis'],
      forecast: ['Historical Data', 'Projections', 'Scenarios'],
      dashboard: ['Summary', 'KPIs', 'Trends']
    };

    return [...baseSheets, ...(typeSheets[config.analysisType] || typeSheets.financial), 'Raw Data'];
  }

  // ============================================================================
  // QUEUE PROCESSING
  // ============================================================================

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const jobId = this.processingQueue.shift();
      if (!jobId) continue;

      const job = this.jobs.get(jobId);
      if (!job) continue;

      job.status = 'processing';

      switch (job.type) {
        case 'powerpoint':
          await this.processPowerPoint(job);
          break;
        case 'word':
          await this.processWord(job);
          break;
        case 'excel':
          await this.processExcel(job);
          break;
      }
    }

    this.isProcessing = false;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getJob(id: string): DocumentJob | undefined {
    return this.jobs.get(id);
  }

  getJobsByType(type: 'powerpoint' | 'word' | 'excel'): DocumentJob[] {
    return Array.from(this.jobs.values()).filter(j => j.type === type);
  }

  getAllJobs(): DocumentJob[] {
    return Array.from(this.jobs.values());
  }

  getQueueLength(): number {
    return this.processingQueue.length;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let instance: DocumentGenerationService | null = null;

export function getDocumentGenerationService(): DocumentGenerationService {
  if (!instance) {
    instance = new DocumentGenerationService();
  }
  return instance;
}

export default DocumentGenerationService;
