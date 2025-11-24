// ChatWidget.tsx – live chat that talks to the MCP (HansPedder & other agents)
import React, { useEffect, useState, useRef } from 'react';

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

export const ChatWidget: React.FC = () => {
    const [messages, setMessages] = useState<Array<{ from: string; text: string }>>([]);
    const [input, setInput] = useState('');
    const wsRef = useRef<WebSocket | null>(null);

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
        <div className="flex flex-col h-full bg-gray-800 text-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">🤖 Chat with HansPedder</h2>
            <div className="flex-1 overflow-y-auto mb-2 space-y-1">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.from === 'You' ? 'justify-end' : 'justify-start'}`}>
                        <span className={`px-3 py-1 rounded ${msg.from === 'You' ? 'bg-teal-600' : 'bg-gray-700'}`}>
                            <strong>{msg.from}:</strong> {msg.text}
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    className="flex-1 px-3 py-2 rounded bg-gray-900 text-white focus:outline-none"
                    placeholder="Ask HansPedder…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                />
                <button
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded"
                    onClick={handleSend}
                >
                    Send
                </button>
            </div>
        </div>
    );
};
