/**
 * Dokumentgenerator Widgets
 * 
 * Autonome widgets til PowerPoint, Word og Excel generering.
 * Se README.md for komplet dokumentation.
 */

// TODO: Import og eksporter widgets når de er implementeret
// export { AutonomousPowerPointMaster } from './autonomous-powerpoint-master';
// export { AutonomousWordArchitect } from './autonomous-word-architect';
// export { AutonomousExcelAnalyzer } from './autonomous-excel-analyzer';

// PowerPoint interfaces
export interface Slide {
  id: string;
  type: 'title' | 'content' | 'image' | 'chart' | 'table' | 'comparison' | 'timeline';
  title: string;
  content: string[];
  images: SlideImage[];
  charts: SlideChart[];
  layout: LayoutConfig;
  notes: string;
}

export interface SlideImage {
  id: string;
  prompt: string;
  url: string;
  position: { x: number; y: number; width: number; height: number };
  style: 'realistic' | 'illustration' | 'diagram' | 'icon';
}

export interface SlideChart {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'waterfall';
  data: ChartData;
  title: string;
  position: { x: number; y: number; width: number; height: number };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export interface LayoutConfig {
  template: 'modern' | 'corporate' | 'creative' | 'academic' | 'startup';
  colorScheme: ColorScheme;
  fontFamily: string;
  spacing: 'tight' | 'normal' | 'loose';
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

// Word interfaces
export interface DocumentSection {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'image' | 'code';
  content: string | string[] | TableData;
  level?: number;
  formatting?: TextFormatting;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontFamily?: string;
}

// Excel interfaces
export interface Worksheet {
  id: string;
  name: string;
  type: 'data' | 'analysis' | 'charts' | 'summary' | 'financial';
  data: (string | number | null)[][];
  charts: ExcelChart[];
  pivotTables: PivotTable[];
}

export interface ExcelChart {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'waterfall' | 'combo';
  title: string;
  dataRange: string;
  position: { col: number; row: number };
  size: { width: number; height: number };
}

export interface PivotTable {
  id: string;
  name: string;
  sourceRange: string;
  rows: string[];
  columns: string[];
  values: string[];
  filters: string[];
}

// Common generation interfaces
export interface GenerationThread {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  output: unknown;
  dependencies: string[];
  priority: number;
  requiredTools: string[];
}

export interface GenerationConfig {
  id: string;
  type: 'powerpoint' | 'word' | 'excel';
  version: string;
  category: 'document-generation';
  gdprCompliant: boolean;
  dataRetentionDays: number;
}
