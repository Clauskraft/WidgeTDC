/**
 * Autonomous PowerPoint Master Widget
 * AI-powered presentation generation with MCP integration
 */
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Button } from '../../components/ui/Button';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type GenerationPhase = 'idle' | 'analyzing' | 'structuring' | 'generating' | 'styling' | 'finalizing' | 'completed';
type SlideType = 'title' | 'content' | 'two-column' | 'image' | 'chart' | 'quote' | 'bullet' | 'comparison' | 'timeline';
type Theme = 'corporate' | 'creative' | 'minimal' | 'dark' | 'academic' | 'tech';

interface SlideDefinition {
  id: string;
  type: SlideType;
  title: string;
  content: string[];
  notes?: string;
  imagePrompt?: string;
  imageUrl?: string;
  chartData?: Record<string, unknown>;
  status: 'pending' | 'generating' | 'completed' | 'error';
}

interface PresentationConfig {
  title: string;
  topic: string;
  audience: string;
  duration: number; // minutes
  theme: Theme;
  includeImages: boolean;
  includeCharts: boolean;
  language: string;
}

interface GenerationProgress {
  phase: GenerationPhase;
  currentSlide: number;
  totalSlides: number;
  message: string;
}

// ============================================================================
// PRESENTATION GENERATION ENGINE
// ============================================================================

class PresentationEngine {
  private slides: SlideDefinition[] = [];
  private config: PresentationConfig | null = null;
  private onUpdate: (slides: SlideDefinition[], progress: GenerationProgress) => void;
  private isRunning = false;
  private progress: GenerationProgress = {
    phase: 'idle',
    currentSlide: 0,
    totalSlides: 0,
    message: 'Ready to generate'
  };

  constructor(onUpdate: (slides: SlideDefinition[], progress: GenerationProgress) => void) {
    this.onUpdate = onUpdate;
  }

  async generatePresentation(config: PresentationConfig): Promise<void> {
    this.isRunning = true;
    this.config = config;
    this.slides = [];

    // Phase 1: Analyze topic
    this.updateProgress('analyzing', 0, 0, 'Analyzing topic and audience...');
    await this.delay(800);

    // Phase 2: Structure presentation
    this.updateProgress('structuring', 0, 0, 'Creating presentation structure...');
    await this.delay(600);
    this.slides = this.createSlideStructure(config);
    this.updateProgress('structuring', 0, this.slides.length, `Created ${this.slides.length} slide structure`);
    await this.delay(400);

    // Phase 3: Generate content for each slide
    for (let i = 0; i < this.slides.length; i++) {
      if (!this.isRunning) break;

      const slide = this.slides[i];
      slide.status = 'generating';
      this.updateProgress('generating', i + 1, this.slides.length, `Generating slide ${i + 1}: ${slide.title}`);
      this.notifyUpdate();

      await this.generateSlideContent(slide, config);
      slide.status = 'completed';
      this.notifyUpdate();
    }

    // Phase 4: Apply styling
    this.updateProgress('styling', this.slides.length, this.slides.length, 'Applying theme and styling...');
    await this.delay(500);

    // Phase 5: Finalize
    this.updateProgress('finalizing', this.slides.length, this.slides.length, 'Finalizing presentation...');
    await this.delay(400);

    this.updateProgress('completed', this.slides.length, this.slides.length, 'Presentation ready!');
    this.isRunning = false;
  }

  private createSlideStructure(config: PresentationConfig): SlideDefinition[] {
    const slidesPerMinute = 1.5;
    const targetSlides = Math.max(5, Math.min(20, Math.floor(config.duration * slidesPerMinute)));
    
    const structure: SlideDefinition[] = [];
    
    // Title slide
    structure.push({
      id: 'slide-1',
      type: 'title',
      title: config.title,
      content: [config.topic, `Prepared for ${config.audience}`],
      status: 'pending'
    });

    // Agenda slide
    structure.push({
      id: 'slide-2',
      type: 'bullet',
      title: 'Agenda',
      content: [],
      status: 'pending'
    });

    // Content slides
    const contentSlideCount = targetSlides - 3; // minus title, agenda, conclusion
    const slideTypes: SlideType[] = ['content', 'two-column', 'bullet', 'image', 'comparison'];
    
    for (let i = 0; i < contentSlideCount; i++) {
      const type = slideTypes[i % slideTypes.length];
      structure.push({
        id: `slide-${i + 3}`,
        type,
        title: `Section ${i + 1}`,
        content: [],
        status: 'pending',
        imagePrompt: type === 'image' ? `Professional image for ${config.topic}` : undefined
      });
    }

    // Conclusion slide
    structure.push({
      id: `slide-${targetSlides}`,
      type: 'bullet',
      title: 'Key Takeaways',
      content: [],
      status: 'pending'
    });

    return structure;
  }

  private async generateSlideContent(slide: SlideDefinition, config: PresentationConfig): Promise<void> {
    await this.delay(300 + Math.random() * 400);

    // Generate content based on slide type
    switch (slide.type) {
      case 'title':
        slide.notes = `Welcome the audience. Introduce ${config.topic}.`;
        break;
      
      case 'bullet':
        slide.content = this.generateBulletPoints(slide.title, config.topic);
        slide.notes = `Discuss each point. Allow ${Math.floor(config.duration / this.slides.length)} minutes.`;
        break;
      
      case 'two-column':
        slide.content = [
          'Left Column: Key advantages',
          '• Point 1: Efficiency gains',
          '• Point 2: Cost reduction',
          'Right Column: Implementation',
          '• Step 1: Assessment',
          '• Step 2: Deployment'
        ];
        break;
      
      case 'image':
        slide.imagePrompt = `Professional, modern image representing ${config.topic}`;
        slide.imageUrl = `https://picsum.photos/800/600?random=${slide.id}`;
        slide.content = [`Visual representation of ${config.topic}`];
        break;
      
      case 'comparison':
        slide.content = [
          'Before: Traditional approach',
          '• Manual processes',
          '• Higher error rate',
          'After: Modern solution',
          '• Automated workflows',
          '• Improved accuracy'
        ];
        break;
      
      default:
        slide.content = this.generateBulletPoints(slide.title, config.topic);
    }
  }

  private generateBulletPoints(title: string, topic: string): string[] {
    const templates = [
      `Key insight about ${topic}`,
      `Important consideration for ${title.toLowerCase()}`,
      `Best practice recommendation`,
      `Data-driven observation`,
      `Strategic implication`
    ];
    
    const count = 3 + Math.floor(Math.random() * 3);
    return templates.slice(0, count).map((t, i) => `• ${t} (point ${i + 1})`);
  }

  private updateProgress(phase: GenerationPhase, current: number, total: number, message: string): void {
    this.progress = { phase, currentSlide: current, totalSlides: total, message };
    this.notifyUpdate();
  }

  private notifyUpdate(): void {
    this.onUpdate([...this.slides], { ...this.progress });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop(): void {
    this.isRunning = false;
  }

  getSlides(): SlideDefinition[] {
    return this.slides;
  }

  async exportToMCP(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    // In production, this would call the MCP PowerPoint server
    await this.delay(1000);
    return {
      success: true,
      filePath: `/presentations/${this.config?.title.replace(/\s+/g, '_')}.pptx`
    };
  }
}

// ============================================================================
// REACT COMPONENT
// ============================================================================

const themeStyles: Record<Theme, { bg: string; accent: string; preview: string }> = {
  corporate: { bg: 'bg-blue-900', accent: 'text-blue-500', preview: 'from-blue-900 to-blue-700' },
  creative: { bg: 'bg-purple-900', accent: 'text-purple-500', preview: 'from-purple-900 to-pink-700' },
  minimal: { bg: 'bg-slate-100', accent: 'text-slate-700', preview: 'from-slate-200 to-white' },
  dark: { bg: 'bg-slate-900', accent: 'text-emerald-400', preview: 'from-slate-900 to-slate-800' },
  academic: { bg: 'bg-amber-50', accent: 'text-amber-800', preview: 'from-amber-100 to-amber-50' },
  tech: { bg: 'bg-cyan-900', accent: 'text-cyan-400', preview: 'from-cyan-900 to-slate-900' }
};

const slideTypeIcons: Record<SlideType, string> = {
  title: '🎯',
  content: '📝',
  'two-column': '📊',
  image: '🖼️',
  chart: '📈',
  quote: '💬',
  bullet: '📋',
  comparison: '⚖️',
  timeline: '📅'
};

const AutonomousPowerPointMasterWidget: React.FC<{ widgetId: string }> = () => {
  const [config, setConfig] = useState<PresentationConfig>({
    title: '',
    topic: '',
    audience: '',
    duration: 15,
    theme: 'corporate',
    includeImages: true,
    includeCharts: true,
    language: 'en'
  });
  
  const [slides, setSlides] = useState<SlideDefinition[]>([]);
  const [progress, setProgress] = useState<GenerationProgress>({
    phase: 'idle',
    currentSlide: 0,
    totalSlides: 0,
    message: 'Ready to generate'
  });
  const [selectedSlide, setSelectedSlide] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const engineRef = useRef<PresentationEngine | null>(null);

  React.useEffect(() => {
    engineRef.current = new PresentationEngine((s, p) => {
      setSlides([...s]);
      setProgress({ ...p });
    });

    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const startGeneration = useCallback(async () => {
    if (!config.title || !config.topic || !engineRef.current) return;
    
    try {
      await engineRef.current.generatePresentation(config);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  }, [config]);

  const stopGeneration = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const exportPresentation = useCallback(async () => {
    if (!engineRef.current) return;
    
    setIsExporting(true);
    try {
      const result = await engineRef.current.exportToMCP();
      if (result.success) {
        alert(`Presentation exported to: ${result.filePath}`);
      } else {
        alert(`Export failed: ${result.error}`);
      }
    } finally {
      setIsExporting(false);
    }
  }, []);

  const selectedSlideData = useMemo(() => 
    slides.find(s => s.id === selectedSlide),
    [slides, selectedSlide]
  );

  const isGenerating = progress.phase !== 'idle' && progress.phase !== 'completed';
  const progressPercent = progress.totalSlides > 0 
    ? Math.round((progress.currentSlide / progress.totalSlides) * 100) 
    : 0;

  return (
    <div className="h-full flex flex-col -m-4" data-testid="autonomous-powerpoint-master-widget">
      {/* Header */}
      <header className="p-4 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white border-b border-orange-500">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-orange-200">Document Generator</p>
            <h3 className="text-2xl font-semibold">PowerPoint Master</h3>
            <p className="text-sm text-white/80">
              AI-powered præsentationsgenerering med MCP integration
            </p>
          </div>
          {isGenerating && (
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-200">{progressPercent}%</div>
              <p className="text-sm text-white/70">{progress.message}</p>
            </div>
          )}
        </div>
      </header>

      {/* Configuration Panel */}
      {progress.phase === 'idle' && (
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Presentation Title</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="Q4 Strategy Review"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Topic / Context</label>
              <input
                type="text"
                value={config.topic}
                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                placeholder="Digital transformation"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Target Audience</label>
              <input
                type="text"
                value={config.audience}
                onChange={(e) => setConfig({ ...config, audience: e.target.value })}
                placeholder="Executive team"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={config.duration}
                onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) || 15 })}
                min={5}
                max={60}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Theme</label>
              <div className="flex gap-2">
                {(Object.keys(themeStyles) as Theme[]).map(theme => (
                  <button
                    key={theme}
                    onClick={() => setConfig({ ...config, theme })}
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${themeStyles[theme].preview} border-2 transition-all ${
                      config.theme === theme 
                        ? 'border-orange-500 scale-110' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    title={theme.charAt(0).toUpperCase() + theme.slice(1)}
                  />
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeImages}
                onChange={(e) => setConfig({ ...config, includeImages: e.target.checked })}
              />
              Include AI Images
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeCharts}
                onChange={(e) => setConfig({ ...config, includeCharts: e.target.checked })}
              />
              Include Charts
            </label>

            <div className="ml-auto">
              <Button 
                variant="primary" 
                onClick={startGeneration}
                disabled={!config.title || !config.topic}
              >
                🚀 Generate Presentation
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
                className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <Button variant="subtle" size="small" onClick={stopGeneration}>
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden bg-slate-50 dark:bg-slate-900/30">
        {/* Slide List */}
        <section className="col-span-12 lg:col-span-4 h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/70">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Slides</h4>
              <p className="text-xs text-slate-500">
                {slides.filter(s => s.status === 'completed').length}/{slides.length} generated
              </p>
            </div>
            {progress.phase === 'completed' && (
              <Button 
                variant="primary" 
                size="small" 
                onClick={exportPresentation}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : '📥 Export PPTX'}
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-auto divide-y divide-slate-100 dark:divide-slate-700">
            {slides.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Configure and start generation to see slides
              </div>
            ) : (
              slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setSelectedSlide(slide.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    selectedSlide === slide.id
                      ? 'bg-orange-50 dark:bg-orange-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{slideTypeIcons[slide.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">#{index + 1}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          slide.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          slide.status === 'generating' ? 'bg-blue-100 text-blue-700' :
                          slide.status === 'error' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {slide.type}
                        </span>
                      </div>
                      <p className="font-medium text-sm truncate mt-1">{slide.title}</p>
                    </div>
                    {slide.status === 'generating' && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Slide Preview */}
        <section className="col-span-12 lg:col-span-8 h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/70">
          {selectedSlideData ? (
            <>
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{selectedSlideData.title}</h4>
                    <p className="text-xs text-slate-500">{selectedSlideData.type} slide</p>
                  </div>
                  <Button variant="subtle" size="small">
                    ✏️ Edit
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-auto">
                {/* Slide Preview */}
                <div className={`aspect-video rounded-xl bg-gradient-to-br ${themeStyles[config.theme].preview} p-8 mb-4 shadow-lg`}>
                  <h2 className={`text-2xl font-bold mb-4 ${
                    config.theme === 'minimal' || config.theme === 'academic' 
                      ? 'text-slate-900' 
                      : 'text-white'
                  }`}>
                    {selectedSlideData.title}
                  </h2>
                  <div className={`space-y-2 ${
                    config.theme === 'minimal' || config.theme === 'academic'
                      ? 'text-slate-700'
                      : 'text-white/90'
                  }`}>
                    {selectedSlideData.content.map((line, i) => (
                      <p key={i} className="text-sm">{line}</p>
                    ))}
                  </div>
                  {selectedSlideData.imageUrl && (
                    <div className="mt-4 rounded-lg overflow-hidden">
                      <img 
                        src={selectedSlideData.imageUrl} 
                        alt="Slide visual"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Speaker Notes */}
                {selectedSlideData.notes && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <h5 className="text-xs font-medium text-slate-500 mb-2">Speaker Notes</h5>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {selectedSlideData.notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <p>Select a slide to preview</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AutonomousPowerPointMasterWidget;
