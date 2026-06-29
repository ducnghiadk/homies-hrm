import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SHIFT_LABEL = 'L\u1ecbch l\u00e0m vi\u1ec7c theo ca'
const SHIFT_COPY = 'Xem l\u1ecbch l\u00e0m vi\u1ec7c t\u1eeb g\u00f3c nh\u00ecn t\u1eebng ca'
const STAFF_LABEL = 'L\u1ecbch l\u00e0m vi\u1ec7c theo nh\u00e2n s\u1ef1'
const STAFF_COPY = 'Xem v\u00e0 \u0111i\u1ec1u ph\u1ed1i l\u1ecbch l\u00e0m vi\u1ec7c theo t\u1eebng nh\u00e2n s\u1ef1'
const REVIEW_LABEL = 'Duy\u1ec7t l\u1ecbch l\u00e0m vi\u1ec7c'
const REVIEW_COPY = 'T\u1eeb \u0111\u0103ng k\u00fd c\u1ee7a nh\u00e2n s\u1ef1 sang l\u1ecbch l\u00e0m vi\u1ec7c ch\u00ednh th\u1ee9c'
const HISTORY_LABEL = 'L\u1ecbch s\u1eed duy\u1ec7t l\u1ecbch'
const HISTORY_COPY = 'Theo d\u00f5i approve t\u1eeb \u0111\u0103ng k\u00fd, s\u1eeda tay trong b\u1ea3n nh\u1eadp, v\u00e0 l\u1ea7n duy\u1ec7t th\u00e0nh l\u1ecbch l\u00e0m vi\u1ec7c'

describe('schedule work pages IA', () => {
  it('labels /schedule/by-shift as shift-based work schedule view', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app/schedule/by-shift/page.tsx'), 'utf8')

    expect(source).toContain(SHIFT_LABEL)
    expect(source).toContain(SHIFT_COPY)
  })

  it('labels /schedule/manage as employee-based work schedule view', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app/schedule/manage/page.tsx'), 'utf8')

    expect(source).toContain(STAFF_LABEL)
    expect(source).toContain(STAFF_COPY)
  })

  it('labels /schedule/admin/review as work schedule approval view', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app/schedule/admin/review/page.tsx'), 'utf8')

    expect(source).toContain(REVIEW_LABEL)
    expect(source).toContain(REVIEW_COPY)
  })

  it('shows the three work-schedule pages in sidebar with explicit labels', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/lib/navigation/sidebar-config.ts'), 'utf8')

    expect(source).toContain(`label: '${SHIFT_LABEL}'`)
    expect(source).toContain(`label: '${STAFF_LABEL}'`)
    expect(source).toContain(`label: '${REVIEW_LABEL}'`)
  })

  it('labels /schedule/history as review history page', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app/schedule/history/page.tsx'), 'utf8')

    expect(source).toContain(HISTORY_LABEL)
    expect(source).toContain(HISTORY_COPY)
  })
})