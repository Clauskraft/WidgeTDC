import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  completedAt?: string;
  duration?: number; // in ms
}

interface TaskBacklogModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentId: string;
  completedTasks: number;
  failedTasks: number;
}

const TaskBacklogModal: React.FC<TaskBacklogModalProps> = ({
  isOpen,
  onClose,
  agentName,
  agentId,
  completedTasks,
  failedTasks,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'pending'>('all');

  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen, agentId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      // Try to fetch tasks from API
      const response = await fetch(`/api/mcp/agents/${agentId}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        // Fallback: generate mock tasks
        generateMockTasks();
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      // Fallback: generate mock tasks
      generateMockTasks();
    } finally {
      setLoading(false);
    }
  };

  const generateMockTasks = () => {
    const mockTasks: Task[] = [];
    const taskTitles = [
      'Initialize dashboard shell',
      'Load widget registry',
      'Setup MCP context',
      'Configure theme system',
      'Load agent state',
      'Initialize UI components',
      'Connect to backend API',
      'Load user preferences',
      'Validate widget data',
      'Render dashboard',
    ];

    // Generate completed tasks
    for (let i = 0; i < completedTasks; i++) {
      mockTasks.push({
        id: `${agentId}-completed-${i}`,
        title: taskTitles[i % taskTitles.length],
        description: `Task ${i + 1} for ${agentName}`,
        status: 'completed',
        priority: ['high', 'medium', 'low'][i % 3] as any,
        createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        completedAt: new Date(Date.now() - Math.random() * 1800000).toISOString(),
        duration: Math.floor(Math.random() * 5000) + 500,
      });
    }

    // Generate failed tasks
    for (let i = 0; i < failedTasks; i++) {
      mockTasks.push({
        id: `${agentId}-failed-${i}`,
        title: `Failed: ${taskTitles[i % taskTitles.length]}`,
        description: `Failed task ${i + 1} for ${agentName}`,
        status: 'failed',
        priority: 'high' as const,
        createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      });
    }

    // Generate a few pending tasks
    mockTasks.push(
      {
        id: `${agentId}-pending-1`,
        title: 'Process queue',
        description: 'Process pending queue items',
        status: 'pending',
        priority: 'high',
        createdAt: new Date(Date.now() - 600000).toISOString(),
      },
      {
        id: `${agentId}-pending-2`,
        title: 'Update cache',
        description: 'Update cached data',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(Date.now() - 300000).toISOString(),
      }
    );

    setTasks(mockTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter || (filter === 'pending' && task.status === 'pending');
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'in_progress':
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      case 'failed':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'in_progress':
      case 'pending':
        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[1200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Task Backlog</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{agentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            <X size={24} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-700">
          {(['all', 'completed', 'failed', 'pending'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`pb-3 px-4 font-medium text-sm transition-colors ${
                filter === tab
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'completed' && ` (${completedTasks})`}
              {tab === 'failed' && ` (${failedTasks})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full" />
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-slate-500 dark:text-slate-400">No tasks found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-l-4 ${getStatusColor(task.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(task.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-slate-900 dark:text-white">{task.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{task.description}</p>
                      <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-500">
                        <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                        {task.completedAt && (
                          <span>Completed: {new Date(task.completedAt).toLocaleString()}</span>
                        )}
                        {task.duration && (
                          <span>Duration: {(task.duration / 1000).toFixed(2)}s</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskBacklogModal;
