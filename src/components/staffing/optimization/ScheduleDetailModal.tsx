import { OptimizationPlan } from '@/lib/staffing/types';
import { X, Check, CalendarDays } from 'lucide-react';

interface ScheduleDetailModalProps {
  plan: OptimizationPlan;
  onClose: () => void;
  onSelect: () => void;
}

export default function ScheduleDetailModal({ plan, onClose, onSelect }: ScheduleDetailModalProps) {
  // Helper to render timeline bar
  const renderTimeline = (start: string, end: string, color: string) => {
    const startH = parseInt(start.split(':')[0]);
    const endH = parseInt(end.split(':')[0]);
    const duration = endH - startH;
    
    // Grid is 7h to 23h (16 cols) usually, but let's do 0-24 for safety or 6-24
    // Requirement says 7h-23h in example.
    // Let's use 6am to 24pm (18 hours)
    const minHour = 6;
    const maxHour = 24; // 00:00 next day
    const totalHours = maxHour - minHour;
    
    const left = ((startH - minHour) / totalHours) * 100;
    const width = (duration / totalHours) * 100;

    return (
      <div 
        className={`absolute h-4 rounded-full ${color} opacity-80`}
        style={{ left: `${left}%`, width: `${width}%` }} 
      />
    );
  };

  const hours = Array.from({length: 19}, (_, i) => i + 6); // 6, 7 ... 24

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-vanilla-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays size={18} className="text-primary-600" />
              Lịch làm việc chi tiết - {plan.name}
            </h3>
            <p className="text-xs text-gray-500">Mô phỏng ca làm việc điển hình trong ngày</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Timeline Visual */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-4">Timeline trong ngày</h4>
            <div className="relative pt-6 pb-2">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {hours.map((h) => (
                    <div key={h} className="flex-1 border-l border-gray-100 first:border-l-0 relative min-h-[200px]">
                        <span className="absolute -top-6 -left-2 text-xs text-gray-400">{h}h</span>
                    </div>
                ))}
              </div>

              {/* Rows */}
              <div className="space-y-3 relative z-10">
                {plan.fulltime.map((slot, i) => (
                    <div key={`ft-${i}`} className="relative h-10 flex items-center group">
                        <div className="w-24 shrink-0 text-xs font-bold text-gray-700">FT {i+1}</div>
                        <div className="flex-1 h-full relative border-t border-gray-50 group-hover:bg-vanilla-50/50">
                            {renderTimeline(slot.startTime, slot.endTime, 'bg-primary-500')}
                            <div className="absolute left-[100px] top-1 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                {slot.role} ({slot.shiftName})
                            </div>
                        </div>
                    </div>
                ))}
                {plan.parttime.map((slot, i) => (
                    <div key={`pt-${i}`} className="relative h-10 flex items-center group">
                        <div className="w-24 shrink-0 text-xs font-bold text-gray-500">PT {i+1}</div>
                        <div className="flex-1 h-full relative border-t border-gray-50 group-hover:bg-vanilla-50/50">
                             {renderTimeline(slot.startTime, slot.endTime, 'bg-warning-400')}
                             <div className="absolute left-[100px] top-1 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                {slot.role} ({slot.shiftName})
                            </div>
                        </div>
                    </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cost Table */}
          <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4">Bảng tổng hợp chi phí</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-vanilla-50 text-xs text-gray-500 font-bold uppercase">
                          <tr>
                              <th className="p-3">Nhân viên</th>
                              <th className="p-3">Loại</th>
                              <th className="p-3">Ca</th>
                              <th className="p-3 text-right">Giờ/ngày</th>
                              <th className="p-3 text-right">Lương/tháng (ước tính)</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {plan.fulltime.map((s, i) => (
                              <tr key={i}>
                                  <td className="p-3 font-medium text-gray-700">FT {i+1} - {s.role}</td>
                                  <td className="p-3"><span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded text-xs font-bold">Full-time</span></td>
                                  <td className="p-3 text-gray-600">{s.shiftName}</td>
                                  <td className="p-3 text-right">{s.hoursPerDay}h</td>
                                  <td className="p-3 text-right font-medium">{s.monthlyCost.toLocaleString('vi-VN')}</td>
                              </tr>
                          ))}
                          {plan.parttime.map((s, i) => (
                              <tr key={i}>
                                  <td className="p-3 font-medium text-gray-700">PT {i+1} - {s.role}</td>
                                  <td className="p-3"><span className="bg-warning-100 text-warning-700 px-2 py-0.5 rounded text-xs font-bold">Part-time</span></td>
                                  <td className="p-3 text-gray-600">{s.shiftName}</td>
                                  <td className="p-3 text-right">{s.hoursPerDay}h</td>
                                  <td className="p-3 text-right font-medium">{s.monthlyCost.toLocaleString('vi-VN')}</td>
                              </tr>
                          ))}
                          <tr className="bg-vanilla-50 font-bold text-gray-900 border-t-2 border-gray-200">
                              <td colSpan={4} className="p-4 text-right">TỔNG CHI PHÍ LƯƠNG</td>
                              <td className="p-4 text-right text-lg text-primary">{plan.totalCost.toLocaleString('vi-VN')}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-vanilla-50">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-primary-50 transition-colors font-medium"
          >
            Đóng
          </button>
          <button 
            onClick={onSelect}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
          >
            <Check size={18} /> Chọn phương án này
          </button>
        </div>

      </div>
    </div>
  );
}
