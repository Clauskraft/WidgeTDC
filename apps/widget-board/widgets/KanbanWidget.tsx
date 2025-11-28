import React, { useState, useEffect, useMemo } from 'react';
import { useWidgetSync } from '../src/hooks/useWidgetSync';
import { Plus, ArrowRight, ArrowLeft, MoreHorizontal, CheckCircle, AlertCircle, Clock, User } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Implementer OAuth', status: 'TODO', assignee: 'Claus', priority: 'high', tags: ['backend', 'security'] },
  { id: 't2', title: 'Design nyt Dashboard', status: 'IN_PROGRESS', assignee: 'AI', priority: 'medium', tags: ['frontend', 'ui'] },
  { id: 't3', title: 'Fix Linter fejl', status: 'DONE', assignee: 'AI', priority: 'low', tags: ['maintenance'] },
];

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'bg-slate-500/20 border-slate-500/30' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500/20 border-blue-500/30' },
  { id: 'REVIEW', title: 'Review', color: 'bg-purple-500/20 border-purple-500/30' },
  { id: 'DONE', title: 'Done', color: 'bg-green-500/20 border-green-500/30' },
] as const;

const KanbanWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Sync state to backend
  useWidgetSync(widgetId, {
    tasksCount: tasks.length,
    activeTasks: tasks.filter(t => t.status !== 'DONE').length,
    columns: COLUMNS.map(c => ({ id: c.id, count: tasks.filter(t => t.status === c.id).length }))
  });

  const moveTask = (taskId: string, direction: 'next' | 'prev') => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      
      const currentIndex = COLUMNS.findIndex(c => c.id === task.status);
      let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      
      // Bounds check
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= COLUMNS.length) nextIndex = COLUMNS.length - 1;
      
      return { ...task, status: COLUMNS[nextIndex].id as any };
    }));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: newTaskTitle,
      status: 'TODO',
      assignee: 'Unassigned',
      priority: 'medium',
      tags: []
    };
    
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="h-full flex flex-col" data-testid="kanban-widget">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h3 className="text-lg font-semibold text-white">Projekt Tavle</h3>
          <p className="text-xs text-gray-400">{tasks.length} opgaver</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-3 py-1.5 bg-[#00B5CB] hover:bg-[#009eb3] text-[#051e3c] rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
        >
          <Plus size={16} /> Ny Opgave
        </button>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <form onSubmit={addTask} className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
          <input
            autoFocus
            type="text"
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Hvad skal gøres?"
            className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 outline-none mb-2"
          />
          <div className="flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Annuller
            </button>
            <button 
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="px-3 py-1 bg-[#00B5CB]/20 text-[#00B5CB] hover:bg-[#00B5CB]/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              Opret
            </button>
          </div>
        </form>
      )}

      {/* Board */}
      <div className="flex-1 flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          
          return (
            <div key={col.id} className="flex-1 min-w-[200px] flex flex-col bg-[#0B3E6F]/20 rounded-xl border border-white/5 overflow-hidden">
              {/* Column Header */}
              <div className={`p-2 border-b ${col.color} flex items-center justify-between`}>
                <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider">{col.title}</span>
                <span className="px-1.5 py-0.5 bg-black/20 rounded-full text-[10px] text-gray-300">{colTasks.length}</span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {colTasks.map(task => (
                  <div key={task.id} className="p-3 bg-[#051e3c]/60 hover:bg-[#051e3c]/80 border border-white/5 rounded-lg group transition-all">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-200 line-clamp-2">{task.title}</p>
                      <button className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <User size={10} /> {task.assignee}
                      </div>
                      <div className={`ml-auto w-2 h-2 rounded-full ${getPriorityColor(task.priority)} bg-current`} title={`Prioritet: ${task.priority}`} />
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                      <button 
                        onClick={() => moveTask(task.id, 'prev')}
                        disabled={task.status === 'TODO'}
                        className="p-1 hover:bg-white/10 rounded text-gray-400 disabled:opacity-0"
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <button 
                        onClick={() => moveTask(task.id, 'next')}
                        disabled={task.status === 'DONE'}
                        className="p-1 hover:bg-white/10 rounded text-gray-400 disabled:opacity-0"
                      >
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="text-center py-4 text-gray-500/50 text-xs italic border-2 border-dashed border-white/5 rounded-lg">
                    Tom
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanWidget;
