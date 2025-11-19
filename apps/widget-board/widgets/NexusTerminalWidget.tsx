import React, { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface NexusMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'nexus' | 'system';
}

const NexusTerminalWidget: React.FC<{ widgetId: string }> = () => {
  const [messages, setMessages] = useState<NexusMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Connect to WebSocket for system data and NEXUS responses
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('NEXUS_RESPONSE', (response: any) => {
      const data = typeof response === 'string' ? response : response.data;
      const nexusMessage: NexusMessage = {
        id: `nexus-${Date.now()}`,
        content: data,
        timestamp: new Date(),
        type: 'nexus'
      };
      setMessages(prev => [...prev, nexusMessage]);
      setIsThinking(false);

      // Play audio feedback
      playNexusBeep();
    });

    // Welcome message
    const welcomeMessage: NexusMessage = {
      id: 'welcome',
      content: 'NEXUS online. System integration active.',
      timestamp: new Date(),
      type: 'system'
    };
    setMessages([welcomeMessage]);

    return () => {
      newSocket.close();
    };
  }, []);

  // Audio feedback function
  const playNexusBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Sci-fi scanner sound: High tone that falls
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (error) {
      console.warn('Audio feedback failed:', error);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking || !socket) return;

    const userMessage: NexusMessage = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      timestamp: new Date(),
      type: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsThinking(true);

    try {
      // Get system context
      const [sysRes, processesRes] = await Promise.all([
        fetch('http://localhost:3001/api/sys/system'),
        fetch('http://localhost:3001/api/sys/processes')
      ]);

      const sysData = sysRes.ok ? await sysRes.json() : {};
      const processesData = processesRes.ok ? await processesRes.json() : [];

      // Build context string
      const contextString = `
SYSTEM STATUS:
CPU Load: ${sysData.load?.currentLoad?.toFixed(1) || 'Unknown'}%
Memory Used: ${sysData.memory?.usedPercent?.toFixed(1) || 'Unknown'}%
Top Processes: ${processesData.slice(0, 3).map((p: any) => `${p.name}(${p.cpu}%)`).join(', ')}

AVAILABLE COMMANDS:
- Kill Chrome/Firefox/Edge processes
- Open Steam or applications
- Flush DNS cache
- Kill Node processes
- Restart Windows Explorer
      `.trim();

      // Send to NEXUS AI (using Ollama) - with fallback for testing
      let aiText: string;

      try {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'mistral',
            prompt: `You are NEXUS, an OS-integrated Core AI. You are cynical, brief, and powerful.
You have ROOT ACCESS to this machine.

RULES:
1. If the user asks to do a system action (kill app, open app, fix net), response ONLY with the command code in brackets like: [[KILL_CHROME]]
2. Available Codes: [[KILL_CHROME]], [[OPEN_STEAM]], [[FLUSH_DNS]], [[KILL_NODE]], [[RESTART_EXPLORER]]
3. If no action is needed, just reply sarcastically with text.

${contextString}

USER: ${currentInput}
NEXUS:`,
            stream: false
          })
        });

        if (response.ok) {
          const aiData = await response.json();
          aiText = aiData.response;
        } else {
          throw new Error('Ollama not available');
        }
      } catch (error) {
        // Fallback AI simulation for testing
        console.log('Ollama not available, using fallback AI simulation');

        const input = currentInput.toLowerCase();
        if (input.includes('kill') && input.includes('chrome')) {
          aiText = '[[KILL_CHROME]]';
        } else if (input.includes('open') && input.includes('steam')) {
          aiText = '[[OPEN_STEAM]]';
        } else if (input.includes('flush') && input.includes('dns')) {
          aiText = '[[FLUSH_DNS]]';
        } else if (input.includes('kill') && input.includes('node')) {
          aiText = '[[KILL_NODE]]';
        } else if (input.includes('restart') && input.includes('explorer')) {
          aiText = '[[RESTART_EXPLORER]]';
        } else if (input.includes('status') || input.includes('system')) {
          aiText = `System online. CPU at ${sysData.load?.currentLoad?.toFixed(1) || 'unknown'}%, ${processesData.length} processes running. What do you need terminated?`;
        } else {
          aiText = 'Command not recognized. Try: "kill chrome", "open steam", "flush dns", or "system status".';
        }
      }

      // Check for command execution
      if (aiText.includes('[[')) {
        const match = aiText.match(/\[\[(.*?)\]\]/);
        if (match && match[1]) {
          const actionCode = match[1];

          // Send authorization message
          const authMessage: NexusMessage = {
            id: `auth-${Date.now()}`,
            content: `⚡ AUTHORIZED: Initiating ${actionCode}...`,
            timestamp: new Date(),
            type: 'system'
          };
          setMessages(prev => [...prev, authMessage]);

          // Execute command via socket
          socket.send(`NEXUS_COMMAND:${actionCode}`);

          // Wait for result
          setTimeout(() => {
            // This will be handled by the NEXUS_RESPONSE event
          }, 500);
          return;
        }
      }

      // Regular response
      const nexusMessage: NexusMessage = {
        id: `nexus-${Date.now()}`,
        content: aiText,
        timestamp: new Date(),
        type: 'nexus'
      };
      setMessages(prev => [...prev, nexusMessage]);
      setIsThinking(false);
      playNexusBeep();

    } catch (error: any) {
      const errorMessage: NexusMessage = {
        id: `error-${Date.now()}`,
        content: `SYSTEM ERROR: ${error.message}`,
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="
      col-span-1 md:col-span-2
      bg-black/80
      border-l-4 border-green-500
      p-4 rounded-r-xl
      shadow-[0_0_30px_rgba(0,255,0,0.15)]
      flex flex-col h-64
      font-mono text-sm
      relative overflow-hidden

      /* SCANLINES EFFECT */
      before:content-['']
      before:absolute before:inset-0
      before:bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]
      before:bg-[length:100%_2px,3px_100%]
      before:pointer-events-none
      before:z-20
    ">
      {/* Header */}
      <div className="text-green-400 font-bold text-lg mb-2 relative z-30">
        NEXUS TERMINAL
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 relative z-30">
        {messages.map(message => (
          <div key={message.id} className="text-xs">
            {message.type === 'user' && (
              <div className="text-blue-400">
                <span className="text-gray-500">&gt;</span> {message.content}
              </div>
            )}
            {message.type === 'nexus' && (
              <div className="text-green-400">
                <span className="text-yellow-400">NEXUS:</span> {message.content}
              </div>
            )}
            {message.type === 'system' && (
              <div className="text-red-400">
                <span className="text-red-500">[SYSTEM]</span> {message.content}
              </div>
            )}
          </div>
        ))}
        {isThinking && (
          <div className="text-yellow-400">
            <span className="text-yellow-500">[THINKING]</span> Processing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative z-30">
        <div className="flex items-center">
          <span className="text-green-400 mr-2">&gt;</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter command..."
            className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-gray-600"
            disabled={isThinking}
          />
        </div>
      </div>
    </div>
  );
};

export default NexusTerminalWidget;