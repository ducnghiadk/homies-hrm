import { useState } from 'react';
import { X, Save, RotateCcw, Settings } from 'lucide-react';
import { AdminSettings } from '@/lib/staffing/types';
import SalaryInput from './shared/SalaryInput';

interface AdminSettingsModalProps {
  settings: AdminSettings;
  onSave: (newSettings: AdminSettings) => void;
  onClose: () => void;
}

export default function AdminSettingsModal({ settings, onSave, onClose }: AdminSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AdminSettings>(settings);

  // Default values for reset
  const defaults: AdminSettings = {
    productivity: 25,
    appOrderTimeBuffer: 30,
    defaultSalaryFT: 7000000,
    defaultSalaryPT: 25000,
    bhxhRatio: 30,
    costWarningThreshold: 20
  };

  const handleReset = () => {
    setLocalSettings(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        <div className="bg-vanilla-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Settings size={18} className="text-gray-600" /> Cài đặt hệ thống
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* PRODUCTIVITY */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Năng suất nhân viên</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Pha chế (ly/giờ)</label>
                        <input 
                            type="number" 
                            className="w-full p-2 border rounded-lg text-sm"
                            value={localSettings.productivity}
                            onChange={(e) => setLocalSettings({...localSettings, productivity: Number(e.target.value)})}
                        />
                        <p className="text-xs text-gray-400">Trung bình ngành: 20-30</p>
                    </div>
                     <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Buffer đơn App (%)</label>
                        <input 
                            type="number" 
                            className="w-full p-2 border rounded-lg text-sm"
                            value={localSettings.appOrderTimeBuffer}
                            onChange={(e) => setLocalSettings({...localSettings, appOrderTimeBuffer: Number(e.target.value)})}
                        />
                         <p className="text-xs text-gray-400">Thời gian thêm cho đóng gói</p>
                    </div>
                </div>
            </div>

            <div className="h-px bg-primary-50" />
            
             {/* SALARY DEFAULTS */}
             <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lương mặc định</h4>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                         <SalaryInput 
                            label="Full-time TB (tháng)"
                            value={localSettings.defaultSalaryFT}
                            onChange={(v) => setLocalSettings({...localSettings, defaultSalaryFT: v})}
                         />
                     </div>
                     <div>
                         <SalaryInput 
                             label="Part-time TB (giờ)"
                             suffix="đ/h"
                            value={localSettings.defaultSalaryPT}
                            onChange={(v) => setLocalSettings({...localSettings, defaultSalaryPT: v})}
                         />
                     </div>
                </div>
                 <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Tỷ lệ BHXH + Phụ cấp (%)</label>
                        <input 
                            type="number" 
                            className="w-full p-2 border rounded-lg text-sm"
                            value={localSettings.bhxhRatio}
                            onChange={(e) => setLocalSettings({...localSettings, bhxhRatio: Number(e.target.value)})}
                        />
                </div>
            </div>

             <div className="h-px bg-primary-50" />
            
             {/* WARNINGS */}
             <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cảnh báo</h4>
                 <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Ngưỡng chi phí nhân sự (%)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-full p-2 border rounded-lg text-sm pr-8"
                                value={localSettings.costWarningThreshold}
                                onChange={(e) => setLocalSettings({...localSettings, costWarningThreshold: Number(e.target.value)})}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                        </div>
                        <p className="text-xs text-gray-400">Cảnh báo khi chi phí lương {'>'} % doanh thu</p>
                </div>
             </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-vanilla-50 flex justify-between">
            <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
                <RotateCcw size={16} /> Khôi phục mặc định
            </button>
            <button 
                onClick={() => onSave(localSettings)}
                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-bold shadow-lg shadow-gray-900/10"
            >
                <Save size={16} /> Lưu thay đổi
            </button>
        </div>
      </div>
    </div>
  );
}
