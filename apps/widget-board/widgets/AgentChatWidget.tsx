import React, { useState, useRef, useEffect } from 'react';
import { useMCP } from '../src/hooks/useMCP';
import { Button } from '../components/ui/Button';
import { Bot, User, Send, Sparkles } from 'lucide-react';

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
    <div className="h-full flex flex-col -m-4" data-testid="agent-chat-widget">
      {/* Header */}
      <div className="p-3 border-b border-white/10 bg-[#0B3E6F]/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Bot size={18} className="text-[#00B5CB]" />
            <h3 className="text-sm font-semibold text-white">Agent Chat</h3>
        </div>
        <button 
            onClick={() => setUseThinkingMode(!useThinkingMode)}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${useThinkingMode ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white'}`}
            title="Aktiver dyb analyse (R1)"
        >
            <Sparkles size={12} /> Thinking
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-xs">
                Start en samtale med agenten...
            </div>
        )}
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'agent' && (
                <div className="w-6 h-6 rounded-full bg-[#00B5CB]/20 flex items-center justify-center shrink-0">
                    <Bot size={12} className="text-[#00B5CB]" />
                </div>
            )}
            <div
              className={`p-3 rounded-xl max-w-[85%] text-sm ${
                message.sender === 'user'
                  ? 'bg-[#00B5CB] text-[#051e3c] rounded-br-none'
                  : 'bg-[#0B3E6F]/40 text-gray-200 border border-white/10 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
             <div className="w-6 h-6 rounded-full bg-[#00B5CB]/20 flex items-center justify-center shrink-0">
                <Bot size={12} className="text-[#00B5CB]" />
            </div>
            <div className="p-3 rounded-xl bg-[#0B3E6F]/40 border border-white/10 rounded-bl-none">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-[#00B5CB] rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-[#00B5CB] rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-[#00B5CB] rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-white/10 bg-[#0B3E6F]/10">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Skriv besked..."
            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00B5CB]/50 resize-none"
            rows={1}
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#00B5CB] text-[#051e3c] rounded-lg hover:bg-[#009eb3] disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChatWidget;
