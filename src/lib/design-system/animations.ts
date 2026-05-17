export const animations = {
  // Durations
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',

  // Easings
  ease: 'ease-out',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',

  // Common combinations
  fadeIn: 'animate-in fade-in duration-200',
  slideUp: 'animate-in slide-in-from-bottom-2 duration-300',
  slideRight: 'animate-in slide-in-from-right-4 duration-300',
  collapse: 'transition-all duration-300 ease-out',

  // Hover
  hoverScale: 'hover:scale-[1.02] transition-transform duration-150',
  hoverShadow: 'hover:shadow-lg transition-shadow duration-200',
} as const
