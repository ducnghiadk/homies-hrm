import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  getSettingsWorkspaceTab,
  settingCategories,
  settingItems,
  settingsWorkspaceTabs,
} from '@/lib/mock-data/settings'
import { getDesktopSidebarEntries } from '@/lib/navigation/sidebar-config'

function routeExists(href: string) {
  const pathname = href.split('#')[0]
  if (!pathname.startsWith('/')) return false
  if (pathname === '/settings') return true

  const pagePath = resolve(process.cwd(), `src/app${pathname}/page.tsx`)
  return existsSync(pagePath)
}

describe('settings information architecture', () => {
  it('uses business groups tailored for HRM F&B', () => {
    expect(settingCategories.map((category) => category.label)).toEqual([
      'C\u01a1 c\u1ea5u c\u1eeda h\u00e0ng',
      'Nh\u00e2n s\u1ef1 & ca l\u00e0m',
      'Ch\u00ednh s\u00e1ch nh\u00e2n s\u1ef1',
      'Qu\u1ea3n tr\u1ecb h\u1ec7 th\u1ed1ng',
    ])
  })

  it('defines exactly four workspace tabs with limited primary cards', () => {
    expect(settingsWorkspaceTabs.map((tab) => tab.label)).toEqual([
      'C\u1eeda h\u00e0ng',
      'Nh\u00e2n s\u1ef1 & ca l\u00e0m',
      'Ch\u00ednh s\u00e1ch nh\u00e2n s\u1ef1',
      'H\u1ec7 th\u1ed1ng & ph\u00e2n quy\u1ec1n',
    ])

    for (const tab of settingsWorkspaceTabs) {
      expect(tab.primaryCards.length).toBeGreaterThanOrEqual(3)
      expect(tab.primaryCards.length).toBeLessThanOrEqual(4)
    }
  })

  it('keeps store sync only inside the store workspace tab', () => {
    const storesTab = getSettingsWorkspaceTab('stores')
    const duplicated = settingsWorkspaceTabs
      .flatMap((tab) => tab.primaryCards.map((card) => ({ tab: tab.id, card })))
      .filter((entry) => entry.card.title === '\u0110\u1ed3ng b\u1ed9 t\u1eeb file nh\u00e2n s\u1ef1')

    expect(storesTab.primaryCards.some((card) => card.title === '\u0110\u1ed3ng b\u1ed9 t\u1eeb file nh\u00e2n s\u1ef1')).toBe(true)
    expect(duplicated).toHaveLength(1)
  })

  it('nests preference registration under scheduling instead of keeping a top-level card', () => {
    const hrTab = getSettingsWorkspaceTab('workforce')

    expect(hrTab.primaryCards.map((card) => card.title)).not.toContain('\u0110\u0103ng k\u00fd ca mong mu\u1ed1n')
    expect(hrTab.secondaryBlocks.map((block) => block.title)).toContain('\u0110\u0103ng k\u00fd ca mong mu\u1ed1n')
  })

  it('only links settings cards to live routes or settings anchors', () => {
    const staleRoutes = ['/settings/branches', '/settings/organization', '/settings/notifications', '/settings/backup']

    for (const item of settingItems) {
      expect(staleRoutes).not.toContain(item.href)
      expect(routeExists(item.href)).toBe(true)
    }
  })

  it('keeps a single settings entry point in manager sidebar', () => {
    const settingsGroup = getDesktopSidebarEntries('hr_admin').find((entry) => entry.id === 'settings')
    const itemHrefs = settingsGroup?.items?.map((item) => item.href) ?? []

    expect(itemHrefs).toEqual([
      '/settings',
      '/settings/permissions',
      '/settings/payroll',
      '/settings/labor-cost',
      '/settings/system',
      '/inventory',
    ])
    expect(itemHrefs).not.toContain('/settings/master-data')
  })

  it('redirects legacy master-data route back to consolidated settings hub', () => {
    const pageSource = readFileSync(
      resolve(process.cwd(), 'src/app/settings/master-data/page.tsx'),
      'utf8',
    )

    expect(pageSource).toContain("redirect('/settings')")
  })

  it('renders new settings workspace primitives in the hub page source', () => {
    const pageSource = readFileSync(
      resolve(process.cwd(), 'src/app/settings/page.tsx'),
      'utf8',
    )

    expect(pageSource).toContain('SettingsWorkspaceTabs')
    expect(pageSource).toContain('SettingsStatusStrip')
    expect(pageSource).toContain('SettingsWorkspaceCard')
    expect(pageSource).not.toContain('<SetupWizardBanner')
  })

  it('renders workspace tabs instead of all-category sections on the settings page source', () => {
    const pageSource = readFileSync(
      resolve(process.cwd(), 'src/app/settings/page.tsx'),
      'utf8',
    )

    expect(pageSource).toContain("useState<SettingsWorkspaceTabId>('stores')")
    expect(pageSource).toContain('getSettingsWorkspaceTab')
    expect(pageSource).not.toContain("selectedCategory === 'all'")
    expect(pageSource).not.toContain('groupedItems.map((category) =>')
  })


  it('searches across workspace cards and secondary blocks', () => {
    const pageSource = readFileSync(
      resolve(process.cwd(), 'src/components/settings/SettingSearch.tsx'),
      'utf8',
    )

    expect(pageSource).toContain('searchWorkspaceSettings')
  })

  it('keeps inline CRUD shell available after workspace refactor', () => {
    const pageSource = readFileSync(
      resolve(process.cwd(), 'src/app/settings/page.tsx'),
      'utf8',
    )

    expect(pageSource).toContain('EditDrawer')
    expect(pageSource).toContain('ConfirmDialog')
    expect(pageSource).toContain('handleStoreImportApply')
  })
  it('renders inline CRUD shell for master data inside settings page', () => {
    const pageSource = readFileSync(
      resolve(process.cwd(), 'src/app/settings/page.tsx'),
      'utf8',
    )

    expect(pageSource).toContain('EditDrawer')
    expect(pageSource).toContain('ConfirmDialog')
    expect(pageSource).toContain('Th\u00eam')
    expect(pageSource).toContain('S\u1eeda')
    expect(pageSource).toContain('X\u00f3a')
  })
})