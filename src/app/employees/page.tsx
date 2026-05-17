'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockEmployees } from '@/lib/mock-data'
import { Phone, Mail, Search, Filter } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function EmployeesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!user) return null

  return (
    <AppShell showNav>
      <div className="space-y-6 animate-fade-in font-['Inter']">
        {/* Header */}
        <div className="flex justify-between items-end mb-2">
            <div>
               <h1 className="text-[26px] font-bold text-dark-700 font-['Poppins']">Nhân sự</h1>
               <p className="text-gray-500 font-medium">Danh sách {mockEmployees.length} nhân viên</p>
            </div>
            <Button size="sm" variant="primary" icon={<Filter size={16} />}>Lọc</Button>
        </div>

        {/* Search */}
        <Input 
           placeholder="Tìm kiếm nhân viên..." 
           icon={<Search size={20} />} 
           className="shadow-sm border-gray-200"
        />

        {/* Employee List */}
        <div className="space-y-3 pb-20">
          {mockEmployees.map((emp) => (
             <Card key={emp.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors border-accent-50" onClick={() => router.push(`/employees/${emp.id}`)}>
                <Avatar name={emp.full_name} size="md" />
                <div className="flex-1 min-w-0">
                   <h3 className="font-semibold text-dark-700 text-[16px] font-['Poppins'] truncate">{emp.full_name}</h3>
                   <p className="text-gray-500 text-sm truncate">{emp.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <Badge variant={emp.status === 'active' ? 'success' : 'neutral'} className="text-xs px-2 py-0.5">
                      {emp.status === 'active' ? 'Đang làm' : 'Đã nghỉ'}
                   </Badge>
                   <span className="text-xs text-gray-400 font-medium">{emp.phone}</span>
                </div>
             </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
