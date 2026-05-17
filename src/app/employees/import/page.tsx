'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { importTemplate, mockImportResults } from '@/lib/mock-data-employee-ext'
import { Upload, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react'

export default function EmployeeImportPage() {
  const [step, setStep] = useState<'upload' | 'result'>('upload')

  const validCount = mockImportResults.filter(r => r.status === 'valid').length
  const errorCount = mockImportResults.filter(r => r.status === 'error').length
  const warnCount = mockImportResults.filter(r => r.status === 'warning').length
  const hasErrors = errorCount > 0

  return (
    <AppShell title="Nhập nhân viên">
      <div className="space-y-4">
        {step === 'upload' ? (
          <>
            <div className="card animate-fade-in text-center py-8" style={{ border: '2px dashed var(--primary)', background: 'var(--primary-50)' }}>
              <Upload size={40} style={{ color: 'var(--primary)', margin: '0 auto' }} />
              <p className="text-sm font-bold mt-3" style={{ color: 'var(--primary)' }}>Kéo thả file Excel vào đây</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Hỗ trợ .xlsx, .csv • Tối đa 500 dòng</p>
              <button onClick={() => setStep('result')} className="btn btn-primary text-xs mt-4 px-6">Chọn file</button>
            </div>

            <div className="card animate-slide-up">
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>📋 Cột bắt buộc</h3>
              <div className="space-y-1">
                {importTemplate.columns.map(c => (
                  <div key={c.key} className="flex items-center gap-2 text-xs p-1.5 rounded" style={{ background: 'var(--gray-50)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: c.required ? '#ef4444' : '#9ca3af' }} />
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>— {c.example}</span>
                    {c.required && <span className="text-[9px] px-1 rounded" style={{ background: '#ef444420', color: '#ef4444' }}>*</span>}
                  </div>
                ))}
              </div>
              <button className="btn w-full text-xs gap-1 mt-3" style={{ background: 'var(--gray-100)', color: 'var(--text-primary)' }}>
                <Download size={12} /> Tải mẫu Excel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="card animate-fade-in text-center" style={{ background: hasErrors ? '#f59e0b10' : '#10b98110' }}>
              {hasErrors ? <AlertTriangle size={32} style={{ color: '#f59e0b', margin: '0 auto' }} /> : <CheckCircle size={32} style={{ color: '#10b981', margin: '0 auto' }} />}
              <div className="text-sm font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                {hasErrors ? 'Có lỗi cần sửa' : 'Import thành công!'}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 animate-slide-up">
              <div className="card text-center p-3"><div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{mockImportResults.length}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Tổng dòng</div></div>
              <div className="card text-center p-3"><div className="text-lg font-bold text-emerald-500">{validCount}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Thành công</div></div>
              <div className="card text-center p-3"><div className="text-lg font-bold text-red-500">{errorCount}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Lỗi</div></div>
            </div>

            <div className="card animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>📋 Chi tiết</h3>
              {mockImportResults.map(r => (
                <div key={r.row} className="flex items-center gap-2 text-xs p-2 rounded mb-1" style={{
                  background: r.status === 'error' ? '#ef444410' : r.status === 'warning' ? '#f59e0b10' : '#10b98108'
                }}>
                  {r.status === 'valid' && <CheckCircle size={12} className="text-emerald-500" />}
                  {r.status === 'error' && <XCircle size={12} className="text-red-500" />}
                  {r.status === 'warning' && <AlertTriangle size={12} className="text-amber-500" />}
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Dòng {r.row}: {r.employee_name || '—'}</span>
                  {r.errors.length > 0 && <span className="text-red-500">{r.errors.join(', ')}</span>}
                  {r.warnings.length > 0 && <span className="text-amber-500">{r.warnings.join(', ')}</span>}
                </div>
              ))}
            </div>

            <button onClick={() => setStep('upload')} className="btn w-full text-sm" style={{ background: 'var(--gray-100)', color: 'var(--text-primary)' }}>
              ← Import lại
            </button>
          </>
        )}
      </div>
    </AppShell>
  )
}
