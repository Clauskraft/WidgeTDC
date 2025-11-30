/**
 * 🧬 DNA SPLICER TYPE DEFINITIONS
 * Interfaces for the Intelligence Extraction System
 */

// ============================================
// PERSONA TYPES
// ============================================
export interface Persona {
  name: string;
  description: string | null;
  author: string | null;
  vendor?: string;
  isPremium?: boolean;
  hash?: string;
  source?: string;
}

export interface PersonaListResponse {
  personas: Persona[];
}

// ============================================
// DIRECTIVE TYPES
// ============================================
export type DirectiveType =
  | 'restriction'
  | 'rule'
  | 'behavior'
  | 'capability'
  | 'tone'
  | 'format';

export interface Directive {
  id: string;
  content: string;
  type: DirectiveType;
  priority: number; // 1-10, higher = more critical
}

export interface DirectiveResponse {
  directives: Directive[];
}

// ============================================
// STATS TYPES
// ============================================
export interface CapabilityStat {
  name: string;
  count: number;
}

export interface SpliceStats {
  totalPersonas: number;
  totalDirectives: number;
  totalCapabilities: number;
  topCapabilities: CapabilityStat[];
}

// ============================================
// SPLICE OPERATION TYPES
// ============================================
export interface SpliceResult {
  personas: number;
  directives: number;
  capabilities: number;
  hotkeys: number;
  duration: number;
  errors: string[];
}

// ============================================
// VENDOR CONFIGURATION
// ============================================
export type VendorType =
  | 'Anthropic'
  | 'OpenAI'
  | 'Google'
  | 'xAI'
  | 'Perplexity'
  | 'Misc'
  | 'Unknown';

export interface VendorConfig {
  name: VendorType;
  color: string;
  glowColor: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon?: string;
}

export const VENDOR_CONFIGS: Record<VendorType, VendorConfig> = {
  Anthropic: {
    name: 'Anthropic',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    bgClass: 'bg-orange-500/20',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/40',
  },
  OpenAI: {
    name: 'OpenAI',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
  },
  Google: {
    name: 'Google',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/40',
  },
  xAI: {
    name: 'xAI',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/40',
  },
  Perplexity: {
    name: 'Perplexity',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.5)',
    bgClass: 'bg-cyan-500/20',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/40',
  },
  Misc: {
    name: 'Misc',
    color: '#6b7280',
    glowColor: 'rgba(107, 114, 128, 0.5)',
    bgClass: 'bg-gray-500/20',
    textClass: 'text-gray-400',
    borderClass: 'border-gray-500/40',
  },
  Unknown: {
    name: 'Unknown',
    color: '#00ff41',
    glowColor: 'rgba(0, 255, 65, 0.5)',
    bgClass: 'bg-neon-green/20',
    textClass: 'text-neon-green',
    borderClass: 'border-neon-green/40',
  },
};

// ============================================
// DIRECTIVE TYPE CONFIGURATION
// ============================================
export interface DirectiveConfig {
  type: DirectiveType;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  icon: string;
}

export const DIRECTIVE_CONFIGS: Record<DirectiveType, DirectiveConfig> = {
  restriction: {
    type: 'restriction',
    label: 'RESTRICTION',
    color: '#ef4444',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    icon: '⛔',
  },
  rule: {
    type: 'rule',
    label: 'RULE',
    color: '#eab308',
    bgClass: 'bg-yellow-500/20',
    textClass: 'text-yellow-400',
    icon: '📜',
  },
  behavior: {
    type: 'behavior',
    label: 'BEHAVIOR',
    color: '#00d4ff',
    bgClass: 'bg-cyan-500/20',
    textClass: 'text-cyan-400',
    icon: '🔄',
  },
  capability: {
    type: 'capability',
    label: 'CAPABILITY',
    color: '#00ff41',
    bgClass: 'bg-green-500/20',
    textClass: 'text-green-400',
    icon: '⚡',
  },
  tone: {
    type: 'tone',
    label: 'TONE',
    color: '#a855f7',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
    icon: '🎭',
  },
  format: {
    type: 'format',
    label: 'FORMAT',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    icon: '📐',
  },
};
