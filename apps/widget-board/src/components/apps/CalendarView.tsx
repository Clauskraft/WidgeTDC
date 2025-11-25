import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, MapPin, Users, Clock } from 'lucide-react';

export const CalendarView: React.FC = () => {
    const days = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
    const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 to 18:00

    return (
        <div className="flex h-full bg-[#0B3E6F]/20 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            {/* Sidebar */}
            <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col p-4">
                <button className="w-full bg-[#00B5CB] hover:bg-[#009eb3] text-[#051e3c] font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#00B5CB]/20 mb-6">
                    <Plus size={18} />
                    Ny Begivenhed
                </button>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <span className="font-semibold text-white">November 2025</span>
                        <div className="flex gap-1">
                            <button className="p-1 hover:bg-white/10 rounded text-gray-400"><ChevronLeft size={16} /></button>
                            <button className="p-1 hover:bg-white/10 rounded text-gray-400"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                        {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map(d => <div key={d} className="text-gray-500">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {Array.from({ length: 30 }, (_, i) => (
                            <div key={i} className={`h-8 w-8 flex items-center justify-center rounded-full cursor-pointer hover:bg-white/10 ${i === 24 ? 'bg-[#00B5CB] text-[#051e3c] font-bold' : 'text-gray-300'}`}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked className="rounded border-gray-600 bg-transparent text-[#00B5CB] focus:ring-0" />
                        <span className="text-sm text-gray-300">Min Kalender</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked className="rounded border-gray-600 bg-transparent text-purple-500 focus:ring-0" />
                        <span className="text-sm text-gray-300">Team Møder</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded border-gray-600 bg-transparent text-green-500 focus:ring-0" />
                        <span className="text-sm text-gray-300">Fødselsdage</span>
                    </div>
                </div>
            </div>

            {/* Main Calendar Grid */}
            <div className="flex-1 flex flex-col bg-[#051e3c]/30">
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-white">November 2025</h2>
                        <div className="flex bg-black/20 rounded-lg p-1 border border-white/10">
                            <button className="px-3 py-1 rounded-md text-sm text-gray-400 hover:text-white hover:bg-white/5">Dag</button>
                            <button className="px-3 py-1 rounded-md text-sm bg-white/10 text-white shadow-sm">Uge</button>
                            <button className="px-3 py-1 rounded-md text-sm text-gray-400 hover:text-white hover:bg-white/5">Måned</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><Search size={20} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col">
                    {/* Header Row */}
                    <div className="flex border-b border-white/10">
                        <div className="w-16 border-r border-white/10 bg-white/5"></div>
                        {days.map((day, i) => (
                            <div key={day} className={`flex-1 py-3 text-center border-r border-white/10 ${i === 6 ? 'border-r-0' : ''} bg-white/5`}>
                                <div className="text-xs text-gray-500 uppercase font-medium">{day}</div>
                                <div className={`text-lg font-semibold mt-1 ${i === 0 ? 'text-[#00B5CB]' : 'text-white'}`}>{25 + i}</div>
                            </div>
                        ))}
                    </div>

                    {/* Time Grid */}
                    <div className="flex-1 relative">
                        {hours.map((hour) => (
                            <div key={hour} className="flex h-20 border-b border-white/5">
                                <div className="w-16 border-r border-white/10 text-xs text-gray-500 text-right pr-3 pt-2 bg-white/5">
                                    {hour}:00
                                </div>
                                {days.map((_, i) => (
                                    <div key={i} className={`flex-1 border-r border-white/5 ${i === 6 ? 'border-r-0' : ''} relative group hover:bg-white/[0.02]`}>
                                        {/* Mock Events */}
                                        {i === 0 && hour === 10 && (
                                            <div className="absolute top-2 left-1 right-1 bottom-2 bg-blue-600/80 border border-blue-400/30 rounded-lg p-2 cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                                                <div className="text-xs font-bold text-white mb-1">Statusmøde</div>
                                                <div className="text-[10px] text-blue-100 flex items-center gap-1"><Clock size={10} /> 10:00 - 11:00</div>
                                                <div className="text-[10px] text-blue-100 flex items-center gap-1 mt-1"><MapPin size={10} /> Mødelokale 1</div>
                                            </div>
                                        )}
                                        {i === 1 && hour === 13 && (
                                            <div className="absolute top-2 left-1 right-1 bottom-[-3rem] bg-purple-600/80 border border-purple-400/30 rounded-lg p-2 cursor-pointer hover:bg-purple-600 transition-colors shadow-lg z-10">
                                                <div className="text-xs font-bold text-white mb-1">Workshop: AI Strategi</div>
                                                <div className="text-[10px] text-purple-100 flex items-center gap-1"><Clock size={10} /> 13:00 - 15:00</div>
                                                <div className="text-[10px] text-purple-100 flex items-center gap-1 mt-1"><Users size={10} /> Hele Teamet</div>
                                            </div>
                                        )}
                                        {i === 3 && hour === 9 && (
                                            <div className="absolute top-2 left-1 right-1 bottom-2 bg-teal-600/80 border border-teal-400/30 rounded-lg p-2 cursor-pointer hover:bg-teal-600 transition-colors shadow-lg">
                                                <div className="text-xs font-bold text-white mb-1">Kundeopkald</div>
                                                <div className="text-[10px] text-teal-100 flex items-center gap-1"><Clock size={10} /> 09:00 - 10:00</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}

                        {/* Current Time Indicator */}
                        <div className="absolute left-16 right-0 top-[180px] border-t-2 border-red-500 z-20 pointer-events-none">
                            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
