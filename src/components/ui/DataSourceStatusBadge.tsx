'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Database, CheckCircle2, AlertCircle, RefreshCw, Server, ShieldCheck, Zap } from 'lucide-react'
import { isRealDbMode } from '@/lib/adapters/repository-config'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface ModuleHealth {
  name: string
  table: string
  isReal: boolean
  count: number | null
  status: 'loading' | 'real' | 'mock' | 'error'
}

export default function DataSourceStatusBadge() {
  const [isOpen, setIsOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const isReal = isRealDbMode() && isSupabaseConfigured
  const popoverRef = useRef<HTMLDivElement>(null)

  const [modules, setModules] = useState<ModuleHealth[]>([
    { name: 'Cửa hàng & Chi nhánh', table: 'cua_hang', isReal: false, count: null, status: 'loading' },
    { name: 'Hồ sơ Nhân viên', table: 'nhan_vien', isReal: false, count: null, status: 'loading' },
    { name: 'Chính sách Thưởng BSC', table: 'bsc_muc_tieu_doanh_thu', isReal: false, count: null, status: 'loading' },
    { name: 'Ca làm & Quy tắc ca', table: 'ca_lam', isReal: false, count: null, status: 'loading' },
    { name: 'Lịch phân ca tuần', table: 'lich_phan_ca', isReal: false, count: null, status: 'loading' },
    { name: 'Chấm công GPS', table: 'cham_cong', isReal: false, count: null, status: 'loading' },
  ])

  const checkLiveStatus = async () => {
    setIsChecking(true)
    const startTime = performance.now()

    if (!isReal) {
      setModules((prev) =>
        prev.map((m) => ({ ...m, isReal: false, count: 0, status: 'mock' }))
      )
      setIsChecking(false)
      return
    }

    try {
      const updatedModules = await Promise.all(
        modules.map(async (mod) => {
          try {
            const { count, error } = await supabase
              .from(mod.table)
              .select('*', { count: 'exact', head: true })

            if (error) {
              return { ...mod, isReal: false, count: 0, status: 'mock' as const }
            }

            const rowCount = count ?? 0
            return {
              ...mod,
              isReal: rowCount > 0,
              count: rowCount,
              status: rowCount > 0 ? ('real' as const) : ('mock' as const),
            }
          } catch {
            return { ...mod, isReal: false, count: 0, status: 'mock' as const }
          }
        })
      )

      const endTime = performance.now()
      setLatencyMs(Math.round(endTime - startTime))
      setModules(updatedModules)
    } catch {
      // Fallback
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkLiveStatus()
  }, [])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const allReal = modules.some((m) => m.status === 'real')

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Trạng thái nguồn dữ liệu Real/Mock"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border outline-none ${
          allReal
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70'
            : 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/70'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {allReal && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              allReal ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          ></span>
        </span>
        <Database size={13} className="hidden sm:inline" />
        <span className="font-bold">
          {allReal ? 'Real Supabase' : 'Mock Data'}
        </span>
      </button>

      {/* Detail Popover Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ boxShadow: '0 12px 35px -5px rgba(0,0,0,0.12), 0 8px 20px -6px rgba(0,0,0,0.06)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  allReal ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                <Server size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">
                  Trạng Thái Nguồn Dữ Liệu
                </h4>
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-600" />
                  {isReal ? 'Supabase Cloud Live' : 'Chế độ Local Mock'}
                  {latencyMs && (
                    <span className="text-emerald-700 font-mono font-bold flex items-center gap-0.5">
                      <Zap size={9} /> {latencyMs}ms
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={checkLiveStatus}
              disabled={isChecking}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-all"
              title="Làm mới trạng thái"
            >
              <RefreshCw size={13} className={isChecking ? 'animate-spin text-primary-500' : ''} />
            </button>
          </div>

          {/* Module List */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 text-xs">
            {modules.map((mod) => (
              <div
                key={mod.table}
                className="flex items-center justify-between p-2 rounded-xl bg-gray-50/80 border border-gray-100/80 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {mod.status === 'real' ? (
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={14} className="text-amber-500 shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold text-gray-800 text-[11px] block leading-tight">
                      {mod.name}
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono">
                      bảng: {mod.table}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {mod.status === 'loading' ? (
                    <span className="text-[10px] text-gray-400">Kiểm tra...</span>
                  ) : mod.status === 'real' ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Real DB ({mod.count})
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-800">
                      Mock (0 dòng)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-500 leading-snug">
            💡 <strong className="text-gray-700">Ghi chú:</strong> Khi bảng có dữ liệu thật trên Supabase (Real DB), hệ thống sẽ ưu tiên 100% dữ liệu Cloud.
          </div>
        </div>
      )}
    </div>
  )
}
