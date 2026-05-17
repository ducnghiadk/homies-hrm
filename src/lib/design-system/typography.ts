export const typography = {
  hero: 'text-5xl md:text-6xl font-bold',
  h1: 'text-2xl font-bold text-slate-900',
  h2: 'text-xl font-semibold text-slate-800',
  h3: 'text-lg font-semibold text-slate-700',
  body: 'text-base text-slate-600',
  caption: 'text-sm text-slate-500',
  metricValue: 'text-2xl font-bold text-slate-900',
  metricLabel: 'text-sm font-medium text-slate-500 uppercase tracking-wide',
} as const

export type TypographyKey = keyof typeof typography
