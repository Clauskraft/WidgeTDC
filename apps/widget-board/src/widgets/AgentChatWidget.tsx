import React, { useEffect, useState, useRef } from 'react';
import { Send, MessageSquare, User, Bot } from 'lucide-react';

// Simple MCP service – wraps fetch to the MCP router
async function sendMcpMessage(message: string) {
    try {
        const resp = await fetch('/api/mcp/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceId: 'ChatWidget',
                type: 'userMessage',
                payload: { text: message },
                createdAt: new Date().toISOString(),
            }),
        });
        if (!resp.ok) console.error('MCP message failed', resp.status);
    } catch (e) {
        console.error('MCP send error', e);
    }
}

const AgentChatWidget: React.FC = () => {
    const [messages, setMessages] = useState<Array<{ from: string; text: string }>>([]);
    const [input, setInput] = useState('');
    const wsRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialise WebSocket connection to MCP (same endpoint as other widgets)
    useEffect(() => {
        const ws = new WebSocket(`ws://${window.location.hostname}:3001/mcp/ws`);
        wsRef.current = ws;
        ws.onopen = () => console.info('ChatWidget WS open');
        ws.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                // Only handle messages that have a payload.text field
                if (msg.payload?.text) {
                    setMessages((prev) => [...prev, { from: msg.sourceId ?? 'system', text: msg.payload.text }]);
                }
            } catch (_) { }
        };
        ws.onclose = () => console.info('ChatWidget WS closed');
        return () => ws.close();
    }, []);

    const handleSend = async () => {
        if (!input.trim()) return;
        // Optimistically add the user message
        setMessages((prev) => [...prev, { from: 'You', text: input }]);
        await sendMcpMessage(input);
        setInput('');
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="flex flex-col h-full bg-[#0B3E6F]/20 text-gray-100 p-4 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                <MessageSquare size={18} className="text-[#00B5CB]" />
                <h2 className="text-sm font-semibold text-gray-200">Agent Chat</h2>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10 text-sm">
                        Start a conversation with the agents...
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.from === 'You' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.from === 'You' ? 'bg-white/10' : 'bg-[#00B5CB]/20'}`}>
                            {msg.from === 'You' ? <User size={14} /> : <Bot size={14} className="text-[#00B5CB]" />}
                        </div>
                        <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${msg.from === 'You' ? 'bg-[#00B5CB]/20 text-white rounded-tr-none' : 'bg-white/5 text-gray-300 rounded-tl-none'}`}>
                            <div className="text-[10px] opacity-50 mb-1">{msg.from}</div>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2 mt-auto">
                <input
                    className="flex-1 px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00B5CB]/50 transition-colors placeholder-gray-500"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                />
                <button
                    className="p-2.5 bg-[#00B5CB] hover:bg-[#0095a8] rounded-xl text-[#051e3c] transition-colors"
                    onClick={handleSend}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default AgentChatWidget;
