'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { getStoreById, getPositionById } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import {
  LogOut, Phone, Mail, Calendar, ChevronRight, Settings, Shield,
  Clock, MapPin, CheckCircle2, DollarSign, CalendarCheck, Crown
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface PersonalShift {
  id: string
  date: string
  shift_name: string
  status: string
  notes?: string
}

export default function ProfilePage() {
  const { user, isAuthenticated, hasHydrated, logout } = useAuthStore()
  const router = useRouter()
  const [personalShifts, setPersonalShifts] = useState<PersonalShift[]>([])
  const [loadingShifts, setLoadingShifts] = useState(false)

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/profile')
    }
  }, [hasHydrated, isAuthenticated, router])

  // Lấy danh sách ca làm việc thật của nhân viên đang đăng nhập
  useEffect(() => {
    if (!user?.id) return

    async function fetchMyShifts() {
      try {
        setLoadingShifts(true)
        const res = await fetch(`/api/shifts?employee_id=${user!.id}`)
        const json = await res.json()
        if (json.success && json.data) {
          // Lấy 5 ca gần nhất
          setPersonalShifts(json.data.slice(0, 5))
        }
      } catch {
        // Silent fallback
      } finally {
        setLoadingShifts(false)
      }
    }

    fetchMyShifts()
  }, [user?.id])

  if (!hasHydrated) {
    return (
      <AppShell showNav title="Hồ sơ">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !isAuthenticated) return null

  const store = getStoreById(user.store_id)
  const position = getPositionById(user.position_id)
  const gamificationLevel = user.gamification_level || 'Thành viên Đồng'
  const totalPoints = user.total_points ?? 120
  const hourlyRate = (user as any).hourly_rate ? `${Number((user as any).hourly_rate).toLocaleString()} đ/h` : 'Theo định mức'
  const baseSalary = user.base_salary ? `${Number(user.base_salary).toLocaleString()} đ` : 'Chưa cập nhật'

  return (
    <AppShell showNav title="Hồ sơ cá nhân">
      <div className="space-y-6 pb-24 max-w-2xl mx-auto font-['Inter']">
        {/* Header with Celtic Blue Gradient */}
        <div className="relative mb-16">
          <div className="h-32 w-full rounded-b-[32px] bg-gradient-to-r from-primary-800 via-primary-700 to-primary-900 shadow-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('/patterns/leaves.svg')] opacity-10" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent-400/20 rounded-full blur-2xl translate-y-1/2 translate-x-1/2" />
          </div>

          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
            <div className="relative inline-block">
              <Avatar
                name={user.full_name || 'Nhân viên'}
                size="xl"
                className="w-24 h-24 border-4 border-white shadow-xl bg-primary-700 text-white text-2xl"
              />
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="text-center px-4">
          <h1 className="text-[22px] font-bold text-gray-900 mb-1 font-['Poppins']">{user.full_name}</h1>
          <p className="text-gray-500 font-medium text-sm">
            {position?.name || user.department_name || 'Nhân sự Homies Milk Tea'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            <Badge variant="primary" className="px-3 py-1 text-xs">
              Mã NV: {user.employee_code || user.id}
            </Badge>
            <Badge variant="warning" className="px-3 py-1 text-xs">
              <Crown size={12} className="mr-1 inline" /> {gamificationLevel}
            </Badge>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin size={12} /> {store?.name || 'Chi nhánh Homies'}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3 px-1">
          <Button
            variant="primary"
            onClick={() => router.push('/checkin')}
            className="h-11 rounded-xl shadow-sm text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Clock size={16} /> Chấm công GPS ngay
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/my-schedule')}
            className="h-11 rounded-xl shadow-sm text-xs font-semibold flex items-center justify-center gap-2 border-primary-600 text-primary-700 hover:bg-primary-50"
          >
            <CalendarCheck size={16} /> Xem lịch ca của tôi
          </Button>
        </div>

        {/* Work & Wage Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">ĐIỂM THƯỞNG</div>
            <div className="font-bold text-accent-600 text-base font-['Poppins']">{totalPoints.toLocaleString()}</div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">LƯƠNG GIỜ</div>
            <div className="font-bold text-primary-700 text-base font-['Poppins']">{hourlyRate}</div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">LƯƠNG ĐỊNH MỨC</div>
            <div className="font-bold text-gray-800 text-xs mt-1 truncate" title={baseSalary}>{baseSalary}</div>
          </div>
        </div>

        {/* Personal Shifts / Ca Làm Việc Gần Nhất */}
        <Card className="p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary-600" />
              <h2 className="text-sm font-bold text-gray-900">Ca làm việc của tôi</h2>
            </div>
            <Link href="/my-schedule" className="text-xs font-semibold text-primary-600 hover:underline">
              Xem tất cả →
            </Link>
          </div>

          {loadingShifts ? (
            <div className="py-4 text-center text-xs text-gray-400">Đang tải ca làm việc...</div>
          ) : personalShifts.length === 0 ? (
            <div className="py-4 text-center text-xs text-gray-400">
              Chưa có ca làm việc nào được xếp tuần này.
            </div>
          ) : (
            <div className="space-y-2">
              {personalShifts.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                  <div>
                    <div className="font-semibold text-gray-800">{s.shift_name}</div>
                    <div className="text-gray-500 text-[11px] mt-0.5">Ngày: {s.date}</div>
                  </div>
                  <Badge variant={s.status === 'APPROVED' ? 'success' : 'default'} className="text-[10px]">
                    {s.status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="p-0 overflow-hidden border border-gray-100 shadow-sm">
          {[
            { icon: Phone, label: 'Số điện thoại', value: user.phone || 'Chưa cập nhật' },
            { icon: Mail, label: 'Email tài khoản', value: user.email },
            { icon: Calendar, label: 'Ngày vào làm', value: user.hire_date ? formatDate(user.hire_date) : '2024-05-01' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                <item.icon size={18} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{item.label}</p>
                <p className="text-sm font-medium text-gray-800 font-['Poppins']">{item.value}</p>
              </div>
            </div>
          ))}
        </Card>

        {/* Settings Menu */}
        <Card className="p-0 overflow-hidden border border-gray-100 shadow-sm">
          {[
            { icon: Shield, label: 'Bảo mật tài khoản', href: '/settings/security' },
            { icon: Settings, label: 'Cài đặt hệ thống', href: '/settings' },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => router.push(item.href)}
              className="flex items-center justify-between p-4 border-b border-gray-100 last:border-none hover:bg-gray-50 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                  <item.icon size={18} />
                </div>
                <span className="font-medium text-sm text-gray-800 font-['Poppins']">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-600 transition-colors" />
            </div>
          ))}
        </Card>

        {/* Logout Button */}
        <Button
          variant="danger"
          fullWidth
          onClick={() => { logout(); router.push('/login') }}
          className="h-12 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl shadow-sm text-sm font-semibold"
        >
          <LogOut size={18} className="mr-2" /> Đăng xuất
        </Button>
      </div>
    </AppShell>
  )
}
