'use client'

import { Copy, Minus, Plus, Sparkles } from 'lucide-react'
import { useMemo } from 'react'

import { suggestScoreBands } from '@/lib/kpi/target-policy-service'
import type { KpiCriterionTarget, KpiSetVersion, KpiTargetProfile } from '@/lib/kpi/types'

export type KPITargetMatrixProps = { version: KpiSetVersion; onChange(profiles: KpiTargetProfile[]): void }

export function KPITargetMatrix({ version, onChange }: KPITargetMatrixProps) {
  const criteria = useMemo(() => version.groups.flatMap((group) => group.criteria.filter((criterion) => criterion.active !== false && criterion.direction !== 'rubric')), [version.groups])
  const snapshots = version.store_group_snapshots ?? []
  const profiles = version.target_profiles ?? []
  const chain = profiles.find((profile) => profile.scope === 'chain')

  function getTarget(profile: KpiTargetProfile | undefined, criterionId: string) { return profile?.targets.find((target) => target.criterion_id === criterionId) }
  function directionFor(criterionId: string): 'higher' | 'lower' {
    return criteria.find((item) => item.id === criterionId)?.direction === 'lower' ? 'lower' : 'higher'
  }

  function setCell(scope: 'chain' | 'store_group', groupId: string | undefined, criterionId: string, value: number | null) {
    const criterion = criteria.find((item) => item.id === criterionId)
    if (!criterion) return
    const direction = criterion.direction === 'lower' ? 'lower' : 'higher'
    const next = profiles.map((profile) => ({ ...profile, targets: profile.targets.map((target) => ({ ...target, score_bands: [...target.score_bands] })) }))
    let profile = next.find((item) => item.scope === scope && item.store_group_id === groupId)
    if (!profile) { profile = { scope, ...(groupId ? { store_group_id: groupId } : {}), targets: [] }; next.push(profile) }
    if (value === null) {
      profile.targets = profile.targets.filter((item) => item.criterion_id !== criterionId)
      onChange(next)
      return
    }
    if (!Number.isFinite(value)) {
      profile.targets = profile.targets.filter((item) => item.criterion_id !== criterionId)
      onChange(next)
      return
    }
    const safeValue = Math.max(0, value)
    const target: KpiCriterionTarget = { criterion_id: criterionId, target: safeValue, score_bands: suggestScoreBands(safeValue, direction) }
    profile.targets = [...profile.targets.filter((item) => item.criterion_id !== criterionId), target]
    onChange(next)
  }
  function adjustAll(factor: number) {
    const next = profiles.map((profile) => ({
      ...profile,
      targets: profile.targets.map((target) => {
        const nextTarget = Math.max(0, Math.round(target.target * factor * 100) / 100)
        return { ...target, target: nextTarget, score_bands: suggestScoreBands(nextTarget, directionFor(target.criterion_id)) }
      }),
    }))
    onChange(next)
  }
  function copyChain() {
    if (!chain) return
    const next = profiles.filter((profile) => profile.scope === 'chain')
    snapshots.forEach((snapshot) => next.push({ scope: 'store_group', store_group_id: snapshot.id, targets: chain.targets.map((target) => ({ ...target, score_bands: target.score_bands.map((band) => ({ ...band })) })) }))
    onChange(next)
  }
  function applyBands() {
    onChange(profiles.map((profile) => ({ ...profile, targets: profile.targets.map((target) => { const criterion = criteria.find((item) => item.id === target.criterion_id); return criterion ? { ...target, score_bands: suggestScoreBands(target.target, criterion.direction === 'lower' ? 'lower' : 'higher') } : target }) })))
  }

  const columns = [{ id: 'chain', label: 'Toàn chuỗi', profile: chain }, ...snapshots.map((snapshot) => ({ id: snapshot.id, label: snapshot.name, profile: profiles.find((profile) => profile.scope === 'store_group' && profile.store_group_id === snapshot.id) }))]
  return <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs space-y-4">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Ma trận mục tiêu</p><h2 className="mt-1 text-base font-bold text-[#001D3D]">Ngưỡng điểm theo toàn chuỗi và nhóm</h2></div><div className="flex flex-wrap gap-2"><button type="button" onClick={copyChain} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50"><Copy size={13} /> Sao chép cột</button><button type="button" onClick={() => adjustAll(1.05)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50"><Plus size={13} /> 5%</button><button type="button" onClick={() => adjustAll(0.95)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50"><Minus size={13} /> 5%</button><button type="button" onClick={applyBands} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100"><Sparkles size={13} /> Dùng bands đề xuất</button></div></div>
    <div className="overflow-x-auto rounded-xl border border-gray-100"><table className="w-full min-w-[700px] text-left text-xs"><thead className="bg-gray-50"><tr><th className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500">Tiêu chí</th>{columns.map((column) => <th key={column.id} className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500">{column.label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{criteria.map((criterion) => <tr key={criterion.id}><td className="px-3 py-2.5"><span className="font-semibold text-[#001D3D]">{criterion.name}</span><span className="ml-2 text-[10px] text-gray-400">{criterion.direction === 'lower' ? 'càng thấp càng tốt' : 'càng cao càng tốt'}</span></td>{columns.map((column) => { const target = getTarget(column.profile, criterion.id); return <td key={column.id} className="px-3 py-2.5"><input aria-label={`Mục tiêu ${criterion.name} cho ${column.label}`} type="number" min={0} step="0.01" value={target?.target ?? ''} placeholder="Chưa đặt" onChange={(event) => setCell(column.id === 'chain' ? 'chain' : 'store_group', column.id === 'chain' ? undefined : column.id, criterion.id, event.target.value.trim() === '' ? null : Number(event.target.value))} className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 text-right font-mono tabular-nums text-[#001D3D] outline-none focus:border-[#2F6FA8]" /></td>})}</tr>)}</tbody></table></div>
    {criteria.length === 0 && <p className="rounded-xl bg-gray-50 p-4 text-center text-xs text-gray-500">Chưa có tiêu chí số để đặt mục tiêu.</p>}
  </section>
}
