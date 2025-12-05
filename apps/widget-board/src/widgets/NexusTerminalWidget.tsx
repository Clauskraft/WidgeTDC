import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Wifi, ShieldAlert, Cpu, Activity } from 'lucide-react';

interface CommandResult {
  id: string;
  type: 'input' | 'output' | 'error' | 'info' | 'success';
  content: string;
  timestamp: Date;
}

const NexusTerminalWidget: React.FC = () => {
  const [history, setHistory] = useState<CommandResult[]>([
    { id: 'init', type: 'info', content: 'NEXUS_TERMINAL v2.1 [ONLINE]', timestamp: new Date() },
    { id: 'help', type: 'info', content: 'Type "help" for available commands.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Auto-focus input on mount and click
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    const cmdId = crypto.randomUUID();
    // Add user input to history
    setHistory(prev => [...prev, { id: cmdId, type: 'input', content: cmd, timestamp: new Date() }]);
    setInput('');
    setIsProcessing(true);

    const args = cmd.trim().split(' ');
    const command = args[0].toLowerCase();
    const params = args.slice(1);

    try {
      let responseContent = '';
      let responseType: CommandResult['type'] = 'success';

      switch (command) {
        case 'help':
          responseContent = `
AVAILABLE COMMANDS:
  status       - Check system health and metrics
  scan [path]  - Run local security scan
  harvest      - Trigger full knowledge harvest
  intel        - Fetch latest threat intelligence
  ping [target]- Measure latency to target
  clear        - Clear terminal history
  whoami       - Current session identity
`;
          responseType = 'info';
          break;

        case 'clear':
          setHistory([]);
          setIsProcessing(false);
          return;

        case 'status':
          const resStatus = await fetch('/api/sys/system');
          if (resStatus.ok) {
            const data = await resStatus.json();
            responseContent = `
SYSTEM STATUS:
  OS: ${data.os.distro} ${data.os.release} (${data.os.arch})
  CPU: ${data.cpu.brand} (${data.load.currentLoad.toFixed(1)}% Load)
  MEM: ${data.memory.usedPercent}% Used
`;
          } else {
            responseContent = 'Failed to fetch system status.';
            responseType = 'error';
          }
          break;

        case 'scan':
            const path = params[0] || '/';
            responseContent = `Initiating scan on ${path}...
[WARN] This is a simulation scan via Terminal. Use CyberOps for full report.`;
            // In real implementation, call /api/sys/security/scan
            break;

        case 'harvest':
            const resHarvest = await fetch('/api/evolution/harvest/all', { method: 'POST' });
            if (resHarvest.ok) {
                const data = await resHarvest.json();
                responseContent = `HARVEST STARTED: ${data.harvestId}
Full sweep initiated across project and intel sources.`;
            } else {
                responseContent = 'Failed to start harvest.';
                responseType = 'error';
            }
            break;
        
        case 'intel':
            const resIntel = await fetch('/api/evolution/harvest/intel', { method: 'POST' });
            if (resIntel.ok) {
                responseContent = `INTEL ACQUISITION STARTED.
Fetching latest neuro-engrams...`;
            } else {
                responseContent = 'Failed to start intel harvest.';
                responseType = 'error';
            }
            break;

        case 'ping':
            const target = params[0] || 'backend';
            const start = Date.now();
            // Simulate or real ping based on target
            if (target === 'backend') {
                await fetch('/api/sys/system'); // Simple keepalive
                const ms = Date.now() - start;
                responseContent = `Ping backend: ${ms}ms`;
            } else {
                responseContent = `Ping ${target}: Target unknown or blocked by firewall.`;
                responseType = 'error';
            }
            break;

        case 'whoami':
            responseContent = 'USER: The Executive (Admin)\nACCESS: Level 5 (God Mode)';
            break;

        default:
          responseContent = `Command not found: "${command}". Type "help" for list.`;
          responseType = 'error';
      }

      setHistory(prev => [...prev, {
        id: crypto.randomUUID(),
        type: responseType,
        content: responseContent,
        timestamp: new Date()
      }]);

    } catch (error: any) {
      setHistory(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'error',
        content: `Execution Error: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
      // Refocus input after command
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('da-DK', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-black font-mono text-sm rounded-xl border border-white/10 overflow-hidden shadow-2xl" onClick={() => inputRef.current?.focus()}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0B3E6F]/30 border-b border-white/10 select-none">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-[#00B5CB]" />
          <span className="text-[#00B5CB] font-bold tracking-widest">NEXUS_TERMINAL</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><Wifi size={10} /> ONLINE</span>
          <span className="flex items-center gap-1"><ShieldAlert size={10} /> SECURE</span>
          <span className="flex items-center gap-1"><Cpu size={10} /> READY</span>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-opacity-90 bg-black">
        {history.map((entry) => (
          <div key={entry.id} className={`mb-2 ${entry.type === 'input' ? 'mt-4' : ''}`}>
            <div className="flex items-start gap-2">
              <span className="text-gray-600 text-[10px] min-w-[60px] pt-0.5 select-none">[{formatTime(entry.timestamp)}]</span>
              <div className="flex-1 break-words whitespace-pre-wrap">
                {entry.type === 'input' && (
                  <span className="text-[#00B5CB] mr-2">➜</span>
                )}
                <span className={`
                  ${entry.type === 'input' ? 'text-white font-bold' : ''}
                  ${entry.type === 'output' ? 'text-gray-300' : ''}
                  ${entry.type === 'error' ? 'text-red-400' : ''}
                  ${entry.type === 'info' ? 'text-blue-300' : ''}
                  ${entry.type === 'success' ? 'text-green-400' : ''}
                `}>
                  {entry.content}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {/* Input Line */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-gray-600 text-[10px] min-w-[60px] select-none">[{formatTime(new Date())}]</span>
          <span className="text-[#00B5CB]">➜</span>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              autoComplete="off"
              spellCheck="false"
              className="w-full bg-transparent border-none outline-none text-white placeholder-gray-700 focus:ring-0 p-0"
              placeholder={isProcessing ? "Processing..." : "Enter command..."}
            />
            {!isProcessing && (
                <div className="absolute top-0 bottom-0 w-2 bg-[#00B5CB] animate-pulse pointer-events-none" style={{ left: `${input.length * 8.5}px`, opacity: 0.5 }}></div>
            )}
          </div>
        </div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default NexusTerminalWidget;