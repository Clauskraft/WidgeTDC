import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, Brain, Shield, Code, Layout } from 'lucide-react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  personas?: string[];
  confidence?: number;
}

interface PersonalAgentWidgetProps {
  userId?: string;
}

export const PersonalAgentWidget: React.FC<PersonalAgentWidgetProps> = ({ userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePersonas, setActivePersonas] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const personas = [
    { id: 'architect', name: 'Architecture', icon: Layout, color: 'text-blue-400' },
    { id: 'security', name: 'Security', icon: Shield, color: 'text-red-400' },
    { id: 'backend', name: 'Backend', icon: Code, color: 'text-emerald-400' },
    { id: 'frontend', name: 'Frontend', icon: Sparkles, color: 'text-amber-400' },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate delay
      await new Promise(r => setTimeout(r, 1500));
      
      // Mock response for demo
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `Based on your request about "${userMessage.content}", I recommend checking the module dependencies first. The architecture looks sound but needs security review.`,
        timestamp: new Date(),
        personas: activePersonas.length > 0 ? activePersonas : ['architect'],
        confidence: 0.89,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error('Agent error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePersona = (personaId: string) => {
    setActivePersonas((prev) =>
      prev.includes(personaId)
        ? prev.filter((p) => p !== personaId)
        : [...prev, personaId]
    );
  };

  return (
    <MatrixWidgetWrapper 
        title="Personal Agent (L1 Director)"
        controls={
            <div className="flex gap-1">
                {personas.map((persona) => {
                    const Icon = persona.icon;
                    const isActive = activePersonas.includes(persona.id);
                    return (
                    <button
                        key={persona.id}
                        onClick={() => togglePersona(persona.id)}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                        isActive
                            ? 'bg-white/20 text-white scale-110'
                            : 'bg-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                        title={persona.name}
                    >
                        <Icon size={14} />
                    </button>
                    );
                })}
            </div>
        }
    >
      <div className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
            {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500/50 p-4">
                <Brain size={32} strokeWidth={1} className="mb-2 opacity-50" />
                <p className="text-xs">L1 Director active. Select personas above to specialize response.</p>
            </div>
            )}

            {messages.map((message) => (
            <div
                key={message.id}
                className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
            >
                <div
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1 ${
                    message.role === 'user'
                    ? 'bg-white/10'
                    : 'bg-[#00B5CB]/20'
                }`}
                >
                {message.role === 'user' ? (
                    <User size={14} className="text-gray-300" />
                ) : (
                    <Bot size={14} className="text-[#00B5CB]" />
                )}
                </div>

                <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div
                        className={`px-3 py-2 rounded-xl text-xs inline-block text-left ${
                        message.role === 'user'
                            ? 'bg-[#00B5CB] text-[#051e3c] rounded-tr-none'
                            : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none'
                        }`}
                    >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Metadata */}
                    {(message.personas || message.confidence) && (
                        <div className={`flex items-center gap-2 mt-1 px-1 text-[9px] text-gray-500 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {message.personas && message.personas.length > 0 && (
                                <span>{message.personas.join(', ')}</span>
                            )}
                            {message.confidence && (
                                <span className="text-green-400/70">
                                {Math.round(message.confidence * 100)}% conf
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
            ))}

            {isLoading && (
            <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00B5CB]/20 flex items-center justify-center mt-1">
                    <Bot size={14} className="text-[#00B5CB]" />
                </div>
                <div className="px-3 py-2 bg-white/5 rounded-xl rounded-tl-none border border-white/10 flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-[#00B5CB] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 rounded-full bg-[#00B5CB] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 rounded-full bg-[#00B5CB] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
            )}

            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask L1 Director..."
                className="flex-1 px-3 py-2 bg-black/20 text-white rounded-lg border border-white/10 focus:border-[#00B5CB]/50 outline-none transition-all text-xs placeholder-gray-600"
                disabled={isLoading}
            />
            <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="p-2 bg-[#00B5CB] text-[#051e3c] rounded-lg hover:bg-[#009eb3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Send size={14} />
            </button>
            </div>
        </div>
      </div>
    </MatrixWidgetWrapper>
  );
};

export default PersonalAgentWidget;
