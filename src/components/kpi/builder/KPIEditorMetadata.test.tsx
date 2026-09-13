import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import test from 'node:test'

import { KPICriterionDrawer } from './KPICriterionDrawer'
import type { KpiCriterionDefinition } from '@/lib/kpi/types'

const criterion: KpiCriterionDefinition = {
  id: 'criterion-1',
  group_id: 'group-1',
  name: 'Đúng công thức',
  description: 'Tỷ lệ ly pha đúng tiêu chuẩn.',
  scoring_mode: 'automatic',
  weight: 60,
  unit: 'percent',
  direction: 'higher',
  core: true,
  recommended_weight_range: { min: 50, max: 70 },
  source_key: 'recipe_accuracy_rate',
  score_bands: [{ min: 0, max: 100, score: 3 }],
  adjustment_reason_required: true,
  sort_order: 1,
  active: true,
}

test('drawer hiển thị metadata nghiệp vụ F&B của tiêu chí', () => {
  const markup = renderToStaticMarkup(
    <KPICriterionDrawer
      open
      criterion={criterion}
      onClose={() => undefined}
      onSave={() => undefined}
    />,
  )

  assert.match(markup, />Đơn vị đo</)
  assert.match(markup, />Chiều đánh giá</)
  assert.match(markup, />Tiêu chí cốt lõi</)
})
