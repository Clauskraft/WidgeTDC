import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, Brain, Shield, Code, Layout } from 'lucide-react';

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
    { id: 'architect', name: 'Architecture', icon: Layout, color: '#3b82f6' },
    { id: 'security', name: 'Security', icon: Shield, color: '#ef4444' },
    { id: 'backend', name: 'Backend', icon: Code, color: '#10b981' },
    { id: 'frontend', name: 'Frontend', icon: Sparkles, color: '#f59e0b' },
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
      // CGentCore L1 Director Agent integration
      const response = await fetch('/api/agent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          userId,
          context: {
            activePersonas,
            conversationHistory: messages.slice(-5),
          },
        }),
      });

      const data = await response.json();

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: data.response,
        timestamp: new Date(),
        personas: data.personas_used,
        confidence: data.confidence,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error('Agent error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: 'Beklager, jeg stødte på en fejl. Prøv venligst igen.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
    <div className="group flex flex-col h-full bg-card/5 backdrop-blur-sm rounded-lg border border-border/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hero)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/20 bg-gradient-to-r from-primary/5 to-primary-brand/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg animate-glow-pulse">
            <Brain className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Personal Agent</h3>
            <p className="text-sm text-muted-foreground">L1 Director • Multi-Persona</p>
          </div>
        </div>

        {/* Persona Selection */}
        <div className="flex gap-2">
          {personas.map((persona) => {
            const Icon = persona.icon;
            const isActive = activePersonas.includes(persona.id);
            return (
              <button
                key={persona.id}
                onClick={() => togglePersona(persona.id)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/30 ring-2 ring-primary scale-110'
                    : 'bg-muted hover:bg-accent hover:scale-105'
                }`}
                title={persona.name}
              >
                <Icon
                  className="w-4 h-4 transition-colors"
                  style={{ color: isActive ? persona.color : 'hsl(var(--muted-foreground))' }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-subtle">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/10 mb-4">
              <Brain className="w-16 h-16 mb-4 mx-auto" style={{ color: 'hsl(var(--primary))' }} />
              <h4 className="text-xl font-semibold text-card-foreground mb-2">
                Din Personlige Agent
              </h4>
              <p className="text-muted-foreground max-w-md">
                Jeg kan hjælpe med kodeanalyse, arkitektur, workflow-generering og meget mere.
                Vælg ekspert-personas ovenfor for specialiseret assistance.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              <div className="p-3 bg-accent/50 backdrop-blur rounded-lg border border-border/10 transition-transform hover:scale-105">
                <p className="text-sm text-accent-foreground font-semibold">💡 Prøv:</p>
                <p className="text-xs text-muted-foreground">"Analysér min kode for sikkerhedsrisici"</p>
              </div>
              <div className="p-3 bg-accent/50 backdrop-blur rounded-lg border border-border/10 transition-transform hover:scale-105">
                <p className="text-sm text-accent-foreground font-semibold">🎯 Eller:</p>
                <p className="text-xs text-muted-foreground">"Generer en workflow fra min PRD"</p>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                message.role === 'user'
                  ? 'bg-primary'
                  : 'bg-gradient-primary'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Bot className="w-5 h-5 text-primary-foreground" />
              )}
            </div>

            {/* Message Content */}
            <div
              className={`flex-1 max-w-[80%] ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl backdrop-blur-sm transition-all ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground shadow-[var(--shadow-button)]'
                    : 'bg-card/70 text-card-foreground border border-border/20'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-2 mt-1 px-2">
                <span className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString('da-DK', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {message.personas && message.personas.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    • {message.personas.join(', ')}
                  </span>
                )}
                {message.confidence && (
                  <span className="text-xs text-success">
                    • {Math.round(message.confidence * 100)}% confidence
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg animate-glow-pulse">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 px-4 py-3 bg-card/70 backdrop-blur-sm rounded-2xl border border-border/20">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '0ms', backgroundColor: 'hsl(var(--primary))' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '150ms', backgroundColor: 'hsl(var(--primary))' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '300ms', backgroundColor: 'hsl(var(--primary))' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/20 bg-gradient-to-r from-primary/5 to-primary-brand/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Stil mig et spørgsmål eller bed om hjælp..."
            className="flex-1 px-4 py-3 bg-input text-foreground rounded-lg border border-border focus:border-ring focus:ring-2 focus:ring-ring/50 outline-none transition-all"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalAgentWidget;
