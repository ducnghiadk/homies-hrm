'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

/**
 * Hook chuẩn React 18/19 để phát hiện đã mount phía client,
 * tránh hydration mismatch mà không gây cascading render hoặc cảnh báo ESLint.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}
