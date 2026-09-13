export const colors = {
  gradients: {
    primary: 'from-primary-800 to-primary-600',
    secondary: 'from-primary-700 to-primary-500',
    success: 'from-success-600 to-success-500',
    warning: 'from-warning-600 to-warning-500',
    danger: 'from-error-600 to-error-500',
    dark: 'from-dark-900 to-dark-700',
  },
  glass: {
    light: 'bg-white/70 backdrop-blur-xl',
    dark: 'bg-gray-900/70 backdrop-blur-xl',
    colored: 'bg-primary-500/10 backdrop-blur-xl',
  },
  status: {
    success: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    warning: { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-200' },
    danger: { bg: 'bg-error-50', text: 'text-error-700', border: 'border-error-200' },
    info: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-200' },
  },
};

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg shadow-purple-500/10',
  xl: 'shadow-xl shadow-purple-500/20',
  glow: 'shadow-lg shadow-primary-600/30',
};

export const spacing = {
  section: 'space-y-6',
  card: 'p-4 md:p-6',
  cardGap: 'gap-4',
};
