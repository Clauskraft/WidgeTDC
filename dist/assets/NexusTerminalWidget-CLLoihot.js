import{r as i,j as t}from"./ui-d27jHJxv.js";import"./vendor-BerfLJhL.js";const C=y=>({on:()=>{},close:()=>{},send:()=>{}}),_=()=>{const[y,l]=i.useState([]),[u,E]=i.useState(""),[g,m]=i.useState(!1),[S,v]=i.useState(null),w=i.useRef(null);i.useEffect(()=>{var e;(e=w.current)==null||e.scrollIntoView({behavior:"smooth"})},[y]),i.useEffect(()=>{const e=C();return v(e),e.on("NEXUS_RESPONSE",a=>{const p=typeof a=="string"?a:a.data,x={id:`nexus-${Date.now()}`,content:p,timestamp:new Date,type:"nexus"};l(h=>[...h,x]),m(!1),N()}),l([{id:"welcome",content:"NEXUS online. System integration active.",timestamp:new Date,type:"system"}]),()=>{e.close()}},[]);const N=()=>{try{const e=new(window.AudioContext||window.webkitAudioContext),r=e.createOscillator(),a=e.createGain();r.connect(a),a.connect(e.destination),r.type="sine",r.frequency.setValueAtTime(800,e.currentTime),r.frequency.exponentialRampToValueAtTime(300,e.currentTime+.1),a.gain.setValueAtTime(.1,e.currentTime),a.gain.exponentialRampToValueAtTime(.01,e.currentTime+.1),r.start(),r.stop(e.currentTime+.1)}catch(e){console.warn("Audio feedback failed:",e)}},j=async()=>{var a,p,x,h,b,T;if(!u.trim()||g||!S)return;const e={id:`user-${Date.now()}`,content:u.trim(),timestamp:new Date,type:"user"};l(c=>[...c,e]);const r=u;E(""),m(!0);try{const[c,f]=await Promise.all([fetch("http://localhost:3001/api/sys/system"),fetch("http://localhost:3001/api/sys/processes")]),d=c.ok?await c.json():{},R=f.ok?await f.json():[],D=`
SYSTEM STATUS:
CPU Load: ${((p=(a=d.load)==null?void 0:a.currentLoad)==null?void 0:p.toFixed(1))||"Unknown"}%
Memory Used: ${((h=(x=d.memory)==null?void 0:x.usedPercent)==null?void 0:h.toFixed(1))||"Unknown"}%
Top Processes: ${R.slice(0,3).map(n=>`${n.name}(${n.cpu}%)`).join(", ")}

AVAILABLE COMMANDS:
- Kill Chrome/Firefox/Edge processes
- Open Steam or applications
- Flush DNS cache
- Kill Node processes
- Restart Windows Explorer
      `.trim();let o;try{const n=await fetch("http://localhost:11434/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"mistral",prompt:`You are NEXUS, an OS-integrated Core AI. You are cynical, brief, and powerful.
You have ROOT ACCESS to this machine.

RULES:
1. If the user asks to do a system action (kill app, open app, fix net), response ONLY with the command code in brackets like: [[KILL_CHROME]]
2. Available Codes: [[KILL_CHROME]], [[OPEN_STEAM]], [[FLUSH_DNS]], [[KILL_NODE]], [[RESTART_EXPLORER]]
3. If no action is needed, just reply sarcastically with text.

${D}

USER: ${r}
NEXUS:`,stream:!1})});if(n.ok)o=(await n.json()).response;else throw new Error("Ollama not available")}catch{console.log("Ollama not available, using fallback AI simulation");const s=r.toLowerCase();s.includes("kill")&&s.includes("chrome")?o="[[KILL_CHROME]]":s.includes("open")&&s.includes("steam")?o="[[OPEN_STEAM]]":s.includes("flush")&&s.includes("dns")?o="[[FLUSH_DNS]]":s.includes("kill")&&s.includes("node")?o="[[KILL_NODE]]":s.includes("restart")&&s.includes("explorer")?o="[[RESTART_EXPLORER]]":s.includes("status")||s.includes("system")?o=`System online. CPU at ${((T=(b=d.load)==null?void 0:b.currentLoad)==null?void 0:T.toFixed(1))||"unknown"}%, ${R.length} processes running. What do you need terminated?`:o='Command not recognized. Try: "kill chrome", "open steam", "flush dns", or "system status".'}if(o.includes("[[")){const n=o.match(/\[\[(.*?)\]\]/);if(n&&n[1]){const s=n[1],O={id:`auth-${Date.now()}`,content:`⚡ AUTHORIZED: Initiating ${s}...`,timestamp:new Date,type:"system"};l(k=>[...k,O]),S.send(`NEXUS_COMMAND:${s}`),setTimeout(()=>{},500);return}}const L={id:`nexus-${Date.now()}`,content:o,timestamp:new Date,type:"nexus"};l(n=>[...n,L]),m(!1),N()}catch(c){const f={id:`error-${Date.now()}`,content:`SYSTEM ERROR: ${c.message}`,timestamp:new Date,type:"system"};l(d=>[...d,f]),m(!1)}},A=e=>{e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),j())};return t.jsxs("div",{className:`\r
      col-span-1 md:col-span-2\r
      bg-black/80\r
      border-l-4 border-green-500\r
      p-4 rounded-r-xl\r
      shadow-[0_0_30px_rgba(0,255,0,0.15)]\r
      flex flex-col h-64\r
      font-mono text-sm\r
      relative overflow-hidden\r
\r
      /* SCANLINES EFFECT */\r
      before:content-['']\r
      before:absolute before:inset-0\r
      before:bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]\r
      before:bg-[length:100%_2px,3px_100%]\r
      before:pointer-events-none\r
      before:z-20\r
    `,children:[t.jsx("div",{className:"text-green-400 font-bold text-lg mb-2 relative z-30",children:"NEXUS TERMINAL"}),t.jsxs("div",{className:"flex-1 overflow-y-auto space-y-2 mb-3 relative z-30",children:[y.map(e=>t.jsxs("div",{className:"text-xs",children:[e.type==="user"&&t.jsxs("div",{className:"text-blue-400",children:[t.jsx("span",{className:"text-gray-500",children:">"})," ",e.content]}),e.type==="nexus"&&t.jsxs("div",{className:"text-green-400",children:[t.jsx("span",{className:"text-yellow-400",children:"NEXUS:"})," ",e.content]}),e.type==="system"&&t.jsxs("div",{className:"text-red-400",children:[t.jsx("span",{className:"text-red-500",children:"[SYSTEM]"})," ",e.content]})]},e.id)),g&&t.jsxs("div",{className:"text-yellow-400",children:[t.jsx("span",{className:"text-yellow-500",children:"[THINKING]"})," Processing..."]}),t.jsx("div",{ref:w})]}),t.jsx("div",{className:"relative z-30",children:t.jsxs("div",{className:"flex items-center",children:[t.jsx("span",{className:"text-green-400 mr-2",children:">"}),t.jsx("input",{type:"text",value:u,onChange:e=>E(e.target.value),onKeyPress:A,placeholder:"Enter command...",className:"flex-1 bg-transparent border-none outline-none text-green-400 placeholder-gray-600",disabled:g})]})})]})};export{_ as default};
