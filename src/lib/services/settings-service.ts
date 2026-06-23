export type ScheduleCycleSettings = {
  registration_open_offset_days: number
  registration_deadline_offset_days: number
  auto_create_next_week: boolean
  reminder_before_deadline_hours: number
}

export type AutoAssignSettings = {
  enabled: boolean
  fallback_to_available: boolean
  notify_on_fallback: boolean
  max_shifts_per_employee_per_week: number
  min_rest_hours_between_shifts: number
  balance_workload: boolean
}

export type PublishRulesSettings = {
  publish_day: 'sunday' | 'saturday' | 'friday'
  auto_publish_on_deadline: boolean
  allow_republish: boolean
  notify_on_publish: boolean
}

export type ReleaseShiftSettings = {
  allow_release_after_publish: boolean
  release_requires_approval: boolean
  release_min_hours_before_shift: number
  release_auto_notify_store: boolean
}

export type OpenShiftSettings = {
  auto_approve: boolean
  requires_manager_approval: boolean
  max_claims_per_week: number
  display_all_stores: boolean
}

export type SwapRulesSettings = {
  requires_peer_approval: boolean
  requires_manager_approval: boolean
  min_hours_before_shift: number
  same_day_allowed: boolean
  cover_only_requires_manager: boolean
}

export type AttendanceSettings = {
  ot_approval_threshold_hours: number
  max_ot_hours_per_day: number
  late_grace_minutes: number
  early_leave_grace_minutes: number
}

export type SchedulingSettings = {
  SCHEDULE_CYCLE: ScheduleCycleSettings
  AUTO_ASSIGN: AutoAssignSettings
  PUBLISH_RULES: PublishRulesSettings
  RELEASE_SHIFT: ReleaseShiftSettings
  OPEN_SHIFT: OpenShiftSettings
  SWAP_RULES: SwapRulesSettings
  ATTENDANCE: AttendanceSettings
}

const SETTINGS_KEY = 'homies_scheduling_settings'

const DEFAULT_SETTINGS: SchedulingSettings = {
  SCHEDULE_CYCLE: {
    registration_open_offset_days: -7,
    registration_deadline_offset_days: -2,
    auto_create_next_week: true,
    reminder_before_deadline_hours: 24,
  },
  AUTO_ASSIGN: {
    enabled: true,
    fallback_to_available: true,
    notify_on_fallback: true,
    max_shifts_per_employee_per_week: 6,
    min_rest_hours_between_shifts: 12,
    balance_workload: true,
  },
  PUBLISH_RULES: {
    publish_day: 'sunday',
    auto_publish_on_deadline: false,
    allow_republish: false,
    notify_on_publish: true,
  },
  RELEASE_SHIFT: {
    allow_release_after_publish: true,
    release_requires_approval: true,
    release_min_hours_before_shift: 4,
    release_auto_notify_store: true,
  },
  OPEN_SHIFT: {
    auto_approve: false,
    requires_manager_approval: true,
    max_claims_per_week: 2,
    display_all_stores: false,
  },
  SWAP_RULES: {
    requires_peer_approval: true,
    requires_manager_approval: true,
    min_hours_before_shift: 4,
    same_day_allowed: false,
    cover_only_requires_manager: true,
  },
  ATTENDANCE: {
    ot_approval_threshold_hours: 2,
    max_ot_hours_per_day: 3,
    late_grace_minutes: 5,
    early_leave_grace_minutes: 5,
  },
}

function cloneDefaults(): SchedulingSettings {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as SchedulingSettings
}

function mergeStored(stored: Partial<SchedulingSettings> | null): SchedulingSettings {
  const defaults = cloneDefaults()
  if (!stored) return defaults

  return {
    SCHEDULE_CYCLE: { ...defaults.SCHEDULE_CYCLE, ...(stored.SCHEDULE_CYCLE || {}) },
    AUTO_ASSIGN: { ...defaults.AUTO_ASSIGN, ...(stored.AUTO_ASSIGN || {}) },
    PUBLISH_RULES: { ...defaults.PUBLISH_RULES, ...(stored.PUBLISH_RULES || {}) },
    RELEASE_SHIFT: { ...defaults.RELEASE_SHIFT, ...(stored.RELEASE_SHIFT || {}) },
    OPEN_SHIFT: { ...defaults.OPEN_SHIFT, ...(stored.OPEN_SHIFT || {}) },
    SWAP_RULES: { ...defaults.SWAP_RULES, ...(stored.SWAP_RULES || {}) },
    ATTENDANCE: { ...defaults.ATTENDANCE, ...(stored.ATTENDANCE || {}) },
  }
}

export class SettingsService {
  static getAllSettings(): SchedulingSettings {
    if (typeof window === 'undefined') return cloneDefaults()
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return cloneDefaults()

    try {
      return mergeStored(JSON.parse(raw) as Partial<SchedulingSettings>)
    } catch {
      return cloneDefaults()
    }
  }

  static saveAllSettings(settings: SchedulingSettings) {
    if (typeof window === 'undefined') return
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }

  static resetAllSettings() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(SETTINGS_KEY)
  }

  static getScheduleCycle(): ScheduleCycleSettings {
    return this.getAllSettings().SCHEDULE_CYCLE
  }

  static updateScheduleCycle(partial: Partial<ScheduleCycleSettings>) {
    const settings = this.getAllSettings()
    this.saveAllSettings({
      ...settings,
      SCHEDULE_CYCLE: {
        ...settings.SCHEDULE_CYCLE,
        ...partial,
      },
    })
  }

  static getAutoAssign(): AutoAssignSettings {
    return this.getAllSettings().AUTO_ASSIGN
  }

  static updateAutoAssign(partial: Partial<AutoAssignSettings>) {
    const settings = this.getAllSettings()
    this.saveAllSettings({
      ...settings,
      AUTO_ASSIGN: {
        ...settings.AUTO_ASSIGN,
        ...partial,
      },
    })
  }

  static getPublishRules(): PublishRulesSettings {
    return this.getAllSettings().PUBLISH_RULES
  }

  static getReleaseShift(): ReleaseShiftSettings {
    return this.getAllSettings().RELEASE_SHIFT
  }

  static getOpenShift(): OpenShiftSettings {
    return this.getAllSettings().OPEN_SHIFT
  }

  static getSwapRules(): SwapRulesSettings {
    return this.getAllSettings().SWAP_RULES
  }

  static getAttendance(): AttendanceSettings {
    return this.getAllSettings().ATTENDANCE
  }
}
