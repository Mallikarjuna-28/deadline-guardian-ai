import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  frequency: string;
  streak: number;
  longestStreak: number;
  completions: string[]; // ISO strings of completions
  createdAt: string;
}

interface HabitState {
  habits: Habit[];
  loading: boolean;
  fetchHabits: () => Promise<void>;
  createHabit: (habit: Partial<Habit>) => Promise<Habit>;
  toggleHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  loading: false,

  fetchHabits: async () => {
    set({ loading: true });
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/habits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const habits = await res.json();
        set({ habits });
      }
    } catch (e) {
      console.error('Fetch habits failed, using fallback');
    } finally {
      set({ loading: false });
    }
  },

  createHabit: async (habitData) => {
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(habitData)
      });
      if (res.ok) {
        const created = await res.json();
        set(state => ({ habits: [...state.habits, created] }));
        return created;
      }
      throw new Error('Create habit failed');
    } catch (e) {
      const fallback: Habit = {
        id: habitData.id || 'habit-local-' + Date.now(),
        name: habitData.name || 'Custom Habit',
        icon: habitData.icon || 'Flame',
        frequency: habitData.frequency || 'daily',
        streak: 0,
        longestStreak: 0,
        completions: [],
        createdAt: new Date().toISOString()
      };
      set(state => ({ habits: [...state.habits, fallback] }));
      return fallback;
    }
  },

  toggleHabit: async (habitId) => {
    const { token, apiUrl } = useAuthStore.getState();
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const isCompletedToday = habit.completions.some(d => d.startsWith(todayStr));

    let updatedCompletions = [...habit.completions];
    let nextStreak = habit.streak;

    if (isCompletedToday) {
      updatedCompletions = updatedCompletions.filter(d => !d.startsWith(todayStr));
      nextStreak = Math.max(0, nextStreak - 1);
    } else {
      updatedCompletions.push(new Date().toISOString());
      nextStreak += 1;
    }

    const updates = {
      completions: updatedCompletions,
      streak: nextStreak,
      longestStreak: Math.max(habit.longestStreak, nextStreak)
    };

    try {
      const res = await fetch(`${apiUrl}/api/habits/${habitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        set(state => ({
          habits: state.habits.map(h => h.id === habitId ? updated : h)
        }));
      }
    } catch (e) {
      set(state => ({
        habits: state.habits.map(h => h.id === habitId ? { ...h, ...updates } : h)
      }));
    }
  },

  deleteHabit: async (habitId) => {
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/habits/${habitId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        set(state => ({ habits: state.habits.filter(h => h.id !== habitId) }));
      }
    } catch (e) {
      set(state => ({ habits: state.habits.filter(h => h.id !== habitId) }));
    }
  }
}));
