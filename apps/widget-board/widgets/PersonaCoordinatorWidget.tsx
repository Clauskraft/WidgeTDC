import React, { useState } from 'react';
import { Users, Upload, Shield, Layout, Code, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

interface PersonaFeedback {
  persona: string;
  role: string;
  feedback: string;
  confidence: number;
  recommendations: string[];
  concerns: string[];
}

interface ReviewResult {
  summary: string;
  consensus: string[];
  disagreements: string[];
  personas: PersonaFeedback[];
  overallScore: number;
}

const personas = [
  {
    id: 'architecture',
    name: 'Architecture Expert',
    icon: Layout,
    color: '#3b82f6',
    focus: 'System design, scalability, patterns',
  },
  {
    id: 'security',
    name: 'Security Expert',
    icon: Shield,
    color: '#ef4444',
    focus: 'Vulnerabilities, compliance, auth',
  },
  {
    id: 'backend',
    name: 'Backend Expert',
    icon: Code,
    color: '#10b981',
    focus: 'APIs, databases, performance',
  },
  {
    id: 'frontend',
    name: 'Frontend Expert',
    icon: Sparkles,
    color: '#f59e0b',
    focus: 'UX, accessibility, responsive',
  },
];

export const PersonaCoordinatorWidget: React.FC = () => {
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['architecture', 'security']);
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);

  const togglePersona = (personaId: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(personaId)
        ? prev.filter((p) => p !== personaId)
        : [...prev, personaId]
    );
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsReviewing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('personas', JSON.stringify(selectedPersonas));

      const response = await fetch('/api/commands/sc/spec-panel', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Review error:', error);
    } finally {
      setIsReviewing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.6) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="group flex flex-col h-full bg-card/5 backdrop-blur-sm rounded-lg border border-border/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hero)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg animate-glow-pulse">
            <Users className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Persona Coordinator</h3>
            <p className="text-sm text-muted-foreground">Multi-Expert Review Panel</p>
          </div>
        </div>
      </div>

      {/* Persona Selection */}
      <div className="p-4 border-b border-border/20 bg-gradient-subtle">
        <p className="text-sm font-semibold text-card-foreground mb-3">Vælg eksperter til review:</p>
        <div className="grid grid-cols-2 gap-3">
          {personas.map((persona) => {
            const Icon = persona.icon;
            const isSelected = selectedPersonas.includes(persona.id);
            return (
              <button
                key={persona.id}
                onClick={() => togglePersona(persona.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left backdrop-blur-sm ${
                  isSelected
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border bg-card/30 hover:bg-accent/50 hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon
                    className="w-6 h-6 transition-colors"
                    style={{ color: isSelected ? persona.color : 'hsl(var(--muted-foreground))' }}
                  />
                  <span className={`font-semibold transition-colors ${isSelected ? 'text-card-foreground' : 'text-muted-foreground'}`}>
                    {persona.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{persona.focus}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-subtle">
        {!result && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/10 mb-6">
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--primary))' }} />
              <h4 className="text-xl font-semibold text-card-foreground mb-2">
                Upload specification for review
              </h4>
              <p className="text-muted-foreground mb-6 max-w-md">
                Få feedback fra {selectedPersonas.length} eksperter på din arkitektur, design eller specification
              </p>

              <label className="inline-flex items-center gap-2 btn-primary cursor-pointer">
                <Upload className="w-5 h-5" />
                <span>Upload dokument</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".md,.txt,.pdf,.docx"
                  disabled={isReviewing || selectedPersonas.length === 0}
                />
              </label>

              {selectedPersonas.length === 0 && (
                <p className="mt-4 text-sm text-destructive animate-fade-in">⚠️ Vælg mindst én ekspert</p>
              )}

              {isReviewing && (
                <div className="mt-4 flex items-center gap-2 text-muted-foreground animate-fade-in">
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'hsl(var(--primary))' }} />
                  <span>Gennemgår med {selectedPersonas.length} eksperter...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-left max-w-2xl">
              <div className="p-4 bg-success/10 backdrop-blur rounded-lg border border-success/20 transition-transform hover:scale-105">
                <CheckCircle className="w-8 h-8 mb-2" style={{ color: 'hsl(var(--success))' }} />
                <p className="text-sm font-semibold text-card-foreground">Consensus</p>
                <p className="text-xs text-muted-foreground">Where experts agree</p>
              </div>
              <div className="p-4 bg-warning/10 backdrop-blur rounded-lg border border-warning/20 transition-transform hover:scale-105">
                <AlertCircle className="w-8 h-8 mb-2" style={{ color: 'hsl(var(--warning))' }} />
                <p className="text-sm font-semibold text-card-foreground">Trade-offs</p>
                <p className="text-xs text-muted-foreground">Productive tensions</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Overall Summary */}
            <div className="p-6 bg-gradient-card backdrop-blur-sm border border-primary/30 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className={`text-4xl font-bold ${getConfidenceColor(result.overallScore / 100)}`}>
                  {result.overallScore}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-card-foreground">Overall Assessment</h4>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>
              </div>
            </div>

            {/* Consensus & Disagreements */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-success/10 backdrop-blur border border-success/30 rounded-lg transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <h5 className="font-semibold text-success">Expert Consensus</h5>
                </div>
                <ul className="space-y-2">
                  {result.consensus.map((item, index) => (
                    <li key={index} className="text-sm text-card-foreground">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-warning/10 backdrop-blur border border-warning/30 rounded-lg transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <h5 className="font-semibold text-warning">Trade-offs Found</h5>
                </div>
                <ul className="space-y-2">
                  {result.disagreements.map((item, index) => (
                    <li key={index} className="text-sm text-card-foreground">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Individual Persona Feedback */}
            <div>
              <h4 className="text-lg font-semibold text-card-foreground mb-4">
                Expert Feedback ({result.personas.length})
              </h4>
              <div className="space-y-4">
                {result.personas.map((personaFeedback, index) => {
                  const persona = personas.find((p) => p.id === personaFeedback.persona);
                  if (!persona) return null;
                  const Icon = persona.icon;

                  return (
                    <div
                      key={index}
                      className="p-5 bg-card/50 backdrop-blur-sm border border-border/20 rounded-lg transition-all hover:scale-[1.01] hover:shadow-[var(--shadow-card)]"
                    >
                      {/* Persona Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Icon className="w-6 h-6" style={{ color: persona.color }} />
                          <div>
                            <h5 className="font-semibold text-card-foreground">{persona.name}</h5>
                            <p className="text-sm text-muted-foreground">{personaFeedback.role}</p>
                          </div>
                        </div>
                        <div className={`text-xl font-bold ${getConfidenceColor(personaFeedback.confidence)}`}>
                          {Math.round(personaFeedback.confidence * 100)}%
                        </div>
                      </div>

                      {/* Feedback */}
                      <p className="text-card-foreground mb-4">{personaFeedback.feedback}</p>

                      {/* Recommendations */}
                      {personaFeedback.recommendations.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-success mb-2">✅ Recommendations:</p>
                          <ul className="space-y-1">
                            {personaFeedback.recommendations.map((rec, i) => (
                              <li key={i} className="text-sm text-card-foreground ml-4">
                                • {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Concerns */}
                      {personaFeedback.concerns.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-destructive mb-2">⚠️ Concerns:</p>
                          <ul className="space-y-1">
                            {personaFeedback.concerns.map((concern, i) => (
                              <li key={i} className="text-sm text-card-foreground ml-4">
                                • {concern}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                  onClick={() => {
                    setResult(null);
                  }}
                className="btn-secondary"
              >
                New Review
              </button>
              <button
                onClick={() => {
                  const json = JSON.stringify(result, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `review-${Date.now()}.json`;
                  a.click();
                }}
                className="btn-primary"
              >
                Export Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaCoordinatorWidget;
