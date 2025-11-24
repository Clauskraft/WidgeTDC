// HansPedderLogWidget.tsx – live log of all HansPedder insights
import React, { useEffect, useState, useRef } from 'react';

export const HansPedderLogWidget: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(`ws://${window.location.hostname}:3001/mcp/ws`);
        wsRef.current = ws;
        ws.onopen = () => console.info('HansPedderLogWidget WS open');
        ws.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                if (msg.sourceId === 'HansPedder' && msg.payload?.text) {
                    setLogs((prev) => [...prev, msg.payload.text]);
                }
            } catch (_) { }
        };
        ws.onclose = () => console.info('HansPedderLogWidget WS closed');
        return () => ws.close();
    }, []);

    return (
        <div className="flex flex-col h-full bg-gray-800 text-gray-100 p-4 rounded-lg overflow-y-auto">
            <h2 className="text-lg font-semibold mb-2">📜 HansPedder Log</h2>
            <ul className="space-y-1">
                {logs.map((log, i) => (
                    <li key={i} className="bg-gray-700 p-2 rounded">
                        {log}
                    </li>
                ))}
            </ul>
        </div>
    );
};
