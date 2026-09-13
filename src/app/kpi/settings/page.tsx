'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Plus,
  Sparkles,
  Store,
  SlidersHorizontal,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { KPIGroupEditor } from '@/components/kpi/builder/KPIGroupEditor'
import { KPICriterionDrawer } from '@/components/kpi/builder/KPICriterionDrawer'
import { KPIStoreGroupPanel } from '@/components/kpi/builder/KPIStoreGroupPanel'
import { KPITargetMatrix } from '@/components/kpi/builder/KPITargetMatrix'
import { KPIStoreOverridePanel } from '@/components/kpi/builder/KPIStoreOverridePanel'

import { KPIProgramStepper } from '@/components/kpi/program/KPIProgramStepper'
import { KPIProgramPurposeStep } from '@/components/kpi/program/KPIProgramPurposeStep'
import { KPIProgramScopeStep } from '@/components/kpi/program/KPIProgramScopeStep'
import { KPIProgramSourcesStep } from '@/components/kpi/program/KPIProgramSourcesStep'
import { KPIProgramReadinessStep } from '@/components/kpi/program/KPIProgramReadinessStep'
import { KPIProgramReviewStep } from '@/components/kpi/program/KPIProgramReviewStep'
import { KPIAdvancedSettingsPanel } from '@/components/kpi/program/KPIAdvancedSettingsPanel'
import { KPISingleStageExceptionPanel } from '@/components/kpi/program/KPISingleStageExceptionPanel'

import { kpiAdapter } from '@/lib/adapters/kpi-adapter'
import { peerReviewAdapter } from '@/lib/adapters/peer-review-adapter'
import { storeAdapter } from '@/lib/adapters/store-adapter'
import { employeeAdapter } from '@/lib/adapters/employee-adapter'
import { MasterDataAdapter } from '@/lib/adapters/master-data-adapter'
import { getFnbTemplate } from '@/lib/kpi/fnb-template-catalog'
import { buildHomiesCareerMapSeed } from '@/lib/kpi/seed'
import { inferJobFamily, inferPositionLevel, selectEditableCareerMap } from '@/lib/kpi/career-map-service'
import type {
  KpiCareerPositionSnapshot,
  CareerMapAggregateChange,
} from '@/lib/kpi/career-map-types'
import {
  DEFAULT_KPI_POLICY,
  cloneAsNextDraft,
  createSingleStageExceptionDraft,
  publishVersion,
  validateKpiSet,
  getDefaultPeerReviewPolicy,
  getDefaultPromotionRule,
  getDefaultSourcePolicy,
  isKpiVersionEditable,
  prepareHomiesQuickStart,
  validateProgramVersion,
  type KpiCriterionDefinition,
  type KpiDatabase,
  type KpiGroupDefinition,
  type KpiSetVersion,
  type KpiProgramSetupStep,
  type KpiStoreGroup,
  type KpiTargetProfile,
  type KpiStoreTargetOverride,
} from '@/lib/kpi'
import { useAuthStore } from '@/store/auth-store'

function createStandard5Pillars(): KpiGroupDefinition[] {
  return [
    {
      id: 'grp_revenue',
      name: 'Doanh thu & Bán kèm (Upsell)',
      tag: 'revenue',
      weight: 30,
      promotion_core: false,
      sort_order: 1,
      criteria: [
        {
          id: 'crit_rev_1',
          group_id: 'grp_revenue',
          name: 'Doanh số & Tỷ lệ bán kèm (Upsell)',
          description: 'Đo lường chỉ số bán kèm topping, bánh, nước size lớn theo ca làm việc.',
          scoring_mode: 'automatic',
          weight: 30,
          source_key: 'pos.revenue_shift_index',
          score_bands: [
            { min: 95, max: null, score: 5 },
            { min: 90, max: 94.99, score: 4 },
            { min: 80, max: 89.99, score: 3 },
            { min: 70, max: 79.99, score: 2 },
            { min: 0, max: 69.99, score: 1 },
          ],
          adjustment_reason_required: true,
          sort_order: 1,
          active: true,
        },
      ],
    },
    {
      id: 'grp_operations',
      name: 'Vận hành ca & Ra món',
      tag: 'operations',
      weight: 25,
      promotion_core: true,
      sort_order: 2,
      criteria: [
        {
          id: 'crit_ops_1',
          group_id: 'grp_operations',
          name: 'Độ chính xác công thức & Tốc độ ra món',
          description: 'Tuân thủ định lượng pha chế, thời gian phục vụ món chuẩn dưới 3 phút.',
          scoring_mode: 'combined',
          weight: 25,
          source_key: 'kitchen.ticket_time_index',
          score_bands: [
            { min: 95, max: null, score: 5 },
            { min: 88, max: 94.99, score: 4 },
            { min: 80, max: 87.99, score: 3 },
            { min: 70, max: 79.99, score: 2 },
            { min: 0, max: 69.99, score: 1 },
          ],
          adjustment_reason_required: true,
          sort_order: 1,
          active: true,
        },
      ],
    },
    {
      id: 'grp_discipline',
      name: 'Kỷ luật & Giờ giấc',
      tag: 'discipline',
      weight: 20,
      promotion_core: true,
      sort_order: 3,
      criteria: [
        {
          id: 'crit_disc_1',
          group_id: 'grp_discipline',
          name: 'Chuyên cần, đúng giờ & Vệ sinh quầy',
          description: 'Đi làm đúng giờ, không bỏ ca và hoàn thành checklist vệ sinh.',
          scoring_mode: 'automatic',
          weight: 20,
          source_key: 'attendance.on_time_index',
          score_bands: [
            { min: 98, max: null, score: 5 },
            { min: 92, max: 97.99, score: 4 },
            { min: 85, max: 91.99, score: 3 },
            { min: 75, max: 84.99, score: 2 },
            { min: 0, max: 74.99, score: 1 },
          ],
          adjustment_reason_required: true,
          sort_order: 1,
          active: true,
        },
      ],
    },
    {
      id: 'grp_service',
      name: 'Thái độ & Trải nghiệm khách',
      tag: 'customer_service',
      weight: 15,
      promotion_core: false,
      sort_order: 4,
      criteria: [
        {
          id: 'crit_serv_1',
          group_id: 'grp_service',
          name: 'Điểm đánh giá dịch vụ & Thái độ phục vụ',
          description: 'Không có phàn nàn khách hàng, nụ cười chào đón và hỗ trợ tận tình.',
          scoring_mode: 'leader',
          weight: 15,
          score_bands: [
            { min: 4.8, max: null, score: 5 },
            { min: 4.4, max: 4.79, score: 4 },
            { min: 4.0, max: 4.39, score: 3 },
            { min: 3.5, max: 3.99, score: 2 },
            { min: 0, max: 3.49, score: 1 },
          ],
          adjustment_reason_required: true,
          sort_order: 1,
          active: true,
        },
      ],
    },
    {
      id: 'grp_teamwork',
      name: 'Tinh thần phối hợp / Chủ động',
      tag: 'custom',
      weight: 10,
      promotion_core: false,
      sort_order: 5,
      criteria: [
        {
          id: 'crit_team_1',
          group_id: 'grp_teamwork',
          name: 'Hỗ trợ đồng đội lúc cao điểm',
          description: 'Chủ động phụ quầy khác khi đông khách, linh hoạt đổi ca hỗ trợ.',
          scoring_mode: 'leader',
          weight: 10,
          score_bands: [
            { min: 90, max: null, score: 5 },
            { min: 80, max: 89.99, score: 4 },
            { min: 70, max: 79.99, score: 3 },
            { min: 60, max: 69.99, score: 2 },
            { min: 0, max: 59.99, score: 1 },
          ],
          adjustment_reason_required: false,
          sort_order: 1,
          active: true,
        },
      ],
    },
  ]
}

function createGroupDraft(nextIndex: number): KpiGroupDefinition {
  const timestamp = Date.now()
  const groupId = `grp_custom_${nextIndex}_${timestamp}`
  return {
    id: groupId,
    name: `Trụ tiêu chí mới ${nextIndex}`,
    tag: 'custom',
    weight: 0,
    promotion_core: false,
    sort_order: nextIndex,
    criteria: [
      {
        id: `crit_custom_${nextIndex}_${timestamp}`,
        group_id: groupId,
        name: 'Tiêu chí đánh giá mới',
        description: 'Mô tả hướng dẫn chấm cho tiêu chí này.',
        scoring_mode: 'leader',
        weight: 0,
        score_bands: [
          { min: 95, max: null, score: 5 },
          { min: 85, max: 94.99, score: 4 },
          { min: 75, max: 84.99, score: 3 },
          { min: 65, max: 74.99, score: 2 },
          { min: 0, max: 64.99, score: 1 },
        ],
        adjustment_reason_required: true,
        sort_order: 1,
        active: true,
      },
    ],
  }
}

function createFreshVersion(userId: string, nextVersion: number): KpiSetVersion {
  return {
    id: `kpi_set_homies_v${nextVersion}_${Date.now()}`,
    set_id: 'kpi_set_main',
    version: nextVersion,
    name: `Chương trình đánh giá v${nextVersion}`,
    status: 'draft',
    primary_purpose: 'promotion',
    secondary_purposes: ['monthly_bonus', 'training'],
    program_setup_step: 'purpose',
    level_codes: ['pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader'],
    store_ids: 'all',
    effective_from: new Date().toISOString().slice(0, 10),
    score_scale: DEFAULT_KPI_POLICY.score_scale,
    groups: createStandard5Pillars(),
    created_by: userId,
    created_at: new Date().toISOString(),
  }
}

export default function KPISettingsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  const [database, setDatabase] = useState<KpiDatabase | null>(null)
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([])
  const [positions, setPositions] = useState<Array<{ id: string; name: string; level?: number }>>([])
  const [employees, setEmployees] = useState<
    Array<{ id: string; name: string; position_id: string; store_id: string }>
  >([])
  const [selectedVersionId, setSelectedVersionId] = useState('')
  const [activeGroupId, setActiveGroupId] = useState('')
  const [drawerCriterion, setDrawerCriterion] = useState<KpiCriterionDefinition | null>(null)
  const [saving, setSaving] = useState(false)

  // Advanced Panel State
  const [openAdvancedPanel, setOpenAdvancedPanel] = useState(false)
  const [advancedSection, setAdvancedSection] = useState<'criteria' | 'targets' | 'overrides' | 'single_stage'>('criteria')
  const [quickStartPendingVersionId, setQuickStartPendingVersionId] = useState<string | null>(null)

  // Floating Dropdown State
  const [openStoreDropdown, setOpenStoreDropdown] = useState(false)
  const storeDropdownRef = useRef<HTMLDivElement>(null)

  const databaseRef = useRef<KpiDatabase | null>(null)
  const saveQueueRef = useRef(Promise.resolve())

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(e.target as Node)) {
        setOpenStoreDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!user || !['ceo', 'hr_admin'].includes(user.role)) return

    let cancelled = false

    async function loadData() {
      const [dbData, storeList, positionList, employeeList] = await Promise.all([
        kpiAdapter.getDatabase(),
        storeAdapter.getStores(),
        MasterDataAdapter.getPositions(),
        employeeAdapter.getAllEmployees(user || undefined),
      ])
      if (cancelled) return

      setDatabase(dbData)
      databaseRef.current = dbData
      setStores(storeList.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
      setPositions(positionList.map((p: { id: string; name: string; level?: number }) => ({ id: p.id, name: p.name, level: p.level })))
      setEmployees(
        employeeList.map((e: { id: string; fullName?: string; name?: string; position_id?: string; store_id?: string }) => ({
          id: e.id,
          name: e.fullName || e.name || e.id,
          position_id: e.position_id || '',
          store_id: e.store_id || '',
        }))
      )
      const preferredVersion = dbData.sets.find((item: KpiSetVersion) => item.status === 'draft') ?? dbData.sets[0]
      setSelectedVersionId(preferredVersion?.id ?? '')
      setActiveGroupId(preferredVersion?.groups[0]?.id ?? '')
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (user && !['ceo', 'hr_admin'].includes(user.role)) router.push('/kpi')
  }, [router, user])

  const versions = useMemo(() => {
    if (!database) return []
    return [...database.sets].sort((left, right) => right.version - left.version)
  }, [database])

  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedVersionId),
    [selectedVersionId, versions]
  )

  const selectedGroup = selectedVersion?.groups.find((group) => group.id === activeGroupId) ?? selectedVersion?.groups[0]

  // Bước hiện tại của Wizard
  const currentProgramStep: KpiProgramSetupStep =
    selectedVersion?.status === 'published' ? 'review' : selectedVersion?.program_setup_step ?? 'purpose'

  // Các bước đã hoàn tất
  const completedProgramSteps = useMemo(() => {
    if (!selectedVersion) return []
    const list: KpiProgramSetupStep[] = []
    if (selectedVersion.primary_purpose) list.push('purpose')
    if (selectedVersion.position_ids && selectedVersion.position_ids.length > 0 && selectedVersion.template_id) list.push('scope')
    if (selectedVersion.source_policy && selectedVersion.source_policy.enabled_sources.length > 0) list.push('sources')
    if (selectedVersion.promotion_rule) list.push('readiness')
    return list
  }, [selectedVersion])

  // Tên chức danh áp dụng
  const positionNames = useMemo(() => {
    if (!selectedVersion?.position_ids) return []
    return selectedVersion.position_ids.map((id) => positions.find((p) => p.id === id)?.name || id)
  }, [selectedVersion, positions])

  const fromPositionName = positions.find((p) => p.id === selectedVersion?.promotion_rule?.from_position_id)?.name || 'Chức danh hiện tại'
  const toPositionName = positions.find((p) => p.id === selectedVersion?.promotion_rule?.to_position_id)?.name || 'Cấp tiếp theo'

  const scopedStoreIds = useMemo(() => {
    if (!selectedVersion) return []
    return selectedVersion.store_ids === 'all' ? stores.map((s) => s.id) : selectedVersion.store_ids
  }, [selectedVersion, stores])

  const programIssues = useMemo(() => {
    if (!selectedVersion) return []
    return validateProgramVersion(selectedVersion)
  }, [selectedVersion])

  const kpiIssues = useMemo(() => {
    if (!selectedVersion || !database) return []
    return validateKpiSet(selectedVersion, database.sets, scopedStoreIds)
  }, [selectedVersion, database, scopedStoreIds])

  const careerPositions: KpiCareerPositionSnapshot[] = useMemo(() => {
    return positions.map((p) => ({
      id: p.id,
      name: p.name,
      level: inferPositionLevel(p.name, p.id, p.level),
      job_family: inferJobFamily(p.name, p.id),
    }))
  }, [positions])

  const seedCareer = useMemo(() => buildHomiesCareerMapSeed(), [])

  const activeCareerMap = useMemo(() => {
    return selectEditableCareerMap({
      maps: database?.career_maps || [],
      livePositions: careerPositions,
      actorId: user?.id || 'admin',
      demoFallback: true,
    })
  }, [database?.career_maps, careerPositions, user?.id])

  const activeProfiles = useMemo(() => {
    if (database?.position_criteria_profiles && database.position_criteria_profiles.length > 0) {
      return database.position_criteria_profiles
    }
    return seedCareer.profiles
  }, [database?.position_criteria_profiles, seedCareer.profiles])

  const employeeCountByPosition = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const emp of employees) {
      if (emp.position_id) {
        counts[emp.position_id] = (counts[emp.position_id] || 0) + 1
      }
    }
    return counts
  }, [employees])

  async function persistDatabase(updater: (latest: KpiDatabase) => KpiDatabase) {
    const queuedSave = saveQueueRef.current.then(async () => {
      const latest = databaseRef.current
      if (!latest) return
      setSaving(true)
      try {
        const next = updater(latest)
        const optimistic = { ...next, revision: latest.revision + 1 }
        databaseRef.current = optimistic
        setDatabase(optimistic)
        const saved = await kpiAdapter.repository.save(optimistic, latest.revision)
        databaseRef.current = saved
        setDatabase(saved)
      } catch (error) {
        databaseRef.current = latest
        setDatabase(latest)
        toast.error(error instanceof Error ? error.message : 'Không thể lưu cấu hình KPI.')
        throw error
      } finally {
        setSaving(false)
      }
    })
    saveQueueRef.current = queuedSave.catch(() => undefined)
    return queuedSave
  }

  async function updateVersion(updater: (latestVersion: KpiSetVersion) => KpiSetVersion) {
    const targetVersionId = selectedVersionId
    const targetVersion = databaseRef.current?.sets.find((version) => version.id === targetVersionId)
    if (!targetVersion || !isKpiVersionEditable(targetVersion)) {
      toast.info('Bản đang áp dụng chỉ để xem. Hãy nhân bản thành bản nháp trước khi chỉnh sửa.')
      return
    }
    await persistDatabase((latest) => ({
      ...latest,
      sets: latest.sets.map((version) => (version.id === targetVersionId ? updater(version) : version)),
    }))
  }

  async function updateProgramMetadata(patch: Partial<KpiSetVersion>) {
    await updateVersion((latestVersion) => ({ ...latestVersion, ...patch }))
  }

  async function handleUpdateCareerAggregate({ map, profiles }: CareerMapAggregateChange) {
    await persistDatabase((latest) => {
      const existingMaps = latest.career_maps || []
      const nextMaps = existingMaps.some((m) => m.id === map.id)
        ? existingMaps.map((m) => (m.id === map.id ? map : m))
        : [map, ...existingMaps]

      let nextProfiles = latest.position_criteria_profiles || []
      if (profiles) {
        const profileMap = new Map(nextProfiles.map((p) => [p.id, p]))
        for (const p of profiles) {
          profileMap.set(p.id, p)
        }
        nextProfiles = Array.from(profileMap.values())
      }

      return {
        ...latest,
        career_maps: nextMaps,
        position_criteria_profiles: nextProfiles,
      }
    })
  }

  async function handleCreateSingleStageException(params: {
    sourcePositionId: string
    targetPositionId: string
    presetKey: Parameters<typeof createSingleStageExceptionDraft>[0]['promotion_preset']
    customMinScore: number
    customRequiredMonths: number
    storeIds: string[] | 'all'
    effectiveFrom: string
  }) {
    const draftRef = { current: null as KpiSetVersion | null }
    await persistDatabase((latest) => {
      const nextVersion = Math.max(0, ...latest.sets.map((version) => version.version)) + 1
      draftRef.current = createSingleStageExceptionDraft({
        positions: careerPositions,
        source_position_id: params.sourcePositionId,
        target_position_id: params.targetPositionId,
        promotion_preset: params.presetKey,
        custom_min_score_percent: params.customMinScore,
        custom_required_months: params.customRequiredMonths,
        store_ids: params.storeIds,
        valid_store_ids: stores.map((store) => store.id),
        effective_from: params.effectiveFrom,
        actor_id: user?.id || 'admin',
        at: new Date().toISOString(),
        version: nextVersion,
      })
      return { ...latest, sets: [draftRef.current, ...latest.sets] }
    })

    const draft = draftRef.current
    if (!draft) return
    setSelectedVersionId(draft.id)
    setActiveGroupId(draft.groups[0]?.id ?? '')
    toast.success('Đã tạo và lưu bản nháp ngoại lệ một chặng. Chưa ban hành.')
  }

  async function handleCreateSet() {
    if (!databaseRef.current) return
    const createdVersionRef = { current: null as KpiSetVersion | null }
    await persistDatabase((latest) => {
      const nextVersionNumber = Math.max(0, ...latest.sets.map((version) => version.version)) + 1
      createdVersionRef.current = createFreshVersion(user?.id || 'admin', nextVersionNumber)
      return { ...latest, sets: [createdVersionRef.current, ...latest.sets] }
    })
    const savedVersion = createdVersionRef.current
    if (!savedVersion) return
    setSelectedVersionId(savedVersion.id)
    setActiveGroupId(savedVersion.groups[0]?.id ?? '')
    toast.success('Đã tạo chương trình đánh giá mới.')
  }

  // Quick Start "Dùng nhanh bộ chuẩn Homies"
  async function handleQuickStart() {
    if (!selectedVersion) return
    const updated = prepareHomiesQuickStart(selectedVersion)

    await updateVersion(() => updated)
    if (updated.program_setup_step === 'scope') {
      setQuickStartPendingVersionId(selectedVersion.id)
      toast.info('Chỉ cần chọn bộ chuẩn, phạm vi và lộ trình để xem trước.')
      return
    }
    setQuickStartPendingVersionId(null)
    toast.success('Đã chuẩn bị bộ chuẩn Homies. Hãy xem lại trước khi áp dụng.')
  }

  async function handleScopeContinue() {
    if (!selectedVersion) return
    if (quickStartPendingVersionId !== selectedVersion.id) {
      await handleSelectProgramStep('sources')
      return
    }

    const updated = prepareHomiesQuickStart(selectedVersion)
    await updateVersion(() => updated)
    setQuickStartPendingVersionId(null)
    toast.success('Đã chuẩn bị bộ chuẩn Homies. Hãy xem lại trước khi áp dụng.')
  }

  async function handleSourcesContinue() {
    if (!selectedVersion) return
    const sourcePolicy =
      selectedVersion.source_policy ||
      getDefaultSourcePolicy(
        selectedVersion.primary_purpose || 'promotion',
        isManagerAudience ? 'manager' : 'employee'
      )
    await updateProgramMetadata({ source_policy: sourcePolicy, program_setup_step: 'readiness' })
  }

  async function handleSelectProgramStep(step: KpiProgramSetupStep) {
    if (!selectedVersion || step === currentProgramStep) return
    await updateProgramMetadata({ program_setup_step: step })
  }

  async function handlePublishVersion(mode: 'now' | 'scheduled') {
    if (!selectedVersion || !databaseRef.current || !user) return

    if (programIssues.length > 0 || kpiIssues.length > 0) {
      toast.error('Vui lòng khắc phục các điểm chưa hợp lệ trước khi phát hành.')
      return
    }

    if (mode === 'scheduled') {
      toast.info('Tính năng lên lịch phát hành sẽ hỗ trợ trong phiên bản tiếp theo.')
      return
    }

    try {
      const published = publishVersion(selectedVersion, user.id, new Date().toISOString())
      await updateVersion(() => published)
      toast.success('Đã công bố và áp dụng chương trình đánh giá thành công!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể phát hành chương trình.')
    }
  }

  async function handleCloneVersion() {
    if (!databaseRef.current || !selectedVersion) return
    const cloned = cloneAsNextDraft(selectedVersion, user?.id || 'admin', new Date().toISOString())
    cloned.name = `${selectedVersion.name} (Bản nháp v${cloned.version})`
    cloned.program_setup_step = 'review'
    await persistDatabase((latest) => ({ ...latest, sets: [cloned, ...latest.sets] }))
    setSelectedVersionId(cloned.id)
    setActiveGroupId(cloned.groups[0]?.id ?? '')
    toast.success('Đã nhân bản chương trình thành công.')
  }

  // Quản lý tiêu chí / nhóm trong Advanced
  async function handleUpdateGroup(groupId: string, patch: Partial<KpiGroupDefinition>) {
    if (!selectedVersion) return
    await updateVersion((latestVersion) => ({
      ...latestVersion,
      groups: latestVersion.groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
    }))
  }

  async function handleAddGroup() {
    if (!selectedVersion) return
    const createdGroupRef = { current: null as KpiGroupDefinition | null }
    await updateVersion((latestVersion) => {
      const nextGroup = createGroupDraft(latestVersion.groups.length + 1)
      createdGroupRef.current = nextGroup
      return { ...latestVersion, groups: [...latestVersion.groups, nextGroup] }
    })
    setActiveGroupId(createdGroupRef.current?.id ?? '')
    toast.success('Đã thêm trụ tiêu chí mới.')
  }

  async function handleDuplicateGroup(groupId: string) {
    if (!selectedVersion) return
    const clonedGroupRef = { current: null as KpiGroupDefinition | null }
    await updateVersion((latestVersion) => {
      const source = latestVersion.groups.find((group) => group.id === groupId)
      if (!source) return latestVersion

      const timestamp = Date.now()
      const cloneId = `${source.id}_copy_${timestamp}`
      const clonedGroup: KpiGroupDefinition = {
        ...structuredClone(source),
        id: cloneId,
        name: `${source.name} (Bản sao)`,
        sort_order: latestVersion.groups.length + 1,
        criteria: source.criteria.map((criterion, index) => ({
          ...structuredClone(criterion),
          id: `${criterion.id}_copy_${timestamp}_${index}`,
          group_id: cloneId,
        })),
      }

      clonedGroupRef.current = clonedGroup
      return { ...latestVersion, groups: [...latestVersion.groups, clonedGroup] }
    })
    if (clonedGroupRef.current) setActiveGroupId(clonedGroupRef.current.id)
    toast.success('Đã nhân bản trụ tiêu chí.')
  }

  async function handleDeleteGroup(groupId: string) {
    if (!selectedVersion) return
    if (selectedVersion.groups.length <= 1) {
      toast.error('Phải có ít nhất 1 trụ tiêu chí trong chương trình.')
      return
    }
    const fallbackGroupRef = { current: '' }
    await updateVersion((latestVersion) => {
      const nextGroups = latestVersion.groups.filter((group) => group.id !== groupId)
      fallbackGroupRef.current = nextGroups[0]?.id ?? ''
      return { ...latestVersion, groups: nextGroups }
    })
    if (activeGroupId === groupId) {
      setActiveGroupId(fallbackGroupRef.current)
    }
    toast.success('Đã xóa trụ tiêu chí.')
  }

  async function handleSaveCriterion(nextCriterion: KpiCriterionDefinition) {
    if (!selectedVersion || !selectedGroup) return

    const targetGroupId = selectedGroup.id
    await updateVersion((latestVersion) => ({
      ...latestVersion,
      groups: latestVersion.groups.map((group) => {
        if (group.id !== targetGroupId) return group
        const criterionExists = group.criteria.some((c) => c.id === nextCriterion.id)
        return {
          ...group,
          criteria: criterionExists
            ? group.criteria.map((criterion) => (criterion.id === nextCriterion.id ? nextCriterion : criterion))
            : [...group.criteria, nextCriterion],
        }
      }),
    }))
    setDrawerCriterion(null)
    toast.success('Đã lưu tiêu chí đánh giá.')
  }

  function handleAddCriterionToCurrentGroup() {
    if (!selectedGroup) return
    const newCrit: KpiCriterionDefinition = {
      id: `crit_${selectedGroup.id}_${Date.now()}`,
      group_id: selectedGroup.id,
      name: 'Tiêu chí mới',
      description: 'Mô tả chi tiết cách đánh giá.',
      scoring_mode: 'leader',
      weight: 10,
      score_bands: [
        { min: 95, max: null, score: 5 },
        { min: 85, max: 94.99, score: 4 },
        { min: 75, max: 84.99, score: 3 },
        { min: 65, max: 74.99, score: 2 },
        { min: 0, max: 64.99, score: 1 },
      ],
      adjustment_reason_required: true,
      sort_order: (selectedGroup.criteria?.length || 0) + 1,
      active: true,
    }
    setDrawerCriterion(newCrit)
  }

  async function handleUpdateStoreGroups(groups: KpiStoreGroup[]) {
    const targetVersionId = selectedVersionId
    await persistDatabase((latest) => ({
      ...latest,
      store_groups: groups,
      sets: latest.sets.map((version) =>
        version.id === targetVersionId
          ? {
              ...version,
              store_group_snapshots: groups
                .filter((group) => group.active)
                .map(({ id, name, store_ids }) => ({ id, name, store_ids: [...store_ids] })),
            }
          : version
      ),
    }))
  }

  async function handleUpdateTargetProfiles(profiles: KpiTargetProfile[]) {
    await updateVersion((latestVersion) => ({ ...latestVersion, target_profiles: profiles }))
  }

  async function handleUpdateOverrides(items: KpiStoreTargetOverride[]) {
    await updateVersion((latestVersion) => ({ ...latestVersion, target_overrides: items }))
  }

  function toggleStore(storeId: string) {
    if (!selectedVersion) return
    void updateVersion((latestVersion) => {
      if (latestVersion.store_ids === 'all') {
        return { ...latestVersion, store_ids: [storeId] }
      }
      const currentList = Array.isArray(latestVersion.store_ids) ? latestVersion.store_ids : []
      const exists = currentList.includes(storeId)
      let nextList: string[] | 'all' = exists ? currentList.filter((id) => id !== storeId) : [...currentList, storeId]
      if (nextList.length === 0) nextList = 'all'
      return { ...latestVersion, store_ids: nextList }
    })
  }

  if (!user || !['ceo', 'hr_admin'].includes(user.role)) {
    return null
  }

  if (!database || !selectedVersion) {
    return (
      <AppShell showNav className="w-full max-w-none bg-[#FFF8E8] min-h-screen">
        <div className="flex h-[70vh] items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm border border-gray-100">
            <Sparkles className="animate-spin text-[#2F6FA8]" size={20} />
            <span className="text-sm font-semibold text-gray-700">Đang tải chương trình đánh giá...</span>
          </div>
        </div>
      </AppShell>
    )
  }

  const storeCountText =
    selectedVersion.store_ids === 'all' ? `Toàn hệ thống (${stores.length} quán)` : `${selectedVersion.store_ids.length} Cửa hàng`

  const isManagerAudience =
    selectedVersion.template_id === 'shift_leader' || selectedVersion.template_id === 'store_manager'

  return (
    <AppShell showNav className="w-full max-w-none bg-[#FFF8E8] min-h-screen">
      {/* TẦNG 1: EXECUTIVE COMMAND HEADER */}
      <header className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <span>KPI &amp; Phát triển</span>
                <ChevronRight size={12} className="text-gray-400" />
                <span className="text-[#2F6FA8] font-bold">Chương Trình Đánh Giá</span>
              </div>
              <h1 className="text-lg font-bold text-[#001D3D] mt-0.5">
                Thiết Lập Chương Trình Đánh Giá &amp; Phát Triển Nhân Viên
              </h1>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                selectedVersion.status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {selectedVersion.status === 'published' ? <CheckCircle2 size={11} /> : null}
              {selectedVersion.status === 'published' ? 'Đang áp dụng' : 'Bản nháp'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-semibold ${saving ? 'text-amber-700' : 'text-emerald-700'}`}>
              {saving ? 'Đang lưu...' : 'Đã lưu'}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-white border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 h-8.5 px-3 shadow-2xs"
              icon={<SlidersHorizontal size={13} className="text-[#2F6FA8]" />}
              onClick={() => setOpenAdvancedPanel(true)}
              disabled={selectedVersion.status === 'published'}
              title={selectedVersion.status === 'published' ? 'Nhân bản chương trình để chỉnh sửa cấu hình' : undefined}
            >
              Cấu hình nâng cao
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 h-8.5 px-3"
              icon={<Copy size={13} className="text-gray-500" />}
              onClick={() => void handleCloneVersion()}
            >
              Nhân bản
            </Button>

            <Button
              type="button"
              size="sm"
              className="bg-[#2F6FA8] hover:bg-[#1D3E61] text-xs font-semibold text-white h-8.5 px-3"
              icon={<Plus size={13} />}
              onClick={() => void handleCreateSet()}
            >
              Tạo mới
            </Button>
          </div>
        </div>
      </header>

      {/* BODY CONTENT CONTAINER */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* THANH ĐIỀU HƯỚNG BƯỚC THIẾT LẬP (STEPPER) */}
        <KPIProgramStepper
          current={currentProgramStep}
          completed={completedProgramSteps}
          onSelect={(step) => void handleSelectProgramStep(step)}
        />

        {/* CONTEXT BAR NỔI (CHỌN PHIÊN BẢN & CỬA HÀNG) */}
        <section className="rounded-2xl border border-gray-100 bg-white px-5 py-2.5 shadow-2xs relative z-20">
          <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Dropdown chọn phiên bản chương trình */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-1.5 hover:border-gray-300 transition">
                <Calendar size={13} className="text-[#2F6FA8]" />
                <span className="text-gray-500 font-medium">Chương trình:</span>
                <select
                  value={selectedVersion.id}
                  onChange={(e) => {
                    const nextId = e.target.value
                    setSelectedVersionId(nextId)
                    setActiveGroupId(versions.find((v) => v.id === nextId)?.groups[0]?.id ?? '')
                  }}
                  className="bg-transparent font-bold text-[#001D3D] outline-none cursor-pointer pr-1"
                >
                  {versions.map((ver) => (
                    <option key={ver.id} value={ver.id}>
                      {ver.name} ({ver.status === 'published' ? 'Đang áp dụng' : 'Bản nháp'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown chọn phạm vi cửa hàng */}
              <div className="relative" ref={storeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setOpenStoreDropdown(!openStoreDropdown)}
                  disabled={selectedVersion.status === 'published'}
                  className={`flex items-center gap-1.5 border rounded-xl px-3 py-1.5 transition ${
                    openStoreDropdown
                      ? 'bg-blue-50/60 border-[#2F6FA8] text-[#2F6FA8]'
                      : 'bg-gray-50 border-gray-200/80 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Store size={13} className="text-[#2F6FA8]" />
                  <span className="text-gray-500 font-medium">Chi nhánh:</span>
                  <span className="font-bold text-[#001D3D]">{storeCountText}</span>
                  <ChevronDown size={12} className="text-gray-400 ml-0.5" />
                </button>

                {openStoreDropdown && (
                  <div className="absolute top-full left-0 mt-2 z-50 w-72 rounded-2xl bg-white p-3 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                      <span className="text-xs font-bold text-[#001D3D]">Chọn chi nhánh áp dụng</span>
                      <button
                        type="button"
                        onClick={() => void updateVersion((latestVersion) => ({ ...latestVersion, store_ids: 'all' }))}
                        className="text-[11px] font-bold text-[#2F6FA8] hover:underline"
                      >
                        [ Chọn tất cả ]
                      </button>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          void updateVersion((latestVersion) => ({ ...latestVersion, store_ids: 'all' }))
                          setOpenStoreDropdown(false)
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition ${
                          selectedVersion.store_ids === 'all'
                            ? 'bg-blue-50 text-[#2F6FA8] font-bold'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span>Toàn hệ thống ({stores.length} quán)</span>
                        {selectedVersion.store_ids === 'all' ? <Check size={14} className="text-[#2F6FA8]" /> : null}
                      </button>
                      {stores.map((st) => {
                        const isChecked =
                          selectedVersion.store_ids === 'all' ||
                          (Array.isArray(selectedVersion.store_ids) && selectedVersion.store_ids.includes(st.id))
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => toggleStore(st.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition ${
                              isChecked && selectedVersion.store_ids !== 'all'
                                ? 'bg-blue-50 text-[#2F6FA8] font-bold'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span>{st.name}</span>
                            {isChecked && selectedVersion.store_ids !== 'all' ? (
                              <Check size={14} className="text-[#2F6FA8]" />
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-500 font-medium">
              <span className="font-mono tabular-nums text-gray-600 font-bold">
                {selectedVersion.effective_from} → {selectedVersion.effective_to || 'Vô thời hạn'}
              </span>
            </div>
          </div>
        </section>

        {/* NỘI DUNG TỪNG BƯỚC WIZARD */}
        {currentProgramStep === 'purpose' && (
          <KPIProgramPurposeStep
            primaryPurpose={selectedVersion.primary_purpose}
            secondaryPurposes={selectedVersion.secondary_purposes || []}
            onChange={(primary, secondary) => {
              void updateProgramMetadata({
                primary_purpose: primary,
                secondary_purposes: secondary,
              })
            }}
            onQuickStart={() => void handleQuickStart()}
            onContinue={() => void handleSelectProgramStep('scope')}
          />
        )}

        {currentProgramStep === 'scope' && (
          <KPIProgramScopeStep
            positions={positions}
            stores={stores}
            positionIds={selectedVersion.position_ids || []}
            templateId={selectedVersion.template_id}
            storeIds={selectedVersion.store_ids}
            effectiveFrom={selectedVersion.effective_from}
            careerMap={activeCareerMap}
            careerProfiles={activeProfiles}
            employeeCountByPosition={employeeCountByPosition}
            onAggregateChange={(change) => void handleUpdateCareerAggregate(change)}
            onChange={(input) => {
              let updatedPromotionRule: KpiSetVersion['promotion_rule']

              if (input.from_position_id && input.to_position_id) {
                updatedPromotionRule = getDefaultPromotionRule(
                  input.from_position_id,
                  input.to_position_id,
                  'employee_to_leader'
                )
              }

              let nextGroups = selectedVersion.groups
              if (input.template_id && input.template_id !== selectedVersion.template_id) {
                nextGroups = structuredClone(getFnbTemplate(input.template_id).groups)
              }

              void updateVersion((latest) => ({
                ...latest,
                position_ids: input.position_ids,
                template_id: input.template_id,
                store_ids: input.store_ids,
                effective_from: input.effective_from,
                promotion_rule: updatedPromotionRule,
                groups: nextGroups,
              }))
            }}
            onBack={() => void handleSelectProgramStep('purpose')}
            onContinue={() => void handleScopeContinue()}
          />
        )}

            {currentProgramStep === 'sources' && (
              <KPIProgramSourcesStep
                policy={
                  selectedVersion.source_policy ||
                  getDefaultSourcePolicy(
                    selectedVersion.primary_purpose || 'promotion',
                    isManagerAudience ? 'manager' : 'employee'
                  )
                }
                peerReviewPolicy={
                  selectedVersion.peer_review_policy || getDefaultPeerReviewPolicy()
                }
                runtimeMode={peerReviewAdapter.getRuntimeMode()}
                purpose={selectedVersion.primary_purpose || 'promotion'}
                audience={isManagerAudience ? 'manager' : 'employee'}
                onChange={(policy) => {
                  void updateProgramMetadata({ source_policy: policy })
                }}
                onPeerReviewPolicyChange={(peerPolicy) => {
                  void updateProgramMetadata({ peer_review_policy: peerPolicy })
                }}
                onBack={() => void handleSelectProgramStep('scope')}
                onContinue={() => void handleSourcesContinue()}
              />
            )}

            {currentProgramStep === 'readiness' && (
              <KPIProgramReadinessStep
                rule={
                  selectedVersion.promotion_rule ||
                  getDefaultPromotionRule(
                    selectedVersion.position_ids?.[0] || 'senior_barista',
                    positions[1]?.id || 'shift_leader',
                    'employee_to_leader'
                  )
                }
                positionNames={{
                  from: fromPositionName,
                  to: toPositionName,
                }}
                onChange={(rule) => {
                  void updateProgramMetadata({ promotion_rule: rule })
                }}
                onUseRecommended={() => {
                  const defaultRule = getDefaultPromotionRule(
                    selectedVersion.promotion_rule?.from_position_id || selectedVersion.position_ids?.[0] || 'senior_barista',
                    selectedVersion.promotion_rule?.to_position_id || positions[1]?.id || 'shift_leader',
                    isManagerAudience ? 'supervisor_to_manager' : 'employee_to_leader'
                  )
                  void updateProgramMetadata({ promotion_rule: defaultRule })
                  toast.success('Đã áp dụng mức gợi ý chuẩn Homies.')
                }}
                onBack={() => void handleSelectProgramStep('sources')}
                onContinue={() => void handleSelectProgramStep('review')}
              />
            )}

            {currentProgramStep === 'review' && (
              <KPIProgramReviewStep
                version={selectedVersion}
                positionNames={positionNames}
                storeCount={stores.length}
                programIssues={programIssues}
                kpiIssues={kpiIssues}
                isPublished={selectedVersion.status === 'published'}
                onBack={() => void handleSelectProgramStep('readiness')}
                onSaveDraft={() => toast.success('Đã lưu bản nháp chương trình.')}
                onPublish={(mode) => void handlePublishVersion(mode)}
                onOpenAdvanced={() => {
                  if (selectedVersion.status === 'published') {
                    toast.info('Hãy nhân bản chương trình thành bản nháp trước khi chỉnh sửa.')
                    return
                  }
                  setOpenAdvancedPanel(true)
                }}
              />
            )}
      </main>

      {/* ADVANCED SETTINGS PANEL (DRAWER CHUYÊN SÂU) */}
      <KPIAdvancedSettingsPanel
        open={openAdvancedPanel}
        activeSection={advancedSection}
        onSectionChange={setAdvancedSection}
        onClose={() => setOpenAdvancedPanel(false)}
      >
        {advancedSection === 'criteria' && (
          <div className="space-y-4">
            <KPIGroupEditor
              groups={selectedVersion.groups}
              selectedGroupId={selectedGroup?.id ?? ''}
              onSelectGroup={setActiveGroupId}
              onAddGroup={() => void handleAddGroup()}
              onDuplicateGroup={(groupId) => void handleDuplicateGroup(groupId)}
              onDeleteGroup={(groupId) => void handleDeleteGroup(groupId)}
              onUpdateGroup={(groupId, patch) => void handleUpdateGroup(groupId, patch)}
            />

            {selectedGroup && (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Tiêu chí con của trụ</span>
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#2F6FA8]">
                        {selectedGroup.weight}% tổng
                      </span>
                    </div>
                    <h3 className="mt-0.5 text-base font-bold text-[#001D3D]">{selectedGroup.name}</h3>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-semibold h-8 px-3"
                    icon={<Plus size={13} />}
                    onClick={handleAddCriterionToCurrentGroup}
                  >
                    Thêm tiêu chí con
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {selectedGroup.criteria.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 text-center text-xs text-gray-500">
                      Chưa có tiêu chí con nào trong trụ này. Bấm nút &quot;Thêm tiêu chí con&quot; để tạo.
                    </div>
                  ) : (
                    selectedGroup.criteria.map((criterion) => (
                      <div
                        key={criterion.id}
                        className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-all hover:bg-white hover:border-gray-200 shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-[#001D3D]">{criterion.name}</h4>
                              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#2F6FA8]">
                                {criterion.scoring_mode === 'automatic'
                                  ? 'Tự động'
                                  : criterion.scoring_mode === 'leader'
                                  ? 'Leader chấm'
                                  : 'Kết hợp'}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-gray-600 leading-relaxed">
                              {criterion.description || 'Chưa có mô tả hướng dẫn.'}
                            </p>
                            {criterion.source_key && (
                              <p className="mt-1 text-[10px] font-mono text-gray-400">
                                Nguồn: {criterion.source_key}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Trọng số</span>
                              <span className="text-xs font-bold font-mono tabular-nums text-[#001D3D]">{criterion.weight}%</span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 h-7 px-2.5"
                              onClick={() => setDrawerCriterion(criterion)}
                            >
                              Chỉnh sửa
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {advancedSection === 'targets' && (
          <div className="space-y-4">
            <KPIStoreGroupPanel
              stores={stores}
              groups={database?.store_groups ?? []}
              onChange={(groups) => void handleUpdateStoreGroups(groups)}
            />
            <KPITargetMatrix
              version={selectedVersion}
              onChange={(profiles) => void handleUpdateTargetProfiles(profiles)}
            />
          </div>
        )}

        {advancedSection === 'overrides' && (
          <div className="space-y-4">
            <KPIStoreOverridePanel
              key={selectedVersion.id}
              version={selectedVersion}
              stores={stores}
              onChange={(items) => void handleUpdateOverrides(items)}
            />
          </div>
        )}

        {advancedSection === 'single_stage' && (
          <KPISingleStageExceptionPanel
            positions={positions}
            stores={stores}
            employees={employees}
            onCreateDraftException={handleCreateSingleStageException}
          />
        )}
      </KPIAdvancedSettingsPanel>

      {/* DRAWER CHỈNH SỬA TIÊU CHÍ CON */}
      {drawerCriterion && (
        <KPICriterionDrawer
          criterion={drawerCriterion}
          open={Boolean(drawerCriterion)}
          onClose={() => setDrawerCriterion(null)}
          onSave={(next) => void handleSaveCriterion(next)}
        />
      )}
    </AppShell>
  )
}
