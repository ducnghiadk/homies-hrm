'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { masterStores } from '@/lib/mock-data-settings'
import { mockEmployees } from '@/lib/mock-data'
import { getInitials } from '@/lib/utils'
import { Crown, Building2, Users, ChevronDown, ChevronRight, MapPin, ShieldCheck, Briefcase, Award, Sparkles } from 'lucide-react'

type OrgNodeProps = {
  title: string
  subtitle: string
  code?: string
  avatarUrl?: string
  managerName?: string
  count?: number
  budget?: string
  level: 1 | 2 | 3 | 4
  accentColor: string
  children?: React.ReactNode
}

function OrgNodeCard({ title, subtitle, code, avatarUrl, managerName, count, budget, level, accentColor, children }: OrgNodeProps) {
  const [collapsed, setCollapsed] = useState(false)

  const levelBadge = level === 4 ? 'Level 4 • Ban Giám đốc' : level === 3 ? 'Level 3 • Quản lý Cửa hàng' : level === 2 ? 'Level 2 • Trưởng ca' : 'Level 1 • Vận hành'

  return (
    <div className="flex flex-col items-center">
      {/* Node Content Card */}
      <div className={`relative w-72 rounded-3xl border bg-white p-4 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 ${accentColor}`}>
        {/* Top Level Pill */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 bg-primary-50 px-2 py-0.5 rounded-full">
            {code || levelBadge}
          </span>
          {count !== undefined && (
            <span className="text-[10px] font-extrabold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Users size={10} /> {count} nhân sự
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Avatar / Icon */}
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 font-bold text-sm shadow-sm">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={title} width={44} height={44} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              getInitials(managerName || title)
            )}
            {level === 4 && (
              <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-dark-900 shadow">
                <Crown size={12} />
              </div>
            )}
          </div>

          {/* Node Text */}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-dark-700 truncate">{title}</h4>
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
            {managerName && (
              <p className="text-[11px] font-semibold text-primary-600 mt-0.5 flex items-center gap-1 truncate">
                <ShieldCheck size={12} className="text-emerald-500" /> {managerName}
              </p>
            )}
          </div>
        </div>

        {budget && (
          <div className="mt-3 border-t border-gray-50 pt-2 flex items-center justify-between text-[11px] text-gray-500">
            <span>Ngân sách lương:</span>
            <span className="font-bold text-dark-700">{budget}</span>
          </div>
        )}

        {/* Collapse Toggle */}
        {children && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow hover:bg-primary-50 hover:text-primary-600 transition-all z-10"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Vertical Connecting Connector Line */}
      {children && !collapsed && (
        <>
          <div className="h-6 w-0.5 bg-primary-200" />
          {/* Children Sub-tree Tree Container */}
          <div className="relative flex justify-center gap-6 pt-2">
            {children}
          </div>
        </>
      )}
    </div>
  )
}

export function VisualOrgChart() {
  const ceo = mockEmployees.find(e => e.role === 'ceo') || mockEmployees[0]
  const managers = mockEmployees.filter(e => e.role === 'store_manager' || e.role === 'hr_admin')

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-6 overflow-hidden animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700">
              <Sparkles size={12} /> Sơ đồ Trực quan Live
            </span>
            <h2 className="text-lg font-bold text-dark-700">Sơ đồ Cây Tổ chức Homies</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">Cấu trúc quản trị phân cấp từ Ban Giám đốc tới Quản lý Cửa hàng và Các bộ phận vận hành</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 font-semibold bg-vanilla-50 px-3.5 py-2 rounded-2xl">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> CEO</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Manager</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Trưởng ca</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Vận hành</span>
        </div>
      </div>

      {/* Scrollable Tree View Canvas */}
      <div className="overflow-x-auto pb-8 pt-4 scrollbar-hide flex justify-center min-w-[900px]">
        {/* ROOT NODE: CEO / BAN GIÁM ĐỐC */}
        <OrgNodeCard
          title="Homies Headquarters"
          subtitle="Ban Giám Đốc & HR Central"
          code="HQ-ROOT"
          avatarUrl={ceo?.avatar_url}
          managerName={ceo?.full_name}
          count={mockEmployees.length}
          budget="125.000.000₫ / tháng"
          level={4}
          accentColor="border-purple-200 hover:border-purple-400"
        >
          {/* LEVEL 3 NODES: CHUYÊN CHI NHÁNH / STORES */}
          {masterStores.map((store, sIdx) => {
            const storeManager = managers[sIdx % managers.length] || ceo
            const storeEmpCount = mockEmployees.filter(e => e.store_id === store.id).length || 3

            return (
              <OrgNodeCard
                key={store.id}
                title={store.name.replace('Homies Milk Tea - ', 'Homies ')}
                subtitle={store.address}
                code={store.code}
                avatarUrl={storeManager?.avatar_url}
                managerName={`Quản lý: ${storeManager?.full_name}`}
                count={storeEmpCount}
                budget="38.000.000₫ / tháng"
                level={3}
                accentColor="border-emerald-200 hover:border-emerald-400"
              >
                {/* LEVEL 2 & 1 DEPARTMENTS UNDER STORE */}
                <div className="flex gap-4">
                  {/* Department 1: Pha chế */}
                  <OrgNodeCard
                    title="Khối Pha chế & Barista"
                    subtitle="3 Vị trí • Barista chính"
                    code="DEPT-BAR"
                    managerName="Trưởng nhóm: Nguyễn Barista"
                    count={3}
                    level={1}
                    accentColor="border-blue-200 hover:border-blue-400"
                  />
                  {/* Department 2: Thu ngân */}
                  <OrgNodeCard
                    title="Khối Thu ngân & Sảnh"
                    subtitle="2 Vị trí • Order POS"
                    code="DEPT-FOH"
                    managerName="Trưởng nhóm: Trần Thu Ngân"
                    count={2}
                    level={1}
                    accentColor="border-amber-200 hover:border-amber-400"
                  />
                </div>
              </OrgNodeCard>
            )
          })}
        </OrgNodeCard>
      </div>
    </div>
  )
}
