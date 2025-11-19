

import React, { useEffect, useRef, useState } from 'react';
import type { Metrics } from '../types';

type MetricDisplayProps = {
  label: string;
  value: number;
  unit: string;
};

const MetricDisplay: React.FC<MetricDisplayProps> = ({ label, value, unit }) => (
  <div className="text-center p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
    <div className="text-2xl font-bold">
      {value.toFixed(1)}
      {unit}
    </div>
    <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
  </div>
);

const PerformanceMonitorWidget: React.FC<{ widgetId: string }> = () => {
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    function connect() {
      socketRef.current = new WebSocket('ws://localhost:8000/metrics/stream');
      setStatus('connecting');

      socketRef.current.onopen = () => setStatus('connected');
      
      socketRef.current.onmessage = (event) => {
        const data: Metrics = JSON.parse(event.data);
        setMetrics(prev => [...prev.slice(-59), data]);
      };

      socketRef.current.onclose = (event: CloseEvent) => {
        setStatus('disconnected');
        if (!event.wasClean) {
            console.error(`Performance Monitor WebSocket closed unexpectedly. Code: ${event.code}, Reason: "${event.reason}"`);
        }
        setTimeout(connect, 5000); // Reconnect after 5s
      };

      socketRef.current.onerror = (error: Event) => {
        console.error('Performance Monitor WebSocket Error. See the event object for details:', error);
        socketRef.current?.close();
      };
    }
    connect();
    return () => socketRef.current?.close();
  }, []);

  const currentMetrics = metrics[metrics.length - 1] || { cpu_percent: 0, memory_percent: 0, api_response_time: 0 };
  
  const statusInfo = {
      connecting: { text: "Forbinder...", color: "bg-yellow-500" },
      connected: { text: "Forbundet", color: "bg-green-500" },
      disconnected: { text: "Forbindelse afbrudt", color: "bg-red-500" }
  };

  return (
    <div className="h-full flex flex-col -m-4">
        <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-end gap-2 text-xs font-medium">
                <div className={`w-2.5 h-2.5 rounded-full ${statusInfo[status].color}`}></div>
                <span>{statusInfo[status].text}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <MetricDisplay label="CPU" value={currentMetrics.cpu_percent} unit="%" />
                <MetricDisplay label="Hukommelse" value={currentMetrics.memory_percent} unit="%" />
                <MetricDisplay label="Svar tid" value={currentMetrics.api_response_time} unit="ms" />
            </div>
            <div className="h-20 rounded-lg p-2 flex items-end gap-0.5 bg-gray-100 dark:bg-gray-700">
                {Array.from({ length: 60 }).map((_, i) => {
                    const metric = metrics[metrics.length - 60 + i];
                    const height = metric ? Math.min(100, metric.cpu_percent) : 0;
                    return (
                        <div key={i} className="flex-1 bg-blue-500 rounded-t-sm" style={{ height: `${height}%` }} />
                    );
                })}
            </div>
        </div>
    </div>
  );
};

export default PerformanceMonitorWidget;