import React, { useState, useEffect } from 'react';

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
      // Use MCP tool: pal.board-action
      const response = await fetch('/api/mcp/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'pal.board-action',
          payload: {},
          context: {
            userId: 'user-1',
            orgId: 'org-1',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Transform MCP response to match widget expectations
        setRecommendations({
          userId: 'user-1',
          orgId: 'org-1',
          boardAdjustments: data.boardAdjustments || [],
          reminders: data.aiRecommendations ? [data.aiRecommendations] : [],
          focusWindow: null,
          profile: {
            preferenceTone: 'supportive',
          },
        });
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
    // Refresh every 30 seconds
    const interval = setInterval(loadRecommendations, 30000);
    return () => clearInterval(interval);
  }, []);

  const recordEvent = async () => {
    try {
      const payload = JSON.parse(eventPayload);

      // Use MCP tool: pal.event
      await fetch('/api/mcp/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'pal.event',
          payload: {
            eventType,
            payload,
            detectedStressLevel: stressLevel,
          },
          context: {
            userId: 'user-1',
            orgId: 'org-1',
          },
        }),
      });

      // Reload recommendations after recording event
      loadRecommendations();
    } catch (err) {
      console.error('Failed to record event:', err);
    }
  };

  const getWeekdayName = (weekday: number) => {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[weekday] || 'Unknown';
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'mute_notifications': return '';
      case 'isolate_widget_view': return '';
      case 'show_nudge': return '';
      default: return '';
    }
  };

  return (
    <div style={{
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
    }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
        AI PAL - Your Personal Assistant
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
          Loading recommendations...
        </div>
      ) : recommendations ? (
        <>
          {/* Current Focus Window */}
          {recommendations.focusWindow && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#10b981',
              borderRadius: '8px',
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                Focus Time Active
              </div>
              <div style={{ fontSize: '13px' }}>
                {getWeekdayName(recommendations.focusWindow.weekday)} {' '}
                {recommendations.focusWindow.startHour}:00 - {recommendations.focusWindow.endHour}:00
              </div>
            </div>
          )}

          {/* Board Adjustments */}
          {recommendations.boardAdjustments.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
                Recommendations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recommendations.boardAdjustments.map((action, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      backgroundColor: '#2a2a2a',
                      borderRadius: '8px',
                      borderLeft: '3px solid #3b82f6',
                    }}
                  >
                    <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                      {getActionIcon(action.actionType)} {action.message}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '10px',
                    }}>
                      <button
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Accept
                      </button>
                      <button
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: '#444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reminders */}
          {recommendations.reminders.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
                Reminders
              </h3>
              <div style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '12px',
              }}>
                {recommendations.reminders.map((reminder, index) => (
                  <div
                    key={index}
                    style={{
                      fontSize: '13px',
                      marginBottom: index < recommendations.reminders.length - 1 ? '8px' : 0,
                      paddingBottom: index < recommendations.reminders.length - 1 ? '8px' : 0,
                      borderBottom: index < recommendations.reminders.length - 1 ? '1px solid #444' : 'none',
                    }}
                  >
                    {reminder}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
              Profile
            </h3>
            <div style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
            }}>
              Tone: <strong>{recommendations.profile.preferenceTone}</strong>
            </div>
          </div>

          {/* Record Event */}
          <div style={{ marginTop: 'auto' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
              Record Activity
            </h3>
            <div style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '8px',
              padding: '12px',
            }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '13px',
                  }}
                >
                  <option value="meeting">Meeting</option>
                  <option value="email">Email</option>
                  <option value="mcp_alert">MCP Alert</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
                  Stress Level
                </label>
                <select
                  value={stressLevel}
                  onChange={(e) => setStressLevel(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '13px',
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
                  Event Data (JSON)
                </label>
                <textarea
                  value={eventPayload}
                  onChange={(e) => setEventPayload(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                onClick={recordEvent}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#8b5cf6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Record Event
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#888',
        }}>
          No recommendations available
        </div>
      )}
    </div>
  );
};

export default AiPalWidget;
