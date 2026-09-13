// Layout Grid System - Responsive layouts
// UX/UI Pack #8: Grid, Flex, Stack components

import { cn } from '@/lib/utils'

interface GridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8
  className?: string
}

export function Grid({ children, cols = 4, gap = 4, className = '' }: GridProps) {
  const colClasses = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' }
  return <div className={cn('grid', colClasses[cols], `gap-${gap}`, className)}>{children}</div>
}

interface FlexProps {
  children: React.ReactNode
  direction?: 'row' | 'col'
  align?: 'start' | 'center' | 'end'
  justify?: 'start' | 'center' | 'end' | 'between'
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8
  wrap?: boolean
  className?: string
}

export function Flex({ children, direction = 'row', align = 'center', justify = 'start', gap = 0, wrap = false, className = '' }: FlexProps) {
  const alignClasses = { start: 'items-start', center: 'items-center', end: 'items-end' }
  const justifyClasses = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between' }
  return (
    <div className={cn('flex', direction === 'col' ? 'flex-col' : 'flex-row', alignClasses[align], justifyClasses[justify], gap > 0 && `gap-${gap}`, wrap && 'flex-wrap', className)}>
      {children}
    </div>
  )
}

interface StackProps {
  children: React.ReactNode
  spacing?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8
  className?: string
}

export function Stack({ children, spacing = 4, className = '' }: StackProps) {
  return <div className={cn('flex flex-col', spacing > 0 && `space-y-${spacing}`, className)}>{children}</div>
}

interface CenterProps {
  children: React.ReactNode
  className?: string
}

export function Center({ children, className = '' }: CenterProps) {
  return <div className={cn('flex items-center justify-center', className)}>{children}</div>
}

interface SpacerProps {
  size?: 1 | 2 | 3 | 4 | 5 | 6 | 8
}

export function Spacer({ size = 4 }: SpacerProps) {
  return <div className={`h-${size}`} />
}

const layoutExports = { Grid, Flex, Stack, Center, Spacer }

export default layoutExports
