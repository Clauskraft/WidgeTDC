import React, { useState, useEffect } from 'react';

interface TeamTask {
  name: string;
  lead: string;
  days: number;
  status: 'scheduled' | 'executing' | 'blocked' | 'complete';
  subtasks: string[];
}

const Phase1CFastTrackKanbanWidget: React.FC<{ widgetId: string }> = () => {
  const [tasks, setTasks] = useState<Record<string, TeamTask>>({
    'Team 1: Design System': {
      name: 'Team 1: Design System',
      lead: 'Chief GUI Designer',
      days: 2,
      status: 'executing',
      subtasks: [
        'Component hierarchy - 0.5 days',
        'Color & Typography - 1 day',
        'Spacing & Accessibility - 0.5 days'
      ]
    },
    'Team 2: Storybook': {
      name: 'Team 2: Storybook',
      lead: 'Frontend Architect 3',
      days: 1.5,
      status: 'scheduled',
      subtasks: [
        'Storybook 7.x install - 0.5 days',
        'CSF templates & docs - 1 day'
      ]
    },
    'Team 3: E2E Testing': {
      name: 'Team 3: E2E Testing',
      lead: 'QA Engineer 1',
      days: 3,
      status: 'scheduled',
      subtasks: [
        'Test scenarios & matrix - 1.5 days',
        'Data generators & templates - 1.5 days'
      ]
    },
    'Team 4: Performance': {
      name: 'Team 4: Performance',
      lead: 'Performance Specialist',
      days: 2,
      status: 'scheduled',
      subtasks: [
        'Core Web Vitals setup - 0.5 days',
        'CI/CD gates & dashboards - 1.5 days'
      ]
    }
  });

  const [completedDays, setCompletedDays] = useState(0);
  const totalDays = 8.5;

  useEffect(() => {
    // Calculate completed days
    const completed = (Object.values(tasks) as TeamTask[])
      .filter(task => task.status === 'complete')
      .reduce((sum, task) => sum + task.days, 0);
    setCompletedDays(completed);
  }, [tasks]);

  const statuses = ['scheduled', 'executing', 'blocked', 'complete'] as const;
  const statusLabels: Record<typeof statuses[number], string> = {
    scheduled: 'Planlagt',
    executing: 'Kørende',
    blocked: 'Blokeret',
    complete: 'Færdig'
  };

  const statusColors: Record<typeof statuses[number], string> = {
    scheduled: 'border-gray-500 bg-gray-50 dark:bg-gray-800',
    executing: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900',
    blocked: 'border-red-500 bg-red-50 dark:bg-red-900',
    complete: 'border-green-500 bg-green-50 dark:bg-green-900'
  };

  const statusHeaderColors: Record<typeof statuses[number], string> = {
    scheduled: 'border-gray-500 text-gray-700 dark:text-gray-300',
    executing: 'border-yellow-500 text-yellow-700 dark:text-yellow-300',
    blocked: 'border-red-500 text-red-700 dark:text-red-300',
    complete: 'border-green-500 text-green-700 dark:text-green-300'
  };

  const percentage = Math.round((completedDays / totalDays) * 100);

  const handleStatusChange = (taskName: string, newStatus: typeof statuses[number]) => {
    setTasks(prev => ({
      ...prev,
      [taskName]: {
        ...prev[taskName],
        status: newStatus
      }
    }));
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
        <div>
          <h2 className="font-bold text-blue-900 dark:text-blue-100">Priority 3: Phase 1.C Fast-Track</h2>
          <p className="text-sm text-blue-700 dark:text-blue-300">Nov 18-22, 2025 | 4 Teams | 8.5 Person-Days</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{percentage}%</div>
          <div className="text-xs text-blue-700 dark:text-blue-300">{completedDays.toFixed(1)}/{totalDays} days</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4">
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-3 p-4 overflow-auto">
        {statuses.map(status => {
          const tasksInStatus = (Object.values(tasks) as TeamTask[]).filter(t => t.status === status);
          const daysInStatus = tasksInStatus.reduce((sum, task) => sum + task.days, 0);

          return (
            <div
              key={status}
              className={`border-2 rounded-lg p-3 min-h-96 flex flex-col ${statusColors[status]}`}
            >
              {/* Column Header */}
              <div className={`border-b-2 pb-2 mb-3 ${statusHeaderColors[status]}`}>
                <div className="font-bold text-sm">{statusLabels[status]}</div>
                <div className="text-xs opacity-75">{tasksInStatus.length} ({daysInStatus.toFixed(1)}d)</div>
              </div>

              {/* Tasks */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {tasksInStatus.length === 0 ? (
                  <div className="text-xs opacity-50 text-center py-4">Ingen opgaver</div>
                ) : (
                  tasksInStatus.map(task => (
                    <div
                      key={task.name}
                      className="bg-white dark:bg-gray-800 p-2 rounded border-l-4 border-blue-500 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        const nextStatuses = {
                          scheduled: 'executing' as const,
                          executing: 'blocked' as const,
                          blocked: 'complete' as const,
                          complete: 'scheduled' as const
                        };
                        handleStatusChange(task.name, nextStatuses[status]);
                      }}
                    >
                      <div className="font-semibold text-xs">{task.name}</div>
                      <div className="text-xs opacity-75">{task.lead}</div>
                      <div className="text-xs opacity-60 mt-1 space-y-0.5">
                        {task.subtasks.map((subtask, idx) => (
                          <div key={idx}>• {subtask}</div>
                        ))}
                      </div>
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {task.days} person-days
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-4 pb-4 text-xs opacity-75 bg-gray-50 dark:bg-gray-800 rounded p-3">
        <p>Klik på kort for at opdatere status: Planlagt → Kørende → Blokeret → Færdig</p>
        <p>Deadline: Fredag, Nov 22 - Alle leverancer skal være færdige</p>
      </div>
    </div>
  );
};

export default Phase1CFastTrackKanbanWidget;
