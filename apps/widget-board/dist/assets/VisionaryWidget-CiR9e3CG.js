import{j as e}from"./index-DZEoTVC4.js";import{r,n as R,a9 as P,i as k,b as z,Z as _,a7 as J,a8 as K,k as Q,aa as S,ab as $,R as Z,ac as X}from"./ui-DyG0g13d.js";import{u as ee}from"./useSemanticBrain-B9gbs0pR.js";import{m as B}from"./mermaid.core-CqduZa7j.js";import"./vendor-Cv91Oj79.js";import"./graph-i8PIyU_l.js";import"./grid-BAREo1Ej.js";const u={flowchart:{icon:e.jsxDEV(S,{className:"w-4 h-4"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:34,columnNumber:11},void 0),label:"Flowchart",example:`flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[End]`},sequence:{icon:e.jsxDEV(X,{className:"w-4 h-4"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:39,columnNumber:11},void 0),label:"Sequence",example:`sequenceDiagram
    Alice->>Bob: Hello
    Bob-->>Alice: Hi!`},class:{icon:e.jsxDEV($,{className:"w-4 h-4"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:44,columnNumber:11},void 0),label:"Class",example:`classDiagram
    class Animal
    Animal : +name
    Animal : +age`},state:{icon:e.jsxDEV(Z,{className:"w-4 h-4"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:49,columnNumber:11},void 0),label:"State",example:`stateDiagram-v2
    [*] --> Active
    Active --> [*]`},erDiagram:{icon:e.jsxDEV($,{className:"w-4 h-4"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:54,columnNumber:11},void 0),label:"ER Diagram",example:`erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ITEM : contains`},gantt:{icon:e.jsxDEV(S,{className:"w-4 h-4"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:59,columnNumber:11},void 0),label:"Gantt",example:`gantt
    title Project
    section Phase 1
    Task 1 :a1, 2024-01-01, 30d`},pie:{icon:e.jsxDEV(R,{className:"w-4 h-4"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:64,columnNumber:11},void 0),label:"Pie Chart",example:`pie title Distribution
    "A" : 40
    "B" : 30
    "C" : 30`},mindmap:{icon:e.jsxDEV(k,{className:"w-4 h-4"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:69,columnNumber:11},void 0),label:"Mind Map",example:`mindmap
  root((Central))
    Branch 1
    Branch 2`}},oe=({widgetId:ie})=>{const[a,C]=r.useState(""),[c,g]=r.useState(""),[D,N]=r.useState(null),[n,x]=r.useState("flowchart"),[W,w]=r.useState(!1),[A,T]=r.useState(!1),[h,M]=r.useState(!1),[V,I]=r.useState([]),[m,b]=r.useState(null),O=r.useRef(null),{thoughts:l,isThinking:F,recall:j,broadcast:y,canDream:L,brainStatus:v}=ee("TheVisionary");r.useEffect(()=>{B.initialize({startOnLoad:!1,theme:"dark",themeVariables:{primaryColor:"#6366f1",primaryTextColor:"#f8fafc",primaryBorderColor:"#818cf8",lineColor:"#94a3b8",secondaryColor:"#1e293b",tertiaryColor:"#0f172a",background:"#0f172a",mainBkg:"#1e293b",nodeBorder:"#6366f1",clusterBkg:"#1e293b",titleColor:"#f8fafc",edgeLabelBackground:"#1e293b"},securityLevel:"loose",fontFamily:"ui-monospace, monospace"})},[]),r.useEffect(()=>{if(a.length>10){const i=setTimeout(()=>{j(a,{limit:3,minScore:.5})},800);return()=>clearTimeout(i)}},[a,j]),r.useEffect(()=>{const t=setTimeout(async()=>{if(!c.trim()){N(null);return}try{b(null);const{svg:s}=await B.render(`mermaid-${Date.now()}`,c);N(s)}catch(s){console.error("Mermaid render error:",s),b(s.message||"Failed to render diagram"),N(null)}},300);return()=>clearTimeout(t)},[c]);const G=r.useCallback(()=>{if(l.length===0)return a;const i=l.map(t=>`- Previously noted: "${t.content}" (${t.agent}, relevance: ${(t.score*100).toFixed(0)}%)`).join(`
`);return`
USER REQUEST: ${a}

DIAGRAM TYPE: ${n}

CONTEXT FROM MEMORY (Use these to match user's style/preferences):
${i}

Generate valid Mermaid.js code for the requested diagram. Apply any relevant patterns from memory.
    `.trim()},[a,l,n]),H=async()=>{var i;if(a.trim()){w(!0),b(null),await y("TOOL_SELECTION",`Starting diagram generation for: ${a.substring(0,50)}...`);try{const t=G(),s=await fetch("/api/mcp/route",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tool:"visionary.generate",params:{prompt:t,diagramType:n,memories:l.map(d=>d.content),format:"mermaid"}})});let o="";if(s.ok){const d=await s.json();o=d.code||((i=d.result)==null?void 0:i.code)||E(a,n)}else o=E(a,n);g(o);const p={id:`diagram-${Date.now()}`,prompt:a,code:o,type:n,timestamp:Date.now(),memories:l.map(d=>d.content)};I(d=>[p,...d].slice(0,10)),await y("INSIGHT",`Generated ${n} diagram: ${a.substring(0,60)}`,{promptLength:a.length,memoriesUsed:l.length,diagramType:n,codeLength:o.length})}catch(t){console.error("Generation failed:",t),b("Failed to generate diagram. Please try again.")}finally{w(!1)}}},E=(i,t)=>{var o,p,d,U;const s=i.toLowerCase().split(" ").filter(f=>f.length>3);switch(t){case"flowchart":return`flowchart TD
    subgraph "${i.substring(0,30)}"
        A[Start] --> B{${s[0]||"Decision"}}
        B -->|Yes| C[${s[1]||"Process A"}]
        B -->|No| D[${s[2]||"Process B"}]
        C --> E[${s[3]||"Complete"}]
        D --> E
        E --> F[End]
    end

    style A fill:#22c55e,color:#fff
    style F fill:#ef4444,color:#fff
    style B fill:#6366f1,color:#fff`;case"sequence":const f=s.slice(0,3);return`sequenceDiagram
    participant U as User
    participant S as ${f[0]||"System"}
    participant D as ${f[1]||"Database"}

    U->>S: Request ${s[2]||"data"}
    activate S
    S->>D: Query
    activate D
    D-->>S: Results
    deactivate D
    S-->>U: Response
    deactivate S

    Note over U,D: ${i.substring(0,40)}`;case"class":return`classDiagram
    class ${s[0]||"Entity"} {
        +id: string
        +name: string
        +created: Date
        +process()
        +validate()
    }

    class ${s[1]||"Service"} {
        +${s[0]||"entity"}: ${s[0]||"Entity"}
        +create()
        +update()
        +delete()
    }

    ${s[1]||"Service"} --> ${s[0]||"Entity"} : manages`;case"state":return`stateDiagram-v2
    [*] --> Idle
    Idle --> ${s[0]||"Processing"}: start
    ${s[0]||"Processing"} --> ${s[1]||"Validating"}: process
    ${s[1]||"Validating"} --> Success: valid
    ${s[1]||"Validating"} --> Error: invalid
    Success --> [*]
    Error --> Idle: retry

    note right of ${s[0]||"Processing"}
        ${i.substring(0,30)}
    end note`;case"erDiagram":return`erDiagram
    ${((o=s[0])==null?void 0:o.toUpperCase())||"USER"} {
        string id PK
        string name
        date created
    }

    ${((p=s[1])==null?void 0:p.toUpperCase())||"ITEM"} {
        string id PK
        string title
        string status
    }

    ${((d=s[0])==null?void 0:d.toUpperCase())||"USER"} ||--o{ ${((U=s[1])==null?void 0:U.toUpperCase())||"ITEM"} : owns`;case"gantt":return`gantt
    title ${i.substring(0,40)}
    dateFormat YYYY-MM-DD

    section Planning
    ${s[0]||"Research"}     :a1, 2024-01-01, 7d
    ${s[1]||"Design"}       :a2, after a1, 14d

    section Development
    ${s[2]||"Build"}        :b1, after a2, 21d
    Testing                          :b2, after b1, 7d

    section Launch
    Deploy                           :c1, after b2, 3d`;case"pie":return`pie showData
    title ${i.substring(0,30)}
    "${s[0]||"Category A"}" : 35
    "${s[1]||"Category B"}" : 25
    "${s[2]||"Category C"}" : 20
    "Other" : 20`;case"mindmap":return`mindmap
  root((${s[0]||"Central Idea"}))
    ${s[1]||"Branch A"}
      Sub-topic 1
      Sub-topic 2
    ${s[2]||"Branch B"}
      Sub-topic 3
      Sub-topic 4
    ${s[3]||"Branch C"}
      Sub-topic 5`;default:return u[t].example}},Y=async()=>{await navigator.clipboard.writeText(c),T(!0),setTimeout(()=>T(!1),2e3)},q=i=>{x(i),g(u[i].example)};return e.jsxDEV("div",{className:"h-full flex flex-col bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 text-white rounded-xl border border-indigo-500/30 shadow-xl overflow-hidden",children:[e.jsxDEV("div",{className:"flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-indigo-900/20 to-purple-900/20",children:[e.jsxDEV("div",{className:"flex items-center gap-3",children:[e.jsxDEV("div",{className:"p-2 bg-indigo-500/20 rounded-lg",children:e.jsxDEV(R,{className:"w-5 h-5 text-indigo-400"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:388,columnNumber:13},void 0)},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:387,columnNumber:11},void 0),e.jsxDEV("div",{children:[e.jsxDEV("h3",{className:"font-bold text-lg",children:"The Visionary"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:391,columnNumber:13},void 0),e.jsxDEV("p",{className:"text-xs text-slate-400",children:L?"🧠 Memory Active":"💤 Memory Offline"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:392,columnNumber:13},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:390,columnNumber:11},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:386,columnNumber:9},void 0),e.jsxDEV("div",{className:"flex items-center gap-2",children:[v&&e.jsxDEV("span",{className:"text-xs text-slate-500",children:[v.metrics.totalThoughts," thoughts"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:399,columnNumber:13},void 0),e.jsxDEV("button",{onClick:()=>M(!h),className:"p-2 hover:bg-white/10 rounded-lg transition-colors",title:"Generation History",children:e.jsxDEV(P,{className:"w-4 h-4 text-slate-400"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:408,columnNumber:13},void 0)},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:403,columnNumber:11},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:397,columnNumber:9},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:385,columnNumber:7},void 0),l.length>0&&e.jsxDEV("div",{className:"mx-4 mt-3 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg",children:[e.jsxDEV("div",{className:"flex items-center gap-2 text-purple-300 text-xs font-medium mb-2",children:[e.jsxDEV(k,{className:"w-3 h-3"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:417,columnNumber:13},void 0),e.jsxDEV("span",{children:["MEMORY ACTIVATED (",l.length," relevant)"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:418,columnNumber:13},void 0),F&&e.jsxDEV(z,{className:"w-3 h-3 animate-pulse"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:419,columnNumber:29},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:416,columnNumber:11},void 0),e.jsxDEV("ul",{className:"space-y-1",children:l.slice(0,3).map((i,t)=>e.jsxDEV("li",{className:"text-xs text-purple-200/70 truncate flex items-center gap-2",children:[e.jsxDEV("span",{className:"text-purple-400",children:"•"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:424,columnNumber:17},void 0),e.jsxDEV("span",{className:"flex-1 truncate",children:i.content},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:425,columnNumber:17},void 0),e.jsxDEV("span",{className:"text-purple-400/50 text-[10px]",children:[(i.score*100).toFixed(0),"%"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:426,columnNumber:17},void 0)]},t,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:423,columnNumber:15},void 0))},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:421,columnNumber:11},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:415,columnNumber:9},void 0),e.jsxDEV("div",{className:"flex-1 p-4 overflow-y-auto space-y-4",children:[e.jsxDEV("div",{children:[e.jsxDEV("label",{className:"block text-sm font-medium text-slate-300 mb-2",children:"Diagram Type"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:439,columnNumber:11},void 0),e.jsxDEV("div",{className:"flex flex-wrap gap-2",children:Object.keys(u).map(i=>e.jsxDEV("button",{onClick:()=>q(i),className:`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${n===i?"bg-indigo-600 text-white":"bg-slate-800 text-slate-300 hover:bg-slate-700"}`,children:[u[i].icon,u[i].label]},i,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:444,columnNumber:15},void 0))},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:442,columnNumber:11},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:438,columnNumber:9},void 0),e.jsxDEV("div",{children:[e.jsxDEV("label",{className:"block text-sm font-medium text-slate-300 mb-2",children:"What should I visualize?"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:462,columnNumber:11},void 0),e.jsxDEV("textarea",{value:a,onChange:i=>C(i.target.value),placeholder:"Describe the diagram you want... e.g., 'User authentication flow with OAuth2 and JWT tokens'",rows:3,className:"w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:465,columnNumber:11},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:461,columnNumber:9},void 0),e.jsxDEV("button",{onClick:H,disabled:W||!a.trim(),className:"w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all",children:W?e.jsxDEV(e.Fragment,{children:[e.jsxDEV("div",{className:"w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:482,columnNumber:15},void 0),"Visualizing..."]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:481,columnNumber:13},void 0):e.jsxDEV(e.Fragment,{children:[e.jsxDEV(_,{className:"w-4 h-4"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:487,columnNumber:15},void 0),"Visualize"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:486,columnNumber:13},void 0)},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:475,columnNumber:9},void 0),(D||m)&&e.jsxDEV("div",{className:"space-y-2",children:[e.jsxDEV("div",{className:"flex items-center justify-between",children:[e.jsxDEV("label",{className:"text-sm font-medium text-slate-300",children:m?"Error":"Preview"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:497,columnNumber:15},void 0),!m&&e.jsxDEV("button",{onClick:Y,className:"px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-1",children:A?e.jsxDEV(e.Fragment,{children:[e.jsxDEV(J,{className:"w-3 h-3 text-green-400"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:507,columnNumber:23},void 0),"Copied!"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:506,columnNumber:21},void 0):e.jsxDEV(e.Fragment,{children:[e.jsxDEV(K,{className:"w-3 h-3"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:512,columnNumber:23},void 0),"Copy Code"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:511,columnNumber:21},void 0)},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:501,columnNumber:17},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:496,columnNumber:13},void 0),m?e.jsxDEV("div",{className:"p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm",children:m},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:520,columnNumber:15},void 0):e.jsxDEV("div",{ref:O,className:"bg-slate-950 border border-slate-700 rounded-lg p-4 overflow-auto",dangerouslySetInnerHTML:{__html:D||""}},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:524,columnNumber:15},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:495,columnNumber:11},void 0),c&&e.jsxDEV("div",{className:"space-y-2",children:[e.jsxDEV("label",{className:"text-sm font-medium text-slate-300 flex items-center gap-2",children:[e.jsxDEV(Q,{className:"w-4 h-4"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:537,columnNumber:15},void 0),"Mermaid Code"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:536,columnNumber:13},void 0),e.jsxDEV("textarea",{value:c,onChange:i=>g(i.target.value),rows:8,className:"w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm focus:outline-none focus:border-indigo-500 resize-none"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:540,columnNumber:13},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:535,columnNumber:11},void 0),h&&V.length>0&&e.jsxDEV("div",{className:"border-t border-slate-700 pt-4",children:[e.jsxDEV("h4",{className:"text-sm font-medium text-slate-300 mb-3 flex items-center gap-2",children:[e.jsxDEV(P,{className:"w-4 h-4"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:553,columnNumber:15},void 0),"Recent Diagrams"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:552,columnNumber:13},void 0),e.jsxDEV("div",{className:"space-y-2 max-h-40 overflow-y-auto",children:V.map(i=>e.jsxDEV("button",{onClick:()=>{C(i.prompt),g(i.code),x(i.type)},className:"w-full text-left p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors",children:[e.jsxDEV("div",{className:"flex items-center gap-2",children:[u[i.type].icon,e.jsxDEV("p",{className:"text-sm text-white truncate flex-1",children:i.prompt},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:569,columnNumber:21},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:567,columnNumber:19},void 0),e.jsxDEV("div",{className:"flex items-center gap-2 mt-1 text-xs text-slate-500",children:[e.jsxDEV("span",{children:new Date(i.timestamp).toLocaleTimeString()},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:572,columnNumber:21},void 0),e.jsxDEV("span",{className:"text-indigo-400",children:i.type},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:573,columnNumber:21},void 0),i.memories.length>0&&e.jsxDEV("span",{className:"text-purple-400",children:["+",i.memories.length," memories"]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:575,columnNumber:23},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:571,columnNumber:19},void 0)]},i.id,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:558,columnNumber:17},void 0))},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:556,columnNumber:13},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:551,columnNumber:11},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:436,columnNumber:7},void 0),e.jsxDEV("div",{className:"p-3 border-t border-white/10 bg-slate-900/50 text-center",children:e.jsxDEV("p",{className:"text-[10px] text-slate-500",children:"The Visionary learns from your diagram patterns via the Semantic Bus"},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:589,columnNumber:9},void 0)},void 0,!1,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:588,columnNumber:7},void 0)]},void 0,!0,{fileName:"C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/widget-board/widgets/VisionaryWidget.tsx",lineNumber:383,columnNumber:5},void 0)};export{oe as default};
