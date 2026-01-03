
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Calendar, History, TrendingUp, X, Bell, Activity, 
  LayoutDashboard, PieChart, Award, Target, CheckCircle2, 
  Circle, Clock, Trash2, ChevronRight, BarChart3, Film, BookOpen, Map
} from 'lucide-react';
import { Habit, Badge, Resolution } from './types';
import { HABIT_COLORS, HABIT_ICONS, STORAGE_KEY, BADGES } from './constants';
import { HabitIcon } from './components/HabitIcon';
import { StatsView } from './components/StatsView';
import { getHabitInsights } from './services/geminiService';
import { format, isSameDay, differenceInDays, isBefore, isAfter } from 'date-fns';

const UNIT_PRESETS = [
  { label: 'Minutes', value: 'minutes' },
  { label: 'Hours', value: 'hours' },
  { label: 'Counts', value: 'counts' },
  { label: 'Pages', value: 'pages' }
];

const App: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'resolutions' | 'badges' | 'insights'>('dashboard');
  
  // New habit form state
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitUnit, setNewHabitUnit] = useState<string>('minutes');
  const [newHabitTime, setNewHabitTime] = useState('09:00');
  const [newHabitColor, setNewHabitColor] = useState(HABIT_COLORS[0]);
  const [newHabitIcon, setNewHabitIcon] = useState(HABIT_ICONS[0]);

  // Logging state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logValue, setLogValue] = useState<string>('');
  const [activeLogHabit, setActiveLogHabit] = useState<Habit | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedRes = localStorage.getItem(STORAGE_KEY + '_res');
    if (saved) setHabits(JSON.parse(saved));
    if (savedRes) setResolutions(JSON.parse(savedRes));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    localStorage.setItem(STORAGE_KEY + '_res', JSON.stringify(resolutions));
  }, [habits, resolutions]);

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: newHabitName,
      unit: newHabitUnit,
      reminderTime: newHabitTime,
      color: newHabitColor,
      icon: newHabitIcon,
      createdAt: new Date().toISOString(),
      logs: []
    };
    setHabits([...habits, newHabit]);
    setIsAddModalOpen(false);
    resetNewHabitForm();
  };

  const resetNewHabitForm = () => {
    setNewHabitName('');
    setNewHabitUnit('minutes');
    setNewHabitTime('09:00');
    setNewHabitColor(HABIT_COLORS[0]);
    setNewHabitIcon(HABIT_ICONS[0]);
  };

  const saveLog = () => {
    if (!activeLogHabit || !logValue) return;
    const value = parseFloat(logValue);
    const today = new Date().toISOString();
    const updated = habits.map(h => {
      if (h.id === activeLogHabit.id) {
        const existingIdx = h.logs.findIndex(l => isSameDay(new Date(l.date), new Date(today)));
        let newLogs = [...h.logs];
        if (existingIdx >= 0) newLogs[existingIdx] = { ...newLogs[existingIdx], value };
        else newLogs.push({ date: today, value });
        return { ...h, logs: newLogs };
      }
      return h;
    });
    setHabits(updated);
    setIsLogModalOpen(false);
  };

  const yearProgress = useMemo(() => {
    const today = new Date();
    const start2026 = new Date(2026, 0, 1);
    const start2027 = new Date(2027, 0, 1);
    const end2026 = new Date(2026, 11, 31, 23, 59, 59);
    if (isBefore(today, start2026)) return { daysLeft: 365, percentGone: 0, percentLeft: 100 };
    if (isAfter(today, end2026)) return { daysLeft: 0, percentGone: 100, percentLeft: 0 };
    const totalDays = differenceInDays(start2027, start2026);
    const daysGone = differenceInDays(today, start2026);
    return { 
      daysLeft: differenceInDays(start2027, today), 
      percentGone: Math.round((daysGone / totalDays) * 100), 
      percentLeft: 100 - Math.round((daysGone / totalDays) * 100) 
    };
  }, []);

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-32">
      {/* iOS Header */}
      <header className="px-5 pt-14 pb-4 sticky top-0 z-10 bg-[#F2F2F7]/80 backdrop-blur-md">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
            <h1 className="large-title">
              {activeTab === 'dashboard' && !selectedHabitId ? 'Today' : 
               activeTab === 'resolutions' ? '2026 Vision' : 
               activeTab === 'badges' ? 'Awards' : 
               activeTab === 'insights' ? 'Insights' : 
               selectedHabit?.name || 'Habit'}
            </h1>
          </div>
          {!selectedHabitId && activeTab === 'dashboard' && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#007AFF] shadow-sm active:scale-95 transition-transform"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
          )}
          {selectedHabitId && (
            <button 
              onClick={() => setSelectedHabitId(null)}
              className="px-4 py-2 bg-white rounded-full text-sm font-bold text-[#007AFF] shadow-sm active:scale-95 transition-transform"
            >
              Back
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-5">
        {selectedHabit ? (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <StatsView habit={selectedHabit} />
             <div className="ios-card p-6 flex justify-between items-center">
                <div>
                   <h3 className="font-bold">Notifications</h3>
                   <p className="text-sm text-gray-500">Every day at {selectedHabit.reminderTime}</p>
                </div>
                <Bell className="text-[#007AFF]" />
             </div>
             <button 
              onClick={() => {
                if (confirm('Delete this habit and all history?')) {
                   setHabits(habits.filter(h => h.id !== selectedHabit.id));
                   setSelectedHabitId(null);
                }
              }}
              className="w-full py-4 text-red-600 font-bold bg-white rounded-xl active:bg-red-50"
             >
                Delete Habit
             </button>
          </div>
        ) : activeTab === 'dashboard' ? (
          <div className="space-y-4">
            {habits.length === 0 ? (
               <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <Activity size={40} className="text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-medium">Tap + to add your first habit</p>
               </div>
            ) : habits.map(habit => {
              const todayLog = habit.logs.find(l => isSameDay(new Date(l.date), new Date()));
              return (
                <div 
                  key={habit.id}
                  onClick={() => setSelectedHabitId(habit.id)}
                  className="ios-card p-4 flex items-center gap-4 active:bg-gray-50 transition-colors"
                >
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: habit.color }}
                  >
                    <HabitIcon name={habit.icon} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{habit.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-700" 
                            style={{ backgroundColor: habit.color, width: todayLog ? '100%' : '0%' }}
                          />
                       </div>
                       <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
                         {todayLog ? `${todayLog.value} ${habit.unit}` : `LOG ${habit.unit}`}
                       </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveLogHabit(habit); setIsLogModalOpen(true); }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-all ${
                      todayLog ? 'bg-green-500 text-white' : 'bg-[#007AFF] text-white'
                    }`}
                  >
                    {todayLog ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                  </button>
                </div>
              );
            })}
          </div>
        ) : activeTab === 'resolutions' ? (
          <div className="space-y-6">
            <div className="ios-card p-6 bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white overflow-hidden relative">
               <Clock className="absolute top-[-20px] right-[-20px] opacity-10 w-40 h-40" />
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <h2 className="text-2xl font-black">2026 Countdown</h2>
                       <p className="text-blue-100 text-sm font-medium">Focused on the future</p>
                    </div>
                    <div className="text-right">
                       <span className="text-4xl font-black">{yearProgress.daysLeft}</span>
                       <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Days to 2027</p>
                    </div>
                 </div>
                 <div className="space-y-5">
                    <div>
                       <div className="flex justify-between text-[11px] font-bold mb-1.5">
                          <span>JOURNEY ELAPSED (2026)</span>
                          <span>{yearProgress.percentGone}%</span>
                       </div>
                       <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white transition-all duration-1000" style={{ width: `${yearProgress.percentGone}%` }} />
                       </div>
                    </div>
                 </div>
               </div>
            </div>
            <div className="ios-card p-4 space-y-4">
              {resolutions.map(res => (
                <div key={res.id} className="flex items-center gap-3 py-1">
                  <button 
                    onClick={() => setResolutions(resolutions.map(r => r.id === res.id ? {...r, completed: !r.completed} : r))}
                    className={res.completed ? 'text-green-500' : 'text-gray-300'}
                  >
                    {res.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  <span className={`flex-1 font-semibold ${res.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{res.text}</span>
                </div>
              ))}
              <input 
                type="text" 
                placeholder="Add a new 2026 resolution..."
                className="w-full bg-gray-50 border-none outline-none rounded-lg px-4 py-3 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as any).value) {
                     setResolutions([...resolutions, { id: crypto.randomUUID(), text: (e.target as any).value, completed: false }]);
                     (e.target as any).value = '';
                  }
                }}
              />
            </div>
          </div>
        ) : activeTab === 'insights' ? (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase px-1">Performance Matrix</h3>
            {habits.map(habit => {
              const totalValue = habit.logs.reduce((acc, curr) => acc + curr.value, 0);
              const totalLogs = habit.logs.length;
              // Normalizing for visual bars
              const maxVal = habit.unit === 'hours' ? 500 : habit.unit === 'minutes' ? 30000 : 100;
              return (
                <div key={habit.id} className="ios-card p-5 space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg text-white" style={{ backgroundColor: habit.color }}>
                        <HabitIcon name={habit.icon} size={20} />
                      </div>
                      <span className="font-bold text-lg">{habit.name}</span>
                   </div>
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                            <span>Activity Volume</span>
                            <span>{totalValue} {habit.unit}</span>
                         </div>
                         <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full transition-all duration-1000" style={{ backgroundColor: habit.color, width: `${Math.min(100, (totalValue / maxVal) * 100)}%` }} />
                         </div>
                      </div>
                      <div className="space-y-1">
                         <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                            <span>Consistency (Logs)</span>
                            <span>{totalLogs} entries</span>
                         </div>
                         <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full opacity-60 transition-all duration-1000" style={{ backgroundColor: habit.color, width: `${Math.min(100, (totalLogs / 30) * 100)}%` }} />
                         </div>
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {BADGES.map(badge => {
              const { unlocked, current, total } = badge.requirement(habits);
              return (
                <div key={badge.id} className={`ios-card p-4 text-center ${unlocked ? '' : 'opacity-40 grayscale'}`}>
                   <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white shadow-md" style={{ backgroundColor: unlocked ? badge.color : '#ccc' }}>
                     <HabitIcon name={badge.icon} size={32} />
                   </div>
                   <h3 className="font-bold text-sm truncate">{badge.name}</h3>
                   <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(current/total)*100}%` }} />
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* iOS Bottom Tab Bar */}
      <nav className="tab-bar fixed bottom-0 left-0 right-0 h-20 flex items-center justify-around px-2">
        <TabItem icon={<LayoutDashboard size={24} />} label="Today" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSelectedHabitId(null); }} />
        <TabItem icon={<Target size={24} />} label="2026" active={activeTab === 'resolutions'} onClick={() => { setActiveTab('resolutions'); setSelectedHabitId(null); }} />
        <TabItem icon={<BarChart3 size={24} />} label="Insights" active={activeTab === 'insights'} onClick={() => { setActiveTab('insights'); setSelectedHabitId(null); }} />
        <TabItem icon={<Award size={24} />} label="Awards" active={activeTab === 'badges'} onClick={() => { setActiveTab('badges'); setSelectedHabitId(null); }} />
      </nav>

      {/* New Habit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm px-2 pb-2">
          <div className="ios-modal bg-[#F2F2F7] w-full p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">New Activity</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"><X size={18} /></button>
            </div>
            <input 
              type="text" placeholder="e.g., Running, Reading, Coding..." value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="w-full bg-white rounded-xl px-4 py-4 text-lg font-medium shadow-sm outline-none"
            />
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Activity Type / Unit</label>
              <div className="grid grid-cols-2 gap-2">
                {UNIT_PRESETS.map(preset => (
                  <button 
                    key={preset.value}
                    onClick={() => setNewHabitUnit(preset.value)}
                    className={`py-3 px-1 rounded-lg text-sm font-bold transition-all border ${newHabitUnit === preset.value ? 'bg-[#007AFF] text-white border-[#007AFF]' : 'bg-white text-gray-600 border-gray-100'}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Theme & Icon</label>
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
                {HABIT_COLORS.map(c => (
                  <button 
                    key={c} onClick={() => setNewHabitColor(c)}
                    className={`w-9 h-9 rounded-xl shrink-0 transition-all ${newHabitColor === c ? 'ring-2 ring-offset-2 ring-blue-500 shadow-sm' : 'border border-gray-200'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-1">
                {HABIT_ICONS.map(i => (
                  <button 
                    key={i} onClick={() => setNewHabitIcon(i)}
                    className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center transition-all ${newHabitIcon === i ? 'bg-[#007AFF] text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'}`}
                  >
                    <HabitIcon name={i} size={22} />
                  </button>
                ))}
              </div>
            </div>
            <button onClick={addHabit} className="w-full py-4 bg-[#007AFF] text-white rounded-2xl font-bold text-lg shadow-lg mb-safe">Create Habit</button>
          </div>
        </div>
      )}

      {/* Log Modal */}
      {isLogModalOpen && activeLogHabit && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm px-2 pb-2">
           <div className="ios-modal bg-white w-full p-8 rounded-t-3xl text-center">
              <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white" style={{ backgroundColor: activeLogHabit.color }}>
                <HabitIcon name={activeLogHabit.icon} size={32} />
              </div>
              <h2 className="text-2xl font-bold">{activeLogHabit.name}</h2>
              <div className="mt-8 mb-10 flex items-center justify-center gap-4">
                 <input 
                  type="number" value={logValue} onChange={(e) => setLogValue(e.target.value)}
                  className="w-32 text-center text-6xl font-black outline-none border-b-2 border-gray-100 focus:border-[#007AFF]"
                  autoFocus
                 />
                 <span className="text-xl font-bold text-gray-400 uppercase tracking-widest">{activeLogHabit.unit}</span>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setIsLogModalOpen(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold">Cancel</button>
                 <button onClick={saveLog} className="flex-1 py-4 bg-[#007AFF] text-white rounded-2xl font-bold">Save</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const TabItem = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: any }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all flex-1 py-2 ${active ? 'text-[#007AFF] scale-105' : 'text-[#8E8E93]'}`}>
    {icon}
    <span className="text-[10px] font-bold tracking-tight">{label}</span>
  </button>
);

export default App;
