// Micro-interaction animation configs
// Use with inline styles or CSS custom properties

export const MICRO_ANIMATIONS = {
  buttonPress: {
    scale: 0.95,
    duration: 100,
    ease: 'ease-out',
  },
  buttonHover: {
    scale: 1.02,
    duration: 150,
    ease: 'ease-out',
  },
  success: {
    scale: [1, 1.1, 1],
    duration: 300,
    ease: 'ease-in-out',
  },
  error: {
    shake: [-5, 5, -5, 5, 0],
    duration: 400,
    ease: 'ease-in-out',
  },
  countUp: {
    duration: 800,
    ease: 'ease-out',
  },
  fadeIn: {
    opacity: [0, 1],
    y: [10, 0],
    duration: 300,
    ease: 'ease-out',
  },
  slideInRight: {
    x: [20, 0],
    opacity: [0, 1],
    duration: 250,
    ease: 'ease-out',
  },
} as const

// When to trigger which animations
export const TRIGGER_POINTS = {
  onSaveSuccess: ['successCheckmark', 'toast'] as const,
  onScheduleGenerated: ['confetti', 'countUp', 'successCheckmark'] as const,
  onWarning: ['pulseIndicator', 'shake'] as const,
  onDelete: ['fadeOut', 'toast'] as const,
  onPublish: ['confetti', 'celebrationToast', 'successCheckmark'] as const,
} as const

// CSS keyframe helpers (for use without framer-motion)
export const keyframes = {
  shake: `@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-5px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-5px); }
    80% { transform: translateX(5px); }
  }`,
  pulse: `@keyframes pulse-ring {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(2); opacity: 0; }
  }`,
  countUp: `@keyframes count-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }`,
  checkDraw: `@keyframes draw-check {
    0% { stroke-dashoffset: 48; }
    100% { stroke-dashoffset: 0; }
  }`,
  confettiFall: `@keyframes confetti-fall {
    0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }`,
} as const
