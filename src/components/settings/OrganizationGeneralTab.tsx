'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Building2, Save, MapPin, Phone, Mail, ShieldCheck } from 'lucide-react'

interface OrganizationGeneralTabProps {
  orgData: {
    name: string
    shortName: string
    taxCode: string
    address: string
    phone: string
    email: string
    signerName: string
    signerTitle: string
    timezone: string
    currency: string
  }
  setOrgData: React.Dispatch<React.SetStateAction<{
    name: string
    shortName: string
    taxCode: string
    address: string
    phone: string
    email: string
    signerName: string
    signerTitle: string
    timezone: string
    currency: string
  }>>
  onSave: (e: React.FormEvent) => void
}

export function OrganizationGeneralTab({
  orgData,
  setOrgData,
  onSave,
}: OrganizationGeneralTabProps) {
  return (
    <form onSubmit={onSave} className="space-y-4 animate-fade-in">
      {/* Core Enterprise Info */}
      <Card className="p-5 space-y-4 bg-white border-gray-200">
        <div className="flex items-center gap-2 text-[#2F6FA8] font-bold text-sm border-b pb-3">
          <Building2 size={18} />
          <span className="text-[#001D3D]">Thông tin pháp lý & Nhận diện</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Tên doanh nghiệp / Chuỗi *</label>
            <input
              type="text"
              required
              value={orgData.name}
              onChange={e => setOrgData({ ...orgData, name: e.target.value })}
              className="w-full bg-vanilla-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Tên viết tắt / Brand</label>
            <input
              type="text"
              value={orgData.shortName}
              onChange={e => setOrgData({ ...orgData, shortName: e.target.value })}
              className="w-full bg-vanilla-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Mã số thuế</label>
            <input
              type="text"
              value={orgData.taxCode}
              onChange={e => setOrgData({ ...orgData, taxCode: e.target.value })}
              className="w-full bg-vanilla-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Địa chỉ trụ sở chính</label>
            <div className="relative">
              <input
                type="text"
                value={orgData.address}
                onChange={e => setOrgData({ ...orgData, address: e.target.value })}
                className="w-full bg-vanilla-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
              />
              <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Số điện thoại liên hệ</label>
            <div className="relative">
              <input
                type="text"
                value={orgData.phone}
                onChange={e => setOrgData({ ...orgData, phone: e.target.value })}
                className="w-full bg-vanilla-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
              />
              <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Email công ty</label>
            <div className="relative">
              <input
                type="email"
                value={orgData.email}
                onChange={e => setOrgData({ ...orgData, email: e.target.value })}
                className="w-full bg-vanilla-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
              />
              <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>
      </Card>

      {/* Contract Signer Default */}
      <Card className="p-5 space-y-4 bg-white border-gray-200">
        <div className="flex items-center gap-2 text-[#2F6FA8] font-bold text-sm border-b pb-3">
          <ShieldCheck size={18} />
          <span className="text-[#001D3D]">Đại diện ký hợp đồng lao động</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Họ và tên người ký</label>
            <input
              type="text"
              value={orgData.signerName}
              onChange={e => setOrgData({ ...orgData, signerName: e.target.value })}
              className="w-full bg-vanilla-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Chức danh người ký</label>
            <input
              type="text"
              value={orgData.signerTitle}
              onChange={e => setOrgData({ ...orgData, signerTitle: e.target.value })}
              className="w-full bg-vanilla-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#001D3D] focus:ring-2 focus:ring-[#2F6FA8] outline-none"
            />
          </div>
        </div>
      </Card>

      {/* System Defaults */}
      <Card className="p-5 space-y-4 bg-white border-gray-200">
        <div className="flex items-center gap-2 text-[#2F6FA8] font-bold text-sm border-b pb-3">
          <Building2 size={18} />
          <span className="text-[#001D3D]">Cấu hình hệ thống mặc định</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Múi giờ làm việc</label>
            <input
              type="text"
              disabled
              value={orgData.timezone}
              className="w-full bg-primary-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Đơn vị tiền tệ</label>
            <input
              type="text"
              disabled
              value={orgData.currency}
              className="w-full bg-primary-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          className="bg-[#2F6FA8] hover:bg-[#255885] text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm"
        >
          <Save size={16} />
          <span>Lưu thông tin doanh nghiệp</span>
        </Button>
      </div>
    </form>
  )
}
