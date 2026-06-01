import React, { useRef } from 'react'

const DummyComponent = () => React.createElement('div', null, 'Component')

export const DynamicCheckinMap = DummyComponent
export const DynamicMapView = DummyComponent
export const DynamicKPIChart = DummyComponent
export const DynamicPayrollChart = DummyComponent
export const DynamicAttendanceChart = DummyComponent
export const DynamicCalendar = DummyComponent
export const DynamicMiniCalendar = DummyComponent
export const DynamicLeaveModal = DummyComponent
export const DynamicEmployeeModal = DummyComponent
export const DynamicKPIModal = DummyComponent
export const DynamicRichTextEditor = DummyComponent
export function LazyLoad({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children)
}

export function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children)
}

export function preloadComponent() {}
export function preloadComponents() {}

export function AvatarImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return React.createElement('img', { src, alt, className })
}

export function CardImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return React.createElement('img', { src, alt, className })
}

export function BackgroundImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return React.createElement('img', { src, alt, className })
}

export function useIntersectionObserver(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null)
  return [ref, true]
}

export function LazyOnScroll({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children)
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  )
}

export async function loadComponents<T>(
  loaders: Array<() => Promise<T>>,

): Promise<T[]> {
  return Promise.all(loaders.map(l => l()))
}

const exported = {
  DynamicCheckinMap,
  DynamicMapView,
  DynamicKPIChart,
  DynamicPayrollChart,
  DynamicAttendanceChart,
  DynamicCalendar,
  DynamicMiniCalendar,
  DynamicLeaveModal,
  DynamicEmployeeModal,
  DynamicKPIModal,
  DynamicRichTextEditor,
  LazyLoad,
  SuspenseWrapper,
  preloadComponent,
  preloadComponents,
  AvatarImage,
  CardImage,
  BackgroundImage,
  useIntersectionObserver,
  LazyOnScroll,
  chunkArray,
  loadComponents,
}

export default exported
