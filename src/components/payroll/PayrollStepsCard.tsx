'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, Clock, Lock, RefreshCw, Send } from 'lucide-react';

type Props = {
  /** Số ca chấm công chưa duyệt trong kỳ */
  pendingShifts: number;
  /** Số nhóm cảnh báo dữ liệu lương (thiếu đơn giá, lương âm...) */
  anomalyCount: number;
  /** Bảng lương đã tính xong và có người */
  hasResults: boolean;
  isLoading: boolean;
  isLocked: boolean;
  totalRows: number;
  sentRows: number;
  paidRows: number;
  canRecalculate: boolean;
  onRecalculate: () => void;
  onGoToTable: () => void;
};

type StepState = 'done' | 'current' | 'todo';

/** 4 bước làm bảng lương mỗi tháng, đọc trạng thái từ số liệu thật của trang bảng lương. */
export function PayrollStepsCard(props: Props) {
  const { pendingShifts, anomalyCount, hasResults, isLoading, isLocked, totalRows, sentRows, paidRows } = props;

  const attendanceOk = pendingShifts === 0;
  const calculated = hasResults && !isLoading;
  const reviewed = calculated && anomalyCount === 0;
  const allPaid = totalRows > 0 && paidRows >= totalRows;

  const states: StepState[] = (() => {
    const done = [attendanceOk, calculated, reviewed, isLocked && allPaid];
    const firstOpen = done.findIndex((d) => !d);
    return done.map((d, i) => (d ? 'done' : i === firstOpen ? 'current' : 'todo'));
  })();

  return (
    <section className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
      <div className="mb-3">
        <h2 className="text-base font-bold text-[#001D3D]">Làm bảng lương tháng này</h2>
        <p className="text-xs text-gray-500">Làm lần lượt 4 bước. Bước đang cần làm có viền xanh.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Step
          n={1}
          state={states[0]}
          title="Kiểm tra chấm công"
          detail={attendanceOk ? 'Không còn ca chấm công chờ duyệt.' : `Còn ${pendingShifts} ca chấm công chờ duyệt.`}
        >
          <Link href="/attendance" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#2F6FA8] hover:bg-gray-50">
            <Clock size={13} /> Mở bảng chấm công
          </Link>
        </Step>
        <Step
          n={2}
          state={states[1]}
          title="Tính lương"
          detail={isLoading ? 'Đang tính lương...' : hasResults ? 'Đã tính theo chấm công và Cài đặt lương.' : 'Chưa có kết quả tính lương.'}
        >
          <button
            type="button"
            onClick={props.onRecalculate}
            disabled={!props.canRecalculate || isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2F6FA8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#245a8a] disabled:opacity-50"
          >
            <RefreshCw size={13} /> {isLoading ? 'Đang tính...' : 'Tính lại lương'}
          </button>
        </Step>
        <Step
          n={3}
          state={states[2]}
          title="Xem lại, thêm thưởng hoặc trừ"
          detail={anomalyCount > 0 ? `Có ${anomalyCount} loại cảnh báo cần xem trong bảng.` : 'Không có cảnh báo. Thêm thưởng/trừ ở từng dòng nếu cần.'}
        >
          <button
            type="button"
            onClick={props.onGoToTable}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#2F6FA8] hover:bg-gray-50"
          >
            Xem bảng lương
          </button>
        </Step>
        <Step
          n={4}
          state={states[3]}
          title="Khóa sổ, gửi phiếu và trả lương"
          detail={
            isLocked
              ? `Đã khóa sổ. Đã gửi phiếu ${sentRows + paidRows}/${totalRows}, đã trả ${paidRows}/${totalRows} người.`
              : 'CEO bấm "Khóa Sổ Lương Tháng" trên bảng, sau đó gửi phiếu và thanh toán trong menu Thao tác.'
          }
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            {isLocked ? <><Send size={13} /> Dùng menu Thao tác</> : <><Lock size={13} /> Chưa khóa sổ</>}
          </span>
        </Step>
      </div>
    </section>
  );
}

function Step({ n, state, title, detail, children }: { n: number; state: StepState; title: string; detail: string; children: React.ReactNode }) {
  const box = state === 'current' ? 'border-[#2F6FA8] bg-sky-50/60' : state === 'done' ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-100 bg-gray-50/60';
  return (
    <div className={`flex flex-col gap-2 rounded-xl border p-3 ${box}`}>
      <div className="flex items-start gap-2">
        {state === 'done' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <Circle size={18} className={`mt-0.5 shrink-0 ${state === 'current' ? 'text-[#2F6FA8]' : 'text-gray-300'}`} />}
        <div>
          <p className="text-sm font-semibold text-[#001D3D]">Bước {n}: {title}</p>
          <p className="text-xs text-gray-600">{detail}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
