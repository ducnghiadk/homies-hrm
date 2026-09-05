'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import AppShell from '@/components/layout/AppShell'
import { mockEmployees, mockStores } from '@/lib/mock-data'
import { Plus, X, Calendar, Image as ImageIcon, RotateCcw, Eye, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import { payrollAdapter, storeAdapter } from '@/lib/adapters'
import { useRouter } from 'next/navigation'

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' đ'

interface TicketItem {
  id: string
  date_scope: string
  branch: string
  ticket_type: string
  employee_id: string
  employee_name: string
  calc_type: string
  amount: number
  note: string
  image: string | null
  status: string
}

export default function BonusSlipPage() {
  const router = useRouter()

  // Filter States matching Reference Screenshot
  const [filterStore, setFilterStore] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterMonth, setFilterMonth] = useState('08/2026')

  // Real Database State (Starts EMPTY, loaded directly from Supabase)
  const [bonuses, setBonuses] = useState<TicketItem[]>([])
  const [stores, setStores] = useState(mockStores)
  const [isLoading, setIsLoading] = useState(true)

  // Modal State
  const [showModal, setShowModal] = useState(false)

  // Modal Form States
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [ticketType, setTicketType] = useState('Phiếu thưởng')
  const [customTicketType, setCustomTicketType] = useState('Thưởng doanh thu')
  const [targetEmpId, setTargetEmpId] = useState(mockEmployees[0]?.id || '')
  const [ticketScope, setTicketScope] = useState('date') // 'date' | 'period'
  const [ticketDate, setTicketDate] = useState('15/08/2026')
  const [selectedPeriod, setSelectedPeriod] = useState('2026-02')
  const [ticketCalcType, setTicketCalcType] = useState('amount')
  const [ticketAmount, setTicketAmount] = useState<number>(0)
  const [ticketNote, setTicketNote] = useState('')
  const [ticketImage, setTicketImage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const targetEmp = mockEmployees.find(e => e.id === targetEmpId) || mockEmployees[0]

  // Load Real Data from Supabase Database on Mount
  const loadRealData = async () => {
    setIsLoading(true)
    try {
      const realTx = await payrollAdapter.getTicketTransactions(true)
      setBonuses(realTx as unknown as TicketItem[])
    } catch (err) {
      console.error('Error loading real bonus slips:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRealData()
    storeAdapter.getStores().then(res => setStores(res))
  }, [])

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => setTicketImage(String(event.target?.result || ''))
      reader.readAsDataURL(file)
    }
  }

  // Save Bonus Ticket Handler directly to Supabase DB
  const handleSaveBonus = async () => {
    let finalAmount = Number(ticketAmount) || 0
    if (ticketCalcType === 'percent') {
      finalAmount = Math.round((finalAmount / 100) * 6500000)
    }

    const newType = ticketType.includes('tự định nghĩa') ? `Phiếu cộng tự định nghĩa: ${customTicketType}` : ticketType

    await payrollAdapter.saveTicketTransaction({
      employee_id: targetEmp.id,
      period_id: selectedPeriod,
      type: newType,
      scope: ticketScope,
      date: ticketDate,
      calc_type: ticketCalcType,
      amount: ticketAmount,
      converted_amount: finalAmount,
      note: ticketNote,
      image: ticketImage,
    })

    alert(`Đã lưu phiếu cộng tiền cho nhân viên ${targetEmp.full_name} trực tiếp vào CSDL Supabase!`)
    setShowModal(false)
    setTicketAmount(0)
    setTicketNote('')
    setTicketImage(null)

    // Reload Real Database
    await loadRealData()
  }

  // Handle Approve Ticket
  const handleApprove = async (id: string) => {
    await payrollAdapter.approveTicketTransaction(id)
    alert('Đã duyệt phiếu thành công trên Supabase!')
    await loadRealData()
  }

  // Handle Delete Ticket
  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa phiếu này khỏi CSDL Supabase?')) {
      await payrollAdapter.deleteTicketTransaction(id)
      await loadRealData()
    }
  }

  // Filter Logic
  const filteredList = bonuses.filter(item => {
    if (filterType !== 'all' && !item.ticket_type.includes(filterType)) return false
    return true
  })

  return (
    <AppShell title="Phiếu cộng tiền">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="space-y-4 text-xs">
        {/* TOP FILTER BAR (100% MATCHING REFERENCE SCREENSHOT) */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStore}
              onChange={e => setFilterStore(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">HBP - Trà sữa phô mai tươi HOMIES</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả loại phiếu</option>
              <option value="Phiếu thưởng">Phiếu thưởng</option>
              <option value="Phiếu cộng tiền khác">Phiếu cộng tiền khác</option>
              <option value="Phiếu cộng tiền tự định nghĩa">Phiếu cộng tiền tự định nghĩa</option>
            </select>

            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 font-medium focus:outline-none cursor-pointer"
            >
              <option value="08/2026">Tháng 08 năm 2026</option>
              <option value="07/2026">Tháng 07 năm 2026</option>
            </select>

            <button
              onClick={loadRealData}
              className="btn bg-sky-600 hover:bg-sky-500 text-white text-xs py-1.5 px-4 rounded-xl font-bold border-0 cursor-pointer shadow-xs"
            >
              Lọc
            </button>

            <button
              onClick={loadRealData}
              className="btn bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs p-1.5 rounded-xl border border-slate-700 cursor-pointer"
              title="Tải lại CSDL Supabase"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn bg-sky-600 hover:bg-sky-500 text-white text-xs py-1.5 px-4 rounded-xl font-bold border-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus size={15} /> Thêm mới
          </button>
        </div>

        {/* FULL DATA TABLE (REAL DB DATA FROM SUPABASE) */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                <th className="p-3 w-10 text-center border-r border-slate-200">#</th>
                <th className="p-3 border-r border-slate-200 min-w-[120px]">Ngày / Chu kỳ</th>
                <th className="p-3 border-r border-slate-200 min-w-[180px]">Chi nhánh</th>
                <th className="p-3 border-r border-slate-200 min-w-[170px]">Loại phiếu</th>
                <th className="p-3 border-r border-slate-200 min-w-[150px]">Nhân viên</th>
                <th className="p-3 border-r border-slate-200 min-w-[140px]">Hình thức cộng</th>
                <th className="p-3 border-r border-slate-200 text-right min-w-[120px]">Giá trị cộng thêm</th>
                <th className="p-3 border-r border-slate-200 min-w-[180px]">Ghi chú</th>
                <th className="p-3 border-r border-slate-200 text-center min-w-[70px]">Ảnh</th>
                <th className="p-3 border-r border-slate-200 text-center min-w-[100px]">Trạng thái</th>
                <th className="p-3 text-center min-w-[110px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 font-medium">
                    <Loader2 size={18} className="animate-spin inline mr-2 text-sky-600" />
                    Đang tải dữ liệu thực tế từ Supabase database...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 font-medium">
                    Chưa có phiếu cộng tiền nào trong CSDL Supabase. Hãy bấm nút <strong>&quot;+ Thêm mới&quot;</strong> ở góc phải để tạo phiếu thật!
                  </td>
                </tr>
              ) : (
                filteredList.map((row, index) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-center text-slate-400 font-mono border-r border-slate-100">{index + 1}</td>
                    <td className="p-3 border-r border-slate-100 font-semibold text-slate-800">{row.date_scope}</td>
                    <td className="p-3 border-r border-slate-100 text-slate-600">{row.branch}</td>
                    <td className="p-3 border-r border-slate-100">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {row.ticket_type}
                      </span>
                    </td>
                    <td className="p-3 border-r border-slate-100 font-bold text-slate-900">{row.employee_name}</td>
                    <td className="p-3 border-r border-slate-100 text-slate-700">{row.calc_type}</td>
                    <td className="p-3 border-r border-slate-100 text-right font-mono font-black text-emerald-600 text-sm">
                      +{fmt(row.amount)}
                    </td>
                    <td className="p-3 border-r border-slate-100 text-slate-500 max-w-[200px] truncate">{row.note}</td>
                    <td className="p-3 border-r border-slate-100 text-center">
                      {row.image ? (
                        <button onClick={() => alert('Xem ảnh chứng từ')} className="text-sky-600 hover:underline font-bold">
                          <Eye size={16} className="inline" />
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3 border-r border-slate-100 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        row.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {row.status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(row.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-all cursor-pointer"
                            title="Duyệt phiếu"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                          title="Xóa phiếu"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL INTERACTIVE MODAL: THÊM PHIẾU CỘNG TIỀN */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 transition-all">
            <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Thêm phiếu cộng tiền</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-primary-50 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4.5 max-h-[82vh] overflow-y-auto text-xs">
              <div>
                <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                  Chi nhánh <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                >
                  <option value="all">HBP - Trà sữa phô mai tươi HOMIES</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                  Loại phiếu <span className="text-rose-500">*</span>
                </label>
                <select
                  value={ticketType}
                  onChange={e => setTicketType(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                >
                  <option value="Phiếu thưởng">Phiếu thưởng</option>
                  <option value="Phiếu cộng tiền khác">Phiếu cộng tiền khác</option>
                  <option value="Phiếu cộng tiền tự định nghĩa">Phiếu cộng tiền tự định nghĩa</option>
                </select>
              </div>

              {ticketType === 'Phiếu cộng tiền tự định nghĩa' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-gray-800 font-bold text-xs">
                      Chọn loại phiếu cộng tiền tự định nghĩa <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => router.push('/settings/payroll?tab=tickets')}
                      className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
                    >
                      Tạo phiếu tự định nghĩa
                    </button>
                  </div>
                  <select
                    value={customTicketType}
                    onChange={e => {
                      const val = e.target.value
                      setCustomTicketType(val)
                      if (val === 'Thưởng chuyên cần') setTicketAmount(100000)
                      else if (val === 'Thưởng gương mẫu') setTicketAmount(100000)
                      else if (val === 'Team truyền thông') setTicketAmount(1200000)
                      else if (val === 'Phụ cấp chức vụ senior') setTicketAmount(200000)
                      else setTicketAmount(0)
                    }}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                  >
                    <option value="Thưởng doanh thu">Thưởng doanh thu (0đ)</option>
                    <option value="Thưởng chuyên cần">Thưởng chuyên cần (100.000đ)</option>
                    <option value="Thưởng gương mẫu">Thưởng gương mẫu (100.000đ)</option>
                    <option value="Team truyền thông">Team truyền thông (1.200.000đ)</option>
                    <option value="Phụ cấp chức vụ senior">Phụ cấp chức vụ senior (200.000đ)</option>
                    <option value="Phụ Cấp Hỗ Trợ Vận Hành Quán">Phụ Cấp Hỗ Trợ Vận Hành Quán (0đ)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                  Nhân viên được cộng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetEmpId}
                  onChange={e => setTargetEmpId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                >
                  <option value="">Chọn nhân viên được cộng</option>
                  {mockEmployees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} ({e.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    Cộng tiền cho <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={ticketScope}
                    onChange={e => setTicketScope(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                  >
                    <option value="date">Ngày cụ thể</option>
                    <option value="period">Chu kỳ lương</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    {ticketScope === 'period' ? 'Chu kỳ áp dụng *' : 'Ngày được cộng *'}
                  </label>
                  {ticketScope === 'period' ? (
                    <select
                      value={selectedPeriod}
                      onChange={e => setSelectedPeriod(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                    >
                      <option value="2026-02">Kỳ tháng 02/2026 (01/02 - 28/02)</option>
                      <option value="2026-01">Kỳ tháng 01/2026 (01/01 - 31/01)</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={ticketDate}
                        onChange={e => setTicketDate(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 font-semibold focus:border-sky-500 focus:outline-none text-xs shadow-2xs"
                      />
                      <Calendar size={16} className="absolute right-3.5 top-3.5 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    Hình thức cộng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={ticketCalcType}
                    onChange={e => setTicketCalcType(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                  >
                    <option value="amount">Cộng tiền</option>
                    <option value="percent">Cộng phần trăm lương</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    Giá trị cộng thêm <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-sky-500 shadow-2xs">
                    <input
                      type="number"
                      placeholder="0"
                      value={ticketAmount || ''}
                      onChange={e => setTicketAmount(Number(e.target.value))}
                      className="flex-1 p-3 text-gray-900 font-black text-sm focus:outline-none"
                    />
                    <span className="bg-slate-50 text-slate-600 px-3.5 py-3 border-l border-gray-200 font-bold text-xs flex items-center">
                      {ticketCalcType === 'percent' ? '%' : 'VNĐ'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/90 border border-sky-100 text-sky-900 leading-relaxed text-xs font-medium space-y-1">
                <div>
                  Giá trị tiền mà bạn khai báo tại đây sẽ được cộng vào lương của nhân viên theo ngày hoặc chu kỳ lương mà bạn khai báo ở trên.
                </div>
                <div className="text-[11px] text-sky-700 font-semibold">
                  Nếu chi nhánh là Công ty ➔ Phiếu cộng tiền sẽ cộng vào Lương theo công ty của nhân viên
                </div>
              </div>

              <div>
                <label className="block text-gray-800 font-bold mb-1.5 text-xs">Ghi chú</label>
                <textarea
                  rows={3}
                  placeholder="Nhập ghi chú"
                  value={ticketNote}
                  onChange={e => setTicketNote(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 focus:border-sky-500 focus:outline-none resize-none text-xs shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-gray-800 font-bold mb-1.5 text-xs">Ảnh</label>
                {ticketImage ? (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200">
                    <Image src={ticketImage} alt="Chứng từ" fill className="object-cover" />
                    <button
                      onClick={() => setTicketImage(null)}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-500 flex flex-col items-center justify-center text-slate-400 hover:text-sky-600 transition-all cursor-pointer bg-slate-50/60"
                  >
                    <ImageIcon size={22} />
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowModal(false)}
                className="btn bg-slate-500 hover:bg-slate-600 text-white text-xs py-2.5 px-5 rounded-xl border-0 font-semibold cursor-pointer"
              >
                Bỏ qua
              </button>
              <button
                onClick={handleSaveBonus}
                className="btn bg-sky-600 hover:bg-sky-500 text-white text-xs py-2.5 px-6 rounded-xl border-0 font-bold cursor-pointer shadow-sm"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
