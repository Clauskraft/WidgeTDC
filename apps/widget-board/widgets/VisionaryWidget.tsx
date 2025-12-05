import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSemanticBrain } from '../src/hooks/useSemanticBrain';
import mermaid from 'mermaid';
import {
  Eye, Brain, Sparkles, Code, Copy, Check,
  RefreshCw, ChevronDown, ChevronUp, Zap, History,
  GitBranch, Network, Workflow
} from 'lucide-react';

/**
 * The Visionary - Intelligent Diagram Generator Widget
 *
 * Features:
 * - Semantic memory: Recalls past diagram patterns and preferences
 * - Context-aware Mermaid.js generation
 * - Live diagram preview
 * - Broadcasts insights for other widgets
 * - Multiple diagram types: flowchart, sequence, class, state, ER, etc.
 */

interface GeneratedDiagram {
  id: string;
  prompt: string;
  code: string;
  type: DiagramType;
  timestamp: number;
  memories: string[];
}

type DiagramType = 'flowchart' | 'sequence' | 'class' | 'state' | 'erDiagram' | 'gantt' | 'pie' | 'mindmap';

const DIAGRAM_TEMPLATES: Record<DiagramType, { icon: React.ReactNode; label: string; example: string }> = {
  flowchart: {
    icon: <Workflow className="w-4 h-4" />,
    label: 'Flowchart',
    example: 'flowchart TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Action]\n    B -->|No| D[End]'
  },
  sequence: {
    icon: <GitBranch className="w-4 h-4" />,
    label: 'Sequence',
    example: 'sequenceDiagram\n    Alice->>Bob: Hello\n    Bob-->>Alice: Hi!'
  },
  class: {
    icon: <Network className="w-4 h-4" />,
    label: 'Class',
    example: 'classDiagram\n    class Animal\n    Animal : +name\n    Animal : +age'
  },
  state: {
    icon: <RefreshCw className="w-4 h-4" />,
    label: 'State',
    example: 'stateDiagram-v2\n    [*] --> Active\n    Active --> [*]'
  },
  erDiagram: {
    icon: <Network className="w-4 h-4" />,
    label: 'ER Diagram',
    example: 'erDiagram\n    USER ||--o{ ORDER : places\n    ORDER ||--|{ ITEM : contains'
  },
  gantt: {
    icon: <Workflow className="w-4 h-4" />,
    label: 'Gantt',
    example: 'gantt\n    title Project\n    section Phase 1\n    Task 1 :a1, 2024-01-01, 30d'
  },
  pie: {
    icon: <Eye className="w-4 h-4" />,
    label: 'Pie Chart',
    example: 'pie title Distribution\n    "A" : 40\n    "B" : 30\n    "C" : 30'
  },
  mindmap: {
    icon: <Brain className="w-4 h-4" />,
    label: 'Mind Map',
    example: 'mindmap\n  root((Central))\n    Branch 1\n    Branch 2'
  }
};

const VisionaryWidget: React.FC<{ widgetId?: string }> = ({ widgetId }) => {
  const [prompt, setPrompt] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  const [renderedSvg, setRenderedSvg] = useState<string | null>(null);
  const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<GeneratedDiagram[]>([]);
  const [error, setError] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  // Semantic Brain - Widget Telepathy
  const {
    thoughts,
    isThinking: isRecalling,
    recall,
    broadcast,
    canDream,
    brainStatus
  } = useSemanticBrain('TheVisionary');

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#6366f1',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#818cf8',
        lineColor: '#94a3b8',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a',
        background: '#0f172a',
        mainBkg: '#1e293b',
        nodeBorder: '#6366f1',
        clusterBkg: '#1e293b',
        titleColor: '#f8fafc',
        edgeLabelBackground: '#1e293b'
      },
      securityLevel: 'loose',
      fontFamily: 'ui-monospace, monospace'
    });
  }, []);

  // Debounced recall when user types
  useEffect(() => {
    if (prompt.length > 10) {
      const timer = setTimeout(() => {
        recall(prompt, { limit: 3, minScore: 0.5 });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [prompt, recall]);

  // Render Mermaid diagram when code changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidCode.trim()) {
        setRenderedSvg(null);
        return;
      }

      try {
        setError(null);
        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, mermaidCode);
        setRenderedSvg(svg);
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        setError(err.message || 'Failed to render diagram');
        setRenderedSvg(null);
      }
    };

    const timer = setTimeout(renderDiagram, 300);
    return () => clearTimeout(timer);
  }, [mermaidCode]);

  // Build enriched prompt with memories
  const buildEnrichedPrompt = useCallback(() => {
    if (thoughts.length === 0) return prompt;

    const memoryContext = thoughts
      .map(t => `- Previously noted: "${t.content}" (${t.agent}, relevance: ${(t.score * 100).toFixed(0)}%)`)
      .join('\n');

    return `
USER REQUEST: ${prompt}

DIAGRAM TYPE: ${diagramType}

CONTEXT FROM MEMORY (Use these to match user's style/preferences):
${memoryContext}

Generate valid Mermaid.js code for the requested diagram. Apply any relevant patterns from memory.
    `.trim();
  }, [prompt, thoughts, diagramType]);

  // Handle diagram generation
  const handleVisualize = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    // Broadcast that we're starting work
    await broadcast('TOOL_SELECTION', `Starting diagram generation for: ${prompt.substring(0, 50)}...`);

    try {
      const enrichedPrompt = buildEnrichedPrompt();

      // Call backend API for diagram generation
      const response = await fetch('/api/mcp/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'visionary.generate',
          payload: {
            prompt: enrichedPrompt,
            diagramType,
            memories: thoughts.map(t => t.content),
            format: 'mermaid'
          }
        })
      });

      let code = '';

      if (response.ok) {
        const data = await response.json();
        code = data.code || data.result?.code || generateFallbackDiagram(prompt, diagramType);
      } else {
        // Fallback to local generation for demo
        code = generateFallbackDiagram(prompt, diagramType);
      }

      setMermaidCode(code);

      // Save to history
      const diagram: GeneratedDiagram = {
        id: `diagram-${Date.now()}`,
        prompt,
        code,
        type: diagramType,
        timestamp: Date.now(),
        memories: thoughts.map(t => t.content)
      };
      setHistory(prev => [diagram, ...prev].slice(0, 10));

      // Broadcast insight about what was created
      await broadcast('INSIGHT', `Generated ${diagramType} diagram: ${prompt.substring(0, 60)}`, {
        promptLength: prompt.length,
        memoriesUsed: thoughts.length,
        diagramType,
        codeLength: code.length
      });

    } catch (err) {
      console.error('Generation failed:', err);
      setError('Failed to generate diagram. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fallback diagram generator (demo mode)
  const generateFallbackDiagram = (userPrompt: string, type: DiagramType): string => {
    const keywords = userPrompt.toLowerCase().split(' ').filter(w => w.length > 3);

    switch (type) {
      case 'flowchart':
        return `flowchart TD
    subgraph "${userPrompt.substring(0, 30)}"
        A[Start] --> B{${keywords[0] || 'Decision'}}
        B -->|Yes| C[${keywords[1] || 'Process A'}]
        B -->|No| D[${keywords[2] || 'Process B'}]
        C --> E[${keywords[3] || 'Complete'}]
        D --> E
        E --> F[End]
    end

    style A fill:#22c55e,color:#fff
    style F fill:#ef4444,color:#fff
    style B fill:#6366f1,color:#fff`;

      case 'sequence':
        const actors = keywords.slice(0, 3);
        return `sequenceDiagram
    participant U as User
    participant S as ${actors[0] || 'System'}
    participant D as ${actors[1] || 'Database'}

    U->>S: Request ${keywords[2] || 'data'}
    activate S
    S->>D: Query
    activate D
    D-->>S: Results
    deactivate D
    S-->>U: Response
    deactivate S

    Note over U,D: ${userPrompt.substring(0, 40)}`;

      case 'class':
        return `classDiagram
    class ${keywords[0] || 'Entity'} {
        +id: string
        +name: string
        +created: Date
        +process()
        +validate()
    }

    class ${keywords[1] || 'Service'} {
        +${keywords[0] || 'entity'}: ${keywords[0] || 'Entity'}
        +create()
        +update()
        +delete()
    }

    ${keywords[1] || 'Service'} --> ${keywords[0] || 'Entity'} : manages`;

      case 'state':
        return `stateDiagram-v2
    [*] --> Idle
    Idle --> ${keywords[0] || 'Processing'}: start
    ${keywords[0] || 'Processing'} --> ${keywords[1] || 'Validating'}: process
    ${keywords[1] || 'Validating'} --> Success: valid
    ${keywords[1] || 'Validating'} --> Error: invalid
    Success --> [*]
    Error --> Idle: retry

    note right of ${keywords[0] || 'Processing'}
        ${userPrompt.substring(0, 30)}
    end note`;

      case 'erDiagram':
        return `erDiagram
    ${keywords[0]?.toUpperCase() || 'USER'} {
        string id PK
        string name
        date created
    }

    ${keywords[1]?.toUpperCase() || 'ITEM'} {
        string id PK
        string title
        string status
    }

    ${keywords[0]?.toUpperCase() || 'USER'} ||--o{ ${keywords[1]?.toUpperCase() || 'ITEM'} : owns`;

      case 'gantt':
        return `gantt
    title ${userPrompt.substring(0, 40)}
    dateFormat YYYY-MM-DD

    section Planning
    ${keywords[0] || 'Research'}     :a1, 2024-01-01, 7d
    ${keywords[1] || 'Design'}       :a2, after a1, 14d

    section Development
    ${keywords[2] || 'Build'}        :b1, after a2, 21d
    Testing                          :b2, after b1, 7d

    section Launch
    Deploy                           :c1, after b2, 3d`;

      case 'pie':
        return `pie showData
    title ${userPrompt.substring(0, 30)}
    "${keywords[0] || 'Category A'}" : 35
    "${keywords[1] || 'Category B'}" : 25
    "${keywords[2] || 'Category C'}" : 20
    "Other" : 20`;

      case 'mindmap':
        return `mindmap
  root((${keywords[0] || 'Central Idea'}))
    ${keywords[1] || 'Branch A'}
      Sub-topic 1
      Sub-topic 2
    ${keywords[2] || 'Branch B'}
      Sub-topic 3
      Sub-topic 4
    ${keywords[3] || 'Branch C'}
      Sub-topic 5`;

      default: {
        // Exhaustive check - this should never be reached
        const _exhaustive: never = type;
        return DIAGRAM_TEMPLATES.flowchart.example;
      }
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load example template
  const loadTemplate = (type: DiagramType) => {
    setDiagramType(type);
    setMermaidCode(DIAGRAM_TEMPLATES[type].example);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 text-white rounded-xl border border-indigo-500/30 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-indigo-900/20 to-purple-900/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Eye className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg">The Visionary</h3>
            <p className="text-xs text-slate-400">
              {canDream ? '🧠 Memory Active' : '💤 Memory Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {brainStatus && (
            <span className="text-xs text-slate-500">
              {brainStatus.metrics.totalThoughts} thoughts
            </span>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Generation History"
          >
            <History className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Memory Indicator */}
      {thoughts.length > 0 && (
        <div className="mx-4 mt-3 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-purple-300 text-xs font-medium mb-2">
            <Brain className="w-3 h-3" />
            <span>MEMORY ACTIVATED ({thoughts.length} relevant)</span>
            {isRecalling && <Sparkles className="w-3 h-3 animate-pulse" />}
          </div>
          <ul className="space-y-1">
            {thoughts.slice(0, 3).map((t, i) => (
              <li key={i} className="text-xs text-purple-200/70 truncate flex items-center gap-2">
                <span className="text-purple-400">•</span>
                <span className="flex-1 truncate">{t.content}</span>
                <span className="text-purple-400/50 text-[10px]">
                  {(t.score * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Diagram Type Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Diagram Type
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(DIAGRAM_TEMPLATES) as DiagramType[]).map((type) => (
              <button
                key={type}
                onClick={() => loadTemplate(type)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                  diagramType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {DIAGRAM_TEMPLATES[type].icon}
                {DIAGRAM_TEMPLATES[type].label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            What should I visualize?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the diagram you want... e.g., 'User authentication flow with OAuth2 and JWT tokens'"
            rows={3}
            className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleVisualize}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Visualizing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Visualize
            </>
          )}
        </button>

        {/* Diagram Preview */}
        {(renderedSvg || error) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                {error ? 'Error' : 'Preview'}
              </label>
              {!error && (
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Code
                    </>
                  )}
                </button>
              )}
            </div>
            {error ? (
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            ) : (
              <div
                ref={diagramRef}
                className="bg-slate-950 border border-slate-700 rounded-lg p-4 overflow-auto"
                dangerouslySetInnerHTML={{ __html: renderedSvg || '' }}
              />
            )}
          </div>
        )}

        {/* Mermaid Code Editor */}
        {mermaidCode && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Code className="w-4 h-4" />
              Mermaid Code
            </label>
            <textarea
              value={mermaidCode}
              onChange={(e) => setMermaidCode(e.target.value)}
              rows={8}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        )}

        {/* History Panel */}
        {showHistory && history.length > 0 && (
          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Diagrams
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setPrompt(item.prompt);
                    setMermaidCode(item.code);
                    setDiagramType(item.type);
                  }}
                  className="w-full text-left p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {DIAGRAM_TEMPLATES[item.type].icon}
                    <p className="text-sm text-white truncate flex-1">{item.prompt}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    <span className="text-indigo-400">{item.type}</span>
                    {item.memories.length > 0 && (
                      <span className="text-purple-400">
                        +{item.memories.length} memories
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 bg-slate-900/50 text-center">
        <p className="text-[10px] text-slate-500">
          The Visionary learns from your diagram patterns via the Semantic Bus
        </p>
      </div>
    </div>
  );
};

export default VisionaryWidget;
