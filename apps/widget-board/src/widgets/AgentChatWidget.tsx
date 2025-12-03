import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  from: string;
  body: string;
  timestamp: string;
  type: 'chat' | 'system';
}

const AgentChatWidget: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/neural-chat/messages?limit=50');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) { /* silent fail */ }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      await fetch('/api/neural-chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'core-dev',
          body: input,
          from: 'human', // Or current user
          priority: 'normal',
          type: 'chat'
        })
      });
      setInput('');
      fetchMessages(); // Immediate refresh
    } catch (error) {
      console.error("Send error:", error);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-[#0B3E6F]/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white tracking-wider">AGENT_NEXUS</h3>
        </div>
        <span className="text-[10px] text-green-400 animate-pulse">● LIVE</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.length === 0 && (
            <div className="text-center text-gray-500 text-xs mt-10">
                No active neural signals.<br/>Start a conversation.
            </div>
        )}
        {messages.map((msg) => {
            const isMe = msg.from === 'human' || msg.from === 'claus'; // Adjust based on auth
            return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-white/10' : 'bg-purple-500/20 text-purple-400'}`}>
                        {isMe ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${isMe ? 'bg-[#00B5CB]/20 text-white rounded-tr-none' : 'bg-white/5 text-gray-300 rounded-tl-none'}`}>
                        <div className="flex justify-between items-center gap-4 mb-1 opacity-50 text-[10px]">
                            <span className="font-bold uppercase">{msg.from}</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p>{msg.body}</p>
                    </div>
                </div>
            );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="p-3 bg-black/20 border-t border-white/10">
        <form onSubmit={sendMessage} className="relative">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Broadcast to agents..."
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-4 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
            />
            <button 
                type="submit" 
                disabled={sending || !input.trim()}
                className="absolute right-2 top-1.5 p-1 text-purple-400 hover:text-white transition-colors disabled:opacity-50"
            >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
        </form>
      </div>
    </div>
  );
};

export default AgentChatWidget;