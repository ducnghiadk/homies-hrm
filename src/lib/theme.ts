// ═══════════════════════════════════════════════════════════════════════════════
// Design Tokens & Theme System
// UX/UI Pack #6: Consistent design language
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  // Primary palette
  primary: {
    50: '#F4F8FC',
    100: '#E6F0FA',
    200: '#C2DBF2',
    300: '#9AC1E5',
    400: '#71A5D4',
    500: '#4F8ABF',
    600: '#2F6FA8',
    700: '#1D3E61',
    800: '#001D3D',
    900: '#000814',
  },

  // Secondary palette
  secondary: {
    50: '#F5FCFA',
    100: '#DDF4EC',
    200: '#DDF4EC',
    300: '#8EDEA9',
    400: '#48C079',
    500: '#1E9E57',
    600: '#107C41',
    700: '#0E6B38',
    800: '#0C582F',
    900: '#0A4A27',
  },

  // Neutral palette
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic colors
  semantic: {
    success: {
      bg: '#DDF4EC',
      border: '#8EDEA9',
      text: '#107C41',
      icon: '#1E9E57',
    },
    warning: {
      bg: '#FFF8E8',
      border: '#FCECC6',
      text: '#D97706',
      icon: '#F6C85F',
    },
    error: {
      bg: '#FEF2F2',
      border: '#FECACA',
      text: '#991B1B',
      icon: '#D9381E',
    },
    info: {
      bg: '#E6F0FA',
      border: '#C2DBF2',
      text: '#1D3E61',
      icon: '#2F6FA8',
    },
  },

  // Role colors
  role: {
    ceo: { bg: '#F3E8FF', text: '#7C3AED', border: '#C4B5FD' },
    hr_admin: { bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' },
    store_manager: { bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' },
    area_manager: { bg: '#CCFBF1', text: '#0D9488', border: '#5EEAD4' },
    shift_leader: { bg: '#FFF8E8', text: '#D97706', border: '#FCECC6' },
    employee: { bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB' },
  },

  // Shift colors
  shift: {
    morning: '#F6C85F', // Warm yellow
    afternoon: '#48C079', // Mint green
    evening: '#2F6FA8', // Primary blue
    night: '#001D3D', // Deep navy
  },

  // Status colors
  status: {
    active: '#1E9E57', // Mint green
    inactive: '#6B7280',
    on_leave: '#F6C85F', // Warm yellow
    pending: '#2F6FA8', // Primary blue
    approved: '#1E9E57', // Mint green
    rejected: '#D9381E',
  },

  // Transparent
  transparent: 'transparent',

  // White/Black
  white: '#FFFFFF',
  black: '#000000',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
    display: 'Inter, system-ui, sans-serif',
  },

  fontSize: {
    'xs': '0.75rem',    // 12px
    'sm': '0.875rem',   // 14px
    'base': '1rem',     // 16px
    'lg': '1.125rem',   // 18px
    'xl': '1.25rem',    // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────────────────────────────────────

export const spacing = {
  '0': '0',
  '1': '0.25rem',   // 4px
  '2': '0.5rem',    // 8px
  '3': '0.75rem',   // 12px
  '4': '1rem',      // 16px
  '5': '1.25rem',   // 20px
  '6': '1.5rem',    // 24px
  '8': '2rem',      // 32px
  '10': '2.5rem',   // 40px
  '12': '3rem',     // 48px
  '16': '4rem',     // 64px
  '20': '5rem',     // 80px
  '24': '6rem',     // 96px
} as const

// ─────────────────────────────────────────────────────────────────────────────
// BORDERS
// ─────────────────────────────────────────────────────────────────────────────

export const borderRadius = {
  'none': '0',
  'sm': '0.25rem',   // 4px
  'DEFAULT': '0.5rem', // 8px
  'md': '0.5rem',
  'lg': '0.75rem',   // 12px
  'xl': '1rem',      // 16px
  '2xl': '1.5rem',   // 24px
  '3xl': '2rem',     // 32px
  'full': '9999px',
} as const

export const borderWidth = {
  '0': '0',
  '1': '1px',
  '2': '2px',
  '4': '4px',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────────────────────────────────────

export const shadows = {
  'none': 'none',
  'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
  'elevated': '0 4px 16px rgba(0, 0, 0, 0.12)',
  'modal': '0 10px 40px rgba(0, 0, 0, 0.2)',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Z-INDEX
// ─────────────────────────────────────────────────────────────────────────────

export const zIndex = {
  '0': '0',
  '10': '10',
  '20': '20',
  '30': '30',
  '40': '40',
  '50': '50',
  'dropdown': '1000',
  'sticky': '1100',
  'fixed': '1200',
  'modal-backdrop': '1300',
  'modal': '1400',
  'popover': '1500',
  'tooltip': '1600',
  'toast': '1700',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// BREAKPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export const breakpoints = {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const transitions = {
  duration: {
    '75': '75ms',
    '100': '100ms',
    '150': '150ms',
    '200': '200ms',
    '300': '300ms',
    '500': '500ms',
    '700': '700ms',
    '1000': '1000ms',
  },
  easing: {
    'DEFAULT': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const components = {
  button: {
    padding: {
      sm: '0.5rem 0.75rem',
      md: '0.625rem 1rem',
      lg: '0.75rem 1.25rem',
    },
    fontSize: {
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
    },
    borderRadius: borderRadius.DEFAULT,
    fontWeight: typography.fontWeight.semibold,
  },
  input: {
    padding: '0.625rem 0.875rem',
    fontSize: '1rem',
    borderRadius: borderRadius.DEFAULT,
    borderWidth: borderWidth['1'],
    focusRing: '2px',
    focusColor: colors.primary[500],
  },
  card: {
    padding: '1rem',
    borderRadius: borderRadius.xl,
    shadow: shadows.card,
  },
  modal: {
    borderRadius: borderRadius['2xl'],
    padding: '1.5rem',
  },
  badge: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    borderRadius: borderRadius.full,
  },
  avatar: {
    sizes: {
      xs: '1.5rem',  // 24px
      sm: '2rem',    // 32px
      md: '2.5rem',  // 40px
      lg: '3rem',    // 48px
      xl: '4rem',    // 64px
      '2xl': '6rem', // 96px
    },
    borderRadius: borderRadius.full,
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// CSS VARIABLES GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

export function generateCSSVariables(): string {
  const variables: string[] = []
  const colorMap = colors as Record<string, unknown>

  // Colors
  Object.entries(colorMap).forEach(([name, values]) => {
    if (values && typeof values === 'object' && 'DEFAULT' in values) {
      const palette = values as Record<string, string>
      variables.push(`--color-${name}: ${palette.DEFAULT || palette['500']}`)
      Object.entries(palette).forEach(([key, value]) => {
        if (key !== 'DEFAULT') {
          variables.push(`--color-${name}-${key}: ${value}`)
        }
      })
    } else if (values && typeof values === 'object') {
      Object.entries(values).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          Object.entries(value).forEach(([subKey, subValue]) => {
            variables.push(`--color-${name}-${key}-${subKey}: ${subValue}`)
          })
        } else {
          variables.push(`--color-${name}-${key}: ${value}`)
        }
      })
    }
  })

  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    variables.push(`--spacing-${key}: ${value}`)
  })

  // Typography
  Object.entries(typography.fontSize).forEach(([key, value]) => {
    variables.push(`--font-size-${key}: ${value}`)
  })
  Object.entries(typography.fontWeight).forEach(([key, value]) => {
    variables.push(`--font-weight-${key}: ${value}`)
  })

  // Border radius
  Object.entries(borderRadius).forEach(([key, value]) => {
    variables.push(`--radius-${key}: ${value}`)
  })

  // Shadows
  Object.entries(shadows).forEach(([key, value]) => {
    variables.push(`--shadow-${key}: ${value}`)
  })

  // Transitions
  Object.entries(transitions.duration).forEach(([key, value]) => {
    variables.push(`--duration-${key}: ${value}`)
  })
  Object.entries(transitions.easing).forEach(([key, value]) => {
    variables.push(`--easing-${key}: ${value}`)
  })

  return variables.join('\n  ')
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getColor(color: string, shade = '500'): string {
  const parts = color.split('.')
  const colorMap = colors as Record<string, unknown>
  if (parts.length === 1) {
    const palette = colorMap[color] as Record<string, string> | undefined
    return palette?.[shade] || color
  }
  const group = colorMap[parts[0]] as Record<string, Record<string, string>> | undefined
  return group?.[parts[1]]?.[shade] || color
}

export function getRoleColor(role: string): { bg: string; text: string; border: string } {
  const roleColors = colors.role as Record<string, { bg: string; text: string; border: string }>
  return roleColors[role] || colors.role.employee
}

export function getShiftColor(shift: string): string {
  const shiftColors = colors.shift as Record<string, string>
  return shiftColors[shift] || colors.primary[500]
}

export function getStatusColor(status: string): string {
  const statusColors = colors.status as Record<string, string>
  return statusColors[status] || colors.neutral[500]
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

const themeExports = {
  colors,
  typography,
  spacing,
  borderRadius,
  borderWidth,
  shadows,
  zIndex,
  breakpoints,
  transitions,
  components,
  generateCSSVariables,
  getColor,
  getRoleColor,
  getShiftColor,
  getStatusColor,
}

export default themeExports
