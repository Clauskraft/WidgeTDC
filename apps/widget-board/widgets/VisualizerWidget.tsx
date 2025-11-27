import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Edit2, Eye, Save, RefreshCw, Download, Maximize2, ZoomIn, ZoomOut, Info, Activity, Database } from 'lucide-react';

// Initial WidgeTDC System Status Diagram
const SYSTEM_STATUS_DIAGRAM = `
flowchart TD
    %% Nodes
    subgraph Frontend [Widget Board (Port 8888)]
        UI[React UI]
        Chat[Chat Widget]
        Cal[Calendar Widget]
        Wiki[Local Wiki]
        Vis[Visualizer]
    end

    subgraph Backend [MCP Server (Port 3001)]
        API[Express API]
        Scraper[Data Scraper]
        Cron[Cron Jobs]
    end

    subgraph Memory [Hukommelse]
        Vector[Vector DB]
        Graph[Graph DB]
        Files[Filsystem]
    end

    subgraph AI [Intelligence]
        Ollama[Ollama (Local)]
        DeepSeek[DeepSeek (Cloud)]
    end

    %% Data Flows
    UI -->|Vises| Chat
    UI -->|Vises| Cal
    UI -->|Vises| Wiki

    %% Status Links (Rød = Mangler, Grøn = Aktiv, Gul = Mock)
    Chat -.->|Direkte (Ingen Memory)| Ollama
    Chat -.->|Direkte (Ingen Memory)| DeepSeek
    
    Cal --x|Mangler (Mock Data)| API
    Wiki --x|Mangler (Mock Data)| API
    
    API --x|Ikke aktiv| Scraper
    API --x|Ikke aktiv| Cron
    
    Scraper --x|Mangler| Files
    API --x|Mangler| Vector
    
    %% Styling
    classDef active fill:#d1fae5,stroke:#059669,stroke-width:2px,color:#064e3b;
    classDef mock fill:#fef3c7,stroke:#d97706,stroke-width:2px,stroke-dasharray: 5 5,color:#78350f;
    classDef missing fill:#fee2e2,stroke:#dc2626,stroke-width:2px,stroke-dasharray: 5 5,color:#7f1d1d;
    classDef ai fill:#e0e7ff,stroke:#4f46e5,stroke-width:2px,color:#312e81;

    class UI,Vis active
    class Chat,Ollama,DeepSeek ai
    class Cal,Wiki mock
    class API,Scraper,Cron,Vector,Graph,Files missing
`;

const TEMPLATE_ER = `
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
`;

const TEMPLATE_SEQUENCE = `
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
`;

export default function VisualizerWidget() {
    const [code, setCode] = useState(SYSTEM_STATUS_DIAGRAM);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'Inter, sans-serif'
        });
        renderDiagram();
    }, []);

    useEffect(() => {
        if (!isEditing) {
            renderDiagram();
        }
    }, [code, isEditing]);

    const renderDiagram = async () => {
        if (!containerRef.current) return;
        setError(null);
        
        try {
            const { svg } = await mermaid.render('mermaid-svg-' + Date.now(), code);
            containerRef.current.innerHTML = svg;
        } catch (err) {
            console.error('Mermaid render error:', err);
            setError('Kunne ikke rendere diagram. Tjek syntaksen.');
            // Mermaid leaves artifacts on error, clean them up
            const oldSvg = document.querySelector(`#${'mermaid-svg-' + Date.now()}`);
            if (oldSvg) oldSvg.remove();
        }
    };

    const handleTemplateLoad = (template: string) => {
        setCode(template);
        setIsEditing(true); // Switch to edit mode to show the code
    };

    return (
        <div className="flex h-full bg-[#0B3E6F]/30 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden text-white">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 flex flex-col bg-black/10">
                <div className="p-4 border-b border-white/10">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Maximize2 size={18} className="text-[#00B5CB]" />
                        Visualizer
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Arkitektur & Diagrammer</p>
                </div>

                <div className="p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Templates</p>
                    <button 
                        onClick={() => handleTemplateLoad(SYSTEM_STATUS_DIAGRAM)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors flex items-center gap-2"
                    >
                        <Activity size={14} className="text-green-400" /> System Status
                    </button>
                    <button 
                        onClick={() => handleTemplateLoad(TEMPLATE_SEQUENCE)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={14} className="text-blue-400" /> Sekvens
                    </button>
                    <button 
                        onClick={() => handleTemplateLoad(TEMPLATE_ER)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors flex items-center gap-2"
                    >
                        <Database size={14} className="text-purple-400" /> ER Diagram
                    </button>
                </div>

                <div className="mt-auto p-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <Info size={12} />
                        <span>Syntax Guide:</span>
                    </div>
                    <a href="https://mermaid.js.org/intro/" target="_blank" rel="noreferrer" className="text-[#00B5CB] hover:underline text-xs">
                        Mermaid Documentation
                    </a>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative bg-[#051e3c]/50">
                {/* Toolbar */}
                <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-white/5">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${isEditing ? 'bg-[#00B5CB] text-[#051e3c]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            {isEditing ? <Eye size={14} /> : <Edit2 size={14} />}
                            {isEditing ? 'Vis Diagram' : 'Rediger Kode'}
                        </button>
                    </div>
                    
                    {!isEditing && (
                        <div className="flex gap-2">
                            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300">
                                <ZoomOut size={16} />
                            </button>
                            <span className="text-xs flex items-center text-gray-400 w-12 justify-center">{(scale * 100).toFixed(0)}%</span>
                            <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300">
                                <ZoomIn size={16} />
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-1" />
                            <button className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300" title="Download SVG">
                                <Download size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Editor / Preview */}
                <div className="flex-1 overflow-hidden relative">
                    {isEditing ? (
                        <textarea 
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full h-full bg-[#0d1117] text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none"
                            spellCheck={false}
                        />
                    ) : (
                        <div className="w-full h-full overflow-auto flex items-center justify-center p-8 bg-grid-pattern">
                            {error ? (
                                <div className="text-red-400 bg-red-900/20 border border-red-900/50 p-4 rounded-lg flex items-center gap-3">
                                    <Info size={20} />
                                    {error}
                                </div>
                            ) : (
                                <div 
                                    ref={containerRef} 
                                    className="mermaid-container transition-transform duration-200 origin-center"
                                    style={{ transform: `scale(${scale})` }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

