/**
 * Autonome OSINT & Cybersecurity Widgets
 * 
 * Multi-threaded investigation widgets med sporopfølgning.
 * Se README.md for komplet dokumentation.
 */

// TODO: Import og eksporter widgets når de er implementeret
// export { AutonomousOSINTEmailWidget } from './autonomous-osint-email-widget';
// export { AutonomousThreatHunterWidget } from './autonomous-threat-hunter-widget';
// export { MasterOrchestratorWidget } from './master-orchestrator-widget';

// Placeholder exports til type definitions
export interface InvestigationThread {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  findings: Finding[];
  dependencies: string[];
  priority: number;
  requiredTools?: string[];
}

export interface Finding {
  id: string;
  threadId: string;
  source: string;
  type: 'email' | 'phone' | 'breach' | 'social' | 'darkweb' | 'domain' | 'ip' | 'threat';
  data: Record<string, unknown>;
  confidence: number;
  relatedFindings: string[];
  timestamp: number;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export interface WidgetConfig {
  id: string;
  type: 'osint-email' | 'threat-hunter' | 'master-orchestrator';
  version: string;
  category: 'osint' | 'cybersecurity';
  gdprCompliant: boolean;
  dataRetentionDays: number;
}

export interface InvestigationTarget {
  email?: string;
  domain?: string;
  ip?: string;
  additionalIdentifiers?: string[];
}
