import type { ReactNode } from 'react'

export function SettingsWorkspaceCard({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${className}`.trim()}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}