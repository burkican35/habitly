
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronRight, Settings2, Trash2, Calendar, History, TrendingUp, X, Bell, Activity, Share } from 'lucide-react';
import { Habit, HabitLog } from './types';
import { HABIT_COLORS, HABIT_ICONS, STORAGE_KEY } from './constants';
import { HabitIcon } from './components/HabitIcon';
import { StatsView } from './components/StatsView';
import { getHabitInsights } from './services/geminiService';
import { format, isSameDay } from 'date-fns';

const App: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'habits' | 'insights'>('habits');
  const [showInstallHint, setShowInstallHint] = useState(false);
  
  // New habit form state
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitUnit, setNewHabitUnit] = useState<'minutes' | 'hours'>('minutes');
  const [newHabitTime, setNewHabitTime] = useState('09:00');
  const [newHabitColor, setNewHabitColor] = useState(HABIT_COLORS[0]);
  const [newHabitIcon, setNewHabitIcon] = useState(HABIT_ICONS[0]);

  // Logging state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logValue, setLogValue] = useState<string>('');
  const [activeLogHabit, setActiveLogHabit] = useState<Habit | null>(null);

  // Insights state
  const [insights, setInsights] = useState<Record<string, any>>({});

  // Detect if app is installed (standalone mode)
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isStandalone && isMobile) {
      // Show hint after a short delay
      const timer = setTimeout(() => setShowInstallHint(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Load habits from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHabits(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved habits", e);
      }
    }
  }, []);

  // Save habits to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

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
    resetForm();
  };

  const deleteHabit = (id: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      setHabits(habits.filter(h => h.id !== id));
      if (selectedHabitId === id) setSelectedHabitId(null);
    }
  };

  const resetForm = () => {
    setNewHabitName('');
    setNewHabitUnit('minutes');
    setNewHabitTime('09:00');
    setNewHabitColor(HABIT_COLORS[0]);
    setNewHabitIcon(HABIT_ICONS[0]);
  };

  const openLogModal = (habit: Habit) => {
    setActiveLogHabit(habit);
    const today = new Date();
    const existingLog = habit.logs.find(l => isSameDay(new Date(l.date), today));
    setLogValue(existingLog ? existingLog.value.toString() : '');
    setIsLogModalOpen(true);
  };

  const saveLog = () => {
    if (!activeLogHabit || !logValue) return;
    const value = parseFloat(logValue);
    if (isNaN(value)) return;

    const today = new Date().toISOString();
    
    const updatedHabits = habits.map(h => {
      if (h.id === activeLogHabit.id) {
        const existingLogIndex = h.logs.findIndex(l => isSameDay(new Date(l.date), new Date(today)));
        let newLogs = [...h.logs];
        if (existingLogIndex >= 0) {
          newLogs[existingLogIndex] = { ...newLogs[existingLogIndex], value };
        } else {
          newLogs.push({ date: today, value });
        }
        return { ...h, logs: newLogs };
      }
      return h;
    });

    setHabits(updatedHabits);
    setIsLogModalOpen(false);
    setActiveLogHabit(null);
    setLogValue('');
  };

  const fetchInsight = async (habit: Habit) => {
    const data = await getHabitInsights(habit);
    setInsights(prev => ({ ...prev, [habit.id]: data }));
  };

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col relative pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 px-6 pt-12 pb-6 ios-blur border-b border-gray-100 flex justify-between items-center pt-safe">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {selectedHabit ? 'Progress' : 'My Habits'}
          </h1>
          <p className="text-gray-400 text-sm font-medium">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        {!selectedHabit && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <Plus size={24} />
          </button>
        )}
        {selectedHabit && (
          <button 
            onClick={() => setSelectedHabitId(null)}
            className="text-blue-500 font-medium active:opacity-60"
          >
            Done
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pt-6 overflow-y-auto">
        {selectedHabit ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-gray-200"
                style={{ backgroundColor: selectedHabit.color }}
              >
                <HabitIcon name={selectedHabit.icon} size={32} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{selectedHabit.name}</h2>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Bell size={14} />
                  <span>Reminds at {selectedHabit.reminderTime}</span>
                </div>
              </div>
              <button 
                onClick={() => deleteHabit(selectedHabit.id)}
                className="p-2 text-red-500 bg-red-50 rounded-xl"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <StatsView habit={selectedHabit} />

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                 <TrendingUp size={20} className="text-blue-500" />
                 AI Insights
               </h3>
               {insights[selectedHabit.id] ? (
                 <div className="space-y-3">
                   <div className="flex items-center gap-2">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                       insights[selectedHabit.id].trend === 'up' ? 'bg-green-100 text-green-700' :
                       insights[selectedHabit.id].trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                     }`}>
                       {insights[selectedHabit.id].trend} Trend
                     </span>
                   </div>
                   <p className="text-gray-700 leading-relaxed text-sm">{insights[selectedHabit.id].summary}</p>
                   <p className="text-gray-500 italic text-sm border-l-2 border-gray-100 pl-3">"{insights[selectedHabit.id].motivation}"</p>
                 </div>
               ) : (
                 <button 
                   onClick={() => fetchInsight(selectedHabit)}
                   className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold border border-dashed border-gray-200 hover:bg-gray-100 transition-colors"
                 >
                   Generate Personalized Insights
                 </button>
               )}
            </div>

            <button 
              onClick={() => openLogModal(selectedHabit)}
              className="w-full py-5 bg-gray-900 text-white rounded-3xl font-bold shadow-xl shadow-gray-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Calendar size={20} />
              Log Progress
            </button>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {habits.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Activity size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Start a new routine</h3>
                <p className="text-gray-400 mt-2">Add your first habit and track your journey.</p>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-100"
                >
                  Create Habit
                </button>
              </div>
            ) : (
              habits.map(habit => {
                const today = new Date();
                const log = habit.logs.find(l => isSameDay(new Date(l.date), today));
                return (
                  <div 
                    key={habit.id}
                    className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-gray-100 flex items-center gap-4 active:bg-gray-50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedHabitId(habit.id)}
                  >
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: habit.color }}
                    >
                      <HabitIcon name={habit.icon} size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{habit.name}</h3>
                      <p className="text-sm text-gray-400">
                        {log ? `Done: ${log.value} ${habit.unit}` : `Next: ${habit.reminderTime}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       {log ? (
                          <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                            <Plus size={18} />
                          </div>
                       ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openLogModal(habit);
                            }}
                            className="w-8 h-8 rounded-full bg-gray-50 text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-500 flex items-center justify-center transition-colors"
                          >
                            <Plus size={18} />
                          </button>
                       )}
                       <ChevronRight className="text-gray-300" size={16} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Navigation Bar (Bottom) */}
      {!selectedHabit && (
        <nav className="fixed bottom-0 left-0 right-0 h-24 ios-blur border-t border-gray-100 px-12 flex justify-between items-center z-20 pb-safe">
          <button 
            onClick={() => setActiveTab('habits')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'habits' ? 'text-gray-900' : 'text-gray-300'}`}
          >
            <History size={24} strokeWidth={activeTab === 'habits' ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Habits</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-gray-300 pointer-events-none opacity-40"
          >
            <Settings2 size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
          </button>
        </nav>
      )}

      {/* PWA Install Hint */}
      {showInstallHint && (
        <div className="fixed bottom-28 left-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-4 relative">
             <div className="flex-1 text-sm">
                <p className="font-bold">Use Habitly like an app!</p>
                <p className="text-gray-400">Tap <Share size={14} className="inline mx-1" /> then <b>"Add to Home Screen"</b></p>
             </div>
             <button onClick={() => setShowInstallHint(false)} className="text-gray-500 p-1">
                <X size={18} />
             </button>
             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 pb-12 sm:pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 pt-safe">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">New Habit</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Morning Cycling"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-medium text-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Daily Goal</label>
                  <select 
                    value={newHabitUnit}
                    onChange={(e) => setNewHabitUnit(e.target.value as any)}
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-medium outline-none appearance-none"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Reminder</label>
                  <input 
                    type="time" 
                    value={newHabitTime}
                    onChange={(e) => setNewHabitTime(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Color & Icon</label>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                  {HABIT_COLORS.map(color => (
                    <button 
                      key={color}
                      onClick={() => setNewHabitColor(color)}
                      className={`w-10 h-10 rounded-full shrink-0 transition-all ${newHabitColor === color ? 'ring-4 ring-offset-2 ring-blue-500 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {HABIT_ICONS.map(icon => (
                    <button 
                      key={icon}
                      onClick={() => setNewHabitIcon(icon)}
                      className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center transition-all ${newHabitIcon === icon ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}
                    >
                      <HabitIcon name={icon} size={24} />
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={addHabit}
                className="w-full py-5 bg-gray-900 text-white rounded-3xl font-bold text-lg shadow-xl shadow-gray-200 mt-4 active:scale-95 transition-all"
              >
                Create Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Modal */}
      {isLogModalOpen && activeLogHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg"
                style={{ backgroundColor: activeLogHabit.color }}
              >
                <HabitIcon name={activeLogHabit.icon} size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{activeLogHabit.name}</h2>
              <p className="text-gray-400">Did you do this today?</p>
            </div>

            <div className="mb-8">
              <div className="relative">
                <input 
                  type="number" 
                  value={logValue}
                  onChange={(e) => setLogValue(e.target.value)}
                  placeholder="0"
                  className="w-full text-center text-5xl font-bold py-6 bg-gray-50 rounded-3xl outline-none focus:bg-gray-100 transition-colors"
                  autoFocus
                />
                <span className="absolute right-6 bottom-6 text-gray-400 font-bold">{activeLogHabit.unit}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsLogModalOpen(false)}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={saveLog}
                className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg shadow-gray-200"
              >
                Log Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
