// ============================================
// HRM Trà Sữa 🧋 — Schedule Rules Data Adapter
// Real Supabase DB & Mock Rules Synchronization
// ============================================

import { isRealDbMode } from './repository-config'
import { supabase } from '../supabase'
import {
  scheduleRules, ruleOverrides,
  saveRulesToStorage, resetRulesToDefault as resetMockDefaults,
  type ScheduleRule, type ScheduleRuleOverride, type WarningLevel, type RuleKey
} from '../mock-data-schedule-rules'

export interface DbScheduleRuleRow {
  id: string
  rule_key: string
  label: string
  description: string
  warning_value: number
  block_value: number
  warning_level: string
  is_active: boolean
}

export interface DbRuleOverrideRow {
  id: string
  rule_key: string
  position_id: string | null
  season_id: string | null
  override_warning: number
  override_block: number
}

export const scheduleRulesAdapter = {
  /**
   * Lấy danh sách tất cả Quy tắc xếp ca (Supabase DB -> LocalStorage -> Mock Data)
   */
  async getRules(): Promise<ScheduleRule[]> {
    if (isRealDbMode()) {
      try {
        const { data, error } = await supabase
          .from('quy_tac_xep_ca')
          .select('*')
          .order('rule_key', { ascending: true })

        if (!error && data && data.length > 0) {
          const rules: ScheduleRule[] = data.map((row: DbScheduleRuleRow) => ({
            id: row.id,
            rule_key: row.rule_key as RuleKey,
            label: row.label,
            description: row.description,
            warning_value: Number(row.warning_value || 0),
            block_value: Number(row.block_value || 0),
            warning_level: (row.warning_level || 'warning') as WarningLevel,
            is_active: Boolean(row.is_active),
          }))

          // Sync in-memory array
          scheduleRules.length = 0
          scheduleRules.push(...rules)
          saveRulesToStorage()
          return rules
        }
      } catch (err) {
        console.warn('[ScheduleRulesAdapter] Fetch rules fallback:', err)
      }
    }
    return scheduleRules
  },

  /**
   * Cập nhật 1 quy tắc (Supabase + Memory + LocalStorage)
   */
  async updateRule(
    ruleKey: RuleKey,
    updates: Partial<Pick<ScheduleRule, 'warning_value' | 'block_value' | 'warning_level' | 'is_active'>>
  ): Promise<void> {
    const target = scheduleRules.find(r => r.rule_key === ruleKey)
    if (target) {
      if (updates.warning_value !== undefined) target.warning_value = updates.warning_value
      if (updates.block_value !== undefined) target.block_value = updates.block_value
      if (updates.warning_level !== undefined) target.warning_level = updates.warning_level
      if (updates.is_active !== undefined) target.is_active = updates.is_active
    }

    saveRulesToStorage()

    if (isRealDbMode() && target) {
      try {
        await supabase
          .from('quy_tac_xep_ca')
          .upsert([{
            rule_key: ruleKey,
            label: target.label,
            description: target.description,
            warning_value: target.warning_value,
            block_value: target.block_value,
            warning_level: target.warning_level,
            is_active: target.is_active,
          }], { onConflict: 'rule_key' })
      } catch (err) {
        console.warn('[ScheduleRulesAdapter] Update rule DB fallback:', err)
      }
    }
  },

  /**
   * Lấy danh sách Ngoại lệ vị trí
   */
  async getOverrides(): Promise<ScheduleRuleOverride[]> {
    if (isRealDbMode()) {
      try {
        const { data, error } = await supabase
          .from('ngoai_le_quy_tac')
          .select('*')

        if (!error && data) {
          const overrides: ScheduleRuleOverride[] = data.map((row: DbRuleOverrideRow) => ({
            id: row.id,
            rule_key: row.rule_key as RuleKey,
            position_id: row.position_id,
            season_id: row.season_id,
            override_warning: Number(row.override_warning || 0),
            override_block: Number(row.override_block || 0),
          }))

          ruleOverrides.length = 0
          ruleOverrides.push(...overrides)
          saveRulesToStorage()
          return overrides
        }
      } catch (err) {
        console.warn('[ScheduleRulesAdapter] Fetch overrides fallback:', err)
      }
    }
    return ruleOverrides
  },

  /**
   * Thêm ngoại lệ vị trí
   */
  async addOverride(ruleKey: RuleKey, positionId: string, warnVal: number, blockVal: number): Promise<void> {
    const newOv: ScheduleRuleOverride = {
      id: `ov-${Date.now()}`,
      rule_key: ruleKey,
      position_id: positionId,
      season_id: null,
      override_warning: warnVal,
      override_block: blockVal,
    }
    ruleOverrides.push(newOv)
    saveRulesToStorage()

    if (isRealDbMode()) {
      try {
        await supabase
          .from('ngoai_le_quy_tac')
          .insert([{
            rule_key: ruleKey,
            position_id: positionId,
            override_warning: warnVal,
            override_block: blockVal,
          }])
      } catch (err) {
        console.warn('[ScheduleRulesAdapter] Add override DB fallback:', err)
      }
    }
  },

  /**
   * Xóa ngoại lệ vị trí
   */
  async removeOverride(id: string): Promise<void> {
    const idx = ruleOverrides.findIndex(o => o.id === id)
    if (idx !== -1) {
      ruleOverrides.splice(idx, 1)
      saveRulesToStorage()
    }

    if (isRealDbMode()) {
      try {
        await supabase.from('ngoai_le_quy_tac').delete().eq('id', id)
      } catch (err) {
        console.warn('[ScheduleRulesAdapter] Remove override DB fallback:', err)
      }
    }
  },

  /**
   * Lưu cố định tất cả quy tắc (upsert hàng loạt sang DB nếu chế độ DB bật)
   */
  async saveAllRules(): Promise<void> {
    saveRulesToStorage()

    if (isRealDbMode()) {
      try {
        const payload = scheduleRules.map(r => ({
          rule_key: r.rule_key,
          label: r.label,
          description: r.description,
          warning_value: r.warning_value,
          block_value: r.block_value,
          warning_level: r.warning_level,
          is_active: r.is_active,
        }))
        await supabase.from('quy_tac_xep_ca').upsert(payload, { onConflict: 'rule_key' })
      } catch (err) {
        console.warn('[ScheduleRulesAdapter] Save all DB fallback:', err)
      }
    }
  },

  /**
   * Mặc định lại toàn bộ quy tắc
   */
  async resetToDefault(): Promise<void> {
    resetMockDefaults()
    if (isRealDbMode()) {
      try {
        await this.saveAllRules()
      } catch (err) {
        console.warn('[ScheduleRulesAdapter] Reset DB fallback:', err)
      }
    }
  }
}
