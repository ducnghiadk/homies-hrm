// ============================================================================
// Kiểm tra lịch tuần trước khi CHỐT (chạy trên máy chủ, không thể bỏ qua bằng cách gọi thẳng API).
// File thuần TypeScript (không đụng fs/db) để kiểm thử được bằng node --test.
// ============================================================================

export interface PublishItem {
  employee_id: string
  employee_name?: string
  date: string // YYYY-MM-DD
  shift_id: string
  startMin: number
  endMin: number // có thể > 1440 nếu ca qua đêm
}

export interface PublishRule {
  rule_key: string
  warning_value: number
  block_value: number
  warning_level: 'info' | 'warning' | 'block' | string
  is_active: boolean
}

export interface PublishIssue {
  level: 'block' | 'warning'
  code: string
  employee_id: string
  employee_name?: string
  date?: string
  message: string
}

function dayIndex(ymd: string): number {
  return Math.floor(Date.parse(`${ymd}T00:00:00Z`) / 86_400_000)
}

function fmtDate(ymd: string): string {
  const [, m, d] = ymd.split('-')
  return `${d}/${m}`
}

/**
 * @param items Ca trong tuần sắp chốt của chi nhánh.
 * @param otherItems Ca đã có của cùng nhân viên ở chi nhánh/tuần khác (để bắt trùng giờ chéo chi nhánh).
 * @param inactiveEmployeeIds Nhân viên đã nghỉ / ngưng hoạt động.
 */
export function validateWeekForPublish(
  items: PublishItem[],
  options: { otherItems?: PublishItem[]; inactiveEmployeeIds?: string[]; rules?: PublishRule[] } = {}
): PublishIssue[] {
  const issues: PublishIssue[] = []
  const inactive = new Set(options.inactiveEmployeeIds || [])
  const rules = (options.rules || []).filter((r) => r.is_active)
  const ruleOf = (key: string) => rules.find((r) => r.rule_key === key)

  const byEmp = new Map<string, PublishItem[]>()
  for (const it of items) {
    const list = byEmp.get(it.employee_id) || []
    list.push(it)
    byEmp.set(it.employee_id, list)
  }

  for (const [empId, list] of byEmp) {
    const name = list[0].employee_name || empId

    if (inactive.has(empId)) {
      issues.push({
        level: 'block',
        code: 'inactive_employee',
        employee_id: empId,
        employee_name: name,
        message: `${name} đã nghỉ việc / ngưng hoạt động nhưng vẫn có ${list.length} ca trong lịch.`,
      })
    }

    // Trùng giờ (trong tuần này và với ca ở chi nhánh khác)
    const others = (options.otherItems || []).filter((o) => o.employee_id === empId)
    const reported = new Set<string>()
    for (let i = 0; i < list.length; i++) {
      const a = list[i]
      const pool = [...list.slice(i + 1), ...others]
      for (const b of pool) {
        if (a.date !== b.date || a === b) continue
        if (a.startMin < b.endMin && a.endMin > b.startMin) {
          const key = `${a.date}|${[a.shift_id, b.shift_id].sort().join('|')}`
          if (reported.has(key)) continue
          reported.add(key)
          issues.push({
            level: 'block',
            code: 'overlap',
            employee_id: empId,
            employee_name: name,
            date: a.date,
            message: `${name} bị xếp 2 ca trùng giờ ngày ${fmtDate(a.date)}.`,
          })
        }
      }
    }

    // Giờ/ngày
    const daily = ruleOf('max_daily_hours')
    if (daily) {
      const perDay = new Map<string, number>()
      for (const it of list) perDay.set(it.date, (perDay.get(it.date) || 0) + (it.endMin - it.startMin) / 60)
      for (const [date, hours] of perDay) {
        const isBlock = daily.warning_level === 'block' && hours > daily.block_value
        if (isBlock || hours > daily.warning_value) {
          issues.push({
            level: isBlock ? 'block' : 'warning',
            code: 'max_daily_hours',
            employee_id: empId,
            employee_name: name,
            date,
            message: `${name} làm ${Math.round(hours * 10) / 10} giờ ngày ${fmtDate(date)} (định mức ${daily.warning_value} giờ).`,
          })
        }
      }
    }

    // Giờ/tuần
    const weekHours = list.reduce((sum, it) => sum + (it.endMin - it.startMin) / 60, 0)
    const weekBlock = ruleOf('max_weekly_hours_block')
    const weekWarn = ruleOf('max_weekly_hours_warn')
    if (weekBlock && weekHours > weekBlock.block_value) {
      issues.push({
        level: weekBlock.warning_level === 'block' ? 'block' : 'warning',
        code: 'max_weekly_hours',
        employee_id: empId,
        employee_name: name,
        message: `${name} làm ${Math.round(weekHours * 10) / 10} giờ/tuần, vượt mức tối đa ${weekBlock.block_value} giờ.`,
      })
    } else if (weekWarn && weekHours > weekWarn.warning_value) {
      issues.push({
        level: 'warning',
        code: 'max_weekly_hours',
        employee_id: empId,
        employee_name: name,
        message: `${name} làm ${Math.round(weekHours * 10) / 10} giờ/tuần, vượt ngưỡng cảnh báo ${weekWarn.warning_value} giờ.`,
      })
    }

    // Nghỉ giữa ca tối và ca sáng hôm sau (đóng - mở quán)
    const clopening = ruleOf('clopening')
    if (clopening) {
      const sorted = [...list].sort((x, y) => dayIndex(x.date) * 1440 + x.startMin - (dayIndex(y.date) * 1440 + y.startMin))
      for (let i = 0; i + 1 < sorted.length; i++) {
        const a = sorted[i]
        const b = sorted[i + 1]
        if (dayIndex(b.date) - dayIndex(a.date) !== 1) continue
        const restHours = (1440 + b.startMin - a.endMin) / 60
        const isBlock = clopening.warning_level === 'block' && restHours < clopening.block_value
        if (isBlock || restHours < clopening.warning_value) {
          issues.push({
            level: isBlock ? 'block' : 'warning',
            code: 'clopening',
            employee_id: empId,
            employee_name: name,
            date: b.date,
            message: `${name} chỉ nghỉ ${Math.round(restHours * 10) / 10} giờ giữa ca ngày ${fmtDate(a.date)} và ca ngày ${fmtDate(b.date)}.`,
          })
        }
      }
    }
  }

  return issues
}
