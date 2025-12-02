import React, { useState, useRef, useEffect } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { Terminal, Cpu, Wifi } from 'lucide-react';

// Mock Socket interface
interface Socket {
  on: (event: string, callback: (data: any) => void) => void;
  close: () => void;
  send: (data: string) => void;
}
const io = (url: string): Socket => ({
  on: () => { },
  close: () => { },
  send: () => { }
});

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
    });

    const welcomeMessage: NexusMessage = {
      id: 'welcome',
      content: 'NEXUS CORE ONLINE. SYSTEMS NOMINAL.',
      timestamp: new Date(),
      type: 'system'
    };
    setMessages([welcomeMessage]);

    return () => {
      newSocket.close();
    };
  }, []);

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
        // Simulate processing for demo
        setTimeout(() => {
            let responseText = `Command not recognized: ${currentInput}`;
            if (currentInput.toLowerCase().includes('status')) {
                responseText = "SYSTEM STATUS: OPTIMAL. CPU: 12% MEM: 45%";
            } else if (currentInput.toLowerCase().includes('scan')) {
                responseText = "INITIATING DEEP SCAN... NO THREATS DETECTED.";
            } else if (currentInput.toLowerCase().includes('help')) {
                responseText = "AVAILABLE COMMANDS: STATUS, SCAN, KILL <PID>, FLUSH DNS";
            }

            const nexusMessage: NexusMessage = {
                id: `nexus-${Date.now()}`,
                content: responseText,
                timestamp: new Date(),
                type: 'nexus'
            };
            setMessages(prev => [...prev, nexusMessage]);
            setIsThinking(false);
        }, 800);

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <MatrixWidgetWrapper title="NEXUS TERMINAL" className="font-mono">
        <div className="flex flex-col h-full bg-black/40 rounded-lg overflow-hidden border border-green-500/20 relative">
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMiIvPgo8L3N2Zz4=')] z-10 opacity-50"></div>
            
            {/* Output */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs z-20 custom-scrollbar">
                {messages.map(message => (
                <div key={message.id} className="leading-relaxed break-words">
                    {message.type === 'user' && (
                    <div className="text-blue-400 flex gap-2">
                        <span className="text-blue-500/50">&gt;</span> 
                        {message.content}
                    </div>
                    )}
                    {message.type === 'nexus' && (
                    <div className="text-green-400 flex gap-2">
                        <span className="text-green-500/50">#</span>
                        <span className="text-green-300">{message.content}</span>
                    </div>
                    )}
                    {message.type === 'system' && (
                    <div className="text-red-400 flex gap-2 font-bold">
                        <span>!</span> {message.content}
                    </div>
                    )}
                </div>
                ))}
                {isThinking && (
                <div className="text-yellow-400 animate-pulse">
                    <span className="text-yellow-500/50">%</span> PROCESSING...
                </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-2 bg-black/60 border-t border-green-500/20 z-20 flex items-center gap-2">
                <span className="text-green-500 animate-pulse">_</span>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="ENTER COMMAND..."
                    className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-green-900 text-xs font-mono uppercase"
                    disabled={isThinking}
                    autoFocus
                />
            </div>
        </div>
    </MatrixWidgetWrapper>
  );
};

export default NexusTerminalWidget;