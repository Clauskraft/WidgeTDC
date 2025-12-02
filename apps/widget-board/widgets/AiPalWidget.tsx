import React, { useState, useEffect } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { Bell, Clock, Target, Zap, User } from 'lucide-react';

interface FocusWindow {
  weekday: number;
  startHour: number;
  endHour: number;
}

interface BoardAction {
  actionType: 'isolate_widget_view' | 'mute_notifications' | 'show_nudge';
  targetWidgetIds?: string[];
  message?: string;
}

interface Recommendations {
  userId: string;
  orgId: string;
  boardAdjustments: BoardAction[];
  reminders: string[];
  focusWindow: FocusWindow | null;
  profile: {
    preferenceTone: string;
  };
}

const AiPalWidget: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState('meeting');
  const [eventPayload, setEventPayload] = useState(JSON.stringify({
    title: 'Team Meeting',
    duration: 30
  }, null, 2));
  const [stressLevel, setStressLevel] = useState<'low' | 'medium' | 'high'>('low');

  const loadRecommendations = async () => {
    setLoading(true);

    try {
      // Mock fetch for demo
      await new Promise(r => setTimeout(r, 1000));
      
      setRecommendations({
          userId: 'user-1',
          orgId: 'org-1',
          boardAdjustments: [
              { actionType: 'mute_notifications', message: 'Suggested: Mute notifications for focus' },
              { actionType: 'isolate_widget_view', message: 'Suggested: Focus on "The Architect"' }
          ],
          reminders: ['Review PR #123', 'Update weekly status'],
          focusWindow: { weekday: 2, startHour: 14, endHour: 16 },
          profile: { preferenceTone: 'supportive' }
      });

    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const getWeekdayName = (weekday: number) => {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[weekday] || 'Unknown';
  };

  return (
    <MatrixWidgetWrapper title="AI PAL Assistant">
      <div className="flex flex-col gap-4 h-full">
        
        {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                Loading insights...
            </div>
        ) : recommendations ? (
            <>
                {/* Focus Window Card */}
                {recommendations.focusWindow && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-full">
                            <Clock size={16} className="text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-emerald-300 uppercase">Focus Window</h4>
                            <p className="text-xs text-emerald-100">
                                {getWeekdayName(recommendations.focusWindow.weekday)} • {recommendations.focusWindow.startHour}:00 - {recommendations.focusWindow.endHour}:00
                            </p>
                        </div>
                    </div>
                )}

                {/* Recommendations List */}
                {recommendations.boardAdjustments.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Zap size={10}/> Smart Actions</h4>
                        <div className="space-y-2">
                            {recommendations.boardAdjustments.map((action, index) => (
                                <div key={index} className="p-2 bg-white/5 border border-white/10 rounded-lg flex flex-col gap-2">
                                    <p className="text-xs text-gray-200">{action.message}</p>
                                    <div className="flex gap-2">
                                        <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[10px] py-1 rounded transition-colors">Accept</button>
                                        <button className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] py-1 rounded transition-colors">Ignore</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reminders */}
                {recommendations.reminders.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Bell size={10}/> Reminders</h4>
                        <ul className="space-y-1">
                            {recommendations.reminders.map((reminder, index) => (
                                <li key={index} className="text-xs text-gray-300 bg-black/20 p-2 rounded border border-white/5 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-[#00B5CB]"></div>
                                    {reminder}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Record Activity */}
                <div className="mt-auto border-t border-white/10 pt-3">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Target size={10}/> Log Context</h4>
                    <div className="flex gap-2 mb-2">
                        <select 
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded text-[10px] text-white p-1.5 outline-none"
                        >
                            <option value="meeting">Meeting</option>
                            <option value="deadline">Deadline</option>
                        </select>
                        <select 
                            value={stressLevel}
                            onChange={(e) => setStressLevel(e.target.value as any)}
                            className="flex-1 bg-black/40 border border-white/10 rounded text-[10px] text-white p-1.5 outline-none"
                        >
                            <option value="low">Low Stress</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <button className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-semibold py-1.5 rounded transition-colors">
                        Record Event
                    </button>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-xs">
                <User size={24} className="mb-2 opacity-50" />
                No recommendations yet.
            </div>
        )}
      </div>
    </MatrixWidgetWrapper>
  );
};

export default AiPalWidget;
