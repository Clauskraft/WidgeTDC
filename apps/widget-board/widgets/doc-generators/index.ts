/**
 * Autonomous Document Generator Widgets
 * AI-powered document creation for PowerPoint, Word, and Excel
 */

export { default as AutonomousPowerPointMasterWidget } from './autonomous-powerpoint-master';
export { default as AutonomousWordArchitectWidget } from './autonomous-word-architect';
export { default as AutonomousExcelAnalyzerWidget } from './autonomous-excel-analyzer';

// Widget Registry Entries
export const docGeneratorWidgets = [
  {
    id: 'autonomous-powerpoint-master',
    name: 'PowerPoint Master',
    description: 'AI-powered presentation generation with MCP integration',
    category: 'document-generation',
    component: 'AutonomousPowerPointMasterWidget',
    icon: '📊',
    tags: ['powerpoint', 'presentation', 'document', 'ai'],
    permissions: ['document.create', 'mcp.powerpoint']
  },
  {
    id: 'autonomous-word-architect',
    name: 'Word Architect',
    description: 'AI-powered document and report generation',
    category: 'document-generation',
    component: 'AutonomousWordArchitectWidget',
    icon: '📄',
    tags: ['word', 'document', 'report', 'ai'],
    permissions: ['document.create', 'mcp.word']
  },
  {
    id: 'autonomous-excel-analyzer',
    name: 'Excel Analyzer',
    description: 'AI-powered spreadsheet generation and data analysis',
    category: 'document-generation',
    component: 'AutonomousExcelAnalyzerWidget',
    icon: '📈',
    tags: ['excel', 'spreadsheet', 'analysis', 'ai'],
    permissions: ['document.create', 'mcp.excel']
  }
];
