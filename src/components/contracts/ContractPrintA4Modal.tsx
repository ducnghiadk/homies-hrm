'use client'

import React, { useRef } from 'react'
import { CheckCircle2, Printer, X } from 'lucide-react'
import type { EmployeeContract } from '@/lib/services/contract-service'
import type { AuthUser } from '@/store/auth-store'

interface ContractPrintA4ModalProps {
  isOpen: boolean
  onClose: () => void
  contract: EmployeeContract
  employee?: AuthUser | null
  storeName?: string
  positionName?: string
}

export default function ContractPrintA4Modal({
  isOpen,
  onClose,
  contract,
  employee,
  storeName = 'Homies Milk Tea',
  positionName = 'Nhân viên vận hành',
}: ContractPrintA4ModalProps) {
  const printContentRef = useRef<HTMLDivElement | null>(null)

  if (!isOpen) return null

  const contractCode = contract.customFields['contract.code'] || contract.id
  const companySigner = contract.customFields['company.signer_name'] || 'Hoàng Thị Yến'
  const companyTitle = contract.customFields['company.signer_title'] || 'Trưởng phòng Nhân sự'
  const salaryOfficial = contract.customFields['salary.official'] || contract.customFields['salary.hourly_or_shift'] || 'Theo chính sách công ty'
  const allowances = contract.customFields['salary.allowances'] || 'Theo chính sách phụ cấp F&B'
  const schedule = contract.customFields['job.working_schedule'] || 'Theo lịch phân ca hệ thống Homies HRM'
  const mainDuties = contract.customFields['job.main_duties'] || 'Pha chế, phục vụ đồ uống, kiểm kê nguyên liệu và vận hành ca theo đúng quy chuẩn an toàn vệ sinh F&B.'
  const note = contract.customFields['policy.contract_note'] || 'Không có ghi chú bổ sung.'

  // Tìm chữ ký của nhân viên và HR
  const empSig = contract.signatures.find((s) => s.role === 'employee')
  const hrSig = contract.signatures.find((s) => s.role === 'hr')

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-xs">
      <div
        className="flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Thanh công cụ (ẩn khi in) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-[#2F6FA8]">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#001D3D]">Xem trước và In hợp đồng lao động A4</h3>
              <p className="text-xs text-slate-500">Chuẩn hóa thể thức hồ sơ thanh tra lao động</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-4 py-2 text-xs font-bold text-white hover:bg-[#1D3E61] transition shadow-xs"
            >
              <Printer size={14} />
              In ngay / Lưu PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Khung tài liệu cuộn được (định dạng A4) */}
        <div className="flex-1 overflow-y-auto bg-slate-100/70 p-4 sm:p-8 print:overflow-visible print:bg-white print:p-0">
          <div
            ref={printContentRef}
            id="printable-contract-a4"
            className="contract-a4-page mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white p-8 sm:p-14 shadow-lg border border-slate-200/80 text-slate-900 print:max-w-none print:shadow-none print:border-none print:p-0"
            style={{
              fontFamily: '"Times New Roman", Times, serif, "Inter", sans-serif',
              lineHeight: '1.6',
            }}
          >
            {/* Header Quốc hiệu Tiêu ngữ */}
            <div className="text-center mb-6">
              <p className="text-xs font-bold uppercase tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="text-xs font-semibold underline underline-offset-4 decoration-slate-400">Độc lập - Tự do - Hạnh phúc</p>
              <p className="mt-6 text-lg font-bold uppercase tracking-wide text-slate-900">HỢP ĐỒNG LAO ĐỘNG</p>
              <p className="text-xs italic text-slate-600">Số: {contractCode}</p>
            </div>

            {/* Căn cứ pháp lý */}
            <div className="mb-4 text-xs italic text-slate-700 leading-relaxed">
              <p>- Căn cứ Bộ luật Lao động số 45/2019/QH14 được Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam thông qua ngày 20/11/2019;</p>
              <p>- Căn cứ nhu cầu sử dụng lao động của Công ty TNHH Homies F&B và khả năng của người lao động;</p>
              <p className="mt-1">Hôm nay, ngày {contract.startDate.split('-')[2] || '...'} tháng {contract.startDate.split('-')[1] || '...'} năm {contract.startDate.split('-')[0] || '...'}, hai bên gồm:</p>
            </div>

            {/* Bên A: Người sử dụng lao động */}
            <div className="mb-4 text-xs leading-relaxed">
              <p className="font-bold uppercase text-slate-900">BÊN A - NGƯỜI SỬ DỤNG LAO ĐỘNG: CÔNG TY TNHH HOMIES F&B</p>
              <div className="grid grid-cols-1 gap-0.5 mt-1 pl-3 text-slate-800">
                <p>• Địa chỉ trụ sở: 89 Hồ Bá Phấn, Phường Phước Long A, TP. Thủ Đức, TP. Hồ Chí Minh</p>
                <p>• Mã số thuế: 0318999888</p>
                <p>• Đại diện bởi: <span className="font-semibold">{companySigner}</span> — Chức vụ: <span className="font-semibold">{companyTitle}</span></p>
                <p>• Đơn vị công tác / Cửa hàng: <span className="font-semibold">{storeName}</span></p>
              </div>
            </div>

            {/* Bên B: Người lao động */}
            <div className="mb-5 text-xs leading-relaxed">
              <p className="font-bold uppercase text-slate-900">BÊN B - NGƯỜI LAO ĐỘNG</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 mt-1 pl-3 text-slate-800">
                <p>• Họ và tên: <span className="font-bold uppercase">{employee?.full_name || contract.employeeId}</span></p>
                <p>• Ngày sinh: {employee?.date_of_birth || contract.customFields['employee.date_of_birth'] || '...'}</p>
                <p>• Số CCCD/CMND: <span className="font-mono font-bold">{employee?.cccd || contract.customFields['employee.cccd'] || '...'}</span></p>
                <p>• Ngày cấp: {contract.customFields['employee.cccd_issue_date'] || '...'}</p>
                <p className="sm:col-span-2">• Địa chỉ thường trú: {employee?.address || contract.customFields['employee.address'] || 'Chưa cập nhật'}</p>
                <p>• Số điện thoại: {employee?.phone || contract.customFields['employee.phone'] || '...'}</p>
                <p>• Email: {employee?.email || '...'}</p>
                <p className="sm:col-span-2">• Tài khoản ngân hàng: {contract.customFields['employee.bank_account'] || employee?.bank_account_no || '...'} ({contract.customFields['employee.bank_name'] || employee?.bank_name || 'Ngân hàng'})</p>
              </div>
            </div>

            <p className="mb-4 text-xs italic font-medium text-slate-800">Cùng thỏa thuận ký kết Hợp đồng lao động với các điều khoản sau đây:</p>

            {/* Các điều khoản hợp đồng */}
            <div className="space-y-3.5 text-xs leading-relaxed text-slate-800">
              <div>
                <p className="font-bold text-slate-900">Điều 1. Vị trí công tác và thời hạn hợp đồng</p>
                <p className="pl-3 mt-0.5">• Chức danh chuyên môn / Vị trí công tác: <span className="font-bold">{positionName}</span></p>
                <p className="pl-3">• Địa điểm làm việc: Tại cơ sở <span className="font-semibold">{storeName}</span> và các cơ sở thuộc chuỗi Homies F&B theo điều động.</p>
                <p className="pl-3">• Loại hợp đồng: {contract.endDate ? 'Hợp đồng xác định thời hạn' : 'Hợp đồng không xác định thời hạn'}</p>
                <p className="pl-3">• Thời hạn: Từ ngày <span className="font-semibold">{contract.startDate}</span> {contract.endDate ? `đến ngày ${contract.endDate}` : '(chưa có ngày kết thúc)'}.</p>
              </div>

              <div>
                <p className="font-bold text-slate-900">Điều 2. Chế độ làm việc và nhiệm vụ chuyên môn</p>
                <p className="pl-3 mt-0.5">• Thời giờ làm việc: {schedule}</p>
                <p className="pl-3">• Nhiệm vụ chính: {mainDuties}</p>
                <p className="pl-3">• Tuân thủ quy chuẩn vệ sinh an toàn thực phẩm, bảo quản nguyên liệu, tác phong đồng phục và quy trình quản lý dòng tiền tại quầy F&B.</p>
              </div>

              <div>
                <p className="font-bold text-slate-900">Điều 3. Chế độ tiền lương và phụ cấp</p>
                <p className="pl-3 mt-0.5">• Mức lương chính: <span className="font-bold font-mono">{salaryOfficial}</span></p>
                <p className="pl-3">• Phụ cấp / Trợ cấp: {allowances}</p>
                <p className="pl-3">• Kỳ trả lương: Ngày 10 hàng tháng qua hình thức chuyển khoản ngân hàng.</p>
              </div>

              <div>
                <p className="font-bold text-slate-900">Điều 4. Quyền và nghĩa vụ của Người lao động</p>
                <p className="pl-3 mt-0.5">• Được trang bị đầy đủ dụng cụ, đồng phục bảo hộ và đào tạo nghiệp vụ F&B.</p>
                <p className="pl-3">• Được hưởng các chế độ bảo hiểm, khen thưởng định kỳ theo hiệu quả KPI và chính sách chuỗi Homies.</p>
                <p className="pl-3">• Hoàn thành nhiệm vụ công việc, chấp hành nghiêm nội quy lao động và bảo mật công thức pha chế của chuỗi.</p>
              </div>

              <div>
                <p className="font-bold text-slate-900">Điều 5. Quyền và nghĩa vụ của Người sử dụng lao động</p>
                <p className="pl-3 mt-0.5">• Điều hành, phân công ca làm việc công bằng, minh bạch qua hệ thống HRM.</p>
                <p className="pl-3">• Thanh toán đầy đủ tiền lương, phụ cấp đúng kỳ hạn đã thỏa thuận.</p>
              </div>

              <div>
                <p className="font-bold text-slate-900">Điều 6. Điều khoản chung và thanh lý hợp đồng</p>
                <p className="pl-3 mt-0.5">• Hợp đồng này được lưu trữ điện tử trên hệ thống quản lý nhân sự Homies HRM và có giá trị pháp lý tương đương bản giấy.</p>
                <p className="pl-3">• Ghi chú thỏa thuận: {note}</p>
              </div>
            </div>

            {/* Khu vực chữ ký hai bên */}
            <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 gap-4 text-center text-xs">
              <div>
                <p className="font-bold uppercase text-slate-900">BÊN B - NGƯỜI LAO ĐỘNG</p>
                <p className="italic text-[11px] text-slate-500">(Ký và ghi rõ họ tên)</p>
                <div className="my-2 flex h-24 items-center justify-center">
                  {empSig?.signatureImageUrl || (empSig?.evidence && empSig.evidence.startsWith('data:image')) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={empSig.signatureImageUrl || empSig.evidence}
                      alt="Chữ ký người lao động"
                      className="max-h-20 max-w-full object-contain"
                    />
                  ) : empSig ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-800">
                      <CheckCircle2 size={13} className="inline mr-1 text-emerald-600" />
                      Đã ký điện tử: {empSig.signedAt.slice(0, 10)}
                    </div>
                  ) : (
                    <span className="text-[11px] italic text-slate-400">(Chưa ký)</span>
                  )}
                </div>
                <p className="font-bold uppercase text-slate-900">{employee?.full_name || contract.employeeId}</p>
              </div>

              <div>
                <p className="font-bold uppercase text-slate-900">BÊN A - ĐẠI DIỆN CÔNG TY</p>
                <p className="italic text-[11px] text-slate-500">(Ký tên và đóng dấu)</p>
                <div className="my-2 flex h-24 items-center justify-center">
                  {hrSig?.signatureImageUrl || (hrSig?.evidence && hrSig.evidence.startsWith('data:image')) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={hrSig.signatureImageUrl || hrSig.evidence}
                      alt="Chữ ký đại diện HR"
                      className="max-h-20 max-w-full object-contain"
                    />
                  ) : hrSig ? (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] text-indigo-800">
                      <CheckCircle2 size={13} className="inline mr-1 text-indigo-600" />
                      HR Countersigned: {hrSig.signedAt.slice(0, 10)}
                    </div>
                  ) : (
                    <span className="text-[11px] italic text-slate-400">(Chờ đại diện ký)</span>
                  )}
                </div>
                <p className="font-bold uppercase text-slate-900">{companySigner}</p>
                <p className="text-[11px] text-slate-600">{companyTitle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Style hỗ trợ in ấn A4 chuẩn chỉ */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-contract-a4,
          #printable-contract-a4 * {
            visibility: visible;
          }
          #printable-contract-a4 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm 20mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm 15mm;
          }
        }
      `}</style>
    </div>
  )
}
