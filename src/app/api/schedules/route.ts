import { NextRequest, NextResponse } from 'next/server'
import { getActiveUser, isScheduleManagerRole } from '@/lib/server/auth-helper'
import {
  getServerDb,
  saveServerDb,
  clearServerDbCache,
  normalizeStoreId,
  getCalendarWeekStart,
  getCalendarWeekEnd,
  isResignedEmployeeRecord,
  isFakeSeedShift,
  getOfficialScheduleSlotKey,
  getWeekMetaInDb,
  isWeekPublishedInDb,
  getShiftTimeRange,
  STANDARD_FNB_SHIFTS,
  type ServerDatabaseSchema,
  type ServerOfficialSchedule,
  type ServerScheduleWeekMeta,
  type ServerScheduleChangeLog,
} from '@/lib/server/db'

function ensureOfficialDbArrays(db: ServerDatabaseSchema) {
  if (!Array.isArray(db.official_schedules)) db.official_schedules = []
  if (!Array.isArray(db.schedule_weeks)) db.schedule_weeks = []
  if (!Array.isArray(db.schedule_change_logs)) db.schedule_change_logs = []
}

async function persistScheduleDb(db: ServerDatabaseSchema): Promise<{
  errorResponse: NextResponse | null
  cloudSynced: boolean
  cloudWarning?: string
}> {
  const saveRes = await saveServerDb(db)
  if (!saveRes.cloudSynced && saveRes.cloudRequired) {
    clearServerDbCache()
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          cloud_synced: false,
          error: saveRes.reason
            ? `Chưa lưu được lên kho đám mây (${saveRes.reason}). Vui lòng thử lại sau vài giây.`
            : 'Chưa lưu được lên kho đám mây. Vui lòng thử lại sau vài giây.',
        },
        { status: 503 }
      ),
      cloudSynced: false,
      cloudWarning: saveRes.reason,
    }
  }
  return {
    errorResponse: null,
    cloudSynced: saveRes.cloudSynced,
    cloudWarning: saveRes.reason,
  }
}

function resolveShiftDisplayName(
  db: ServerDatabaseSchema,
  shiftId: string,
  providedName?: string
): string {
  const clean = (providedName || '').trim()
  if (clean) return clean
  const tpl = (db.shift_templates || []).find((t) => t.id === shiftId || t.code === shiftId)
  if (tpl?.name) return tpl.name
  const std = STANDARD_FNB_SHIFTS[shiftId]
  if (std?.name) return std.name
  if (shiftId === 'shift-001') return 'Ca Sáng'
  if (shiftId === 'shift-002') return 'Ca Trưa'
  if (shiftId === 'shift-003') return 'Ca Tối'
  return shiftId
}

function isScheduleInStoreWeek(
  s: Pick<ServerOfficialSchedule, 'store_id' | 'date' | 'week_start_date'>,
  normStore: string,
  normWeekStart: string,
  normWeekEnd: string
): boolean {
  if (normalizeStoreId(s.store_id) !== normStore) return false
  if (getCalendarWeekStart(s.week_start_date || s.date) === normWeekStart) return true
  const d = (s.date || '').slice(0, 10)
  return d >= normWeekStart && d <= normWeekEnd
}

function upsertWeekMeta(
  db: ServerDatabaseSchema,
  params: {
    store_id: string
    week_start: string
    status?: 'draft' | 'published'
    actor_id?: string
    actor_name?: string
    source?: ServerScheduleWeekMeta['source']
    markModifiedAfterPublish?: boolean
  }
): ServerScheduleWeekMeta {
  ensureOfficialDbArrays(db)
  const normStore = normalizeStoreId(params.store_id)
  const normWeekStart = getCalendarWeekStart(params.week_start)
  const normWeekEnd = getCalendarWeekEnd(normWeekStart)
  const nowIso = new Date().toISOString()

  const idx = db.schedule_weeks!.findIndex(
    (w) => normalizeStoreId(w.store_id) === normStore && getCalendarWeekStart(w.week_start) === normWeekStart
  )

  const existing = idx >= 0 ? db.schedule_weeks![idx] : undefined
  const nextStatus: 'draft' | 'published' =
    params.status !== undefined
      ? params.status
      : existing?.status === 'published'
      ? 'published'
      : 'draft'

  const nextMeta: ServerScheduleWeekMeta = {
    ...existing,
    store_id: normStore,
    week_start: normWeekStart,
    week_end: normWeekEnd,
    status: nextStatus,
    updated_at: nowIso,
    updated_by: params.actor_id || existing?.updated_by || 'manager',
    ...(params.source ? { source: params.source } : {}),
    ...(nextStatus === 'published'
      ? {
          published_at: existing?.status === 'published' && existing.published_at ? existing.published_at : nowIso,
          published_by: existing?.status === 'published' && existing.published_by ? existing.published_by : (params.actor_id || 'manager'),
          published_by_name:
            existing?.status === 'published' && existing.published_by_name
              ? existing.published_by_name
              : params.actor_name,
        }
      : {
          published_at: undefined,
          published_by: undefined,
          published_by_name: undefined,
        }),
    ...(params.markModifiedAfterPublish ? { last_modified_after_publish_at: nowIso } : {}),
  }

  if (idx >= 0) {
    db.schedule_weeks![idx] = nextMeta
  } else {
    db.schedule_weeks!.push(nextMeta)
  }

  return nextMeta
}

function appendChangeLog(
  db: ServerDatabaseSchema,
  entry: Omit<ServerScheduleChangeLog, 'id' | 'changed_at'>
): ServerScheduleChangeLog {
  ensureOfficialDbArrays(db)
  const log: ServerScheduleChangeLog = {
    id: `sch-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    changed_at: new Date().toISOString(),
    ...entry,
    store_id: normalizeStoreId(entry.store_id),
    week_start: getCalendarWeekStart(entry.week_start),
  }
  db.schedule_change_logs!.unshift(log)
  if (db.schedule_change_logs!.length > 2000) {
    db.schedule_change_logs = db.schedule_change_logs!.slice(0, 2000)
  }
  return log
}

function sortOfficialSchedules(
  items: ServerOfficialSchedule[],
  db: ServerDatabaseSchema
): ServerOfficialSchedule[] {
  return [...items].sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date)
    if (dateDiff !== 0) return dateDiff
    const startA = getShiftTimeRange(a.shift_id, db.shift_templates).startMin
    const startB = getShiftTimeRange(b.shift_id, db.shift_templates).startMin
    if (startA !== startB) return startA - startB
    return (a.employee_name || a.employee_id).localeCompare(b.employee_name || b.employee_id, 'vi')
  })
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getActiveUser(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để xem lịch làm việc.' },
        { status: 401 }
      )
    }

    const isManager = isScheduleManagerRole(auth.role)
    const { searchParams } = req.nextUrl
    const storeIdParam = searchParams.get('store_id')
    const weekStartParam = searchParams.get('week_start') || searchParams.get('week_start_date')
    const fromDateParam = searchParams.get('from_date')
    const toDateParam = searchParams.get('to_date')
    const employeeIdParam = isManager ? searchParams.get('employee_id') : auth.userId
    const publishedOnly =
      !isManager ||
      searchParams.get('published_only') === '1' ||
      searchParams.get('published_only') === 'true'
    const includeMeta = isManager && searchParams.get('include_meta') !== '0'
    const includeLogs =
      isManager &&
      (searchParams.get('include_logs') === '1' || searchParams.get('include_logs') === 'true')

    const db = await getServerDb()
    ensureOfficialDbArrays(db)

    const normStoreFilter =
      storeIdParam && storeIdParam !== 'ALL' ? normalizeStoreId(storeIdParam) : null
    const effectiveWeekStart = weekStartParam
      ? getCalendarWeekStart(weekStartParam)
      : fromDateParam
      ? getCalendarWeekStart(fromDateParam)
      : undefined
    const rangeStart = fromDateParam?.slice(0, 10) || effectiveWeekStart
    const rangeEnd =
      toDateParam?.slice(0, 10) ||
      (weekStartParam ? getCalendarWeekEnd(getCalendarWeekStart(weekStartParam)) : undefined)

    let list = [...(db.official_schedules || [])]

    if (normStoreFilter) {
      list = list.filter((s) => normalizeStoreId(s.store_id) === normStoreFilter)
    }

    if (employeeIdParam) {
      list = list.filter((s) => s.employee_id === employeeIdParam)
    }

    if (rangeStart) {
      list = list.filter((s) => s.date >= rangeStart)
    }

    if (rangeEnd) {
      list = list.filter((s) => s.date <= rangeEnd)
    }

    if (publishedOnly) {
      // Lựa chọn A nghiêm ngặt: chỉ trả ca đã chốt thuộc tuần đã bấm Chốt Lịch Chính Thức trên Homies
      list = list.filter(
        (s) => s.status === 'published' && isWeekPublishedInDb(db, s.store_id, s.week_start_date)
      )
    }

    list = sortOfficialSchedules(list, db)

    let weekMeta: ServerScheduleWeekMeta | null = null
    let isWeekPublished = false

    if (effectiveWeekStart) {
      if (normStoreFilter) {
        weekMeta = getWeekMetaInDb(db, normStoreFilter, effectiveWeekStart) || null
        isWeekPublished = weekMeta?.status === 'published'
      } else if (employeeIdParam) {
        const emp = db.employees.find((e) => e.id === employeeIdParam)
        const homeStore = emp ? normalizeStoreId(emp.store_id) : 'store-001'
        const homeMeta = getWeekMetaInDb(db, homeStore, effectiveWeekStart) || null
        const publishedAssignmentStore = list.find(
          (s) => s.status === 'published' && isWeekPublishedInDb(db, s.store_id, s.week_start_date)
        )?.store_id
        if (publishedAssignmentStore) {
          weekMeta = getWeekMetaInDb(db, publishedAssignmentStore, effectiveWeekStart) || homeMeta
          isWeekPublished = true
        } else {
          weekMeta = homeMeta
          isWeekPublished = homeMeta?.status === 'published'
        }
      }
    }

    const weekMetas = includeMeta
      ? (db.schedule_weeks || []).filter(
          (w) => !normStoreFilter || normalizeStoreId(w.store_id) === normStoreFilter
        )
      : undefined

    const changeLogs = includeLogs
      ? (db.schedule_change_logs || [])
          .filter((log) => {
            if (normStoreFilter && normalizeStoreId(log.store_id) !== normStoreFilter) return false
            if (effectiveWeekStart && getCalendarWeekStart(log.week_start) !== effectiveWeekStart) {
              return false
            }
            return true
          })
          .slice(0, 200)
      : undefined

    return NextResponse.json({
      success: true,
      source: 'homies_official',
      count: list.length,
      is_week_published: isWeekPublished,
      week_meta: weekMeta,
      ...(includeMeta ? { week_metas: weekMetas } : {}),
      ...(includeLogs ? { change_logs: changeLogs } : {}),
      data: list,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi máy chủ khi tải lịch xếp ca'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getActiveUser(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để thao tác xếp lịch.' },
        { status: 401 }
      )
    }
    if (!isScheduleManagerRole(auth.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không đủ thẩm quyền: Chỉ Quản lý cửa hàng, Quản lý khu vực, HR hoặc CEO mới được xếp và chốt lịch.',
        },
        { status: 403 }
      )
    }

    const body = await req.json()
    const db = await getServerDb()
    ensureOfficialDbArrays(db)

    const action =
      !Array.isArray(body) && body && typeof body === 'object'
        ? String(body.action || '').trim()
        : 'upsert'

    const actorId = auth.userId
    const actorName =
      auth.employee?.full_name ||
      db.employees.find((e) => e.id === actorId)?.full_name ||
      auth.email ||
      actorId

    // 1. Chốt lịch chính thức toàn tuần
    if (action === 'publish_week') {
      const storeId = body.store_id ? normalizeStoreId(String(body.store_id)) : ''
      const weekStartRaw = String(body.week_start || body.week_start_date || '')
      if (!storeId || !weekStartRaw) {
        return NextResponse.json(
          { success: false, error: 'Thiếu store_id hoặc week_start để chốt lịch tuần.' },
          { status: 400 }
        )
      }

      const normWeekStart = getCalendarWeekStart(weekStartRaw)
      const normWeekEnd = getCalendarWeekEnd(normWeekStart)
      const nowIso = new Date().toISOString()

      // Nếu client truyền kèm danh sách sync_items chưa kịp lưu riêng lẻ, hợp nhất trước khi chốt
      if (Array.isArray(body.sync_items) && body.sync_items.length > 0) {
        for (const raw of body.sync_items) {
          if (!raw || typeof raw !== 'object') continue
          const empId = String(raw.employee_id || '')
          const date = String(raw.date || '').slice(0, 10)
          const shiftId = String(raw.shift_id || '')
          if (!empId || !date || !shiftId) continue
          if (isFakeSeedShift({ id: String(raw.id || ''), notes: String(raw.notes || '') })) continue
          const emp = db.employees.find((e) => e.id === empId)
          if (isResignedEmployeeRecord(empId, raw.employee_name || emp?.full_name)) continue

          const candidate: ServerOfficialSchedule = {
            id: String(raw.id || `sch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
            store_id: storeId,
            week_start_date: getCalendarWeekStart(date),
            date,
            employee_id: empId,
            employee_name: String(raw.employee_name || emp?.full_name || 'Nhân viên'),
            shift_id: shiftId,
            shift_name: resolveShiftDisplayName(db, shiftId, raw.shift_name),
            assigned_position_id: raw.assigned_position_id || raw.position_id || emp?.position_id || 'pos-001',
            status: 'published',
            notes: raw.notes ? String(raw.notes) : undefined,
            updated_by: actorId,
            updated_at: nowIso,
            created_at: String(raw.created_at || nowIso),
          }
          const slotKey = getOfficialScheduleSlotKey(candidate)
          const existingIdx = db.official_schedules!.findIndex(
            (s) => s.id === candidate.id || getOfficialScheduleSlotKey(s) === slotKey
          )
          if (existingIdx >= 0) {
            db.official_schedules![existingIdx] = {
              ...db.official_schedules![existingIdx],
              ...candidate,
              id: db.official_schedules![existingIdx].id,
            }
          } else {
            db.official_schedules!.push(candidate)
          }
        }
      }

      const publishedItems: ServerOfficialSchedule[] = []
      for (const s of db.official_schedules!) {
        if (isScheduleInStoreWeek(s, storeId, normWeekStart, normWeekEnd)) {
          s.status = 'published'
          s.week_start_date = normWeekStart
          s.updated_at = nowIso
          s.updated_by = actorId
          publishedItems.push(s)
        }
      }

      const weekMeta = upsertWeekMeta(db, {
        store_id: storeId,
        week_start: normWeekStart,
        status: 'published',
        actor_id: actorId,
        actor_name: actorName,
      })

      appendChangeLog(db, {
        store_id: storeId,
        week_start: normWeekStart,
        assignment_id: `publish-${storeId}-${normWeekStart}`,
        employee_id: actorId,
        employee_name: actorName,
        date: normWeekStart,
        action: 'publish',
        reason: `Chốt lịch chính thức tuần ${normWeekStart} (${publishedItems.length} ca)`,
        changed_by: actorId,
        changed_by_name: actorName,
      })

      const persisted = await persistScheduleDb(db)
      if (persisted.errorResponse) return persisted.errorResponse

      return NextResponse.json({
        success: true,
        cloud_synced: persisted.cloudSynced,
        ...(persisted.cloudWarning ? { cloud_warning: persisted.cloudWarning } : {}),
        message: `Đã chốt lịch chính thức tuần ${normWeekStart} (${publishedItems.length} ca).`,
        published_count: publishedItems.length,
        week_meta: weekMeta,
        data: sortOfficialSchedules(publishedItems, db),
      })
    }

    // 2. Mở khóa tuần về trạng thái Nháp
    if (action === 'unpublish_week') {
      const storeId = body.store_id ? normalizeStoreId(String(body.store_id)) : ''
      const weekStartRaw = String(body.week_start || body.week_start_date || '')
      if (!storeId || !weekStartRaw) {
        return NextResponse.json(
          { success: false, error: 'Thiếu store_id hoặc week_start.' },
          { status: 400 }
        )
      }

      const normWeekStart = getCalendarWeekStart(weekStartRaw)
      const normWeekEnd = getCalendarWeekEnd(normWeekStart)
      const nowIso = new Date().toISOString()

      for (const s of db.official_schedules!) {
        if (isScheduleInStoreWeek(s, storeId, normWeekStart, normWeekEnd)) {
          s.status = 'draft'
          s.updated_at = nowIso
          s.updated_by = actorId
        }
      }

      const weekMeta = upsertWeekMeta(db, {
        store_id: storeId,
        week_start: normWeekStart,
        status: 'draft',
        actor_id: actorId,
        actor_name: actorName,
      })

      appendChangeLog(db, {
        store_id: storeId,
        week_start: normWeekStart,
        assignment_id: `unpublish-${storeId}-${normWeekStart}`,
        employee_id: actorId,
        employee_name: actorName,
        date: normWeekStart,
        action: 'unpublish',
        reason: String(body.reason || 'Mở khóa tuần về bản nháp'),
        changed_by: actorId,
        changed_by_name: actorName,
      })

      const persisted = await persistScheduleDb(db)
      if (persisted.errorResponse) return persisted.errorResponse

      return NextResponse.json({
        success: true,
        cloud_synced: persisted.cloudSynced,
        ...(persisted.cloudWarning ? { cloud_warning: persisted.cloudWarning } : {}),
        message: 'Đã mở khóa tuần về trạng thái Bản Nháp.',
        week_meta: weekMeta,
      })
    }

    // 3. Điền nhanh từ Kho Lịch Rảnh (db.shifts) sang Bản Nháp Homies
    if (action === 'seed_from_availability') {
      const storeId = body.store_id ? normalizeStoreId(String(body.store_id)) : ''
      const weekStartRaw = String(body.week_start || body.week_start_date || '')
      const mode = body.mode === 'replace' ? 'replace' : 'merge'

      if (!storeId || !weekStartRaw) {
        return NextResponse.json(
          { success: false, error: 'Thiếu store_id hoặc week_start để nạp nháp từ lịch rảnh.' },
          { status: 400 }
        )
      }

      const normWeekStart = getCalendarWeekStart(weekStartRaw)
      const normWeekEnd = getCalendarWeekEnd(normWeekStart)

      if (isWeekPublishedInDb(db, storeId, normWeekStart)) {
        return NextResponse.json(
          {
            success: false,
            code: 'WEEK_ALREADY_PUBLISHED',
            error: 'Tuần này đã chốt lịch chính thức trên Homies, không thể nạp đè từ lịch rảnh.',
          },
          { status: 409 }
        )
      }

      const nowIso = new Date().toISOString()

      if (mode === 'replace') {
        db.official_schedules = db.official_schedules!.filter(
          (s) => !isScheduleInStoreWeek(s, storeId, normWeekStart, normWeekEnd)
        )
      }

      const existingKeys = new Set(db.official_schedules!.map((s) => getOfficialScheduleSlotKey(s)))
      const sourceAvailability = (db.shifts || []).filter((s) => {
        if (normalizeStoreId(s.store_id) !== storeId) return false
        if ((s.status || '').toUpperCase() === 'REJECTED') return false
        if (isFakeSeedShift(s) || isResignedEmployeeRecord(s.employee_id, s.employee_name)) {
          return false
        }
        const sDate = (s.date || '').slice(0, 10)
        return sDate >= normWeekStart && sDate <= normWeekEnd
      })

      let addedCount = 0
      for (const reg of sourceAvailability) {
        const matchedEmp = db.employees.find(
          (e) =>
            e.id === reg.employee_id ||
            (reg.employee_name &&
              e.full_name.trim().toLowerCase() === reg.employee_name.trim().toLowerCase())
        )
        if (matchedEmp && (matchedEmp.status === 'resigned' || matchedEmp.status === 'inactive')) {
          continue
        }

        const empId = matchedEmp?.id || reg.employee_id
        const empName = matchedEmp?.full_name || reg.employee_name || 'Nhân viên'
        if (isResignedEmployeeRecord(empId, empName)) continue

        const normDate = reg.date.slice(0, 10)
        const candidate: ServerOfficialSchedule = {
          id: `sch-draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          store_id: storeId,
          week_start_date: normWeekStart,
          date: normDate,
          employee_id: empId,
          employee_name: empName,
          shift_id: reg.shift_id,
          shift_name: resolveShiftDisplayName(db, reg.shift_id, reg.shift_name),
          assigned_position_id: reg.position_id || matchedEmp?.position_id || 'pos-001',
          status: 'draft',
          notes: reg.notes || undefined,
          updated_by: actorId,
          updated_at: nowIso,
          created_at: nowIso,
        }

        const slotKey = getOfficialScheduleSlotKey(candidate)
        if (existingKeys.has(slotKey)) continue
        existingKeys.add(slotKey)
        db.official_schedules!.push(candidate)
        addedCount++
      }

      const weekMeta = upsertWeekMeta(db, {
        store_id: storeId,
        week_start: normWeekStart,
        status: 'draft',
        actor_id: actorId,
        actor_name: actorName,
        source: 'seeded_from_availability',
      })

      if (addedCount > 0 || mode === 'replace') {
        appendChangeLog(db, {
          store_id: storeId,
          week_start: normWeekStart,
          assignment_id: `seed-${storeId}-${normWeekStart}`,
          employee_id: actorId,
          employee_name: actorName,
          date: normWeekStart,
          action: 'seed_draft',
          reason: `Điền nhanh ${addedCount} ca từ lịch rảnh vào Bản Nháp`,
          changed_by: actorId,
          changed_by_name: actorName,
        })
      }

      const persisted = await persistScheduleDb(db)
      if (persisted.errorResponse) return persisted.errorResponse

      const weekSchedules = sortOfficialSchedules(
        db.official_schedules!.filter((s) =>
          isScheduleInStoreWeek(s, storeId, normWeekStart, normWeekEnd)
        ),
        db
      )

      return NextResponse.json({
        success: true,
        cloud_synced: persisted.cloudSynced,
        ...(persisted.cloudWarning ? { cloud_warning: persisted.cloudWarning } : {}),
        message:
          addedCount > 0
            ? `Đã nạp ${addedCount} ca từ lịch rảnh vào Bản Nháp.`
            : 'Không có thêm ca rảnh mới cần điền vào Bản Nháp.',
        added_count: addedCount,
        total_week_count: weekSchedules.length,
        week_meta: weekMeta,
        data: weekSchedules,
      })
    }

    // 4. Thay thế toàn bộ ca Nháp của 1 tuần (dùng cho Import Excel / Copy tuần / Smart Scheduler)
    if (action === 'replace_week_draft') {
      const storeId = body.store_id ? normalizeStoreId(String(body.store_id)) : ''
      const weekStartRaw = String(body.week_start || body.week_start_date || '')
      const rawItems = Array.isArray(body.items) ? body.items : []

      if (!storeId || !weekStartRaw) {
        return NextResponse.json(
          { success: false, error: 'Thiếu store_id hoặc week_start để thay thế bản nháp tuần.' },
          { status: 400 }
        )
      }

      const normWeekStart = getCalendarWeekStart(weekStartRaw)
      const normWeekEnd = getCalendarWeekEnd(normWeekStart)

      if (isWeekPublishedInDb(db, storeId, normWeekStart)) {
        return NextResponse.json(
          {
            success: false,
            code: 'WEEK_ALREADY_PUBLISHED',
            error: 'Tuần này đã chốt lịch chính thức, không thể ghi đè toàn bộ tuần.',
          },
          { status: 409 }
        )
      }

      const nowIso = new Date().toISOString()
      db.official_schedules = db.official_schedules!.filter(
        (s) => !isScheduleInStoreWeek(s, storeId, normWeekStart, normWeekEnd)
      )

      const slotKeys = new Set<string>()
      const added: ServerOfficialSchedule[] = []

      for (const raw of rawItems) {
        if (!raw || typeof raw !== 'object') continue
        const empId = String(raw.employee_id || '')
        const date = String(raw.date || '').slice(0, 10)
        const shiftId = String(raw.shift_id || '')
        if (!empId || !date || !shiftId) continue
        if (isFakeSeedShift({ id: String(raw.id || ''), notes: String(raw.notes || '') })) continue

        const emp = db.employees.find((e) => e.id === empId)
        if (isResignedEmployeeRecord(empId, raw.employee_name || emp?.full_name)) continue

        const candidate: ServerOfficialSchedule = {
          id: String(raw.id || `sch-draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
          store_id: storeId,
          week_start_date: normWeekStart,
          date,
          employee_id: empId,
          employee_name: String(raw.employee_name || emp?.full_name || 'Nhân viên'),
          shift_id: shiftId,
          shift_name: resolveShiftDisplayName(db, shiftId, raw.shift_name),
          assigned_position_id: raw.assigned_position_id || raw.position_id || emp?.position_id || 'pos-001',
          status: 'draft',
          notes: raw.notes ? String(raw.notes) : undefined,
          updated_by: actorId,
          updated_at: nowIso,
          created_at: nowIso,
        }

        const slotKey = getOfficialScheduleSlotKey(candidate)
        if (slotKeys.has(slotKey)) continue
        slotKeys.add(slotKey)
        db.official_schedules!.push(candidate)
        added.push(candidate)
      }

      const source =
        body.source === 'imported_excel' || body.source === 'copied_week'
          ? body.source
          : 'manual'
      const weekMeta = upsertWeekMeta(db, {
        store_id: storeId,
        week_start: normWeekStart,
        status: 'draft',
        actor_id: actorId,
        actor_name: actorName,
        source,
      })

      const persisted = await persistScheduleDb(db)
      if (persisted.errorResponse) return persisted.errorResponse

      return NextResponse.json({
        success: true,
        cloud_synced: persisted.cloudSynced,
        ...(persisted.cloudWarning ? { cloud_warning: persisted.cloudWarning } : {}),
        message: `Đã lưu ${added.length} ca vào Bản Nháp tuần ${normWeekStart}.`,
        count: added.length,
        week_meta: weekMeta,
        data: sortOfficialSchedules(added, db),
      })
    }

    // 5. Cập nhật metadata Bản Nháp tuần
    if (action === 'save_draft_meta') {
      const storeId = body.store_id ? normalizeStoreId(String(body.store_id)) : ''
      const weekStartRaw = String(body.week_start || body.week_start_date || '')
      if (!storeId || !weekStartRaw) {
        return NextResponse.json(
          { success: false, error: 'Thiếu store_id hoặc week_start.' },
          { status: 400 }
        )
      }
      const weekMeta = upsertWeekMeta(db, {
        store_id: storeId,
        week_start: getCalendarWeekStart(weekStartRaw),
        actor_id: actorId,
        actor_name: actorName,
      })
      const persisted = await persistScheduleDb(db)
      if (persisted.errorResponse) return persisted.errorResponse
      return NextResponse.json({
        success: true,
        cloud_synced: persisted.cloudSynced,
        ...(persisted.cloudWarning ? { cloud_warning: persisted.cloudWarning } : {}),
        week_meta: weekMeta,
      })
    }

    // 6. Upsert 1 ca đơn lẻ hoặc mảng ca (action: 'upsert' / mặc định)
    const rawItems: Array<Record<string, unknown>> = Array.isArray(body)
      ? body
      : Array.isArray(body?.items)
      ? body.items
      : body && typeof body === 'object'
      ? [body]
      : []

    if (rawItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không có dữ liệu ca xếp lịch hợp lệ.' },
        { status: 400 }
      )
    }

    const nowIso = new Date().toISOString()
    const saved: ServerOfficialSchedule[] = []
    let latestWeekMeta: ServerScheduleWeekMeta | null = null

    for (const item of rawItems) {
      if (!item || typeof item !== 'object') continue
      const empId = String(item.employee_id || '')
      const dateRaw = String(item.date || '')
      const shiftId = String(item.shift_id || '')
      const itemId = item.id ? String(item.id) : ''
      const notes = item.notes ? String(item.notes) : ''

      if (isFakeSeedShift({ id: itemId, notes })) {
        return NextResponse.json(
          { success: false, error: 'Không cho phép lưu ca giả lập (sch-seed).' },
          { status: 400 }
        )
      }

      if (!empId || !dateRaw || !shiftId) {
        return NextResponse.json(
          { success: false, error: 'Thiếu thông tin bắt buộc (employee_id, date, shift_id).' },
          { status: 400 }
        )
      }

      const emp = db.employees.find((e) => e.id === empId)
      const empName = String(item.employee_name || emp?.full_name || 'Nhân viên')
      if (isResignedEmployeeRecord(empId, empName)) {
        return NextResponse.json(
          { success: false, error: `Nhân sự ${empName} đã nghỉ việc, không thể xếp ca.` },
          { status: 400 }
        )
      }

      const normDate = dateRaw.slice(0, 10)
      const normWeekStart = getCalendarWeekStart(normDate)
      const normStore = normalizeStoreId(String(item.store_id || emp?.store_id || 'store-001'))
      const published = isWeekPublishedInDb(db, normStore, normWeekStart)
      const reason = String(item.change_reason || body.change_reason || '').trim()

      if (published && !reason) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cần nhập lý do thay đổi khi chỉnh sửa lịch đã chốt chính thức.',
          },
          { status: 400 }
        )
      }

      const replaceId = item.replace_schedule_id ? String(item.replace_schedule_id) : ''
      const candidateForKey: ServerOfficialSchedule = {
        id: itemId || `sch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        store_id: normStore,
        week_start_date: normWeekStart,
        date: normDate,
        employee_id: empId,
        employee_name: empName,
        shift_id: shiftId,
        shift_name: resolveShiftDisplayName(db, shiftId, item.shift_name ? String(item.shift_name) : undefined),
        assigned_position_id: String(
          item.assigned_position_id || item.position_id || emp?.position_id || 'pos-001'
        ),
        status: published ? 'published' : 'draft',
        notes: notes || undefined,
        ...(published ? { modified_after_publish: true, change_reason: reason } : {}),
        updated_by: actorId,
        updated_at: nowIso,
        created_at: String(item.created_at || nowIso),
      }

      const slotKey = getOfficialScheduleSlotKey(candidateForKey)
      let existingIdx = -1
      if (replaceId) {
        existingIdx = db.official_schedules!.findIndex((s) => s.id === replaceId)
      }
      if (existingIdx === -1 && itemId) {
        existingIdx = db.official_schedules!.findIndex((s) => s.id === itemId)
      }
      if (existingIdx === -1) {
        existingIdx = db.official_schedules!.findIndex((s) => getOfficialScheduleSlotKey(s) === slotKey)
      }

      const beforeState = existingIdx >= 0 ? { ...db.official_schedules![existingIdx] } : null
      const finalRecord: ServerOfficialSchedule =
        existingIdx >= 0
          ? {
              ...db.official_schedules![existingIdx],
              ...candidateForKey,
              id: db.official_schedules![existingIdx].id,
              created_at: db.official_schedules![existingIdx].created_at || nowIso,
            }
          : candidateForKey

      if (existingIdx >= 0) {
        db.official_schedules![existingIdx] = finalRecord
      } else {
        db.official_schedules!.push(finalRecord)
      }

      saved.push(finalRecord)

      latestWeekMeta = upsertWeekMeta(db, {
        store_id: normStore,
        week_start: normWeekStart,
        actor_id: actorId,
        actor_name: actorName,
        markModifiedAfterPublish: published,
      })

      if (published) {
        appendChangeLog(db, {
          store_id: normStore,
          week_start: normWeekStart,
          assignment_id: finalRecord.id,
          employee_id: finalRecord.employee_id,
          employee_name: finalRecord.employee_name,
          date: finalRecord.date,
          shift_id: finalRecord.shift_id,
          action: beforeState ? 'update' : 'create',
          reason,
          changed_by: actorId,
          changed_by_name: actorName,
          before_state: beforeState,
          after_state: { ...finalRecord },
        })
      }
    }

    const persisted = await persistScheduleDb(db)
    if (persisted.errorResponse) return persisted.errorResponse

    const isBatchPayload = Array.isArray(body) || Array.isArray(body?.items)
    return NextResponse.json({
      success: true,
      cloud_synced: persisted.cloudSynced,
      ...(persisted.cloudWarning ? { cloud_warning: persisted.cloudWarning } : {}),
      message: `Đã lưu ${saved.length} ca vào lịch Homies.`,
      count: saved.length,
      week_meta: latestWeekMeta,
      data: isBatchPayload ? saved : saved[0],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi máy chủ khi lưu lịch xếp ca'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getActiveUser(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để gỡ ca làm việc.' },
        { status: 401 }
      )
    }
    if (!isScheduleManagerRole(auth.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không đủ thẩm quyền: Chỉ Quản lý cửa hàng, Quản lý khu vực, HR hoặc CEO mới được xóa lịch ca.',
        },
        { status: 403 }
      )
    }

    const { searchParams } = req.nextUrl
    let body: Record<string, unknown> = {}
    try {
      const raw = await req.text()
      if (raw.trim()) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          body = parsed as Record<string, unknown>
        }
      }
    } catch {
      body = {}
    }

    const db = await getServerDb()
    ensureOfficialDbArrays(db)

    const scope = String(searchParams.get('scope') || body.scope || '').trim()

    // Chế độ A: Xóa toàn bộ ca nháp của 1 tuần
    if (scope === 'draft_week') {
      const storeIdRaw = String(searchParams.get('store_id') || body.store_id || '')
      const weekStartRaw = String(
        searchParams.get('week_start') ||
          searchParams.get('week_start_date') ||
          body.week_start ||
          body.week_start_date ||
          ''
      )
      if (!storeIdRaw || !weekStartRaw) {
        return NextResponse.json(
          { success: false, error: 'Thiếu store_id hoặc week_start để xóa tuần nháp.' },
          { status: 400 }
        )
      }

      const normStore = normalizeStoreId(storeIdRaw)
      const normWeekStart = getCalendarWeekStart(weekStartRaw)
      const normWeekEnd = getCalendarWeekEnd(normWeekStart)

      if (isWeekPublishedInDb(db, normStore, normWeekStart)) {
        return NextResponse.json(
          {
            success: false,
            code: 'WEEK_ALREADY_PUBLISHED',
            error: 'Tuần này đã chốt lịch chính thức, không thể xóa trắng cả tuần.',
          },
          { status: 409 }
        )
      }

      const prevCount = db.official_schedules!.length
      db.official_schedules = db.official_schedules!.filter(
        (s) => !isScheduleInStoreWeek(s, normStore, normWeekStart, normWeekEnd)
      )
      const removedCount = prevCount - db.official_schedules.length

      const cleanMeta =
        searchParams.get('clean_meta') === '1' ||
        searchParams.get('clean_meta') === 'true' ||
        body.clean_meta === true

      if (cleanMeta) {
        db.schedule_weeks = db.schedule_weeks!.filter(
          (w) =>
            !(
              normalizeStoreId(w.store_id) === normStore &&
              getCalendarWeekStart(w.week_start) === normWeekStart &&
              w.status !== 'published'
            )
        )
        db.schedule_change_logs = db.schedule_change_logs!.filter(
          (l) =>
            !(
              normalizeStoreId(l.store_id) === normStore &&
              getCalendarWeekStart(l.week_start) === normWeekStart
            )
        )
      }

      const persisted = await persistScheduleDb(db)
      if (persisted.errorResponse) return persisted.errorResponse

      return NextResponse.json({
        success: true,
        cloud_synced: persisted.cloudSynced,
        ...(persisted.cloudWarning ? { cloud_warning: persisted.cloudWarning } : {}),
        message: `Đã xóa ${removedCount} ca nháp của tuần ${normWeekStart}.`,
        removed_count: removedCount,
      })
    }

    // Chế độ B: Xóa đúng 1 ca cụ thể theo id hoặc bộ 4 khóa (store_id, employee_id, date, shift_id)
    const idParam = String(searchParams.get('id') || body.id || '').trim()
    const storeIdParam = String(searchParams.get('store_id') || body.store_id || '').trim()
    const employeeIdParam = String(searchParams.get('employee_id') || body.employee_id || '').trim()
    const dateParam = String(searchParams.get('date') || body.date || '').trim().slice(0, 10)
    const shiftIdParam = String(
      searchParams.get('shift_id') || searchParams.get('shiftId') || body.shift_id || body.shiftId || ''
    ).trim()
    const reason = String(
      searchParams.get('reason') || searchParams.get('change_reason') || body.reason || body.change_reason || ''
    ).trim()
    const actorId = auth.userId
    const actorName =
      auth.employee?.full_name ||
      db.employees.find((e) => e.id === actorId)?.full_name ||
      auth.email ||
      actorId

    if (!idParam && (!storeIdParam || !employeeIdParam || !dateParam || !shiftIdParam)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Thiếu thông tin xác định ca cần xóa. Phải truyền id hoặc đủ 4 khóa: store_id, employee_id, date, shift_id.',
        },
        { status: 400 }
      )
    }

    let targetIdx = -1
    if (idParam) {
      targetIdx = db.official_schedules!.findIndex((s) => s.id === idParam)
    }
    if (targetIdx === -1 && storeIdParam && employeeIdParam && dateParam && shiftIdParam) {
      const normStore = normalizeStoreId(storeIdParam)
      targetIdx = db.official_schedules!.findIndex(
        (s) =>
          normalizeStoreId(s.store_id) === normStore &&
          s.employee_id === employeeIdParam &&
          s.date === dateParam &&
          s.shift_id === shiftIdParam
      )
      if (targetIdx === -1) {
        const expectedSlotKey = getOfficialScheduleSlotKey({
          store_id: normStore,
          employee_id: employeeIdParam,
          date: dateParam,
          shift_id: shiftIdParam,
        })
        targetIdx = db.official_schedules!.findIndex(
          (s) => getOfficialScheduleSlotKey(s) === expectedSlotKey
        )
      }
    }

    if (targetIdx === -1) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy ca phân công cần xóa.' },
        { status: 404 }
      )
    }

    const target = db.official_schedules![targetIdx]
    const published = isWeekPublishedInDb(db, target.store_id, target.week_start_date)

    if (published && !reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cần nhập lý do thay đổi khi gỡ ca trong tuần đã chốt chính thức.',
        },
        { status: 400 }
      )
    }

    const [removed] = db.official_schedules!.splice(targetIdx, 1)

    if (published) {
      upsertWeekMeta(db, {
        store_id: removed.store_id,
        week_start: removed.week_start_date,
        actor_id: actorId,
        actor_name: actorName,
        markModifiedAfterPublish: true,
      })

      appendChangeLog(db, {
        store_id: removed.store_id,
        week_start: removed.week_start_date,
        assignment_id: removed.id,
        employee_id: removed.employee_id,
        employee_name: removed.employee_name,
        date: removed.date,
        shift_id: removed.shift_id,
        action: 'cancel',
        reason,
        changed_by: actorId,
        changed_by_name: actorName,
        before_state: { ...removed },
        after_state: null,
      })
    }

    const persisted = await persistScheduleDb(db)
    if (persisted.errorResponse) return persisted.errorResponse

    const remainingSameDay = db.official_schedules!.filter(
      (s) => s.employee_id === removed.employee_id && s.date === removed.date
    ).length

    return NextResponse.json({
      success: true,
      cloud_synced: persisted.cloudSynced,
      ...(persisted.cloudWarning ? { cloud_warning: persisted.cloudWarning } : {}),
      message: `Đã xóa ca ${removed.shift_name || removed.shift_id} ngày ${removed.date}.`,
      deleted_id: removed.id,
      remaining_same_day: remainingSameDay,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi máy chủ khi xóa ca phân công'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

