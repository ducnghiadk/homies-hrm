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
      'Cơ cấu cửa hàng',
      'Nhân sự & ca làm',
      'Chính sách nhân sự',
      'Quản trị hệ thống',
    ])
  })

  it('defines exactly four workspace tabs with limited primary cards', () => {
    expect(settingsWorkspaceTabs.map((tab) => tab.label)).toEqual([
      'Cửa hàng',
      'Nhân sự & ca làm',
      'Chính sách nhân sự',
      'Hệ thống & phân quyền',
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
      .filter((entry) => entry.card.title === 'Đồng bộ từ file nhân sự')

    expect(storesTab.primaryCards.some((card) => card.title === 'Đồng bộ từ file nhân sự')).toBe(true)
    expect(duplicated).toHaveLength(1)
  })

  it('nests preference registration under scheduling instead of keeping a top-level card', () => {
    const hrTab = getSettingsWorkspaceTab('workforce')

    expect(hrTab.primaryCards.map((card) => card.title)).not.toContain('Đăng ký ca mong muốn')
    expect(hrTab.secondaryBlocks.map((block) => block.title)).toContain('Đăng ký ca mong muốn')
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

  it('renders inline CRUD shell for master data inside settings page', () => {
    const pageSource = readFileSync(
      resolve(process.cwd(), 'src/app/settings/page.tsx'),
      'utf8',
    )

    expect(pageSource).toContain('EditDrawer')
    expect(pageSource).toContain('ConfirmDialog')
    expect(pageSource).toContain('Thêm')
    expect(pageSource).toContain('Sửa')
    expect(pageSource).toContain('Xóa')
  })
})