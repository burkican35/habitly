
export interface HabitLog {
  date: string; // ISO string
  value: number; // e.g., 2 (movies), 50 (pages), 1 (vacation)
}

export interface Habit {
  id: string;
  name: string;
  unit: string; // Flexible units: 'minutes', 'hours', 'movies', 'books', 'trips', etc.
  reminderTime: string; // HH:mm
  color: string;
  icon: string;
  createdAt: string;
  logs: HabitLog[];
}

export interface Resolution {
  id: string;
  text: string;
  completed: boolean;
}

export type Timeframe = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface HabitInsight {
  summary: string;
  motivation: string;
  trend: 'up' | 'down' | 'stable';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: (habits: Habit[]) => { current: number; total: number; unlocked: boolean };
}
