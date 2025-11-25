/**
 * Autonomous Word Architect Widget
 * AI-powered document generation for reports, manuals, and analyses
 */
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Button } from '../../components/ui/Button';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type DocumentType = 'report' | 'manual' | 'analysis' | 'proposal' | 'whitepaper' | 'sop';
type GenerationPhase = 'idle' | 'researching' | 'outlining' | 'drafting' | 'formatting' | 'reviewing' | 'completed';
type SectionStatus = 'pending' | 'generating' | 'completed' | 'review';

interface DocumentSection {
  id: string;
  level: number; // 1 = h1, 2 = h2, etc.
  title: string;
  content: string;
  wordCount: number;
  status: SectionStatus;
  subsections: DocumentSection[];
  images?: { prompt: string; url?: string }[];
  tables?: { headers: string[]; rows: string[][] }[];
}

interface DocumentConfig {
  title: string;
  type: DocumentType;
  topic: string;
  targetAudience: string;
  targetWordCount: number;
  includeImages: boolean;
  includeTables: boolean;
  includeExecutiveSummary: boolean;
  includeReferences: boolean;
  language: string;
  tone: 'formal' | 'professional' | 'casual' | 'technical';
}

interface GenerationProgress {
  phase: GenerationPhase;
  currentSection: number;
  totalSections: number;
  wordCount: number;
  message: string;
}

// ============================================================================
// DOCUMENT GENERATION ENGINE
// ============================================================================

class DocumentEngine {
  private sections: DocumentSection[] = [];
  private config: DocumentConfig | null = null;
  private onUpdate: (sections: DocumentSection[], progress: GenerationProgress) => void;
  private isRunning = false;
  private progress: GenerationProgress = {
    phase: 'idle',
    currentSection: 0,
    totalSections: 0,
    wordCount: 0,
    message: 'Ready to generate'
  };

  constructor(onUpdate: (sections: DocumentSection[], progress: GenerationProgress) => void) {
    this.onUpdate = onUpdate;
  }

  async generateDocument(config: DocumentConfig): Promise<void> {
    this.isRunning = true;
    this.config = config;
    this.sections = [];

    // Phase 1: Research
    this.updateProgress('researching', 0, 0, 0, 'Researching topic and gathering information...');
    await this.delay(800);

    // Phase 2: Outline
    this.updateProgress('outlining', 0, 0, 0, 'Creating document outline...');
    await this.delay(600);
    this.sections = this.createDocumentOutline(config);
    this.notifyUpdate();

    const totalSections = this.countAllSections(this.sections);
    let processedSections = 0;
    let totalWords = 0;

    // Phase 3: Draft content
    for (const section of this.sections) {
      if (!this.isRunning) break;

      const result = await this.generateSectionContent(section, config, processedSections, totalSections, totalWords);
      processedSections = result.processed;
      totalWords = result.words;
    }

    // Phase 4: Formatting
    this.updateProgress('formatting', totalSections, totalSections, totalWords, 'Applying formatting and styles...');
    await this.delay(500);

    // Phase 5: Review
    this.updateProgress('reviewing', totalSections, totalSections, totalWords, 'Performing final review...');
    await this.delay(400);

    this.updateProgress('completed', totalSections, totalSections, totalWords, 'Document ready!');
    this.isRunning = false;
  }

  private createDocumentOutline(config: DocumentConfig): DocumentSection[] {
    const outline: DocumentSection[] = [];
    
    // Executive Summary (if enabled)
    if (config.includeExecutiveSummary) {
      outline.push({
        id: 'exec-summary',
        level: 1,
        title: 'Executive Summary',
        content: '',
        wordCount: 0,
        status: 'pending',
        subsections: []
      });
    }

    // Introduction
    outline.push({
      id: 'intro',
      level: 1,
      title: 'Introduction',
      content: '',
      wordCount: 0,
      status: 'pending',
      subsections: [
        { id: 'intro-background', level: 2, title: 'Background', content: '', wordCount: 0, status: 'pending', subsections: [] },
        { id: 'intro-purpose', level: 2, title: 'Purpose and Scope', content: '', wordCount: 0, status: 'pending', subsections: [] }
      ]
    });

    // Main sections based on document type
    const mainSections = this.getMainSectionsForType(config.type);
    mainSections.forEach((section, index) => {
      outline.push({
        id: `main-${index}`,
        level: 1,
        title: section.title,
        content: '',
        wordCount: 0,
        status: 'pending',
        subsections: section.subsections.map((sub, subIndex) => ({
          id: `main-${index}-sub-${subIndex}`,
          level: 2,
          title: sub,
          content: '',
          wordCount: 0,
          status: 'pending',
          subsections: []
        })),
        tables: config.includeTables && Math.random() > 0.5 
          ? [{ headers: ['Column A', 'Column B', 'Column C'], rows: [] }] 
          : undefined
      });
    });

    // Conclusion
    outline.push({
      id: 'conclusion',
      level: 1,
      title: 'Conclusion',
      content: '',
      wordCount: 0,
      status: 'pending',
      subsections: [
        { id: 'conclusion-summary', level: 2, title: 'Summary of Findings', content: '', wordCount: 0, status: 'pending', subsections: [] },
        { id: 'conclusion-recommendations', level: 2, title: 'Recommendations', content: '', wordCount: 0, status: 'pending', subsections: [] }
      ]
    });

    // References (if enabled)
    if (config.includeReferences) {
      outline.push({
        id: 'references',
        level: 1,
        title: 'References',
        content: '',
        wordCount: 0,
        status: 'pending',
        subsections: []
      });
    }

    return outline;
  }

  private getMainSectionsForType(type: DocumentType): { title: string; subsections: string[] }[] {
    const templates: Record<DocumentType, { title: string; subsections: string[] }[]> = {
      report: [
        { title: 'Methodology', subsections: ['Approach', 'Data Collection', 'Analysis Framework'] },
        { title: 'Findings', subsections: ['Key Discoveries', 'Data Analysis', 'Observations'] },
        { title: 'Discussion', subsections: ['Interpretation', 'Implications', 'Limitations'] }
      ],
      manual: [
        { title: 'Getting Started', subsections: ['Requirements', 'Installation', 'Configuration'] },
        { title: 'Core Features', subsections: ['Feature Overview', 'Usage Instructions', 'Examples'] },
        { title: 'Advanced Topics', subsections: ['Customization', 'Integration', 'Troubleshooting'] }
      ],
      analysis: [
        { title: 'Current State Assessment', subsections: ['Overview', 'Strengths', 'Weaknesses'] },
        { title: 'Gap Analysis', subsections: ['Identified Gaps', 'Root Causes', 'Impact Assessment'] },
        { title: 'Strategic Options', subsections: ['Option A', 'Option B', 'Comparison Matrix'] }
      ],
      proposal: [
        { title: 'Problem Statement', subsections: ['Current Challenges', 'Business Impact', 'Urgency'] },
        { title: 'Proposed Solution', subsections: ['Approach', 'Deliverables', 'Timeline'] },
        { title: 'Investment & Returns', subsections: ['Cost Breakdown', 'ROI Analysis', 'Risk Mitigation'] }
      ],
      whitepaper: [
        { title: 'Industry Context', subsections: ['Market Overview', 'Key Trends', 'Challenges'] },
        { title: 'Technical Deep Dive', subsections: ['Architecture', 'Implementation', 'Best Practices'] },
        { title: 'Case Studies', subsections: ['Case Study 1', 'Case Study 2', 'Lessons Learned'] }
      ],
      sop: [
        { title: 'Procedure Overview', subsections: ['Purpose', 'Scope', 'Responsibilities'] },
        { title: 'Step-by-Step Instructions', subsections: ['Phase 1', 'Phase 2', 'Phase 3'] },
        { title: 'Quality Control', subsections: ['Checkpoints', 'Verification', 'Documentation'] }
      ]
    };

    return templates[type] || templates.report;
  }

  private countAllSections(sections: DocumentSection[]): number {
    return sections.reduce((count, section) => 
      count + 1 + this.countAllSections(section.subsections), 0
    );
  }

  private async generateSectionContent(
    section: DocumentSection, 
    config: DocumentConfig,
    processedSections: number,
    totalSections: number,
    totalWords: number
  ): Promise<{ processed: number; words: number }> {
    section.status = 'generating';
    this.updateProgress('drafting', processedSections, totalSections, totalWords, `Drafting: ${section.title}`);
    this.notifyUpdate();

    await this.delay(200 + Math.random() * 300);

    // Generate content
    const targetWords = Math.floor(config.targetWordCount / totalSections);
    section.content = this.generateParagraph(section.title, config.topic, config.tone, targetWords);
    section.wordCount = section.content.split(/\s+/).length;
    totalWords += section.wordCount;

    // Generate table data if present
    if (section.tables && section.tables.length > 0) {
      section.tables[0].rows = [
        ['Data point 1', 'Value A', 'Result X'],
        ['Data point 2', 'Value B', 'Result Y'],
        ['Data point 3', 'Value C', 'Result Z']
      ];
    }

    section.status = 'completed';
    processedSections++;
    this.notifyUpdate();

    // Process subsections
    for (const subsection of section.subsections) {
      if (!this.isRunning) break;
      const result = await this.generateSectionContent(subsection, config, processedSections, totalSections, totalWords);
      processedSections = result.processed;
      totalWords = result.words;
    }

    return { processed: processedSections, words: totalWords };
  }

  private generateParagraph(title: string, topic: string, tone: string, targetWords: number): string {
    const sentences = [
      `This section addresses key aspects of ${title.toLowerCase()} in the context of ${topic}.`,
      `A comprehensive analysis reveals important insights that inform strategic decision-making.`,
      `The findings presented here are based on thorough research and industry best practices.`,
      `Key stakeholders should consider these recommendations when evaluating options.`,
      `Implementation of these strategies requires careful planning and resource allocation.`,
      `Success metrics have been defined to measure progress and outcomes effectively.`,
      `Cross-functional collaboration is essential for achieving desired results.`,
      `Continuous monitoring and adjustment will ensure optimal performance over time.`
    ];

    const paragraphs: string[] = [];
    let currentWords = 0;
    
    while (currentWords < targetWords) {
      const paragraph = sentences.slice(0, 3 + Math.floor(Math.random() * 3)).join(' ');
      paragraphs.push(paragraph);
      currentWords += paragraph.split(/\s+/).length;
    }

    return paragraphs.join('\n\n');
  }

  private updateProgress(phase: GenerationPhase, current: number, total: number, words: number, message: string): void {
    this.progress = { phase, currentSection: current, totalSections: total, wordCount: words, message };
    this.notifyUpdate();
  }

  private notifyUpdate(): void {
    this.onUpdate([...this.sections], { ...this.progress });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop(): void {
    this.isRunning = false;
  }

  async exportToDocx(): Promise<{ success: boolean; filePath?: string }> {
    await this.delay(1000);
    return {
      success: true,
      filePath: `/documents/${this.config?.title.replace(/\s+/g, '_')}.docx`
    };
  }
}

// ============================================================================
// REACT COMPONENT
// ============================================================================

const documentTypeLabels: Record<DocumentType, { label: string; icon: string }> = {
  report: { label: 'Report', icon: '📊' },
  manual: { label: 'Manual', icon: '📘' },
  analysis: { label: 'Analysis', icon: '🔍' },
  proposal: { label: 'Proposal', icon: '💡' },
  whitepaper: { label: 'Whitepaper', icon: '📄' },
  sop: { label: 'SOP', icon: '📋' }
};

const AutonomousWordArchitectWidget: React.FC<{ widgetId: string }> = () => {
  const [config, setConfig] = useState<DocumentConfig>({
    title: '',
    type: 'report',
    topic: '',
    targetAudience: '',
    targetWordCount: 3000,
    includeImages: true,
    includeTables: true,
    includeExecutiveSummary: true,
    includeReferences: true,
    language: 'en',
    tone: 'professional'
  });
  
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [progress, setProgress] = useState<GenerationProgress>({
    phase: 'idle',
    currentSection: 0,
    totalSections: 0,
    wordCount: 0,
    message: 'Ready to generate'
  });
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const engineRef = useRef<DocumentEngine | null>(null);

  React.useEffect(() => {
    engineRef.current = new DocumentEngine((s, p) => {
      setSections([...s]);
      setProgress({ ...p });
    });

    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const startGeneration = useCallback(async () => {
    if (!config.title || !config.topic || !engineRef.current) return;
    
    try {
      await engineRef.current.generateDocument(config);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  }, [config]);

  const stopGeneration = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const exportDocument = useCallback(async () => {
    if (!engineRef.current) return;
    
    setIsExporting(true);
    try {
      const result = await engineRef.current.exportToDocx();
      if (result.success) {
        alert(`Document exported to: ${result.filePath}`);
      }
    } finally {
      setIsExporting(false);
    }
  }, []);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const findSection = (sections: DocumentSection[], id: string): DocumentSection | null => {
    for (const section of sections) {
      if (section.id === id) return section;
      const found = findSection(section.subsections, id);
      if (found) return found;
    }
    return null;
  };

  const selectedSectionData = useMemo(() => 
    selectedSection ? findSection(sections, selectedSection) : null,
    [sections, selectedSection]
  );

  const isGenerating = progress.phase !== 'idle' && progress.phase !== 'completed';
  const progressPercent = progress.totalSections > 0 
    ? Math.round((progress.currentSection / progress.totalSections) * 100) 
    : 0;

  const renderSectionTree = (sectionList: DocumentSection[], depth = 0) => {
    return sectionList.map(section => (
      <div key={section.id} style={{ marginLeft: depth * 16 }}>
        <button
          onClick={() => {
            setSelectedSection(section.id);
            if (section.subsections.length > 0) {
              toggleSection(section.id);
            }
          }}
          className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2 ${
            selectedSection === section.id
              ? 'bg-blue-50 dark:bg-blue-950/30'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          {section.subsections.length > 0 && (
            <span className="text-slate-400">
              {expandedSections.has(section.id) ? '▼' : '▶'}
            </span>
          )}
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            section.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
            section.status === 'generating' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            H{section.level}
          </span>
          <span className="flex-1 text-sm truncate">{section.title}</span>
          {section.wordCount > 0 && (
            <span className="text-xs text-slate-500">{section.wordCount} words</span>
          )}
        </button>
        {expandedSections.has(section.id) && section.subsections.length > 0 && (
          <div className="mt-1">
            {renderSectionTree(section.subsections, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col -m-4" data-testid="autonomous-word-architect-widget">
      {/* Header */}
      <header className="p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-700 text-white border-b border-blue-600">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-200">Document Generator</p>
            <h3 className="text-2xl font-semibold">Word Architect</h3>
            <p className="text-sm text-white/80">
              AI-powered dokument- og rapportgenerering
            </p>
          </div>
          {isGenerating && (
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-200">{progress.wordCount}</div>
              <p className="text-sm text-white/70">words generated</p>
            </div>
          )}
        </div>
      </header>

      {/* Configuration Panel */}
      {progress.phase === 'idle' && (
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Document Title</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="Q4 Market Analysis Report"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Document Type</label>
              <select
                value={config.type}
                onChange={(e) => setConfig({ ...config, type: e.target.value as DocumentType })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              >
                {Object.entries(documentTypeLabels).map(([key, { label, icon }]) => (
                  <option key={key} value={key}>{icon} {label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Topic / Subject</label>
              <input
                type="text"
                value={config.topic}
                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                placeholder="Digital transformation strategy"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Target Word Count</label>
              <input
                type="number"
                value={config.targetWordCount}
                onChange={(e) => setConfig({ ...config, targetWordCount: parseInt(e.target.value) || 3000 })}
                min={500}
                max={20000}
                step={500}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tone</label>
              <select
                value={config.tone}
                onChange={(e) => setConfig({ ...config, tone: e.target.value as DocumentConfig['tone'] })}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              >
                <option value="formal">Formal</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="technical">Technical</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeExecutiveSummary}
                onChange={(e) => setConfig({ ...config, includeExecutiveSummary: e.target.checked })}
              />
              Executive Summary
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeTables}
                onChange={(e) => setConfig({ ...config, includeTables: e.target.checked })}
              />
              Include Tables
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeReferences}
                onChange={(e) => setConfig({ ...config, includeReferences: e.target.checked })}
              />
              Include References
            </label>

            <div className="ml-auto">
              <Button 
                variant="primary" 
                onClick={startGeneration}
                disabled={!config.title || !config.topic}
              >
                📝 Generate Document
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isGenerating && (
        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[100px]">
              {progress.wordCount} words
            </span>
            <Button variant="subtle" size="small" onClick={stopGeneration}>
              Stop
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">{progress.message}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden bg-slate-50 dark:bg-slate-900/30">
        {/* Section Tree */}
        <section className="col-span-12 lg:col-span-4 h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/70">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Document Structure</h4>
              <p className="text-xs text-slate-500">
                {sections.length} sections · {progress.wordCount} words
              </p>
            </div>
            {progress.phase === 'completed' && (
              <Button 
                variant="primary" 
                size="small" 
                onClick={exportDocument}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : '📥 Export DOCX'}
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-3">
            {sections.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-6">
                Configure and start generation to see document structure
              </div>
            ) : (
              renderSectionTree(sections)
            )}
          </div>
        </section>

        {/* Content Preview */}
        <section className="col-span-12 lg:col-span-8 h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/70">
          {selectedSectionData ? (
            <>
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{selectedSectionData.title}</h4>
                    <p className="text-xs text-slate-500">
                      {selectedSectionData.wordCount} words · Level {selectedSectionData.level}
                    </p>
                  </div>
                  <Button variant="subtle" size="small">
                    ✏️ Edit
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-auto prose prose-sm dark:prose-invert max-w-none">
                <h2>{selectedSectionData.title}</h2>
                {selectedSectionData.content.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}

                {selectedSectionData.tables && selectedSectionData.tables.length > 0 && (
                  <table className="w-full border-collapse mt-4">
                    <thead>
                      <tr>
                        {selectedSectionData.tables[0].headers.map((header, i) => (
                          <th key={i} className="border border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSectionData.tables[0].rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-slate-200 dark:border-slate-700 px-3 py-2">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📄</div>
                <p>Select a section to preview content</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AutonomousWordArchitectWidget;
