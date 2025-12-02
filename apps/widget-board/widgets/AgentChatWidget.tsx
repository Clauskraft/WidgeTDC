import React, { useState, useRef, useEffect } from 'react';
import { useMCP } from '../src/hooks/useMCP';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { Bot, User, Send, Sparkles, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

const AgentChatWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const { send } = useMCP();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinkingMode, setUseThinkingMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Send to backend via MCP
      // We use 'srag.query' as a generic chat endpoint for now, but specifying a persona
      const response = await send('agent-orchestrator', 'srag.query', {
        naturalLanguageQuery: currentInput,
        model: useThinkingMode ? 'deepseek-reasoner' : 'deepseek-chat', // Use backend defaults
        systemPrompt: "You are a specialized Agent focused on executing tasks."
      });

      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        content: response.response || response.content || JSON.stringify(response),
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: `Fejl: Kunne ikke forbinde til agenten. ${error.message}`,
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <MatrixWidgetWrapper 
        title="Neural Agent Interface"
        controls={
             <button 
                onClick={() => setUseThinkingMode(!useThinkingMode)}
                className={`p-1 rounded text-[10px] font-medium flex items-center gap-1 transition-all border ${useThinkingMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                title="Deep Reasoning Mode (R1)"
            >
                <Sparkles size={10} className={useThinkingMode ? 'text-purple-400' : ''} />
                {useThinkingMode ? 'Deep Think' : 'Standard'}
            </button>
        }
    >
      <div className="flex flex-col h-full">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-500/40 gap-2">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <Bot size={24} strokeWidth={1.5} />
                    </div>
                    <p className="text-xs">System online. Awaiting input.</p>
                </div>
            )}
            
            {messages.map(message => (
            <div
                key={message.id}
                className={`flex gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                    message.sender === 'user' ? 'bg-white/10' : 'bg-[#00B5CB]/20'
                }`}>
                    {message.sender === 'user' ? <User size={12} className="text-gray-300" /> : <Bot size={12} className="text-[#00B5CB]" />}
                </div>
                
                <div
                className={`p-2.5 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                    message.sender === 'user'
                    ? 'bg-[#00B5CB]/80 text-white rounded-tr-none shadow-lg shadow-[#00B5CB]/10'
                    : 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none'
                }`}
                >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className="text-[9px] opacity-50 mt-1 block text-right">
                    {message.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </span>
                </div>
            </div>
            ))}
            
            {isLoading && (
             <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[#00B5CB]/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={12} className="text-[#00B5CB]" />
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 rounded-tl-none flex items-center gap-1">
                    <div className="w-1 h-1 bg-[#00B5CB] rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-[#00B5CB] rounded-full animate-bounce delay-75"></div>
                    <div className="w-1 h-1 bg-[#00B5CB] rounded-full animate-bounce delay-150"></div>
                </div>
            </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="mt-3 pt-3 border-t border-white/5">
            <div className="relative group">
            <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Execute command or ask question..."
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00B5CB]/50 focus:ring-1 focus:ring-[#00B5CB]/20 resize-none transition-all"
                rows={1}
                style={{ minHeight: '38px' }}
            />
            <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#00B5CB] hover:bg-[#00B5CB]/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
                <Send size={14} />
            </button>
            </div>
        </div>
      </div>
    </MatrixWidgetWrapper>
  );
};

export default AgentChatWidget;
