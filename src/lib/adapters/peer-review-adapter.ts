import {
  buildPeerReviewDemoSeed,
  createLocalPeerReviewRepository,
  createSupabasePeerReviewRepository,
  type KpiActor,
  type KpiEmployeePeerResultDto,
  type KpiEvaluationIntegrityFlag,
  type KpiPeerCandidateFact,
  type KpiPeerManagerQueueDto,
  type KpiPeerReviewRepository,
  type KpiPeerReviewerTaskDto,
  type PeerResponseDraftInput,
} from '../kpi/index.ts'
import { supabase, isSupabaseConfigured } from '../supabase.ts'

export type PeerReviewRuntimeMode = 'local_demo' | 'supabase_secure'

export interface PeerReviewAdapter extends KpiPeerReviewRepository {
  getRuntimeMode(): PeerReviewRuntimeMode
}

export interface CreatePeerReviewAdapterOptions {
  requestedMode: PeerReviewRuntimeMode
  supabaseConfigured: boolean
  localRepository: KpiPeerReviewRepository
  secureRepository?: KpiPeerReviewRepository
}

export function buildPeerCandidateFacts(input: {
  subject_id: string
  primary_reviewer_id?: string
  employees: Array<{
    id: string
    role: string
    status: string
    store_id: string
    probation?: boolean
    suspended?: boolean
  }>
  schedules: Array<{
    employee_id: string
    store_id: string
    date: string
    shift_id: string
    status?: string
  }>
  month: string
  open_serious_incident_employee_ids?: string[]
  reciprocal_pairs?: Array<[string, string]>
  previous_reviewer_ids?: string[]
}): KpiPeerCandidateFact[] {
  const {
    subject_id,
    employees,
    schedules,
    month,
    open_serious_incident_employee_ids = [],
    reciprocal_pairs = [],
    previous_reviewer_ids = [],
  } = input

  // Lọc lịch hợp lệ trong tháng (chỉ tính published hoặc legacy không có status)
  const validSchedules = schedules.filter((s) => {
    if (!s.date.startsWith(month)) return false
    if (s.status && s.status !== 'published') return false
    return true
  })

  // Tập hợp các ca của subject
  const subjectShiftKeys = new Set<string>()
  for (const s of validSchedules) {
    if (s.employee_id === subject_id) {
      subjectShiftKeys.add(`${s.store_id}_${s.date}_${s.shift_id}`)
    }
  }

  const reciprocalSet = new Set(
    reciprocal_pairs
      .filter(([sub]) => sub === subject_id)
      .map(([, peer]) => peer)
  )

  const subjectEmployee = employees.find((e) => e.id === subject_id)
  const subjectStoreId = subjectEmployee?.store_id

  return employees
    .filter((emp) => emp.id !== subject_id && emp.store_id === subjectStoreId)
    .map((emp) => {
      const empSchedules = validSchedules.filter((s) => s.employee_id === emp.id)
      const totalShifts = empSchedules.length

      let sharedShifts = 0
      for (const s of empSchedules) {
        const key = `${s.store_id}_${s.date}_${s.shift_id}`
        if (subjectShiftKeys.has(key)) {
          sharedShifts += 1
        }
      }

      const role = (emp.role === 'shift_leader' || emp.role === 'store_manager'
        ? emp.role
        : 'employee') as KpiPeerCandidateFact['role']

      const status = (emp.status === 'inactive' ? 'inactive' : 'active') as KpiPeerCandidateFact['status']

      return {
        employee_id: emp.id,
        role,
        status,
        probation: Boolean(emp.probation),
        suspended: Boolean(emp.suspended),
        serious_incident_open: open_serious_incident_employee_ids.includes(emp.id),
        total_shifts: totalShifts,
        shared_shifts: sharedShifts,
        reviewed_subject_last_month: previous_reviewer_ids.includes(emp.id),
        reciprocal_in_period: reciprocalSet.has(emp.id),
      }
    })
}

class PeerReviewAdapterService implements PeerReviewAdapter {
  private readonly repository: KpiPeerReviewRepository
  private readonly runtimeMode: PeerReviewRuntimeMode

  constructor(
    repository: KpiPeerReviewRepository,
    runtimeMode: PeerReviewRuntimeMode
  ) {
    this.repository = repository
    this.runtimeMode = runtimeMode
  }

  getRuntimeMode(): PeerReviewRuntimeMode {
    return this.runtimeMode
  }

  async listReviewerTasks(actor: KpiActor): Promise<KpiPeerReviewerTaskDto[]> {
    return this.repository.listReviewerTasks(actor)
  }

  async listManagerQueue(actor: KpiActor): Promise<KpiPeerManagerQueueDto[]> {
    return this.repository.listManagerQueue(actor)
  }

  async submitResponse(
    actor: KpiActor,
    assignmentId: string,
    draft: PeerResponseDraftInput
  ): Promise<void> {
    return this.repository.submitResponse(actor, assignmentId, draft)
  }

  async selectReviewers(
    actor: KpiActor,
    monthlyReviewId: string,
    reviewerIds: string[],
    reason?: string
  ): Promise<void> {
    return this.repository.selectReviewers(actor, monthlyReviewId, reviewerIds, reason)
  }

  async approveMonthlyReview(
    actor: KpiActor,
    monthlyReviewId: string,
    approvedAt?: string
  ) {
    return this.repository.approveMonthlyReview(actor, monthlyReviewId, approvedAt)
  }

  async returnMonthlyReview(
    actor: KpiActor,
    monthlyReviewId: string,
    reason: string,
    returnedAt?: string
  ) {
    return this.repository.returnMonthlyReview(actor, monthlyReviewId, reason, returnedAt)
  }

  async getEmployeeAggregate(
    actor: KpiActor,
    monthlyReviewId: string
  ): Promise<KpiEmployeePeerResultDto> {
    return this.repository.getEmployeeAggregate(actor, monthlyReviewId)
  }

  async revealReviewerIdentity(
    actor: KpiActor,
    assignmentId: string,
    reason: string
  ): Promise<{ reviewer_id: string }> {
    return this.repository.revealReviewerIdentity(actor, assignmentId, reason)
  }

  async listIntegrityFlags(actor: KpiActor): Promise<KpiEvaluationIntegrityFlag[]> {
    return this.repository.listIntegrityFlags(actor)
  }

  async resolveIntegrityFlag(
    actor: KpiActor,
    flagId: string,
    decision: 'dismissed' | 'confirmed',
    reason: string
  ): Promise<KpiEvaluationIntegrityFlag> {
    return this.repository.resolveIntegrityFlag(actor, flagId, decision, reason)
  }
}

export function createPeerReviewAdapter(
  options: CreatePeerReviewAdapterOptions
): PeerReviewAdapter {
  if (options.requestedMode === 'supabase_secure') {
    if (!options.supabaseConfigured || !options.secureRepository) {
      throw new Error('Đã bật KPI Supabase nhưng cấu hình kết nối bảo mật chưa đầy đủ.')
    }
    return new PeerReviewAdapterService(options.secureRepository, 'supabase_secure')
  }

  return new PeerReviewAdapterService(options.localRepository, 'local_demo')
}

const localRepository = createLocalPeerReviewRepository({
  initialData: buildPeerReviewDemoSeed(),
})
const requestedMode: PeerReviewRuntimeMode = process.env.NEXT_PUBLIC_KPI_REPOSITORY === 'supabase'
  ? 'supabase_secure'
  : 'local_demo'

export const peerReviewAdapter = createPeerReviewAdapter({
  requestedMode,
  supabaseConfigured: isSupabaseConfigured,
  localRepository,
  secureRepository: isSupabaseConfigured
    ? createSupabasePeerReviewRepository(supabase as unknown as import('../kpi/index.ts').SupabaseClientLike)
    : undefined,
})
