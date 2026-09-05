import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'

const readSource = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')

describe('career grade admin UI contract', () => {
  it('uses the grade migration preview without exposing legacy position labels', () => {
    const source = readSource('src/app/kpi/settings/migration/page.tsx')

    assert.match(source, /buildCareerGradeMigrationPreview/)
    assert.match(source, /needs_confirmation/)
    assert.match(source, /Xác nhận bản xem trước/)
    assert.doesNotMatch(source, /PT1 Thu ngân|PT1 Pha chế|System detect/)
  })

  it('seeds only the three Homies job titles for a new tenant', () => {
    const source = readSource('src/lib/adapters/master-data-adapter.ts')
    const positionsBlock = source.match(/const initialPositions:[\s\S]*?\n\]/)?.[0] || ''

    assert.match(positionsBlock, /Nhân viên cửa hàng/)
    assert.match(positionsBlock, /Trưởng ca/)
    assert.match(positionsBlock, /Quản lý cửa hàng/)
    assert.doesNotMatch(positionsBlock, /Pha chế chính|Thu ngân|Phục vụ sảnh/)

    const page = readSource('src/app/settings/master-data/page.tsx')
    assert.match(page, /Danh mục chức danh & Lộ trình năng lực Homies/)
    assert.match(page, /Khối quản lý/)
    assert.match(page, /Lộ trình năng lực/)
    assert.match(page, /c1_pc|C1-PC/)
    assert.doesNotMatch(page, /L\{pos\.level\}/)
    assert.doesNotMatch(page, /Vị trí Công việc & Cấp bậc Level/)
  })

  it('offers a one-click Homies repair action for missing criteria', () => {
    const source = readSource('src/components/kpi/career-map/KPICareerMapValidationPanel.tsx')

    assert.match(source, /onUseHomiesTemplate/)
    assert.match(source, /Dùng bộ Homies/)
  })

  it('lets the advanced tray add grade nodes under the same job title', () => {
    const tray = readSource('src/components/kpi/career-map/KPICareerPositionTray.tsx')
    const canvas = readSource('src/components/kpi/career-map/KPICareerMapCanvas.tsx')

    assert.match(tray, /application\/reactflow-grade/)
    assert.match(tray, /gradeCode/)
    assert.match(canvas, /application\/reactflow-grade/)
  })
})
