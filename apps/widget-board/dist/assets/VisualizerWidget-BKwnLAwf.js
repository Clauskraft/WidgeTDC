import{j as e}from"./index-DZEoTVC4.js";import{r as t,$ as D,A as C,R as f,N as h,V as x,n as W,a0 as w,a1 as V,a2 as T,a3 as j}from"./ui-DyG0g13d.js";import{m as p}from"./mermaid.core-CqduZa7j.js";import"./vendor-Cv91Oj79.js";import"./graph-i8PIyU_l.js";import"./grid-BAREo1Ej.js";const N=`
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
`,v=`
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
`,E=`
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
`;function I(){const[r,d]=t.useState(N),[i,o]=t.useState(!1),[u,c]=t.useState(null),[g,n]=t.useState(1),a=t.useRef(null);t.useEffect(()=>{p.initialize({startOnLoad:!0,theme:"dark",securityLevel:"loose",fontFamily:"Inter, sans-serif"}),m()},[]),t.useEffect(()=>{i||m()},[r,i]);const m=async()=>{if(a.current){c(null);try{const{svg:s}=await p.render("mermaid-svg-"+Date.now(),r);a.current.innerHTML=s}catch(s){console.error("Mermaid render error:",s),c("Kunne ikke rendere diagram. Tjek syntaksen.");const b=document.querySelector(`#${"mermaid-svg-"+Date.now()}`);b&&b.remove()}}},l=s=>{d(s),o(!0)};return e.jsxDEV("div",{className:"flex h-full bg-[#0B3E6F]/30 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden text-white",children:[e.jsxDEV("div",{className:"w-64 border-r border-white/10 flex flex-col bg-black/10",children:[e.jsxDEV("div",{className:"p-4 border-b border-white/10",children:[e.jsxDEV("h2",{className:"font-bold text-lg flex items-center gap-2",children:[e.jsxDEV(D,{size:18,className:"text-[#00B5CB]"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:135,columnNumber:25},this),"Visualizer"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:134,columnNumber:21},this),e.jsxDEV("p",{className:"text-xs text-gray-400 mt-1",children:"Arkitektur & Diagrammer"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:138,columnNumber:21},this)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:133,columnNumber:17},this),e.jsxDEV("div",{className:"p-4 space-y-2",children:[e.jsxDEV("p",{className:"text-xs font-semibold text-gray-500 uppercase",children:"Templates"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:142,columnNumber:21},this),e.jsxDEV("button",{onClick:()=>l(N),className:"w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors flex items-center gap-2",children:[e.jsxDEV(C,{size:14,className:"text-green-400"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:147,columnNumber:25},this)," System Status"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:143,columnNumber:21},this),e.jsxDEV("button",{onClick:()=>l(E),className:"w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors flex items-center gap-2",children:[e.jsxDEV(f,{size:14,className:"text-blue-400"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:153,columnNumber:25},this)," Sekvens"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:149,columnNumber:21},this),e.jsxDEV("button",{onClick:()=>l(v),className:"w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors flex items-center gap-2",children:[e.jsxDEV(h,{size:14,className:"text-purple-400"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:159,columnNumber:25},this)," ER Diagram"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:155,columnNumber:21},this)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:141,columnNumber:17},this),e.jsxDEV("div",{className:"mt-auto p-4 border-t border-white/10",children:[e.jsxDEV("div",{className:"flex items-center gap-2 text-xs text-gray-400 mb-2",children:[e.jsxDEV(x,{size:12},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:165,columnNumber:25},this),e.jsxDEV("span",{children:"Syntax Guide:"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:166,columnNumber:25},this)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:164,columnNumber:21},this),e.jsxDEV("a",{href:"https://mermaid.js.org/intro/",target:"_blank",rel:"noreferrer",className:"text-[#00B5CB] hover:underline text-xs",children:"Mermaid Documentation"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:168,columnNumber:21},this)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:163,columnNumber:17},this)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:132,columnNumber:13},this),e.jsxDEV("div",{className:"flex-1 flex flex-col relative bg-[#051e3c]/50",children:[e.jsxDEV("div",{className:"h-12 border-b border-white/10 flex items-center justify-between px-4 bg-white/5",children:[e.jsxDEV("div",{className:"flex gap-2",children:e.jsxDEV("button",{onClick:()=>o(!i),className:`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${i?"bg-[#00B5CB] text-[#051e3c]":"bg-white/10 text-white hover:bg-white/20"}`,children:[i?e.jsxDEV(W,{size:14},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:183,columnNumber:42},this):e.jsxDEV(w,{size:14},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:183,columnNumber:62},this),i?"Vis Diagram":"Rediger Kode"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:179,columnNumber:25},this)},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:178,columnNumber:21},this),!i&&e.jsxDEV("div",{className:"flex gap-2",children:[e.jsxDEV("button",{onClick:()=>n(s=>Math.max(.5,s-.1)),className:"p-1.5 hover:bg-white/10 rounded-lg text-gray-300",children:e.jsxDEV(V,{size:16},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:191,columnNumber:33},this)},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:190,columnNumber:29},this),e.jsxDEV("span",{className:"text-xs flex items-center text-gray-400 w-12 justify-center",children:[(g*100).toFixed(0),"%"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:193,columnNumber:29},this),e.jsxDEV("button",{onClick:()=>n(s=>Math.min(2,s+.1)),className:"p-1.5 hover:bg-white/10 rounded-lg text-gray-300",children:e.jsxDEV(T,{size:16},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:195,columnNumber:33},this)},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:194,columnNumber:29},this),e.jsxDEV("div",{className:"w-px h-4 bg-white/10 mx-1"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:197,columnNumber:29},this),e.jsxDEV("button",{className:"p-1.5 hover:bg-white/10 rounded-lg text-gray-300",title:"Download SVG",children:e.jsxDEV(j,{size:16},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:199,columnNumber:33},this)},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:198,columnNumber:29},this)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:189,columnNumber:25},this)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:177,columnNumber:17},this),e.jsxDEV("div",{className:"flex-1 overflow-hidden relative",children:i?e.jsxDEV("textarea",{value:r,onChange:s=>d(s.target.value),className:"w-full h-full bg-[#0d1117] text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none",spellCheck:!1},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:208,columnNumber:25},this):e.jsxDEV("div",{className:"w-full h-full overflow-auto flex items-center justify-center p-8 bg-grid-pattern",children:u?e.jsxDEV("div",{className:"text-red-400 bg-red-900/20 border border-red-900/50 p-4 rounded-lg flex items-center gap-3",children:[e.jsxDEV(x,{size:20},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:218,columnNumber:37},this),u]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:217,columnNumber:33},this):e.jsxDEV("div",{ref:a,className:"mermaid-container transition-transform duration-200 origin-center",style:{transform:`scale(${g})`}},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:222,columnNumber:33},this)},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:215,columnNumber:25},this)},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:206,columnNumber:17},this)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:175,columnNumber:13},this)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisualizerWidget.tsx",lineNumber:130,columnNumber:9},this)}export{I as default};
