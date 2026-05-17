'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockStores, mockPositions } from '@/lib/mock-data'
import { ArrowLeft, Save, Camera, User } from 'lucide-react'

export default function NewEmployeePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', date_of_birth: '',
    gender: 'male', address: '', store_id: '', position_id: '',
    role: 'employee', status: 'probation',
  })

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])

  if (!user || user.role === 'employee') {
    return <AppShell title="Thêm nhân viên"><div className="text-center py-20" style={{color:'var(--text-muted)'}}>Không có quyền</div></AppShell>
  }

  const handleSave = () => {
    if (!form.full_name || !form.phone) return
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => router.push('/employees'), 1500)
    }, 1000)
  }

  const update = (key: string, value: string) => setForm(f => ({...f, [key]: value}))

  return (
    <AppShell>
      <div className="space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-medium"
          style={{color:'var(--primary)'}}>
          <ArrowLeft size={16}/> Quay lại
        </button>

        {saved ? (
          <div className="text-center py-12 animate-scale-in">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{background:'var(--success-light)'}}>
              <Save size={36} style={{color:'var(--success)'}}/>
            </div>
            <h2 className="text-xl font-bold" style={{color:'var(--success)'}}>Đã lưu thành công! ✅</h2>
            <p className="text-sm mt-1" style={{color:'var(--text-secondary)'}}>Đang chuyển hướng...</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold animate-fade-in">Thêm nhân viên mới</h2>

            {/* Avatar */}
            <div className="flex justify-center animate-fade-in">
              <div className="relative">
                <div className="avatar avatar-xl" style={{background:'var(--gray-100)', color:'var(--text-muted)'}}>
                  <User size={36}/>
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                  style={{background:'var(--primary)', color:'white'}}>
                  <Camera size={14}/>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-3 animate-slide-up">
              <Field label="Họ và tên *" value={form.full_name} onChange={v => update('full_name', v)} placeholder="Nguyễn Văn A"/>
              <Field label="Số điện thoại *" value={form.phone} onChange={v => update('phone', v)} placeholder="0901234567" type="tel"/>
              <Field label="Email" value={form.email} onChange={v => update('email', v)} placeholder="email@example.com" type="email"/>
              <Field label="Ngày sinh" value={form.date_of_birth} onChange={v => update('date_of_birth', v)} type="date"/>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{color:'var(--text-primary)'}}>Giới tính</label>
                <div className="flex gap-2">
                  {[{v:'male',l:'Nam'},{v:'female',l:'Nữ'}].map(({v,l}) => (
                    <button key={v} className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: form.gender===v ? 'var(--primary)' : 'var(--gray-100)',
                        color: form.gender===v ? 'white' : 'var(--text-secondary)',
                      }}
                      onClick={() => update('gender', v)}>{l}</button>
                  ))}
                </div>
              </div>

              <Field label="Địa chỉ" value={form.address} onChange={v => update('address', v)} placeholder="Số nhà, đường, quận..."/>

              <SelectField label="Cửa hàng *" value={form.store_id} onChange={v => update('store_id', v)}
                options={mockStores.map(s => ({value:s.id, label:s.name.replace('Boba House - ','')}))}/>

              <SelectField label="Vị trí *" value={form.position_id} onChange={v => update('position_id', v)}
                options={mockPositions.map(p => ({value:p.id, label:`${p.name} (${p.base_salary.toLocaleString()}đ)`}))}/>

              <SelectField label="Vai trò" value={form.role} onChange={v => update('role', v)}
                options={[{value:'employee',label:'Nhân viên'},{value:'manager',label:'Quản lý'}]}/>

              <button className="btn btn-primary btn-block btn-large mt-4"
                disabled={!form.full_name || !form.phone || saving}
                onClick={handleSave}
                style={{opacity: !form.full_name || !form.phone ? 0.5 : 1}}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"/>
                    Đang lưu...
                  </span>
                ) : (
                  <><Save size={18}/> Lưu nhân viên</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{color:'var(--text-primary)'}}>{label}</label>
      <input className="input" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: {value:string, label:string}[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{color:'var(--text-primary)'}}>{label}</label>
      <select className="input" value={value} onChange={e => onChange(e.target.value)}
        style={{appearance:'auto'}}>
        <option value="">Chọn...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
