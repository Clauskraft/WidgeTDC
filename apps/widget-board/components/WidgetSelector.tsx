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
    const cardWidth = 280;
    const cardHeight = 360;
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
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md perspective-[1000px] overflow-hidden">

            {/* Header */}
            <div className="absolute top-8 w-full flex justify-between items-center px-12 z-50">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        Widget Gallery
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Select a widget to add to your workspace</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-110 text-white"
                >
                    <X size={24} />
                </button>
            </div>

            {/* 3D Carousel Container */}
            <div className="relative w-full h-[500px] flex items-center justify-center preserve-3d">
                <div
                    ref={carouselRef}
                    className="relative w-full h-full flex items-center justify-center transition-transform duration-700 ease-out preserve-3d"
                    style={{ transform: `translateZ(-${radius}px) rotateY(${rotation}deg)` }}
                >
                    {availableWidgets.map((widget, index) => {
                        const angle = index * anglePerCard;
                        const isActive = activeWidgets.includes(widget.id);
                        const isSelected = index === selectedIndex;

                        return (
                            <div
                                key={widget.id}
                                className={`absolute top-1/2 left-1/2 -ml-[140px] -mt-[180px] w-[280px] h-[360px] rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-500 group cursor-pointer
                                    ${isSelected ? 'ring-2 ring-blue-500/50 bg-white/10 scale-105' : 'bg-white/5 opacity-60 hover:opacity-100'}
                                `}
                                style={{
                                    transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                                    backfaceVisibility: 'visible' // Allow seeing from back if needed, but usually hidden
                                }}
                                onClick={() => {
                                    if (isSelected) onAddWidget(widget.id);
                                    else setSelectedIndex(index);
                                }}
                            >
                                {/* Glassy Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                                {/* Content */}
                                <div className="relative z-10 p-6 flex flex-col h-full">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400'}`}>
                                        {/* Placeholder Icon */}
                                        <div className="w-6 h-6 rounded bg-current opacity-50" />
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-2">{widget.name}</h3>
                                    <p className="text-sm text-gray-300 leading-relaxed line-clamp-4 flex-1">
                                        {widget.description}
                                    </p>

                                    <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-xs font-mono text-gray-500">
                                            {widget.defaultLayout?.w || 6}x{widget.defaultLayout?.h || 4}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddWidget(widget.id);
                                            }}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
                                                ${isActive
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                                                }
                                            `}
                                        >
                                            {isActive ? 'Added' : <><Plus size={16} /> Add</>}
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
                    className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all hover:scale-110 active:scale-95"
                >
                    <ChevronLeft size={32} />
                </button>

                <div className="flex gap-2">
                    {availableWidgets.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === selectedIndex ? 'w-8 bg-blue-500' : 'bg-white/20'}`}
                        />
                    ))}
                </div>

                <button
                    onClick={rotateRight}
                    className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-all hover:scale-110 active:scale-95"
                >
                    <ChevronRight size={32} />
                </button>
            </div>

            {/* Background Ambient Glow */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px]" />
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
