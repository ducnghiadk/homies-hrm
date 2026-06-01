'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { getStoreById, getPositionById } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import { LogOut, Phone, Mail, Calendar, ChevronRight, Settings, Shield, Edit2, Crown } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const store = getStoreById(user.store_id)
  const position = getPositionById(user.position_id)

  return (
    <AppShell showNav>
      <div className="space-y-6 animate-fade-in font-['Inter']">
        {/* Header with Celtic Blue Gradient */}
        <div className="relative mb-16">
          <div className="h-32 w-full rounded-b-[32px] bg-gradient-to-r from-primary-600 to-primary-800 shadow-lg overflow-hidden relative">
             <div className="absolute inset-0 bg-[url('/patterns/leaves.svg')] opacity-10"></div>
             <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent-400/20 rounded-full blur-2xl translate-y-1/2 translate-x-1/2"></div>
          </div>
          
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
            <div className="relative inline-block">
              <Avatar 
                name={user.full_name} 
                size="xl" 
                className="w-24 h-24 border-4 border-accent-400 shadow-xl bg-primary-600 text-2xl" 
              />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow-md border border-gray-100 cursor-pointer hover:bg-vanilla-50 transition-colors">
                 <Edit2 size={16} className="text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="text-center px-4">
          <h1 className="text-[24px] font-bold text-dark-700 mb-1 font-['Poppins']">{user.full_name}</h1>
          <p className="text-gray-500 font-medium">{position?.name}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="warning" className="px-3 py-1">
               <Crown size={12} className="mr-1" /> {user.gamification_level}
            </Badge>
            <span className="text-sm text-gray-400">• {store?.name}</span>
          </div>
        </div>

        {/* Stats Row - So Matcha Style */}
        <div className="grid grid-cols-3 gap-3 px-2">
            <div className="bg-white p-3 rounded-[16px] border border-accent-100 shadow-sm text-center">
                <div className="text-xs text-gray-400 mb-1 font-bold bg-gray-50 py-0.5 rounded uppercase tracking-wider">LEVEL</div>
                <div className="font-bold text-primary-600 text-[18px] font-['Poppins']">{user.gamification_level}</div>
            </div>
            <div className="bg-white p-3 rounded-[16px] border border-accent-100 shadow-sm text-center">
                <div className="text-xs text-gray-400 mb-1 font-bold bg-gray-50 py-0.5 rounded uppercase tracking-wider">ĐIỂM</div>
                <div className="font-bold text-accent-600 text-[18px] font-['Poppins']">{user.total_points.toLocaleString()}</div>
            </div>
            <div className="bg-white p-3 rounded-[16px] border border-accent-100 shadow-sm text-center">
                <div className="text-xs text-gray-400 mb-1 font-bold bg-gray-50 py-0.5 rounded uppercase tracking-wider">THÂM NIÊN</div>
                <div className="font-bold text-dark-700 text-[18px] font-['Poppins']">2 Năm</div>
            </div>
        </div>

        {/* Info Card */}
        <Card className="p-0 overflow-hidden border border-accent-100 shadow-sm animate-slide-up">
          {[
            { icon: Phone, label: 'Số điện thoại', value: user.phone },
            { icon: Mail, label: 'Email', value: user.email },
            { icon: Calendar, label: 'Ngày vào làm', value: formatDate(user.hire_date) },
          ].map((item, idx) => (
             <div key={idx} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors">
               <div className="w-10 h-10 rounded-[12px] bg-primary-50 flex items-center justify-center text-primary-600">
                 <item.icon size={20} />
               </div>
               <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{item.label}</p>
                  <p className="text-[15px] font-medium text-dark-700 font-['Poppins']">{item.value}</p>
               </div>
             </div>
          ))}
        </Card>

        {/* Settings Menu */}
        <Card className="p-0 overflow-hidden border border-accent-100 shadow-sm animate-slide-up">
          {[
             { icon: Shield, label: 'Bảo mật tài khoản', href: '/settings/security' },
             { icon: Settings, label: 'Cài đặt ứng dụng', href: '/settings' },
          ].map((item, idx) => (
             <div key={idx} onClick={() => router.push(item.href)} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-none hover:bg-gray-50 cursor-pointer group transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-[12px] bg-vanilla-100 flex items-center justify-center text-dark-600 group-hover:bg-vanilla-300 transition-colors">
                      <item.icon size={20} />
                   </div>
                   <span className="font-medium text-dark-700 font-['Poppins']">{item.label}</span>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-primary-600 transition-colors" />
             </div>
          ))}
        </Card>
        
        <Button 
           variant="danger" 
           fullWidth 
           onClick={() => { logout(); router.push('/login') }}
           className="h-12 bg-error-50 text-error hover:bg-error-100 border border-error-100 rounded-[16px] shadow-sm font-['Poppins']"
        >
           <LogOut size={20} className="mr-2" /> Đăng xuất
        </Button>

        <div className="h-4"></div>
      </div>
    </AppShell>
  )
}
