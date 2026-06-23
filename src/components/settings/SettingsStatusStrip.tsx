'use client'

export function SettingsStatusStrip({
  statusLabel,
  actionLabel,
  helperText,
}: {
  statusLabel: string
  actionLabel: string
  helperText: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-sm font-semibold text-gray-900">{statusLabel}</div>
        <div className="mt-1 text-xs text-gray-600">{helperText}</div>
      </div>
      <div className="inline-flex items-center rounded-xl bg-white px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm">
        {actionLabel}
      </div>
    </div>
  )
}