import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';

const AgentChatWidget: React.FC<{ widgetId: string }> = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);
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
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // This is a mocked API call. In a real scenario, the backend would handle grounding and thinking mode.
      await new Promise(resolve => setTimeout(resolve, 1200)); 

      const mockResponse: { response: string, sources?: any[] } = {
        response: `Dette er et simuleret svar for: "${userMessage.content}".`
      };

      if (useThinkingMode) {
        mockResponse.response += "\n\n🧠 Thinking Mode (gemini-2.5-pro) aktiveret med thinkingBudget: 32768. Dette giver et mere dybdegående svar.";
      }

      if (useGoogleSearch) {
          mockResponse.response += "\n\n🌍 Søgning er aktiveret.";
          mockResponse.sources = [
              { uri: 'https://google.com/search?q=nyheder', title: 'Nyheder - Google Søgning' },
              { uri: 'https://ai.google.dev', title: 'Google AI for Developers' }
          ];
      }
      if (useGoogleMaps) {
          mockResponse.response += "\n\n📍 Kort er aktiveret.";
          mockResponse.sources = [
              ...mockResponse.sources || [],
              { uri: 'https://maps.google.com/?q=restauranter', title: 'Restauranter i nærheden - Google Maps' }
          ];
      }

      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        content: mockResponse.response,
        sender: 'agent',
        timestamp: new Date(),
        sources: mockResponse.sources
      };
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error("Failed to fetch chat response:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'Fejl: Kunne ikke kontakte serveren. Sørg for at backend kører.',
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const Toggle: React.FC<{label: string, checked: boolean, onChange: () => void}> = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
        <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 rounded text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
        {label}
    </label>
  );

  return (
    <div className="h-full flex flex-col -m-4">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`p-3 rounded-lg max-w-[80%] flex flex-col ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-blue-400 dark:border-gray-600">
                    <h4 className="text-xs font-bold mb-1 text-blue-100 dark:text-gray-300">Kilder:</h4>
                    <div className="space-y-1">
                        {message.sources.map((source, index) => (
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" key={index} className="block text-xs text-blue-200 dark:text-blue-300 hover:underline truncate">
                                {source.title}
                            </a>
                        ))}
                    </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
             <div className="p-3 rounded-lg max-w-[80%] bg-gray-200 dark:bg-gray-700 rounded-bl-none">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
         <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
            <Toggle label="Google Search" checked={useGoogleSearch} onChange={() => setUseGoogleSearch(v => !v)} />
            <Toggle label="Google Maps" checked={useGoogleMaps} onChange={() => setUseGoogleMaps(v => !v)} />
            <Toggle label="Thinking Mode" checked={useThinkingMode} onChange={() => setUseThinkingMode(v => !v)} />
         </div>
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Skriv din besked... (Shift+Enter for ny linje)"
            className="w-full p-3 pr-20 rounded-lg border bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 py-2 px-4 rounded-lg transition-colors text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChatWidget;