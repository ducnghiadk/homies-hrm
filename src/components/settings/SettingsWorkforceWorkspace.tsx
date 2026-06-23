import { SettingsWorkspaceCard } from '@/components/settings/SettingsWorkspaceCard'

function SimpleList({ items }: { items: Array<{ title: string; subtitle: string }> }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.title} className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3">
          <div className="text-sm font-medium text-gray-900">{item.title}</div>
          <div className="mt-1 text-xs text-gray-500">{item.subtitle}</div>
        </div>
      ))}
    </div>
  )
}

export function SettingsWorkforceWorkspace({
  cards,
}: {
  cards: Array<{ title: string; description: string; items: Array<{ title: string; subtitle: string }>; footer?: string }>
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {cards.map((card) => (
        <SettingsWorkspaceCard key={card.title} title={card.title} description={card.description}>
          <SimpleList items={card.items} />
          {card.footer ? <div className="mt-3 text-xs font-medium text-amber-700">{card.footer}</div> : null}
        </SettingsWorkspaceCard>
      ))}
    </div>
  )
}