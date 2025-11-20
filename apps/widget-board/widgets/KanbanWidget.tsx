import React, { useState, useEffect, useMemo } from 'react';
import { useMCP } from '../src/hooks/useMCP';

interface Task {
  id: string;
  title: string;
  status: 'TO DO' | 'IN PROGRESS' | 'BLOCKED' | 'COMPLETED';
  agent: string;
  storyPoints: number;
  wave: number;
  dependencies: string[];
}

interface KanbanData {
  tasks: Task[];
  agents: string[];
  waves: number;
}

const EMPTY_KANBAN: KanbanData = {
  tasks: [],
  agents: [],
  waves: 0,
};

const KanbanWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const { send: mcpSend, isLoading } = useMCP();
  const [kanbanData, setKanbanData] = useState<KanbanData>(EMPTY_KANBAN);
  const [error, setError] = useState<string | null>(null);

  const refreshKanban = async () => {
    try {
      const response = await mcpSend('kanban-service', 'kanban.get-status', { orgId: 'current' });
      setKanbanData(response.payload);
      setError(null);
    } catch (err) {
      setError('Kanban data unavailable - MCP integration pending');
      setKanbanData(EMPTY_KANBAN);
    }
  };

  useEffect(() => {
    refreshKanban();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(refreshKanban, 30000); // Poll every 30s
    return () => clearInterval(intervalId);
  }, [mcpSend]);

  const columns = useMemo(() => {
    const cols = ['TO DO', 'IN PROGRESS', 'BLOCKED', 'COMPLETED'].map(status => ({
      status,
      tasks: kanbanData.tasks.filter(task => task.status === status),
    }));
    return cols;
  }, [kanbanData.tasks]);

  if (isLoading) return <div>Loading kanban...</div>;

  return (
    <div className="h-full flex flex-col p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      <header className="mb-4">
        <h3 className="text-lg font-semibold">Agent Kanban Board</h3>
        <p className="text-sm text-slate-500">Live updates from agent workflows (Waves: {kanbanData.waves})</p>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </header>
      <div className="flex-1 grid grid-cols-4 gap-4 overflow-auto">
        {columns.map(col => (
          <div key={col.status} className="border-r last:border-r-0 pr-4">
            <h4 className="font-medium text-sm uppercase text-slate-500 mb-2">{col.status}</h4>
            <div className="space-y-2">
              {col.tasks.length > 0 ? (
                col.tasks.map(task => (
                  <div key={task.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded border-l-4 border-blue-500">
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-slate-500">Agent: {task.agent} | Points: {task.storyPoints} | Wave: {task.wave}</p>
                    {task.dependencies.length > 0 && (
                      <p className="text-xs text-orange-500">Depends: {task.dependencies.join(', ')}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No tasks</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={refreshKanban}
        disabled={isLoading}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Refreshing...' : 'Refresh Kanban'}
      </button>
    </div>
  );
};

export default KanbanWidget;
