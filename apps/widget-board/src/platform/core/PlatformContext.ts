import { createContext, useContext } from 'react';
import { SecurityOverwatchService } from '../../services/SecurityOverwatchService';
import { AuditLogService } from '../../services/AuditLogService';
import { FeedIngestionService } from '../../services/FeedIngestionService';

export interface PlatformServices {
  securityOverwatch: SecurityOverwatchService;
  auditLog: AuditLogService;
  feedIngestion: FeedIngestionService;
}

export const PlatformContext = createContext<PlatformServices | null>(null);

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};
