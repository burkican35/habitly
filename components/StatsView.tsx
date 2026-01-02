
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Habit, Timeframe } from '../types';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, isSameMonth, subMonths } from 'date-fns';

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
        return {
          name: format(day, 'EEE'),
          value: log ? log.value : 0,
          fullDate: format(day, 'MMM d')
        };
      });
    }

    if (timeframe === 'monthly') {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      const days = eachDayOfInterval({ start, end });
      
      return days.map(day => {
        const log = habit.logs.find(l => isSameDay(new Date(l.date), day));
        return {
          name: format(day, 'd'),
          value: log ? log.value : 0,
          fullDate: format(day, 'MMM d')
        };
      });
    }

    if (timeframe === 'quarterly') {
       // Last 3 months
       const start = startOfMonth(subMonths(today, 2));
       const end = endOfMonth(today);
       const months = eachMonthOfInterval({ start, end });

       return months.map(month => {
          const monthlyLogs = habit.logs.filter(l => isSameMonth(new Date(l.date), month));
          const total = monthlyLogs.reduce((acc, curr) => acc + curr.value, 0);
          return {
             name: format(month, 'MMM'),
             value: total,
             fullDate: format(month, 'yyyy')
          };
       });
    }

    if (timeframe === 'yearly') {
       const start = startOfYear(today);
       const months = eachMonthOfInterval({ start, end: today });

       return months.map(month => {
          const monthlyLogs = habit.logs.filter(l => isSameMonth(new Date(l.date), month));
          const total = monthlyLogs.reduce((acc, curr) => acc + curr.value, 0);
          return {
             name: format(month, 'MMM'),
             value: total,
             fullDate: format(month, 'yyyy')
          };
       });
    }

    return [];
  }, [habit.logs, timeframe]);

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Progress</h3>
            <p className="text-3xl font-bold text-gray-900">{totalValue} <span className="text-lg font-normal text-gray-400">{habit.unit}</span></p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['weekly', 'monthly', 'quarterly', 'yearly'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === tf ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {tf.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11 }} 
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-gray-900 text-white p-2 rounded-lg text-xs shadow-lg">
                      <p className="font-bold">{payload[0].value} {habit.unit}</p>
                      <p className="opacity-70">{payload[0].payload.fullDate}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={habit.color} fillOpacity={entry.value > 0 ? 1 : 0.1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
