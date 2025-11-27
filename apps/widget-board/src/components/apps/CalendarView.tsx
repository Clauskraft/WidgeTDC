import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, RefreshCw, Mail, Calendar, X, Settings, Eye, EyeOff, Trash2 } from 'lucide-react';

interface CalendarSource {
    id: string;
    name: string;
    email: string;
    type: 'google' | 'outlook' | 'other';
    color: string;
    enabled: boolean;
}

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    location?: string;
    attendees?: string[];
    sourceId: string;
    color: string;
}

const defaultSources: CalendarSource[] = [
    { id: 'google-1', name: 'Google Calendar', email: 'personlig@gmail.com', type: 'google', color: 'red', enabled: true },
    { id: 'outlook-1', name: 'Outlook', email: 'clak@tdc.dk', type: 'outlook', color: 'blue', enabled: true },
];

const colorOptions = ['red', 'blue', 'green', 'purple', 'orange', 'teal', 'pink', 'indigo'];

export const CalendarView: React.FC = () => {
    const [sources, setSources] = useState<CalendarSource[]>(() => {
        const saved = localStorage.getItem('calendar_sources');
        return saved ? JSON.parse(saved) : defaultSources;
    });
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSource, setNewSource] = useState({ name: '', email: '', type: 'google' as const, color: 'green' });

    const days = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
    const hours = Array.from({ length: 11 }, (_, i) => i + 8);

    // Save sources to localStorage
    useEffect(() => {
        localStorage.setItem('calendar_sources', JSON.stringify(sources));
    }, [sources]);

    useEffect(() => {
        const fetchEvents = async () => {
            // Demo events - in production, fetch from actual calendar APIs
            const allEvents: CalendarEvent[] = [
                // Google Calendar events
                { id: 'g1', title: 'Standup Meeting', start: '2025-11-27T09:00:00', end: '2025-11-27T09:30:00', location: 'Google Meet', sourceId: 'google-1', color: 'red' },
                { id: 'g2', title: 'AI Workshop', start: '2025-11-27T14:00:00', end: '2025-11-27T16:00:00', location: 'Konferencelokale A', sourceId: 'google-1', color: 'red' },
                { id: 'g3', title: 'Sprint Planning', start: '2025-11-28T10:00:00', end: '2025-11-28T12:00:00', location: 'Google Meet', sourceId: 'google-1', color: 'red' },
                // Outlook events
                { id: 'o1', title: 'Projektstatus med Lars', start: '2025-11-27T10:00:00', end: '2025-11-27T11:00:00', location: 'Teams', sourceId: 'outlook-1', color: 'blue' },
                { id: 'o2', title: 'Kundeopkald - TDC', start: '2025-11-27T13:00:00', end: '2025-11-27T13:30:00', location: 'Teams', sourceId: 'outlook-1', color: 'blue' },
                { id: 'o3', title: 'Q2 Review', start: '2025-11-28T09:00:00', end: '2025-11-28T10:00:00', location: 'Direktionslokalet', sourceId: 'outlook-1', color: 'blue' },
                { id: 'o4', title: '1:1 med Mette', start: '2025-11-27T15:00:00', end: '2025-11-27T15:30:00', location: 'Teams', sourceId: 'outlook-1', color: 'blue' },
            ];
            setEvents(allEvents);
            setLoading(false);
        };
        fetchEvents();
    }, []);

    const toggleSource = (id: string) => {
        setSources(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    };

    const removeSource = (id: string) => {
        if (confirm('Er du sikker på at du vil fjerne denne kalender?')) {
            setSources(prev => prev.filter(s => s.id !== id));
        }
    };

    const addSource = () => {
        if (!newSource.name || !newSource.email) return;
        const id = `${newSource.type}-${Date.now()}`;
        setSources(prev => [...prev, { ...newSource, id, enabled: true }]);
        setNewSource({ name: '', email: '', type: 'google', color: 'green' });
        setShowAddModal(false);
    };

    const getColorClass = (color: string, opacity: number = 500) => {
        const colors: Record<string, string> = {
            red: `bg-red-${opacity}`,
            blue: `bg-blue-${opacity}`,
            green: `bg-green-${opacity}`,
            purple: `bg-purple-${opacity}`,
            orange: `bg-orange-${opacity}`,
            teal: `bg-teal-${opacity}`,
            pink: `bg-pink-${opacity}`,
            indigo: `bg-indigo-${opacity}`,
        };
        return colors[color] || `bg-gray-${opacity}`;
    };

    const enabledSourceIds = sources.filter(s => s.enabled).map(s => s.id);
    const filteredEvents = events.filter(e => enabledSourceIds.includes(e.sourceId));

    const getEventPosition = (event: CalendarEvent) => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const startHour = start.getHours();
        const startMinute = start.getMinutes();
        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return {
            top: (startHour - 8) * 80 + (startMinute / 60) * 80 + 8,
            height: Math.max(duration * 80 - 16, 40),
        };
    };

    const todayEvents = filteredEvents.filter(e => {
        const eventDate = new Date(e.start);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCw className="animate-spin text-[#00B5CB]" size={24} />
            </div>
        );
    }

    return (
        <div className="flex h-full bg-[#0B3E6F]/20 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in duration-500">
            {/* Sidebar */}
            <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col p-4">
                <button className="w-full bg-[#00B5CB] hover:bg-[#009eb3] text-[#051e3c] font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#00B5CB]/20 mb-6">
                    <Plus size={18} />
                    Ny Begivenhed
                </button>

                {/* Mini Calendar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <span className="font-semibold text-white text-sm">November 2025</span>
                        <div className="flex gap-1">
                            <button className="p-1 hover:bg-white/10 rounded text-gray-400"><ChevronLeft size={14} /></button>
                            <button className="p-1 hover:bg-white/10 rounded text-gray-400"><ChevronRight size={14} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] mb-1">
                        {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((d, i) => <div key={i} className="text-gray-500">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                        {Array.from({ length: 30 }, (_, i) => (
                            <div key={i} className={`h-6 w-6 flex items-center justify-center rounded-full cursor-pointer hover:bg-white/10 ${i === 26 ? 'bg-[#00B5CB] text-[#051e3c] font-bold' : 'text-gray-300'}`}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Calendar Sources */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500 uppercase font-medium">Kalendere</p>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-[#00B5CB] transition-colors"
                            title="Tilføj kalender"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    
                    <div className="space-y-1">
                        {sources.map(source => (
                            <div 
                                key={source.id} 
                                className={`flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 group transition-colors ${!source.enabled ? 'opacity-50' : ''}`}
                            >
                                <button
                                    onClick={() => toggleSource(source.id)}
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${source.enabled ? `border-${source.color}-500 bg-${source.color}-500` : 'border-gray-500'}`}
                                    style={{ 
                                        borderColor: source.enabled ? `var(--color-${source.color}, #${source.color === 'red' ? 'ef4444' : source.color === 'blue' ? '3b82f6' : source.color === 'green' ? '22c55e' : '8b5cf6'})` : undefined,
                                        backgroundColor: source.enabled ? `var(--color-${source.color}, #${source.color === 'red' ? 'ef4444' : source.color === 'blue' ? '3b82f6' : source.color === 'green' ? '22c55e' : '8b5cf6'})` : 'transparent'
                                    }}
                                >
                                    {source.enabled && <span className="text-white text-[10px]">✓</span>}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        {source.type === 'outlook' ? <Mail size={10} className="text-gray-400" /> : <Calendar size={10} className="text-gray-400" />}
                                        <span className="text-xs text-gray-300 truncate">{source.name}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 truncate">{source.email}</p>
                                </div>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => toggleSource(source.id)}
                                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                                        title={source.enabled ? 'Skjul' : 'Vis'}
                                    >
                                        {source.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                                    </button>
                                    <button
                                        onClick={() => removeSource(source.id)}
                                        className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                                        title="Fjern"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {sources.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-xs">
                            <p>Ingen kalendere tilføjet</p>
                            <button 
                                onClick={() => setShowAddModal(true)}
                                className="text-[#00B5CB] hover:underline mt-1"
                            >
                                Tilføj en kalender
                            </button>
                        </div>
                    )}
                </div>

                {/* Today's Summary */}
                <div className="pt-3 border-t border-white/10 mt-2">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-2">I dag ({todayEvents.length})</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {todayEvents.slice(0, 4).map(event => {
                            const source = sources.find(s => s.id === event.sourceId);
                            return (
                                <div 
                                    key={event.id} 
                                    className="p-1.5 rounded-lg bg-white/5 border-l-2"
                                    style={{ borderColor: source?.color === 'red' ? '#ef4444' : source?.color === 'blue' ? '#3b82f6' : '#22c55e' }}
                                >
                                    <p className="text-[10px] font-medium text-white truncate">{event.title}</p>
                                    <p className="text-[9px] text-gray-400">
                                        {new Date(event.start).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Calendar Grid */}
            <div className="flex-1 flex flex-col bg-[#051e3c]/30">
                <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-white/5">
                    <div className="flex items-center gap-3">
                        <h2 className="text-base font-semibold text-white">November 2025</h2>
                        <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/10">
                            <button className="px-2 py-1 rounded text-[10px] text-gray-400 hover:text-white hover:bg-white/5">Dag</button>
                            <button className="px-2 py-1 rounded text-[10px] bg-white/10 text-white">Uge</button>
                            <button className="px-2 py-1 rounded text-[10px] text-gray-400 hover:text-white hover:bg-white/5">Måned</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                        {sources.filter(s => s.enabled).map(s => (
                            <div key={s.id} className="flex items-center gap-1">
                                <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: s.color === 'red' ? '#ef4444' : s.color === 'blue' ? '#3b82f6' : '#22c55e' }}
                                />
                                <span className="text-gray-400">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col">
                    {/* Header Row */}
                    <div className="flex border-b border-white/10 sticky top-0 bg-[#051e3c] z-20">
                        <div className="w-12 border-r border-white/10 bg-white/5"></div>
                        {days.map((day, i) => (
                            <div key={day} className={`flex-1 py-2 text-center border-r border-white/10 ${i === 6 ? 'border-r-0' : ''} bg-white/5`}>
                                <div className="text-[9px] text-gray-500 uppercase">{day}</div>
                                <div className={`text-sm font-semibold ${i === 3 ? 'text-[#00B5CB]' : 'text-white'}`}>{24 + i}</div>
                            </div>
                        ))}
                    </div>

                    {/* Time Grid */}
                    <div className="flex-1 relative">
                        {hours.map((hour) => (
                            <div key={hour} className="flex h-20 border-b border-white/5">
                                <div className="w-12 border-r border-white/10 text-[9px] text-gray-500 text-right pr-1 pt-1 bg-white/5">
                                    {hour}:00
                                </div>
                                {days.map((_, i) => (
                                    <div key={i} className={`flex-1 border-r border-white/5 ${i === 6 ? 'border-r-0' : ''} hover:bg-white/[0.02]`} />
                                ))}
                            </div>
                        ))}

                        {/* Render Events */}
                        {filteredEvents.map(event => {
                            const pos = getEventPosition(event);
                            const eventDate = new Date(event.start);
                            const dayDiff = Math.floor((eventDate.getTime() - new Date('2025-11-24').getTime()) / (1000 * 60 * 60 * 24));
                            const source = sources.find(s => s.id === event.sourceId);
                            
                            if (dayDiff < 0 || dayDiff > 6) return null;

                            const bgColor = source?.color === 'red' ? 'rgba(239,68,68,0.8)' : 
                                           source?.color === 'blue' ? 'rgba(59,130,246,0.8)' : 
                                           source?.color === 'green' ? 'rgba(34,197,94,0.8)' : 
                                           'rgba(139,92,246,0.8)';

                            return (
                                <div
                                    key={event.id}
                                    className="absolute rounded-lg p-1.5 cursor-pointer hover:brightness-110 transition-all shadow-lg overflow-hidden border border-white/20"
                                    style={{
                                        left: `calc(48px + ${dayDiff} * ((100% - 48px) / 7) + 2px)`,
                                        width: `calc((100% - 48px) / 7 - 4px)`,
                                        top: `${pos.top}px`,
                                        height: `${pos.height}px`,
                                        backgroundColor: bgColor,
                                        zIndex: 10
                                    }}
                                >
                                    <div className="text-[9px] font-bold text-white leading-tight truncate">{event.title}</div>
                                    {pos.height > 45 && (
                                        <div className="text-[8px] text-white/80 flex items-center gap-0.5 mt-0.5">
                                            <Clock size={8} />
                                            {new Date(event.start).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                    {event.location && pos.height > 60 && (
                                        <div className="text-[8px] text-white/70 flex items-center gap-0.5 truncate">
                                            <MapPin size={8} className="shrink-0" />
                                            <span className="truncate">{event.location}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Current Time Indicator */}
                        <div className="absolute left-12 right-0 top-[160px] border-t-2 border-red-500 z-30 pointer-events-none">
                            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Calendar Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
                    <div className="bg-[#0B3E6F] border border-white/20 rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">Tilføj Kalender</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Type</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setNewSource(s => ({ ...s, type: 'google' }))}
                                        className={`flex-1 py-2 px-3 rounded-lg border text-sm flex items-center justify-center gap-2 transition-colors ${newSource.type === 'google' ? 'bg-red-500/20 border-red-500/50 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        <Calendar size={16} />
                                        Google
                                    </button>
                                    <button
                                        onClick={() => setNewSource(s => ({ ...s, type: 'outlook' }))}
                                        className={`flex-1 py-2 px-3 rounded-lg border text-sm flex items-center justify-center gap-2 transition-colors ${newSource.type === 'outlook' ? 'bg-blue-500/20 border-blue-500/50 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        <Mail size={16} />
                                        Outlook
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Navn</label>
                                <input
                                    type="text"
                                    value={newSource.name}
                                    onChange={e => setNewSource(s => ({ ...s, name: e.target.value }))}
                                    placeholder="F.eks. Arbejdskalender"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00B5CB]/50"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                                <input
                                    type="email"
                                    value={newSource.email}
                                    onChange={e => setNewSource(s => ({ ...s, email: e.target.value }))}
                                    placeholder="din@email.dk"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00B5CB]/50"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Farve</label>
                                <div className="flex gap-2">
                                    {colorOptions.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setNewSource(s => ({ ...s, color }))}
                                            className={`w-8 h-8 rounded-full transition-transform ${newSource.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0B3E6F] scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : color === 'green' ? '#22c55e' : color === 'purple' ? '#8b5cf6' : color === 'orange' ? '#f97316' : color === 'teal' ? '#14b8a6' : color === 'pink' ? '#ec4899' : '#6366f1' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                            >
                                Annuller
                            </button>
                            <button
                                onClick={addSource}
                                disabled={!newSource.name || !newSource.email}
                                className="flex-1 py-2 px-4 bg-[#00B5CB] hover:bg-[#009eb3] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-[#051e3c] font-semibold transition-colors"
                            >
                                Tilføj
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

