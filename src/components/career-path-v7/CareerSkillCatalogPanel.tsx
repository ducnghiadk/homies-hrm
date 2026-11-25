'use client'

import { useState } from 'react'
import type { CareerPathSettings, CareerPositionCode, CareerSkillConfig, CareerSkillGroup } from '@/lib/career-path/settings'
import { POSITION_LABEL, SKILL_GROUP_LABEL, cardClass, inputClass } from './career-ui'

interface Props {
  settings: CareerPathSettings
  readOnly: boolean
  onChange: (next: CareerPathSettings) => void
}

type Filter = 'all' | CareerPositionCode | 'shared'

export default function CareerSkillCatalogPanel({ settings, readOnly, onChange }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const visible = settings.skills
    .map((sk, index) => ({ sk, index }))
    .filter(({ sk }) => (filter === 'all' ? true : filter === 'shared' ? sk.position === null : sk.position === filter))

  const update = (index: number, patch: Partial<CareerSkillConfig>) =>
    onChange({ ...settings, skills: settings.skills.map((sk, i) => (i === index ? { ...sk, ...patch } : sk)) })

  const addSkill = () =>
    onChange({
      ...settings,
      skills: [...settings.skills, { code: '', name: '', position: filter === 'cashier' || filter === 'barista' ? filter : null, group: filter === 'shared' ? 'common' : 'core', standard: '', active: true }],
    })

  return (
    <section className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-[#001D3D]">Danh mục kỹ năng</h2>
          <p className="mt-1 text-sm text-gray-500">Tắt “Đang dùng” thay vì xóa để giữ lịch sử đánh giá cũ.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {([['all', 'Tất cả'], ['cashier', 'Thu ngân'], ['barista', 'Pha chế'], ['shared', 'Dùng chung']] as [Filter, string][]).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setFilter(v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === v ? 'bg-[#001D3D] text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {visible.map(({ sk, index }) => (
          <div key={index} className={`grid gap-2 rounded-xl border p-3 sm:grid-cols-[90px_1fr_150px_150px_auto] ${sk.active ? 'border-gray-200' : 'border-dashed border-gray-200 opacity-60'}`}>
            <input className={inputClass} placeholder="Mã" disabled={readOnly} value={sk.code} onChange={(e) => update(index, { code: e.target.value.toUpperCase() })} />
            <div className="space-y-1.5">
              <input className={inputClass} placeholder="Tên kỹ năng" disabled={readOnly} value={sk.name} onChange={(e) => update(index, { name: e.target.value })} />
              <input className={inputClass} placeholder="Tiêu chuẩn đạt" disabled={readOnly} value={sk.standard} onChange={(e) => update(index, { standard: e.target.value })} />
            </div>
            <select className={inputClass} disabled={readOnly} value={sk.group} onChange={(e) => update(index, { group: e.target.value as CareerSkillGroup })}>
              {(Object.keys(SKILL_GROUP_LABEL) as CareerSkillGroup[]).map((g) => <option key={g} value={g}>{SKILL_GROUP_LABEL[g]}</option>)}
            </select>
            <select
              className={inputClass}
              disabled={readOnly}
              value={sk.position ?? ''}
              onChange={(e) => update(index, { position: (e.target.value || null) as CareerPositionCode | null })}
            >
              <option value="">Dùng chung</option>
              {(Object.keys(POSITION_LABEL) as CareerPositionCode[]).map((p) => <option key={p} value={p}>{POSITION_LABEL[p]}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-gray-600">
              <input type="checkbox" disabled={readOnly} checked={sk.active} onChange={(e) => update(index, { active: e.target.checked })} />
              Đang dùng
            </label>
          </div>
        ))}
        {visible.length === 0 && <p className="py-6 text-center text-sm text-gray-500">Chưa có kỹ năng nào trong nhóm này.</p>}
      </div>

      {!readOnly && (
        <button type="button" onClick={addSkill} className="mt-3 rounded-lg border border-dashed border-[#2F6FA8] px-3 py-1.5 text-sm font-semibold text-[#2F6FA8]">
          + Thêm kỹ năng
        </button>
      )}
    </section>
  )
}
