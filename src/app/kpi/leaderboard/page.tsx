'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import AnimatedPodium from '@/components/kpi/AnimatedPodium'
import MyPositionCard from '@/components/kpi/MyPositionCard'
import MoversCard from '@/components/kpi/MoversCard'
import GradeBadge from '@/components/kpi/GradeBadge'
import TrendIndicator from '@/components/kpi/TrendIndicator'
import { getLeaderboard } from '@/lib/kpi-report-service'
import { getCurrentPeriod, getPreviousPeriodsHelper } from '@/lib/mock-data-kpi'
import {
  Trophy,
  ChevronRight,
  ChevronLeft,
  Building2,
  Calendar,
  Sparkles,
  Users,
  TrendingUp,
  Award,
  Medal,
} from 'lucide-react'
import Link from 'next/link'

export default function LeaderboardPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [scope, setScope] = useState<'store' | 'all'>('store')

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login?redirect=/kpi/leaderboard')
  }, [hasHydrated, isAuthenticated, router])

  if (!hasHydrated || !user) return null

  const period = getCurrentPeriod()
  const prevPeriod = getPreviousPeriodsHelper(2)[1]
  const storeId = scope === 'store' ? user.store_id : undefined
  const lb = getLeaderboard(storeId, period)
  const prevLb = getLeaderboard(storeId, prevPeriod)
  const myEntry = lb.current.find(e => e.employee_id === user.id)
  const myPrevEntry = prevLb.current.find(e => e.employee_id === user.id)

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold font-mono text-xs flex items-center justify-center border border-amber-300">
          1
        </span>
      )
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold font-mono text-xs flex items-center justify-center border border-slate-300">
          2
        </span>
      )
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 font-bold font-mono text-xs flex items-center justify-center border border-amber-200">
          3
        </span>
      )
    }
    return (
      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 font-bold font-mono text-xs flex items-center justify-center">
        {rank}
      </span>
    )
  }

  return (
    <AppShell showNav className="w-full max-w-none bg-[#FFF8E8] min-h-screen">
      {/* ══════════════════════════════════════════════════════════════════════
          TẦNG 1: EXECUTIVE COMMAND HEADER (Cố định sticky top-0 z-30)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs w-full sticky top-0 z-30">
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          {/* Cột trái: Breadcrumb + Tiêu đề */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span>HRM Homies</span>
              <ChevronRight size={12} className="text-gray-400" />
              <Link href="/kpi" className="hover:text-[#2F6FA8] transition">
                Hiệu Suất &amp; Đánh Giá KPI
              </Link>
              <ChevronRight size={12} className="text-gray-400" />
              <span className="text-[#2F6FA8] font-bold">Bảng Xếp Hạng</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-[#001D3D] tracking-tight">
                Bảng Xếp Hạng Hiệu Suất Nhân Sự
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                Tháng {period.slice(5)}/{period.slice(0, 4)}
              </span>
            </div>
          </div>

          {/* Cột phải: Toggle Phạm vi + Nút Quay lại */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setScope('store')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  scope === 'store'
                    ? 'bg-white text-[#001D3D] shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Chi Nhánh
              </button>
              <button
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  scope === 'all'
                    ? 'bg-white text-[#001D3D] shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Toàn Chuỗi Homies
              </button>
            </div>

            <Link
              href="/kpi"
              className="px-3.5 py-1.5 min-h-[36px] rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
            >
              <ChevronLeft size={14} />
              <span>Về Trang KPI</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          NỘI DUNG CHÍNH (FULL WIDTH - SOFT CREAM BACKGROUND)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Podium Top 3 */}
        {lb.current.length >= 3 && <AnimatedPodium top3={lb.current.slice(0, 3)} />}

        {/* My Position Card & Movers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {myEntry && (
            <MyPositionCard
              rank={myEntry.rank}
              total={lb.current.length}
              score={myEntry.score}
              gapToTop3={lb.current.length >= 3 ? lb.current[2].score - myEntry.score : 0}
              prevRank={myPrevEntry?.rank}
            />
          )}
          <MoversCard gainer={lb.movers.biggest_gainer} dropper={lb.movers.biggest_drop} />
        </div>

        {/* Full Ranking Data Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-sm font-bold text-[#001D3D] flex items-center gap-2">
                <Trophy size={16} className="text-[#2F6FA8]" />
                <span>Bảng Xếp Hạng Đầy Đủ</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#2F6FA8] border border-blue-200 font-mono">
                  {lb.current.length} nhân sự
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Điểm số tổng hợp từ kết quả tự chấm, quản lý review và trừ điểm vi phạm.
              </p>
            </div>

            <span className="text-xs font-bold text-[#2F6FA8] font-mono">
              Kỳ xét {period}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-100">
                  <th className="py-3 px-3 text-center w-16">Thứ Hạng</th>
                  <th className="py-3 px-4 text-[#001D3D]">Nhân Viên</th>
                  <th className="py-3 px-3 text-center">Điểm KPI</th>
                  <th className="py-3 px-3 text-center">Xếp Loại</th>
                  <th className="py-3 px-3 text-center">Biến Động</th>
                  <th className="py-3 px-4 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {lb.current.map((entry) => {
                  const isMe = entry.employee_id === user.id
                  return (
                    <tr
                      key={entry.employee_id}
                      className={`transition-all ${
                        isMe
                          ? 'bg-blue-50/40 font-bold'
                          : 'hover:bg-blue-50/20'
                      }`}
                    >
                      {/* Cột 1: Thứ hạng */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center">
                          {getRankBadge(entry.rank)}
                        </div>
                      </td>

                      {/* Cột 2: Nhân viên */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#2F6FA8] flex items-center justify-center font-bold text-xs shrink-0">
                            {entry.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              <span>{entry.name}</span>
                              {isMe && (
                                <span className="px-1.5 py-0.2 rounded-md bg-[#2F6FA8] text-white text-[10px] font-bold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium font-mono">
                              {entry.employee_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Điểm KPI */}
                      <td className="py-3 px-3 text-center">
                        <span className={`font-mono font-bold tabular-nums text-sm ${
                          entry.score >= 85
                            ? 'text-emerald-700'
                            : entry.score >= 70
                            ? 'text-[#2F6FA8]'
                            : 'text-rose-700'
                        }`}>
                          {entry.score.toFixed(1)} đ
                        </span>
                      </td>

                      {/* Cột 4: Xếp loại */}
                      <td className="py-3 px-3 text-center">
                        <GradeBadge gradeCode={entry.grade_code} size="sm" showIcon={false} />
                      </td>

                      {/* Cột 5: Biến động */}
                      <td className="py-3 px-3 text-center">
                        {entry.change !== 0 ? (
                          <div className="flex items-center justify-center">
                            <TrendIndicator value={entry.change} size="sm" />
                          </div>
                        ) : (
                          <span className="text-gray-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Cột 6: Trạng thái */}
                      <td className="py-3 px-4 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đã công bố
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
