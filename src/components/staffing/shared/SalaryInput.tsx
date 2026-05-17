import { CircleDollarSign } from 'lucide-react';

interface SalaryInputProps {
  value: number;
  onChange: (val: number) => void;
  label?: string;
  suffix?: string;
}

export default function SalaryInput({ value, onChange, label, suffix = 'VNĐ' }: SalaryInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-digits
    const rawInfo = e.target.value.replace(/\D/g, '');
    onChange(Number(rawInfo));
  };

  return (
    <div className="w-full">
      {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <CircleDollarSign size={16} />
        </div>
        <input
          type="text"
          className="w-full pl-9 pr-12 py-2 rounded-lg border border-gray-200 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          value={value.toLocaleString('vi-VN')}
          onChange={handleChange}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
          {suffix}
        </div>
      </div>
    </div>
  );
}
