import React from 'react';
import { FileText, Save, Share2, MoreHorizontal, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Image as ImageIcon } from 'lucide-react';

export const WordView: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[#0B3E6F]/20 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            {/* Toolbar */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-white">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <FileText size={18} />
                        </div>
                        <span className="font-medium">Udkast til Q2 Strategi.docx</span>
                        <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">Gemt</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"><Save size={18} /></button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"><Share2 size={18} /></button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"><MoreHorizontal size={18} /></button>
                </div>
            </div>

            {/* Ribbon */}
            <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-white/5 overflow-x-auto">
                <div className="flex items-center gap-1 border-r border-white/10 pr-2">
                    <button className="p-1.5 hover:bg-white/10 rounded text-gray-300"><Bold size={16} /></button>
                    <button className="p-1.5 hover:bg-white/10 rounded text-gray-300"><Italic size={16} /></button>
                    <button className="p-1.5 hover:bg-white/10 rounded text-gray-300"><Underline size={16} /></button>
                </div>
                <div className="flex items-center gap-1 border-r border-white/10 pr-2 pl-2">
                    <button className="p-1.5 hover:bg-white/10 rounded text-gray-300"><AlignLeft size={16} /></button>
                    <button className="p-1.5 hover:bg-white/10 rounded text-gray-300"><AlignCenter size={16} /></button>
                    <button className="p-1.5 hover:bg-white/10 rounded text-gray-300"><AlignRight size={16} /></button>
                </div>
                <div className="flex items-center gap-1 pl-2">
                    <button className="p-1.5 hover:bg-white/10 rounded text-gray-300"><List size={16} /></button>
                    <button className="p-1.5 hover:bg-white/10 rounded text-gray-300"><ImageIcon size={16} /></button>
                </div>
            </div>

            {/* Document Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#051e3c]/50 flex justify-center">
                <div className="w-full max-w-3xl bg-white min-h-[800px] shadow-2xl rounded-sm p-12 text-gray-900 selection:bg-blue-200">
                    <h1 className="text-3xl font-bold mb-4 text-[#0B3E6F]">Q2 Strategi & Målsætninger</h1>
                    <p className="text-gray-500 mb-8 text-sm">Sidst opdateret: 25. november 2025 af Claus Kraft</p>

                    <h2 className="text-xl font-semibold mb-3 text-[#0B3E6F]">1. Executive Summary</h2>
                    <p className="mb-4 leading-relaxed">
                        Denne strategiplan skitserer de primære fokusområder for Q2, med særligt henblik på at accelerere vores digitale transformation og styrke vores markedsposition inden for AI-drevne løsninger.
                    </p>
                    <p className="mb-6 leading-relaxed">
                        Vi ser en markant stigning i efterspørgslen på integrerede løsninger, hvor DOT-platformen spiller en central rolle.
                    </p>

                    <h2 className="text-xl font-semibold mb-3 text-[#0B3E6F]">2. Nøgleinitiativer</h2>
                    <ul className="list-disc pl-5 space-y-2 mb-6">
                        <li>Lancering af DOT 2.0 med forbedret UI/UX.</li>
                        <li>Integration af real-time dataanalyse i alle kundevendte dashboards.</li>
                        <li>Optimering af interne arbejdsgange via automatisering.</li>
                    </ul>

                    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r mb-6">
                        <p className="text-blue-800 font-medium">Note: Budgetgodkendelse afventer bestyrelsesmøde d. 1. december.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
