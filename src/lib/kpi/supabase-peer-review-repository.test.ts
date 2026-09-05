import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  createSupabasePeerReviewRepository,
  type SupabaseClientLike,
} from './supabase-peer-review-repository.ts'
import type { KpiActor } from './types.ts'

describe('supabase peer review repository', () => {
  const actor: KpiActor = { id: 'user-01', role: 'employee', store_id: 'store-001' }

  it('delegates reviewer task retrieval to secure RPC', async () => {
    let rpcCalledWith: { fn: string; args?: Record<string, unknown> } | null = null

    const mockClient: SupabaseClientLike = {
      from: () => ({
        select: () => ({}),
        insert: () => ({}),
        update: () => ({}),
      }),
      rpc: async (fn, args) => {
        rpcCalledWith = { fn, args }
        return {
          data: [
            {
              assignment_id: 'assign-01',
              monthly_review_id: 'mr-01',
              subject: { id: 'emp-02', name: 'Trần B', position_name: 'Pha chế' },
              month: '2026-08',
              shared_shift_count: 8,
              deadline_at: '2026-08-27T08:00:00.000Z',
              status: 'assigned',
            },
          ],
          error: null,
        }
      },
    }

    const repo = createSupabasePeerReviewRepository(mockClient)
    const tasks = await repo.listReviewerTasks(actor)

    assert.ok(rpcCalledWith)
    assert.equal((rpcCalledWith as { fn: string }).fn, 'get_my_peer_reviewer_tasks')
    assert.equal(tasks.length, 1)
    assert.equal(tasks[0].subject.name, 'Trần B')
  })

  it('delegates response submission to secure RPC with draft validation payload', async () => {
    let rpcPayload: { fn: string; args?: Record<string, unknown> } | null = null

    const mockClient: SupabaseClientLike = {
      from: () => ({
        select: () => ({}),
        insert: () => ({}),
        update: () => ({}),
      }),
      rpc: async (fn, args) => {
        rpcPayload = { fn, args }
        return { data: null, error: null }
      },
    }

    const repo = createSupabasePeerReviewRepository(mockClient)
    await repo.submitResponse(actor, 'assign-01', {
      answers: [{ question_code: 'peak_teamwork', score: 5, evidence_note: 'Bằng chứng hợp lệ và đầy đủ' }],
      strength_note: 'Nhiệt tình',
      improvement_note: 'Cẩn thận hơn',
      direct_observation_confirmed: true,
    })

    assert.ok(rpcPayload)
    const payload = rpcPayload as { fn: string; args?: Record<string, unknown> }
    assert.equal(payload.fn, 'submit_peer_response')
    assert.equal(payload.args?.p_assignment_id, 'assign-01')
    assert.equal(payload.args?.p_direct_observation_confirmed, true)
  })

  it('delegates reviewer reveal to security-definer RPC requiring reason', async () => {
    let rpcPayload: { fn: string; args?: Record<string, unknown> } | null = null

    const mockClient: SupabaseClientLike = {
      from: () => ({
        select: () => ({}),
        insert: () => ({}),
        update: () => ({}),
      }),
      rpc: async (fn, args) => {
        rpcPayload = { fn, args }
        return { data: { reviewer_id: 'peer-secret-99' }, error: null }
      },
    }

    const hrActor: KpiActor = { id: 'hr-01', role: 'hr_admin', store_id: 'store-001' }
    const repo = createSupabasePeerReviewRepository(mockClient)

    const result = await repo.revealReviewerIdentity(
      hrActor,
      'assign-01',
      'Điều tra khiếu nại kỷ luật'
    )

    assert.ok(rpcPayload)
    const payload = rpcPayload as { fn: string; args?: Record<string, unknown> }
    assert.equal(payload.fn, 'reveal_peer_reviewer_identity')
    assert.equal(payload.args?.p_reason, 'Điều tra khiếu nại kỷ luật')
    assert.equal(result.reviewer_id, 'peer-secret-99')
  })

  it('delegates approval and return decisions to secure RPCs', async () => {
    const calls: Array<{ fn: string; args?: Record<string, unknown> }> = []
    const mockClient: SupabaseClientLike = {
      from: () => ({
        select: () => ({}),
        insert: () => ({}),
        update: () => ({}),
      }),
      rpc: async (fn, args) => {
        calls.push({ fn, args })
        return {
          data: {
            id: 'mr-01',
            status: fn === 'approve_monthly_review' ? 'published' : 'primary_review_pending',
            blocker_codes: [],
          },
          error: null,
        }
      },
    }
    const manager: KpiActor = { id: 'manager-01', role: 'store_manager', store_id: 'store-001' }
    const repo = createSupabasePeerReviewRepository(mockClient)

    assert.ok(repo.approveMonthlyReview)
    assert.ok(repo.returnMonthlyReview)
    await repo.approveMonthlyReview(manager, 'mr-01', '2026-08-27T10:00:00.000Z')
    await repo.returnMonthlyReview(manager, 'mr-01', 'Bổ sung bằng chứng.', '2026-08-27T11:00:00.000Z')

    assert.equal(calls[0].fn, 'approve_monthly_review')
    assert.equal(calls[1].fn, 'return_monthly_review')
    assert.equal(calls[1].args?.p_reason, 'Bổ sung bằng chứng.')
  })

  it('delegates integrity queue and decisions to secure RPCs', async () => {
    const calls: Array<{ fn: string; args?: Record<string, unknown> }> = []
    const mockClient: SupabaseClientLike = {
      from: () => ({ select: () => ({}), insert: () => ({}), update: () => ({}) }),
      rpc: async (fn, args) => {
        calls.push({ fn, args })
        return { data: fn === 'get_kpi_integrity_flags' ? [{ id: 'flag-01', status: 'open' }] : { id: 'flag-01', status: 'confirmed' }, error: null }
      },
    }
    const hr: KpiActor = { id: 'hr-01', role: 'hr_admin', store_id: 'store-001' }
    const repo = createSupabasePeerReviewRepository(mockClient)

    assert.equal((await repo.listIntegrityFlags(hr)).length, 1)
    await repo.resolveIntegrityFlag(hr, 'flag-01', 'confirmed', 'Đã kiểm tra lịch sử chấm chéo.')
    assert.equal(calls[0].fn, 'get_kpi_integrity_flags')
    assert.equal(calls[1].fn, 'resolve_kpi_integrity_flag')
    assert.equal(calls[1].args?.p_reason, 'Đã kiểm tra lịch sử chấm chéo.')
  })

  it('defines every repository RPC against the canonical Homies employee schema', () => {
    const schemaSql = readFileSync(
      new URL('../../../supabase/migrations/20260823_kpi_monthly_peer_review.sql', import.meta.url),
      'utf8'
    )
    const rlsSql = readFileSync(
      new URL('../../../supabase/migrations/20260823_kpi_monthly_peer_review_rls.sql', import.meta.url),
      'utf8'
    )

    assert.doesNotMatch(schemaSql, /public\.profiles|public\.stores/)
    assert.match(schemaSql, /REFERENCES public\.nhan_vien\(id\)/)
    assert.match(schemaSql, /REFERENCES public\.cua_hang\(id\)/)

    for (const rpcName of [
      'get_store_peer_manager_queue',
      'submit_peer_response',
      'manager_select_peer_reviewers',
      'get_employee_peer_aggregate',
      'approve_monthly_review',
      'return_monthly_review',
      'get_kpi_integrity_flags',
      'resolve_kpi_integrity_flag',
    ]) {
      assert.match(rlsSql, new RegExp(`FUNCTION public\\.${rpcName}`))
    }

    assert.match(rlsSql, /app_kpi_current_employee_id\(\)/)
    assert.match(rlsSql, /app_kpi_current_store_id\(\)/)
    assert.match(rlsSql, /REVOKE ALL ON FUNCTION public\.reveal_peer_reviewer_identity/)
    assert.match(rlsSql, /GRANT EXECUTE ON FUNCTION public\.reveal_peer_reviewer_identity/)
    assert.match(rlsSql, /IDENTICAL_RESPONSES/)
    assert.match(rlsSql, /RECIPROCAL_PAIR/)
  })
})
