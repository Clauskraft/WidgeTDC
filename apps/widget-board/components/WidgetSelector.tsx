import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';

interface WidgetSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onAddWidget: (widgetId: string) => void;
    activeWidgets?: string[];
}

export default function WidgetSelector({ isOpen, onClose, onAddWidget, activeWidgets = [] }: WidgetSelectorProps) {
    const { availableWidgets } = useWidgetRegistry();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [rotation, setRotation] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    const radius = 400; // Radius of the carousel
    const totalWidgets = availableWidgets.length;
    const anglePerCard = 360 / totalWidgets;

    useEffect(() => {
        setRotation(selectedIndex * -anglePerCard);
    }, [selectedIndex, anglePerCard]);

    const rotateLeft = () => {
        setSelectedIndex((prev) => (prev - 1 + totalWidgets) % totalWidgets);
    };

    const rotateRight = () => {
        setSelectedIndex((prev) => (prev + 1) % totalWidgets);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') rotateLeft();
        if (e.key === 'ArrowRight') rotateRight();
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter') onAddWidget(availableWidgets[selectedIndex].id);
    };

    useEffect(() => {
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#051e3c]/90 backdrop-blur-xl perspective-[1000px] overflow-hidden animate-in fade-in duration-300">

            {/* Header */}
            <div className="absolute top-8 w-full flex justify-between items-center px-12 z-50">
                <div className="text-center">
                    <h2 className="text-3xl font-light text-white tracking-wide">
                        Widget <span className="text-[#00B5CB] font-bold">Gallery</span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-1 font-light">Vælg en widget til dit dashboard</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-110 text-white hover:text-[#00B5CB]"
                >
                    <X size={24} />
                </button>
            </div>

            {/* 3D Carousel Container */}
            <div className="relative w-full h-[500px] flex items-center justify-center preserve-3d">
                <div
                    ref={carouselRef}
                    className="relative w-full h-full flex items-center justify-center transition-transform duration-700 ease-spring preserve-3d"
                    style={{ transform: `translateZ(-${radius}px) rotateY(${rotation}deg)` }}
                >
                    {availableWidgets.map((widget, index) => {
                        const angle = index * anglePerCard;
                        const isActive = activeWidgets.includes(widget.id);
                        const isSelected = index === selectedIndex;

                        return (
                            <div
                                key={widget.id}
                                className={`absolute top-1/2 left-1/2 -ml-[140px] -mt-[180px] w-[280px] h-[360px] rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden transition-all duration-500 group cursor-pointer
                                    ${isSelected ? 'ring-1 ring-[#00B5CB] bg-[#0B3E6F]/40 scale-105 shadow-[0_0_50px_rgba(0,181,203,0.2)]' : 'bg-[#0B3E6F]/20 opacity-40 hover:opacity-80 scale-90'}
                                `}
                                style={{
                                    transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                                    backfaceVisibility: 'visible'
                                }}
                                onClick={() => {
                                    if (isSelected) onAddWidget(widget.id);
                                    else setSelectedIndex(index);
                                }}
                            >
                                {/* Glassy Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#00B5CB]/10 to-transparent pointer-events-none" />

                                {/* Content */}
                                <div className="relative z-10 p-6 flex flex-col h-full">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-colors duration-300 ${isSelected ? 'bg-[#00B5CB] text-[#051e3c]' : 'bg-white/10 text-gray-400'}`}>
                                        {/* Placeholder Icon - In a real app, map widget types to icons */}
                                        <div className="w-6 h-6 rounded bg-current opacity-80" />
                                    </div>

                                    <h3 className="text-2xl font-medium text-white mb-2">{widget.name}</h3>
                                    <p className="text-sm text-gray-300 leading-relaxed line-clamp-4 flex-1 font-light">
                                        {widget.description}
                                    </p>

                                    <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-xs font-mono text-[#00B5CB]">
                                            {widget.defaultLayout?.w || 6}x{widget.defaultLayout?.h || 4}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddWidget(widget.id);
                                            }}
                                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
                                                ${isActive
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                                                    : 'bg-[#00B5CB] hover:bg-[#009eb3] text-[#051e3c] shadow-lg shadow-[#00B5CB]/20 hover:scale-105 active:scale-95'
                                                }
                                            `}
                                        >
                                            {isActive ? 'Tilføjet' : <><Plus size={16} /> Tilføj</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-12 flex items-center gap-8 z-50">
                <button
                    onClick={rotateLeft}
                    className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all hover:scale-110 active:scale-95 hover:text-[#00B5CB]"
                >
                    <ChevronLeft size={32} />
                </button>

                <div className="flex gap-2">
                    {availableWidgets.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === selectedIndex ? 'w-8 bg-[#00B5CB]' : 'w-2 bg-white/20'}`}
                        />
                    ))}
                </div>

                <button
                    onClick={rotateRight}
                    className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all hover:scale-110 active:scale-95 hover:text-[#00B5CB]"
                >
                    <ChevronRight size={32} />
                </button>
            </div>

            {/* Background Ambient Glow */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00B5CB]/5 rounded-full blur-[150px] animate-pulse-slow" />
            </div>

            <style>{`
                .preserve-3d {
                    transform-style: preserve-3d;
                }
                .perspective-[1000px] {
                    perspective: 1000px;
                }
            `}</style>
        </div>
    );
}
