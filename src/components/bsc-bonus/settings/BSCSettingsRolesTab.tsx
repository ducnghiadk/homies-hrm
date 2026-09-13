'use client'

import React from 'react'
import { Users } from 'lucide-react'
import { bscPositionMultipliersCatalog, updateBSCPositionMultiplier } from '@/lib/mock-data-bsc'

interface BSCSettingsRolesTabProps {
  isCEOOrHR: boolean
  onNotify: (msg: string) => void
}

export default function BSCSettingsRolesTab({
  isCEOOrHR,
  onNotify,
}: BSCSettingsRolesTabProps) {
  return (
    <div className="card p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-5 animate-fade-in text-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#001D3D]">
              Hệ Số Nhận Thưởng Theo Chức Danh (Quản Lý / Trưởng Ca / Nhân Viên)
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Quyết định tỷ lệ nhân thưởng giữa Quản Lý, Trưởng Ca và Nhân Viên</p>
          </div>
        </div>
        <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-blue-50 text-[#2F6FA8] border border-blue-200">
          Phân Phối Quỹ Thưởng
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bscPositionMultipliersCatalog.map(pos => (
          <div key={pos.role_key} className="p-4 sm:p-5 rounded-2xl border border-gray-200/80 bg-gray-50/70 space-y-3 shadow-2xs">
            <span className="font-bold text-[#001D3D] text-sm block">{pos.role_title}</span>
            <p className="text-xs text-gray-500 line-clamp-2 font-medium">{pos.description}</p>
            <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">Hệ số thưởng:</span>
              <input
                type="number"
                step={0.1}
                min={0.1}
                max={5.0}
                disabled={!isCEOOrHR}
                value={pos.multiplier}
                onChange={e => {
                  updateBSCPositionMultiplier(pos.role_key, Number(e.target.value))
                  onNotify('Đã cập nhật hệ số vị trí!')
                }}
                className="w-16 px-2.5 py-1.5 min-h-[38px] text-center font-black rounded-xl border border-blue-300 bg-white text-[#2F6FA8] text-sm outline-none focus:border-[#2F6FA8] font-mono tabular-nums"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
