import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Message, GroundingSource } from '../types';
import { Button } from '../components/ui/Button';

const AgentChatWidget: React.FC<{ widgetId: string }> = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);
  const [useThinkingMode, setUseThinkingMode] = useState(false);
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (useGoogleMaps) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.warn("Geolocation permission denied or unavailable.", error);
                    // Optionally, inform the user that location access is beneficial for Maps search.
                }
            );
        }
    }
  }, [useGoogleMaps]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    if (!process.env.API_KEY) {
        const errorMessage: Message = {
            id: `error-${Date.now()}`,
            content: 'Fejl: API nøgle mangler. Sæt den venligst i dine secrets for at bruge denne widget.',
            sender: 'agent',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const modelName = useThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
      
      const tools: any[] = [];
      if (useGoogleSearch) {
          tools.push({ googleSearch: {} });
      }
      if (useGoogleMaps) {
          tools.push({ googleMaps: {} });
      }

      const config: any = {};
      if (tools.length > 0) {
          config.tools = tools;
      }
      if (useThinkingMode) {
          config.thinkingConfig = { thinkingBudget: 32768 };
      }
      if (useGoogleMaps && location) {
          config.toolConfig = {
              retrievalConfig: {
                  latLng: location
              }
          };
      }

      const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: [{ text: currentInput }] },
          config: config
      });

      const agentResponseText = response.text;
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      const sources: GroundingSource[] = groundingChunks
        .map((chunk: any) => {
          const sourceData = chunk.web || chunk.maps;
          return {
              uri: sourceData?.uri || '#',
              title: sourceData?.title || 'Ukendt Kilde',
          };
        })
        .filter((source: GroundingSource) => source.uri !== '#');

      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        content: agentResponseText,
        sender: 'agent',
        timestamp: new Date(),
        sources: sources.length > 0 ? sources : undefined
      };
      setMessages(prev => [...prev, agentMessage]);
    } catch (error: any) {
      console.error("Failed to fetch chat response:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: `Fejl: Kunne ikke hente svar fra Gemini API.\n\n${error.message || 'En ukendt fejl opstod.'}`,
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
        <input type="checkbox" checked={checked} onChange={onChange} className="ms-focusable w-4 h-4 rounded text-blue-600 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600" />
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
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" key={index} className="ms-focusable block text-xs text-blue-200 dark:text-blue-300 hover:underline truncate">
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
            className="ms-focusable w-full p-3 pr-20 rounded-lg border bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 resize-none"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgentChatWidget;