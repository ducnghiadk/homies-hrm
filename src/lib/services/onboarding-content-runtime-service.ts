import type {
  OnboardingChecklistItemTemplate,
  OnboardingStageCode,
} from '@/lib/career-path-types'
import {
  getOnboardingChecklistItems,
  getOnboardingChecklistStages,
  getOnboardingChecklistTemplateSnapshotById,
  getOnboardingContentTopics,
} from '@/lib/career-path-service'

export interface OnboardingRuntimeDayItem {
  id: string
  code: string
  title: string
  topicLabel: string
  stageCode: OnboardingStageCode
  estimatedMinutes: number
  isRequired: boolean
  isFocusBlockEligible: boolean
  opsVisibility: OnboardingChecklistItemTemplate['ops_visibility']
}

export interface OnboardingRuntimeDay {
  dayIndex: number
  title: string
  stageCode: OnboardingStageCode | null
  stageLabel: string
  focusItems: OnboardingRuntimeDayItem[]
  allItems: OnboardingRuntimeDayItem[]
}

export interface OnboardingRuntimeSummary {
  total_days: number
  total_items: number
  focus_days: number
}

const stageDayMap: Record<OnboardingStageCode, number[]> = {
  pre_start: [1],
  day_1: [1],
  day_2_3: [2, 3],
  day_4_7: [4, 5, 6, 7],
  week_2: [8, 9, 10, 11, 12, 13, 14],
}

export function buildOnboardingRuntimeDays(templateId: string): OnboardingRuntimeDay[] {
  const template = getOnboardingChecklistTemplateSnapshotById(templateId)
  if (!template) return []

  const journeyLength = Math.max(1, Math.min(template.journey_length_days || 14, 14))
  const stages = getOnboardingChecklistStages(templateId)
  const items = getOnboardingChecklistItems(templateId)
  const topicMap = new Map(getOnboardingContentTopics(templateId).map((topic) => [topic.id, topic.label]))

  const runtimeDays = Array.from({ length: journeyLength }, (_, index) => ({
    dayIndex: index + 1,
    title: `Ngay ${index + 1}`,
    stageCode: null as OnboardingStageCode | null,
    stageLabel: 'Chua gan stage',
    focusItems: [] as OnboardingRuntimeDayItem[],
    allItems: [] as OnboardingRuntimeDayItem[],
  }))

  stages.forEach((stage) => {
    const dayIndexes = (stageDayMap[stage.code] ?? []).filter((dayIndex) => dayIndex <= journeyLength)
    if (dayIndexes.length === 0) return

    const stageItems = items
      .filter((item) => item.stage_id === stage.id)
      .map((item) => ({
        id: item.id,
        code: item.code,
        title: item.title,
        topicLabel: topicMap.get(item.topic_id) ?? 'Khac',
        stageCode: stage.code,
        estimatedMinutes: item.estimated_minutes,
        isRequired: item.is_required,
        isFocusBlockEligible: item.is_focus_block_eligible,
        opsVisibility: item.ops_visibility,
      }))

    dayIndexes.forEach((dayIndex) => {
      const runtimeDay = runtimeDays[dayIndex - 1]
      runtimeDay.stageCode = stage.code
      runtimeDay.stageLabel = stage.label
      runtimeDay.allItems = stageItems
      runtimeDay.focusItems = stageItems.filter((item) => item.isFocusBlockEligible).slice(0, 3)
    })
  })

  return runtimeDays
}

export function buildOnboardingRuntimeSummary(templateId: string): OnboardingRuntimeSummary {
  const days = buildOnboardingRuntimeDays(templateId)

  return {
    total_days: days.length,
    total_items: days.reduce((sum, day) => sum + day.allItems.length, 0),
    focus_days: days.filter((day) => day.focusItems.length > 0).length,
  }
}
