import React from 'react';
import { Mail, Search, Edit3, Star, Inbox, Send, Archive, Trash2, Paperclip, MoreVertical } from 'lucide-react';

export const OutlookView: React.FC = () => {
    return (
        <div className="flex h-full bg-[#0B3E6F]/20 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            {/* Sidebar */}
            <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col">
                <div className="p-4">
                    <button className="w-full bg-[#00B5CB] hover:bg-[#009eb3] text-[#051e3c] font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#00B5CB]/20">
                        <Edit3 size={18} />
                        Ny Email
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/10 text-white">
                        <div className="flex items-center gap-3">
                            <Inbox size={18} />
                            <span className="text-sm font-medium">Indbakke</span>
                        </div>
                        <span className="text-xs bg-[#00B5CB] text-[#051e3c] px-1.5 py-0.5 rounded-full font-bold">4</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                        <Send size={18} />
                        <span className="text-sm font-medium">Sendt</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                        <Archive size={18} />
                        <span className="text-sm font-medium">Arkiv</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                        <Trash2 size={18} />
                        <span className="text-sm font-medium">Slettet</span>
                    </button>
                </div>
            </div>

            {/* Email List */}
            <div className="w-80 bg-white/5 border-r border-white/10 flex flex-col">
                <div className="p-4 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Søg"
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00B5CB]/50"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {[
                        { sender: 'Lars Jensen', subject: 'Projektstatus Q2', time: '10:30', preview: 'Hej Claus, her er opdateringen på...', active: true },
                        { sender: 'Mette Hansen', subject: 'Frokostmøde?', time: '09:15', preview: 'Har du tid til at spise frokost i dag...', active: false },
                        { sender: 'Microsoft', subject: 'Din faktura er klar', time: 'Igår', preview: 'Se din seneste faktura for Azure...', active: false },
                        { sender: 'HR Afdelingen', subject: 'Sommerfest 2025', time: 'Igår', preview: 'Husk at tilmelde dig årets fest...', active: false },
                    ].map((email, i) => (
                        <div key={i} className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${email.active ? 'bg-white/10 border-l-2 border-l-[#00B5CB]' : ''}`}>
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-semibold ${email.active ? 'text-white' : 'text-gray-300'}`}>{email.sender}</span>
                                <span className="text-xs text-gray-500">{email.time}</span>
                            </div>
                            <div className={`text-sm mb-1 ${email.active ? 'text-white font-medium' : 'text-gray-400'}`}>{email.subject}</div>
                            <div className="text-xs text-gray-500 line-clamp-1">{email.preview}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 flex flex-col bg-[#051e3c]/30">
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5">
                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><Archive size={20} /></button>
                        <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><Trash2 size={20} /></button>
                        <div className="h-6 w-px bg-white/10 mx-1" />
                        <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><Star size={20} /></button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><MoreVertical size={20} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                    <h2 className="text-2xl font-semibold text-white mb-6">Projektstatus Q2</h2>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold">LJ</div>
                        <div>
                            <div className="text-sm font-medium text-white">Lars Jensen &lt;lars@tdc.dk&gt;</div>
                            <div className="text-xs text-gray-400">Til: Claus Kraft</div>
                        </div>
                        <div className="ml-auto text-xs text-gray-500">I dag, 10:30</div>
                    </div>
                    <div className="prose prose-invert max-w-none text-gray-300">
                        <p>Hej Claus,</p>
                        <p>Her er en kort opdatering på Q2 projektet. Vi er godt med på tidsplanen, og de første tests ser lovende ud.</p>
                        <p>Nøglepunkter:</p>
                        <ul>
                            <li>Backend integration er 90% færdig.</li>
                            <li>Frontend design er godkendt.</li>
                            <li>Brugeraccepttest starter i næste uge.</li>
                        </ul>
                        <p>Har du mulighed for at kigge på de vedhæftede dokumenter inden vores møde på torsdag?</p>
                        <p>Mvh,<br />Lars</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 w-fit hover:bg-white/10 cursor-pointer transition-colors">
                            <div className="bg-blue-600/20 p-2 rounded text-blue-400"><Paperclip size={20} /></div>
                            <div>
                                <div className="text-sm font-medium text-white">Q2_Status_Report.pdf</div>
                                <div className="text-xs text-gray-500">2.4 MB</div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex gap-3">
                        <button className="px-4 py-2 bg-[#00B5CB] text-[#051e3c] font-medium rounded-lg hover:bg-[#009eb3] transition-colors">Svar</button>
                        <button className="px-4 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors">Videresend</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
