// Assuming this exists, otherwise I'll remove it

interface TimeRangeSliderProps {
  value: number; // 0-100
  onChange: (val: number) => void;
  label: string; // "7h - 9h"
  color?: string; // Class for color bar
}

export default function TimeRangeSlider({ value, onChange, label, color = 'bg-primary-500' }: TimeRangeSliderProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-20 text-xs font-medium text-gray-600">{label}</div>
      <div className="flex-1 relative h-6 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group">
        {/* Background track */}
        <input 
            type="range" 
            min="0" 
            max="100" 
            step="5"
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        {/* Visual bar */}
        <div 
            className={`absolute top-0 left-0 h-full transition-all duration-300 ${color}`} 
            style={{ width: `${value}%` }}
        />
        {/* Label inside bar */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={`text-xs font-bold ${value > 15 ? 'text-white' : 'text-gray-500 ml-6'}`}>
                {value}%
            </span>
        </div>
      </div>
    </div>
  );
}
