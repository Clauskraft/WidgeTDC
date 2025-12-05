import React, { useState } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
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
    color: 'text-blue-400',
    focus: 'System design, scalability, patterns',
  },
  {
    id: 'security',
    name: 'Security Expert',
    icon: Shield,
    color: 'text-red-400',
    focus: 'Vulnerabilities, compliance, auth',
  },
  {
    id: 'backend',
    name: 'Backend Expert',
    icon: Code,
    color: 'text-emerald-400',
    focus: 'APIs, databases, performance',
  },
  {
    id: 'frontend',
    name: 'Frontend Expert',
    icon: Sparkles,
    color: 'text-amber-400',
    focus: 'UX, accessibility, responsive',
  },
];

export const PersonaCoordinatorWidget: React.FC<{ widgetId?: string }> = () => {
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['architecture', 'security']);
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

    setSelectedFile(file);
    setIsReviewing(true);

    try {
        // Mock response for UI testing if backend is unavailable
        await new Promise(r => setTimeout(r, 2000));
        
        // Fallback Mock Data
        const mockResult: ReviewResult = {
            summary: "Strong architectural foundation, but potential security gaps in authentication flow.",
            consensus: ["Microservices approach is appropriate", "React stack is well chosen"],
            disagreements: ["Database choice (SQL vs NoSQL)", "Auth provider strategy"],
            overallScore: 78,
            personas: [
                { 
                    persona: 'architecture', role: 'Architect', feedback: 'Clean separation of concerns. Good scalability.', confidence: 0.9, 
                    recommendations: ['Add caching layer'], concerns: []
                },
                {
                    persona: 'security', role: 'Security', feedback: 'Auth flow needs hardening against CSRF.', confidence: 0.75,
                    recommendations: ['Implement strict CSP'], concerns: ['Token storage in localStorage']
                }
            ]
        };
        setResult(mockResult);

        // Real fetch call (commented out until backend endpoint is verified)
        /*
        const formData = new FormData();
        formData.append('file', file);
        formData.append('personas', JSON.stringify(selectedPersonas));
        const response = await fetch('/api/commands/sc/spec-panel', { method: 'POST', body: formData });
        const data = await response.json();
        setResult(data);
        */
    } catch (error) {
      console.error('Review error:', error);
    } finally {
      setIsReviewing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <MatrixWidgetWrapper title="Persona Coordinator">
      <div className="flex flex-col h-full gap-4">
        
        {/* Persona Selection Grid */}
        {!result && (
            <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Expert Panel</p>
                <div className="grid grid-cols-2 gap-2">
                {personas.map((persona) => {
                    const Icon = persona.icon;
                    const isSelected = selectedPersonas.includes(persona.id);
                    return (
                    <button
                        key={persona.id}
                        onClick={() => togglePersona(persona.id)}
                        className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col gap-2 ${
                        isSelected
                            ? 'bg-[#00B5CB]/10 border-[#00B5CB] shadow-lg shadow-[#00B5CB]/10'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex items-center justify-between w-full">
                            <Icon className={`w-5 h-5 ${persona.color}`} />
                            {isSelected && <CheckCircle className="w-4 h-4 text-[#00B5CB]" />}
                        </div>
                        <div>
                            <span className={`text-sm font-medium block ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                {persona.name}
                            </span>
                            <span className="text-[10px] text-gray-500 line-clamp-1">{persona.focus}</span>
                        </div>
                    </button>
                    );
                })}
                </div>
            </div>
        )}

        {/* Upload / Loading State */}
        {!result && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-xl bg-black/20 mt-2">
            {isReviewing ? (
                <div className="text-center space-y-3">
                    <div className="relative w-12 h-12 mx-auto">
                        <div className="absolute inset-0 border-2 border-[#00B5CB] border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-sm text-gray-300">Consulting experts...</p>
                    <p className="text-xs text-gray-500">Analyzing document structure</p>
                </div>
            ) : (
                <label className="flex flex-col items-center cursor-pointer group">
                    <div className="p-4 bg-white/5 rounded-full mb-3 group-hover:bg-[#00B5CB]/20 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#00B5CB]" />
                    </div>
                    <span className="text-sm font-semibold text-gray-200 group-hover:text-white">Upload Specification</span>
                    <span className="text-xs text-gray-500 mt-1">PDF, MD, or TXT</span>
                    <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".md,.txt,.pdf,.docx"
                        disabled={isReviewing || selectedPersonas.length === 0}
                    />
                </label>
            )}
          </div>
        )}

        {/* Results View */}
        {result && (
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
            {/* Overall Summary */}
            <div className="p-4 bg-[#00B5CB]/10 border border-[#00B5CB]/20 rounded-xl">
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold ${getConfidenceColor(result.overallScore / 100)}`}>
                  {result.overallScore}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wide">Consensus Score</h4>
                  <p className="text-xs text-gray-300 mt-1">{result.summary}</p>
                </div>
              </div>
            </div>

            {/* Consensus & Disagreements */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h5 className="font-bold text-xs text-green-400 mb-2 flex items-center gap-1"><CheckCircle size={12}/> Consensus</h5>
                <ul className="space-y-1">
                  {result.consensus.map((item, index) => (
                    <li key={index} className="text-[10px] text-gray-300">• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h5 className="font-bold text-xs text-yellow-400 mb-2 flex items-center gap-1"><AlertCircle size={12}/> Conflicts</h5>
                <ul className="space-y-1">
                  {result.disagreements.map((item, index) => (
                    <li key={index} className="text-[10px] text-gray-300">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Individual Persona Feedback */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Expert Feedback</h4>
              <div className="space-y-3">
                {result.personas.map((personaFeedback, index) => {
                  const persona = personas.find((p) => p.id === personaFeedback.persona);
                  if (!persona) return null;
                  const Icon = persona.icon;

                  return (
                    <div key={index} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${persona.color}`} />
                          <span className="text-xs font-bold text-white">{persona.name}</span>
                        </div>
                        <span className={`text-xs font-mono ${getConfidenceColor(personaFeedback.confidence)}`}>
                          {Math.round(personaFeedback.confidence * 100)}% conf.
                        </span>
                      </div>

                      <p className="text-xs text-gray-300 mb-2">{personaFeedback.feedback}</p>

                      {/* Concerns */}
                      {personaFeedback.concerns.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <p className="text-[10px] font-bold text-red-400 mb-1">Concerns:</p>
                          {personaFeedback.concerns.map((c, i) => (
                              <p key={i} className="text-[10px] text-gray-400 pl-2 border-l border-red-500/30">{c}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
                onClick={() => { setResult(null); setSelectedFile(null); }}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-xs font-medium rounded-lg text-white transition-colors"
            >
                Start New Review
            </button>
          </div>
        )}
      </div>
    </MatrixWidgetWrapper>
  );
};

export default PersonaCoordinatorWidget;
