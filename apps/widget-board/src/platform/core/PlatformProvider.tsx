import React, { ReactNode, useMemo } from 'react';
import { PlatformContext, PlatformServices } from './PlatformContext';
import { SecurityOverwatchService } from '../../services/SecurityOverwatchService';
import { AuditLogService } from '../../services/AuditLogService';
import { FeedIngestionService } from '../../services/FeedIngestionService';
import { AgentService } from '../../services/AgentService';

interface PlatformProviderProps {
    children: ReactNode;
}

export const PlatformProvider: React.FC<PlatformProviderProps> = ({ children }) => {
    const services = useMemo<PlatformServices>(() => {
        // Initialize services here. In a real app, you might pass configuration or API clients.
        // For now, we assume they can be instantiated directly or are singletons.
        return {
            securityOverwatch: new SecurityOverwatchService(),
            auditLog: new AuditLogService(),
            feedIngestion: new FeedIngestionService(),
            agentService: new AgentService(),
        };
    }, []);

    return (
        <PlatformContext.Provider value={services}>
            {children}
        </PlatformContext.Provider>
    );
};
