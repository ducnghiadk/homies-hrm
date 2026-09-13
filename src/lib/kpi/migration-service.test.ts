import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const {
  buildLegacyMigrationPreview,
  classifyLegacyLevel,
  convertLegacyScoreToKpiScore,
} = await import('./migration-service.ts')

describe('migration-service', () => {
  it('classifies legacy levels into auto, needs mapping, and rejected groups', () => {
    assert.deepEqual(classifyLegacyLevel('L2'), {
      status: 'auto_convertible',
      suggested_level: 'pt2',
      allowed_levels: ['pt2'],
      reason: 'L2 trong bo cu map thang sang PT2 trong bo KPI moi.',
    })

    assert.deepEqual(classifyLegacyLevel('L3'), {
      status: 'needs_mapping',
      suggested_level: undefined,
      allowed_levels: ['senior', 'shift_leader'],
      reason: 'L3 trong bo cu gom ca Senior va Truong ca, can Admin chon dich danh dung.',
    })

    assert.deepEqual(classifyLegacyLevel('L5'), {
      status: 'rejected',
      suggested_level: undefined,
      allowed_levels: [],
      reason: 'Pilot KPI SaaS hien tai chua nhap du lieu L4-L5.',
    })
  })

  it('converts legacy 0-100 scores into the new 1-5 score scale', () => {
    assert.equal(convertLegacyScoreToKpiScore(97), 5)
    assert.equal(convertLegacyScoreToKpiScore(89), 4)
    assert.equal(convertLegacyScoreToKpiScore(80), 3)
    assert.equal(convertLegacyScoreToKpiScore(64), 2)
    assert.equal(convertLegacyScoreToKpiScore(40), 1)
  })

  it('builds a dry-run preview with counts, mapping queue, and checksum', () => {
    const preview = buildLegacyMigrationPreview({
      evaluations: [
        {
          id: 'eval-l2',
          org_id: 'org-001',
          store_id: 'store-001',
          employee_id: 'emp-001',
          employee_level: 'L2',
          option_type: 'B',
          period: '2026-07',
          category_scores: [],
          violation_score: 90,
          total_score: 89,
          grade_code: 'good',
          status: 'published',
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
        },
        {
          id: 'eval-l3',
          org_id: 'org-001',
          store_id: 'store-001',
          employee_id: 'emp-002',
          employee_level: 'L3',
          option_type: 'B',
          period: '2026-07',
          category_scores: [],
          violation_score: 85,
          total_score: 84,
          grade_code: 'fair',
          status: 'published',
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
        },
        {
          id: 'eval-l5',
          org_id: 'org-001',
          store_id: 'store-001',
          employee_id: 'emp-003',
          employee_level: 'L5',
          option_type: 'C',
          period: '2026-07',
          category_scores: [],
          violation_score: 92,
          total_score: 91,
          grade_code: 'excellent',
          status: 'published',
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
        },
      ],
    })

    assert.equal(preview.summary.total_rows, 3)
    assert.equal(preview.summary.auto_convertible, 1)
    assert.equal(preview.summary.needs_mapping, 1)
    assert.equal(preview.summary.rejected, 1)
    assert.equal(preview.summary.ready_to_import, 1)
    assert.ok(preview.checksum.length >= 8)
    assert.equal(preview.items[0].new_level, 'pt2')
    assert.equal(preview.items[0].new_score, 4)
    assert.equal(preview.items[0].new_grade_code, 'good')
    assert.equal(preview.items[1].status, 'needs_mapping')
    assert.equal(preview.items[2].status, 'rejected')
  })

  it('uses admin mapping rules and changes checksum when mappings change', () => {
    const first = buildLegacyMigrationPreview({
      evaluations: [
        {
          id: 'eval-l0',
          org_id: 'org-001',
          store_id: 'store-001',
          employee_id: 'emp-004',
          employee_level: 'L0',
          option_type: 'A',
          period: '2026-07',
          category_scores: [],
          violation_score: 100,
          total_score: 96,
          grade_code: 'excellent',
          status: 'published',
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
        },
      ],
      level_mapping: {
        L0: 'pt1_pc',
      },
    })

    const second = buildLegacyMigrationPreview({
      evaluations: [
        {
          id: 'eval-l0',
          org_id: 'org-001',
          store_id: 'store-001',
          employee_id: 'emp-004',
          employee_level: 'L0',
          option_type: 'A',
          period: '2026-07',
          category_scores: [],
          violation_score: 100,
          total_score: 96,
          grade_code: 'excellent',
          status: 'published',
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
        },
      ],
      level_mapping: {
        L0: 'pt1_tn',
      },
    })

    assert.equal(first.summary.ready_to_import, 1)
    assert.equal(first.items[0].new_level, 'pt1_pc')
    assert.equal(second.items[0].new_level, 'pt1_tn')
    assert.notEqual(first.checksum, second.checksum)
  })
})
