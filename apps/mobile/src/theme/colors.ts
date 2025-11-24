/**
 * WidgeTDC Mobile Theme Colors
 * Inspired by the web dashboard aesthetic
 */

export const colors = {
  // Primary palette - Deep blue to cyan gradient feel
  primary: {
    50: '#E6F4FF',
    100: '#BAE3FF',
    200: '#7CC4FA',
    300: '#47A3F3',
    400: '#2186EB',
    500: '#0967D2',
    600: '#0552B5',
    700: '#03449E',
    800: '#01337D',
    900: '#002159',
  },

  // Accent - Vibrant teal/cyan
  accent: {
    50: '#E6FFFA',
    100: '#B2F5EA',
    200: '#81E6D9',
    300: '#4FD1C5',
    400: '#38B2AC',
    500: '#319795',
    600: '#2C7A7B',
    700: '#285E61',
    800: '#234E52',
    900: '#1D4044',
  },

  // Semantic colors
  success: {
    light: '#68D391',
    main: '#48BB78',
    dark: '#38A169',
  },
  warning: {
    light: '#F6E05E',
    main: '#ECC94B',
    dark: '#D69E2E',
  },
  error: {
    light: '#FC8181',
    main: '#F56565',
    dark: '#E53E3E',
  },
  info: {
    light: '#63B3ED',
    main: '#4299E1',
    dark: '#3182CE',
  },

  // Neutrals - Slate tones
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Background colors
  background: {
    primary: '#0F172A',      // Dark slate
    secondary: '#1E293B',    // Lighter slate
    tertiary: '#334155',     // Card background
    elevated: '#1E293B',     // Elevated surfaces
    input: '#1E293B',        // Input fields
  },

  // Text colors
  text: {
    primary: '#F8FAFC',      // White-ish
    secondary: '#94A3B8',    // Muted
    tertiary: '#64748B',     // Even more muted
    inverse: '#0F172A',      // For light backgrounds
    link: '#38B2AC',         // Accent color for links
  },

  // Border colors
  border: {
    light: '#334155',
    default: '#475569',
    focus: '#38B2AC',
  },

  // Special UI elements
  card: {
    background: '#1E293B',
    border: '#334155',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },

  // Status indicators
  status: {
    online: '#48BB78',
    offline: '#718096',
    busy: '#F6AD55',
    error: '#F56565',
  },

  // Gradient definitions (for use with LinearGradient)
  gradients: {
    primary: ['#0967D2', '#319795'],
    accent: ['#38B2AC', '#4FD1C5'],
    dark: ['#0F172A', '#1E293B'],
    card: ['#1E293B', '#334155'],
  },
};

export default colors;

