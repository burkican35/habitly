
export interface HabitLog {
  date: string; // ISO string
  value: number; // minutes or hours
}

export interface Habit {
  id: string;
  name: string;
  unit: 'minutes' | 'hours';
  reminderTime: string; // HH:mm
  color: string;
  icon: string;
  createdAt: string;
  logs: HabitLog[];
}

export type Timeframe = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface HabitInsight {
  summary: string;
  motivation: string;
  trend: 'up' | 'down' | 'stable';
}
