import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface WidgetSummary {
    widgetId: string;
    name: string;
    summary: string; // Kort tekst: "3 nye trusler fundet"
    lastUpdated: Date;
    data?: any; // Rådata hvis nødvendigt
}

interface WidgetBridgeContextType {
    summaries: Record<string, WidgetSummary>;
    reportStatus: (widgetId: string, name: string, summary: string, data?: any) => void;
    openWidget: (widgetId: string) => void;
    // Event stream til chatten
    activeWidgetId: string | null;
}

const WidgetBridgeContext = createContext<WidgetBridgeContextType | null>(null);

export const WidgetBridgeProvider: React.FC<{ children: React.ReactNode, onOpenWidget: (id: string) => void }> = ({ children, onOpenWidget }) => {
    const [summaries, setSummaries] = useState<Record<string, WidgetSummary>>({});
    const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);

    const reportStatus = useCallback((widgetId: string, name: string, summary: string, data?: any) => {
        setSummaries(prev => ({
            ...prev,
            [widgetId]: {
                widgetId,
                name,
                summary,
                lastUpdated: new Date(),
                data
            }
        }));
    }, []);

    const openWidget = useCallback((widgetId: string) => {
        console.log(`🤖 AI anmoder om at åbne widget: ${widgetId}`);
        setActiveWidgetId(widgetId);
        onOpenWidget(widgetId);
    }, [onOpenWidget]);

    return (
        <WidgetBridgeContext.Provider value={{ summaries, reportStatus, openWidget, activeWidgetId }}>
            {children}
        </WidgetBridgeContext.Provider>
    );
};

export const useWidgetBridge = () => {
    const context = useContext(WidgetBridgeContext);
    if (!context) throw new Error('useWidgetBridge must be used within WidgetBridgeProvider');
    return context;
};

