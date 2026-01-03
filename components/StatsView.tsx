
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Habit, Timeframe } from '../types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, isSameMonth, subMonths } from 'date-fns';

interface StatsViewProps {
  habit: Habit;
}

export const StatsView: React.FC<StatsViewProps> = ({ habit }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');

  const chartData = useMemo(() => {
    const today = new Date();
    
    if (timeframe === 'weekly') {
      const start = startOfWeek(today);
      const end = endOfWeek(today);
      const days = eachDayOfInterval({ start, end });
      return days.map(day => {
        const log = habit.logs.find(l => isSameDay(new Date(l.date), day));
        return { name: format(day, 'EEE'), value: log ? log.value : 0, fullDate: format(day, 'MMM d') };
      });
    }

    if (timeframe === 'monthly') {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      const days = eachDayOfInterval({ start, end });
      return days.map(day => {
        const log = habit.logs.find(l => isSameDay(new Date(l.date), day));
        return { name: format(day, 'd'), value: log ? log.value : 0, fullDate: format(day, 'MMM d') };
      });
    }

    if (timeframe === 'quarterly') {
       const start = startOfMonth(subMonths(today, 2));
       const months = eachMonthOfInterval({ start, end: today });
       return months.map(month => {
          const monthlyLogs = habit.logs.filter(l => isSameMonth(new Date(l.date), month));
          return { name: format(month, 'MMM'), value: monthlyLogs.reduce((acc, curr) => acc + curr.value, 0), fullDate: format(month, 'yyyy') };
       });
    }

    if (timeframe === 'yearly') {
       const start = startOfYear(today);
       const months = eachMonthOfInterval({ start, end: today });
       return months.map(month => {
          const monthlyLogs = habit.logs.filter(l => isSameMonth(new Date(l.date), month));
          return { name: format(month, 'MMM'), value: monthlyLogs.reduce((acc, curr) => acc + curr.value, 0), fullDate: format(month, 'yyyy') };
       });
    }
    return [];
  }, [habit.logs, timeframe]);

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Activity</h3>
          <p className="text-4xl font-black text-gray-900 tracking-tight">{totalValue} <span className="text-xl font-normal text-gray-400">{habit.unit}</span></p>
        </div>
        <div className="flex bg-[#f3f3f3] p-1 rounded-md">
          {(['weekly', 'monthly', 'quarterly', 'yearly'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${
                timeframe === tf ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a3a3a3', fontSize: 11 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a3a3a3', fontSize: 11 }} />
            <Tooltip 
              cursor={{ fill: '#fafafa' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-xl text-xs">
                      <p className="font-bold text-gray-900">{payload[0].value} {habit.unit}</p>
                      <p className="text-gray-400">{payload[0].payload.fullDate}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={habit.color} fillOpacity={entry.value > 0 ? 1 : 0.05} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
