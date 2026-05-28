// =============================================
// Schedule Generation History Service
// =============================================
// Quản lý lưu trữ, truy xuất, và so sánh các bản thảo xếp ca tự động (Generations)

import type { ScheduleResult } from '../mock-data-smart-schedule'
import { format } from 'date-fns'

type ScheduleResultWithPreferenceStats = ScheduleResult & {
  preferenceStats?: {
    matchRate?: number
  }
}

export interface GenerationCompareResult {
  versionA: number
  versionB: number
  costDiff: number // B - A
  hourDiff: number // B - A
  coverageDiff: number // B - A
  warningCountDiff: number // B - A
  preferenceMatchRateDiff?: number // B - A
}

/**
 * Get all generations for a given week from localStorage
 */
export function getScheduleGenerations(weekStart: string): ScheduleResult[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem('homies_schedule_generations')
  if (!data) return []
  try {
    const allGenerations: ScheduleResult[] = JSON.parse(data)
    // Filter by weekStart and sort by version or generatedAt desc
    return allGenerations
      .filter(g => g.weekStart === weekStart)
      .sort((a, b) => (b.version || 0) - (a.version || 0))
  } catch {
    return []
  }
}

/**
 * Save a new generation for a week
 */
export function saveScheduleGeneration(weekStart: string, schedule: ScheduleResult): ScheduleResult {
  if (typeof window === 'undefined') return schedule

  const allData = localStorage.getItem('homies_schedule_generations')
  let allGenerations: ScheduleResult[] = []
  
  try {
    if (allData) {
      allGenerations = JSON.parse(allData)
    }
  } catch {
    allGenerations = []
  }

  // Use max existing version to avoid reusing labels after deletions.
  const weekGenerations = allGenerations.filter(g => g.weekStart === weekStart)
  const nextVersion = weekGenerations.reduce((maxVersion, generation) => {
    return Math.max(maxVersion, generation.version || 0)
  }, 0) + 1
  
  const formattedTime = format(new Date(), 'HH:mm dd/MM')
  const updatedSchedule: ScheduleResult = {
    ...schedule,
    id: `sched-gen-${weekStart}-v${nextVersion}-${Date.now()}`,
    version: nextVersion,
    versionLabel: `Bản thảo v${nextVersion} (${formattedTime})`,
    generatedAt: new Date().toISOString()
  }

  // Push new schedule version to history
  allGenerations.push(updatedSchedule)
  localStorage.setItem('homies_schedule_generations', JSON.stringify(allGenerations))

  return updatedSchedule
}

/**
 * Compare two schedule generations (B vs A)
 */
export function compareGenerations(
  versionA: ScheduleResult,
  versionB: ScheduleResult
): GenerationCompareResult {
  const costDiff = versionB.stats.totalCost - versionA.stats.totalCost
  const hourDiff = versionB.stats.totalHours - versionA.stats.totalHours
  const coverageDiff = versionB.stats.coveragePercent - versionA.stats.coveragePercent
  const warningCountDiff = versionB.warnings.length - versionA.warnings.length

  const matchRateA = (versionA as ScheduleResultWithPreferenceStats).preferenceStats?.matchRate
  const matchRateB = (versionB as ScheduleResultWithPreferenceStats).preferenceStats?.matchRate
  
  const preferenceMatchRateDiff = (matchRateA !== undefined && matchRateB !== undefined)
    ? matchRateB - matchRateA
    : undefined

  return {
    versionA: versionA.version || 1,
    versionB: versionB.version || 2,
    costDiff,
    hourDiff,
    coverageDiff,
    warningCountDiff,
    preferenceMatchRateDiff,
  }
}

/**
 * Delete a specific generation by ID
 */
export function deleteScheduleGeneration(id: string): void {
  if (typeof window === 'undefined') return
  const data = localStorage.getItem('homies_schedule_generations')
  if (!data) return
  try {
    const allGenerations: ScheduleResult[] = JSON.parse(data)
    const filtered = allGenerations.filter(g => g.id !== id)
    localStorage.setItem('homies_schedule_generations', JSON.stringify(filtered))
  } catch {
    // Ignore error
  }
}
