import type { OnboardingTemplateDiffSummary } from '@/lib/career-path-types'
import {
  getOnboardingChecklistItems,
  getOnboardingChecklistTemplateSnapshotById,
  getOnboardingContentTopics,
} from '@/lib/career-path-service'

export function buildOnboardingTemplateDiffSummary(
  templateId: string,
  baselineTemplateId: string | null,
): OnboardingTemplateDiffSummary {
  const current = getOnboardingChecklistTemplateSnapshotById(templateId)
  const baseline = baselineTemplateId ? getOnboardingChecklistTemplateSnapshotById(baselineTemplateId) : null
  const currentTopics = getOnboardingContentTopics(templateId)
  const baselineTopics = baseline ? getOnboardingContentTopics(baseline.id) : []
  const currentItems = getOnboardingChecklistItems(templateId)
  const baselineItems = baseline ? getOnboardingChecklistItems(baseline.id) : []
  const currentRequired = new Set(currentItems.filter((item) => item.is_required).map((item) => item.code))
  const baselineRequired = new Set(baselineItems.filter((item) => item.is_required).map((item) => item.code))
  const currentStages = new Set(currentItems.map((item) => item.stage_id))
  const baselineStages = new Set(baselineItems.map((item) => item.stage_id))

  return {
    template_id: templateId,
    baseline_template_id: baseline?.id ?? null,
    topic_added: Math.max(currentTopics.length - baselineTopics.length, 0),
    topic_removed: Math.max(baselineTopics.length - currentTopics.length, 0),
    item_added: Math.max(currentItems.length - baselineItems.length, 0),
    item_removed: Math.max(baselineItems.length - currentItems.length, 0),
    required_item_changed: [...new Set([...currentRequired, ...baselineRequired])].filter(
      (code) => currentRequired.has(code) !== baselineRequired.has(code),
    ).length,
    stage_changed: [...new Set([...currentStages, ...baselineStages])].filter(
      (stageId) => currentStages.has(stageId) !== baselineStages.has(stageId),
    ).length,
    journey_length_changed: Boolean(current && baseline && current.journey_length_days !== baseline.journey_length_days),
  }
}
