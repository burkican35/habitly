
import { Habit, Badge } from './types';
import { isSameDay, subDays } from 'date-fns';

export const HABIT_COLORS = [
  '#007AFF', // iOS Blue
  '#34C759', // iOS Green
  '#FF9500', // iOS Orange
  '#FF3B30', // iOS Red
  '#AF52DE', // iOS Purple
  '#5856D6', // iOS Indigo
  '#FF2D55', // iOS Pink
  '#5AC8FA', // iOS Light Blue
];

export const HABIT_ICONS = [
  'Activity', 'Book', 'Coffee', 'Heart', 'Moon', 'Sun', 'Target', 
  'Zap', 'Dumbbell', 'Music', 'Cloud', 'Film', 'Map', 'Camera', 'Plane', 'Star'
];

export const STORAGE_KEY = 'habitly_data_v1';

const getStreak = (habit: Habit): number => {
  if (habit.logs.length === 0) return 0;
  const sortedLogs = [...habit.logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  let currentDate = new Date();
  
  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i].date);
    const expectedDate = subDays(currentDate, i);
    
    if (isSameDay(logDate, expectedDate)) {
      streak++;
    } else if (i === 0 && isSameDay(logDate, subDays(currentDate, 1))) {
      continue; 
    } else {
      break;
    }
  }
  return streak;
};

export const BADGES: Badge[] = [
  {
    id: 'first-steps',
    name: 'Genesis',
    description: 'Log your very first activity.',
    icon: 'Flag',
    color: '#007AFF',
    requirement: (habits) => {
      const total = habits.reduce((acc, h) => acc + h.logs.length, 0);
      return { current: total > 0 ? 1 : 0, total: 1, unlocked: total > 0 };
    }
  },
  {
    id: 'consistency-week',
    name: 'Unstoppable',
    description: 'Reach a 7-day streak.',
    icon: 'Zap',
    color: '#34C759',
    requirement: (habits) => {
      const maxStreak = Math.max(0, ...habits.map(h => getStreak(h)));
      return { current: Math.min(maxStreak, 7), total: 7, unlocked: maxStreak >= 7 };
    }
  },
  {
    id: 'habit-architect',
    name: 'Polymath',
    description: 'Track 5 different habits.',
    icon: 'Layers',
    color: '#AF52DE',
    requirement: (habits) => {
      return { current: habits.length, total: 5, unlocked: habits.length >= 5 };
    }
  },
  {
    id: 'monthly-master',
    name: 'Loyalty',
    description: 'Maintain a 30-day streak.',
    icon: 'Star',
    color: '#FF9500',
    requirement: (habits) => {
      const maxStreak = Math.max(0, ...habits.map(h => getStreak(h)));
      return { current: Math.min(maxStreak, 30), total: 30, unlocked: maxStreak >= 30 };
    }
  }
];
