/**
 * Autonomous Investigation Widgets
 * Multi-threaded OSINT and Cybersecurity investigations
 */

export { default as AutonomousOSINTEmailWidget } from './autonomous-osint-email-widget';
export { default as AutonomousThreatHunterWidget } from './autonomous-threat-hunter-widget';
export { default as MasterOrchestratorWidget } from './master-orchestrator-widget';

// Widget Registry Entries
export const autonomousWidgets = [
  {
    id: 'autonomous-osint-email',
    name: 'OSINT Email Investigation',
    description: 'Multi-threaded email investigation with autonomous spor-following',
    category: 'investigation',
    component: 'AutonomousOSINTEmailWidget',
    icon: '🔍',
    tags: ['osint', 'email', 'investigation', 'autonomous'],
    permissions: ['osint.read', 'investigation.execute']
  },
  {
    id: 'autonomous-threat-hunter',
    name: 'Threat Hunter',
    description: 'Autonomous cybersecurity threat detection and response',
    category: 'security',
    component: 'AutonomousThreatHunterWidget',
    icon: '🎯',
    tags: ['security', 'threat', 'hunting', 'autonomous'],
    permissions: ['security.read', 'threat.execute']
  },
  {
    id: 'master-orchestrator',
    name: 'Master Orchestrator',
    description: 'Coordinates OSINT and Cybersecurity investigations',
    category: 'investigation',
    component: 'MasterOrchestratorWidget',
    icon: '🎛️',
    tags: ['orchestration', 'osint', 'security', 'coordination'],
    permissions: ['osint.read', 'security.read', 'orchestration.execute']
  }
];
