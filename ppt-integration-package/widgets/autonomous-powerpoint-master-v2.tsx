// Autonomous PowerPoint Master v2.0
// UPGRADED with PPTAgent + MultiAgent + ChatPPT-MCP Integration

import React, { useState, useEffect } from 'react';
import { Play, Download, Settings, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface PowerPointMasterProps {
  onGenerate?: (result: GenerationResult) => void;
}

export const AutonomousPowerPointMasterV2: React.FC<PowerPointMasterProps> = ({ onGenerate }) => {
  // State
  const [topic, setTopic] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStage, setCurrentStage] = useState<GenerationStage | null>(null);
  const [progress, setProgress] = useState<StageProgress>({});
  const [slides, setSlides] = useState<Slide[]>([]);
  const [qualityScores, setQualityScores] = useState<QualityScores | null>(null);
  const [generatedFile, setGeneratedFile] = useState<string | null>(null);

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/ppt-generation');

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      handleProgressUpdate(update);
    };

    return () => ws.close();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress({});
    setSlides([]);
    setQualityScores(null);

    try {
      // Call backend orchestrator
      const response = await fetch('http://localhost:3000/api/presentations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, requirements })
      });

      const result = await response.json();
      
      if (result.success) {
        setGeneratedFile(result.filePath);
        setSlides(result.slides);
        setQualityScores(result.qualityScores);
        onGenerate?.(result);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProgressUpdate = (update: ProgressUpdate) => {
    setCurrentStage(update.stage);
    setProgress(prev => ({
      ...prev,
      [update.stage]: update.progress
    }));

    if (update.data?.slide) {
      setSlides(prev => [...prev, update.data.slide]);
    }
  };

  return (
    <div className="autonomous-ppt-master-v2">
      {/* Header */}
      <div className="widget-header">
        <div className="title-section">
          <Zap className="widget-icon" />
          <h2>Autonomous PowerPoint Master v2.0</h2>
          <span className="badge">PPTAgent + MultiAgent + MCP</span>
        </div>
      </div>

      {/* Input Section */}
      <div className="input-section">
        <div className="form-group">
          <label>Presentation Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="E.g., AI in Healthcare 2025"
            disabled={isGenerating}
          />
        </div>

        <div className="form-group">
          <label>Requirements (Optional)</label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Specific requirements: target audience, key points, data sources..."
            rows={3}
            disabled={isGenerating}
          />
        </div>

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={!topic || isGenerating}
        >
          <Play size={16} />
          {isGenerating ? 'Generating...' : 'Generate Presentation'}
        </button>
      </div>

      {/* Progress Pipeline */}
      {isGenerating && (
        <div className="pipeline-section">
          <h3>Generation Pipeline</h3>
          <div className="pipeline-stages">
            <StageIndicator
              name="Outline"
              stage="outline"
              current={currentStage}
              progress={progress.outline}
            />
            <StageIndicator
              name="Research"
              stage="research"
              current={currentStage}
              progress={progress.research}
              subtitle="3 parallel agents"
            />
            <StageIndicator
              name="Generation"
              stage="generation"
              current={currentStage}
              progress={progress.generation}
              subtitle="With quality loops"
            />
            <StageIndicator
              name="Export"
              stage="export"
              current={currentStage}
              progress={progress.export}
            />
          </div>
        </div>
      )}

      {/* Slides Preview */}
      {slides.length > 0 && (
        <div className="slides-section">
          <h3>Generated Slides ({slides.length})</h3>
          <div className="slides-grid">
            {slides.map((slide, idx) => (
              <SlidePreview key={idx} slide={slide} index={idx + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Quality Scores (PPTEval) */}
      {qualityScores && (
        <div className="quality-section">
          <h3>Quality Assessment (PPTEval)</h3>
          <div className="quality-scores">
            <QualityScore label="Content" score={qualityScores.content} />
            <QualityScore label="Design" score={qualityScores.design} />
            <QualityScore label="Coherence" score={qualityScores.coherence} />
          </div>
        </div>
      )}

      {/* Download Section */}
      {generatedFile && (
        <div className="download-section">
          <button className="download-btn" onClick={() => window.open(generatedFile)}>
            <Download size={16} />
            Download .pptx
          </button>
        </div>
      )}
    </div>
  );
};

// Sub-components
const StageIndicator: React.FC<StageIndicatorProps> = ({ name, stage, current, progress, subtitle }) => {
  const isActive = current === stage;
  const isComplete = progress === 100;

  return (
    <div className={`stage-indicator ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
      <div className="stage-icon">
        {isComplete ? <CheckCircle /> : isActive ? <Zap /> : <div className="dot" />}
      </div>
      <div className="stage-info">
        <div className="stage-name">{name}</div>
        {subtitle && <div className="stage-subtitle">{subtitle}</div>}
        {progress !== undefined && (
          <div className="stage-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

const SlidePreview: React.FC<{ slide: Slide; index: number }> = ({ slide, index }) => (
  <div className="slide-preview">
    <div className="slide-number">#{index}</div>
    <div className="slide-title">{slide.title}</div>
    <div className="slide-type">{slide.type}</div>
  </div>
);

const QualityScore: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  const color = score >= 8 ? 'green' : score >= 7 ? 'yellow' : 'red';
  
  return (
    <div className="quality-score">
      <div className="score-label">{label}</div>
      <div className={`score-value ${color}`}>{score.toFixed(1)}/10</div>
      <div className="score-bar">
        <div className="score-fill" style={{ width: `${score * 10}%`, backgroundColor: `var(--${color})` }} />
      </div>
    </div>
  );
};

// Interfaces
type GenerationStage = 'outline' | 'research' | 'generation' | 'export';

interface StageProgress {
  [key: string]: number;
}

interface ProgressUpdate {
  stage: GenerationStage;
  progress: number;
  data?: any;
}

interface Slide {
  type: string;
  title: string;
  content?: string;
}

interface QualityScores {
  content: number;
  design: number;
  coherence: number;
}

interface GenerationResult {
  success: boolean;
  filePath: string;
  slides: Slide[];
  qualityScores: QualityScores;
}

interface StageIndicatorProps {
  name: string;
  stage: GenerationStage;
  current: GenerationStage | null;
  progress?: number;
  subtitle?: string;
}

export default AutonomousPowerPointMasterV2;
