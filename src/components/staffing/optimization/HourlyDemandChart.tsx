import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HourlyDemandChartProps {
  demand: number[]; // Array of 24 numbers
}

export default function HourlyDemandChart({ demand }: HourlyDemandChartProps) {
  const data = demand.map((val, hour) => ({
    hour: `${hour}h`,
    staff: val
  })).filter((d, i) => d.staff > 0 || (i > 6 && i < 23)); // Filter relevant hours or show all open hours

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorStaff" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="hour" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#64748b' }} 
            interval={2}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#64748b' }}
            allowDecimals={false}
          />
          <Tooltip 
             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Area 
            type="monotone" 
            dataKey="staff" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorStaff)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
