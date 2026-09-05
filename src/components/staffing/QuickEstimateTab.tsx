import { useState, useMemo } from 'react';
import { calculateQuickEstimate } from '@/lib/staffing/quick-estimate';
import { QuickEstimateState, QuickEstimateResult } from '@/lib/staffing/types';
import BusinessModelSelector from './shared/BusinessModelSelector';
import { toast } from 'sonner';
import { Zap } from 'lucide-react';
import HeroResultCard from './HeroResultCard';

interface QuickEstimateTabProps {
  onApplyToStaffing: (result: QuickEstimateResult) => void;
  onAnalyzeDetail: (state: QuickEstimateState) => void;
}

export default function QuickEstimateTab({ onApplyToStaffing, onAnalyzeDetail }: QuickEstimateTabProps) {
  const [input, setInput] = useState<QuickEstimateState>({
    businessModel: 'dine-in',
    dailyCups: 100,
    operatingHours: 10,
    appRatio: 50,
    avgCupsPerOrder: 2.5
  });

  const result = useMemo<QuickEstimateResult | null>(() => {
    if (input.dailyCups > 0 && input.operatingHours > 0) {
      return calculateQuickEstimate(input);
    }
    return null;
  }, [input]);

  const handleApply = () => {
    if (result) {
      onApplyToStaffing(result);
      toast.success('✅ Đã cập nhật định biên nhân sự');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto p-4">
      {/* LEFT: INPUTS */}
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <Zap size={22} className="text-primary" /> Tính nhanh định biên
          </h2>
          <p className="text-gray-500">Trả lời 3 câu hỏi, có kết quả ngay</p>
        </div>

        {/* Q1: Business Model */}
        <div className="space-y-3">
          <label className="text-sm font-medium block">1. Quán bạn bán theo hình thức nào?</label>
          <BusinessModelSelector 
            value={input.businessModel} 
            onChange={(val) => setInput({ ...input, businessModel: val })} 
          />
          
          {input.businessModel === 'app-delivery' && (
            <div className="bg-vanilla-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-4 mt-2 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tỷ lệ đơn App (%)</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded-lg text-sm"
                  value={input.appRatio}
                  onChange={e => setInput({...input, appRatio: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Số ly TB/đơn</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded-lg text-sm"
                  value={input.avgCupsPerOrder}
                  onChange={e => setInput({...input, avgCupsPerOrder: Number(e.target.value)})}
                />
              </div>
            </div>
          )}
        </div>

        {/* Q2: Daily Cups */}
        <div className="space-y-3">
          <label className="text-sm font-medium block">2. Quán bán bao nhiêu ly/ngày?</label>
          <div className="flex gap-2 flex-wrap">
            {[50, 100, 200, 300, 500].map(cups => (
              <button
                key={cups}
                onClick={() => setInput({ ...input, dailyCups: cups })}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  input.dailyCups === cups 
                    ? 'border-primary bg-primary text-white' 
                    : 'border-gray-200 hover:border-primary/50 text-gray-600'
                }`}
              >
                {cups}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-500">Hoặc nhập số cụ thể:</span>
            <input 
              type="number" 
              className="w-24 p-2 border rounded-lg text-sm font-bold text-center"
              value={input.dailyCups}
              onChange={e => setInput({...input, dailyCups: Number(e.target.value)})}
            />
            <span className="text-sm text-gray-500">ly</span>
          </div>
        </div>

        {/* Q3: Operating Hours */}
        <div className="space-y-3">
          <label className="text-sm font-medium block">3. Quán mở cửa mấy tiếng/ngày?</label>
          <div className="flex gap-2">
             {[8, 10, 12, 14, 16].map(hours => (
              <button
                key={hours}
                onClick={() => setInput({ ...input, operatingHours: hours })}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  input.operatingHours === hours 
                    ? 'border-primary bg-primary text-white' 
                    : 'border-gray-200 hover:border-primary/50 text-gray-600'
                }`}
              >
                {hours} tiếng
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: RESULT — 3-level visual hierarchy */}
      <div className="relative">
        <div className="sticky top-4">
          <HeroResultCard
            result={result}
            businessModel={input.businessModel}
            dailyCups={input.dailyCups}
            operatingHours={input.operatingHours}
            onApply={handleApply}
            onAnalyzeDetail={() => onAnalyzeDetail(input)}
          />
        </div>
      </div>
    </div>
  );
}
