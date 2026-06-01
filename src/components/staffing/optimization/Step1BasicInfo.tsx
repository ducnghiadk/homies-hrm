import { OptimizationState } from '@/lib/staffing/types';
import BusinessModelSelector from '../shared/BusinessModelSelector';
import { ArrowRight, MapPin } from 'lucide-react';

interface Step1Props {
  state: OptimizationState;
  onUpdate: (data: Partial<OptimizationState>) => void;
  onNext: () => void;
}

export default function Step1BasicInfo({ state, onUpdate, onNext }: Step1Props) {
  const { basicInfo } = state;

  const updateBasicInfo = (updates: Partial<typeof basicInfo>) => {
    onUpdate({ basicInfo: { ...basicInfo, ...updates } });
  };

  const isValid = basicInfo.dailyCups > 0 && basicInfo.operatingDays.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <MapPin size={20} className="text-error-500" />
          Bước 1/4: Thông tin quán
        </h2>
        <p className="text-gray-500 text-sm">Cung cấp thông tin cơ bản để tính toán nhu cầu nhân sự</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        
        {/* Model */}
        <div className="space-y-3">
          <label className="text-sm font-medium block">Mô hình kinh doanh</label>
          <BusinessModelSelector 
            value={basicInfo.businessModel}
            onChange={(val) => updateBasicInfo({ businessModel: val })}
          />
          
          {basicInfo.businessModel === 'app-delivery' && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-4 mt-2">
               <div>
                <label className="text-xs text-gray-500 mb-1 block">Tỷ lệ đơn App (%)</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded-lg text-sm"
                  value={basicInfo.appRatio}
                  onChange={e => updateBasicInfo({ appRatio: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Số ly TB/đơn</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded-lg text-sm"
                  value={basicInfo.avgCupsPerOrder}
                  onChange={e => updateBasicInfo({ avgCupsPerOrder: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Daily Cups */}
        <div className="space-y-3">
            <label className="text-sm font-medium block">Số ly bán mỗi ngày</label>
            <div className="relative">
                <input 
                    type="number" 
                    className="w-full p-3 pl-4 pr-12 border rounded-xl text-lg font-bold"
                    placeholder="VD: 200"
                    value={basicInfo.dailyCups || ''}
                    onChange={e => updateBasicInfo({ dailyCups: Number(e.target.value) })}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">ly</span>
            </div>
        </div>

        {/* Operating Hours */}
        <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-sm font-medium block">Giờ mở cửa</label>
                <select 
                    className="w-full p-3 border rounded-xl bg-white"
                    value={basicInfo.openTime}
                    onChange={e => updateBasicInfo({ openTime: e.target.value })}
                >
                    {Array.from({length: 24}).map((_, i) => (
                        <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                            {i.toString().padStart(2, '0')}:00
                        </option>
                    ))}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium block">Giờ đóng cửa</label>
                <select 
                     className="w-full p-3 border rounded-xl bg-white"
                     value={basicInfo.closeTime}
                     onChange={e => updateBasicInfo({ closeTime: e.target.value })}
                >
                    {Array.from({length: 24}).map((_, i) => (
                        <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                            {i.toString().padStart(2, '0')}:00
                        </option>
                    ))}
                </select>
             </div>
        </div>

        {/* Operating Days */}
        <div className="space-y-3">
            <label className="text-sm font-medium block">Ngày hoạt động</label>
            <div className="flex gap-2 justify-between">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => {
                    // Map T2->1, CN->0
                    const dayVal = index === 6 ? 0 : index + 1;
                    const isSelected = basicInfo.operatingDays.includes(dayVal);
                    
                    return (
                        <button
                            key={day}
                            onClick={() => {
                                const newDays = isSelected 
                                    ? basicInfo.operatingDays.filter(d => d !== dayVal)
                                    : [...basicInfo.operatingDays, dayVal];
                                updateBasicInfo({ operatingDays: newDays });
                            }}
                            className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${
                                isSelected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                        >
                            {day}
                        </button>
                    )
                })}
            </div>
        </div>

      </div>

      <div className="flex justify-end">
        <button 
            onClick={onNext}
            disabled={!isValid}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
            Tiếp tục <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
