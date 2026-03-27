// ─────────────────────────────────────────────────────────────────────────────
// Enterprise Design System — Posture Coach
// Palette v2 — approved by CEO 2026-02
// ─────────────────────────────────────────────────────────────────────────────

export const COLORS = {
  // ── Dark Mode ──────────────────────────────────────────────────────────────
  dark: {
    bg: '#0F172A',
    card: '#111827',
    surface: '#1F2937',
    border: 'rgba(255,255,255,0.06)',
    text: '#F9FAFB',
    textSec: '#9CA3AF',
    textMuted: '#6B7280',
    primary: '#3B5BDB',
    electric: '#2563EB',
    teal: '#14D1B5',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    lowRisk: '#10B981',
    medRisk: '#F59E0B',
    highRisk: '#EF4444',
  },
  // ── Light Mode ────────────────────────────────────────────────────────────
  light: {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    surface: '#F1F5F9',
    border: 'rgba(15,23,42,0.08)',
    text: '#0F172A',
    textSec: '#64748B',
    textMuted: '#94A3B8',
    primary: '#3B5BDB',
    electric: '#2563EB',
    teal: '#14D1B5',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    lowRisk: '#10B981',
    medRisk: '#F59E0B',
    highRisk: '#EF4444',
  },
};

export const GRADIENTS = {
  primary: ['#3B5BDB', '#2563EB'] as const,
  purple: ['#4F6EF7', '#7C3AED'] as const,
  teal: ['#14D1B5', '#0EA5E9'] as const,
  danger: ['#EF4444', '#DC2626'] as const,
  warning: ['#F59E0B', '#D97706'] as const,
};

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };

export const getTheme = (darkMode: boolean) => darkMode ? COLORS.dark : COLORS.light;
