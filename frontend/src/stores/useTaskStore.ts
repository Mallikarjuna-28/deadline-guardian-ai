import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { auth } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import confetti from 'canvas-confetti';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  deadline: string;
  estimatedMinutes: number;
  actualMinutes: number;
  category: string;
  tags: string[];
  projectId: string | null;
  parentTaskId: string | null;
  subtasks: SubTask[];
  attachments: string[];
  recurrence: string | null;
  aiRiskScore: number;
  aiInsight: string;
  aiSubtasks: string[];
  scheduledStart: string | null;
  completedAt: string | null;
  xpReward: number;
  createdAt: string;
  updatedAt: string;
  googleCalendarEventId?: string | null;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  activeFilter: string;
  activePriority: string;
  activeSearch: string;
  setFilter: (filter: string) => void;
  setPriority: (priority: string) => void;
  setSearch: (search: string) => void;
  fetchTasks: () => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  parseNLP: (text: string) => Promise<any>;
  generateSubtasks: (taskId: string) => Promise<void>;
  analyzeRisk: (taskId: string) => Promise<void>;
}

const syncTaskToGoogleCalendarAPI = async (task: Task, googleAccessToken: string): Promise<{ eventId: string | null; tokenExpired: boolean }> => {
  try {
    const deadlineDate = new Date(task.deadline);
    const durationMinutes = task.estimatedMinutes || 60;
    const startDate = new Date(deadlineDate.getTime() - durationMinutes * 60 * 1000);

    const event = {
      summary: `📌 ${task.title}`,
      description: `Deadline Guardian AI Task\nPriority: ${task.priority.toUpperCase()}\nRisk Score: ${task.aiRiskScore || 0}%\nEstimated: ${durationMinutes} min\n\nManaged by Deadline Guardian AI`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      },
      end: {
        dateTime: deadlineDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      },
      colorId: task.priority === 'critical' ? '11' : task.priority === 'high' ? '6' : '9', // red, orange, blue
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },  // 1 day before
          { method: 'popup', minutes: 60 },    // 1 hour before
          { method: 'popup', minutes: 15 }     // 15 min before
        ]
      }
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Task synced directly to Google Calendar:', data.htmlLink);
      return { eventId: data.id, tokenExpired: false };
    } else if (response.status === 401) {
      // Token expired — clear it so next attempt re-auths
      console.warn('Google access token expired, clearing stored token.');
      localStorage.removeItem('dg_google_access_token');
      useAuthStore.setState({ googleAccessToken: null });
      return { eventId: null, tokenExpired: true };
    } else {
      const errText = await response.text();
      console.error('Google Calendar API error:', response.status, errText);
      return { eventId: null, tokenExpired: false };
    }
  } catch (error) {
    console.error('Network error syncing to Google Calendar:', error);
    return { eventId: null, tokenExpired: false };
  }
};

const ensureGoogleCalendarPermission = async (forceConsent = false): Promise<string | null> => {
  const { googleAccessToken } = useAuthStore.getState();
  if (googleAccessToken && !forceConsent) return googleAccessToken;

  try {
    // Clone provider and request calendar scope with consent prompt
    const { GoogleAuthProvider: GAP } = await import('firebase/auth');
    const calendarProvider = new GAP();
    calendarProvider.addScope('https://www.googleapis.com/auth/calendar.events');
    calendarProvider.setCustomParameters({ prompt: 'consent', access_type: 'offline' });

    const cred = await signInWithPopup(auth, calendarProvider);
    const credential = GAP.credentialFromResult(cred);
    const newAccessToken = credential?.accessToken || null;
    if (newAccessToken) {
      localStorage.setItem('dg_google_access_token', newAccessToken);
      useAuthStore.setState({ googleAccessToken: newAccessToken });
      return newAccessToken;
    }
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.log('User cancelled Google Calendar permission dialog.');
    } else {
      console.error('Failed to get Google Calendar access:', error);
    }
  }
  return null;
};

// Exported so Tasks.tsx can trigger re-auth
export const requestGoogleCalendarAccess = () => ensureGoogleCalendarPermission(true);

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  activeFilter: 'all',
  activePriority: 'all',
  activeSearch: '',

  setFilter: (filter) => set({ activeFilter: filter }),
  setPriority: (priority) => set({ activePriority: priority }),
  setSearch: (search) => set({ activeSearch: search }),

  fetchTasks: async () => {
    set({ loading: true });
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const tasks = await res.json();
        set({ tasks });
      }
    } catch (e) {
      console.error('Fetch tasks error, using offline store:', e);
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (taskData) => {
    const { token, apiUrl } = useAuthStore.getState();
    const activeToken = await ensureGoogleCalendarPermission();
    try {
      const res = await fetch(`${apiUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
      if (res.ok) {
        let created = await res.json();
        if (activeToken) {
          const { eventId, tokenExpired } = await syncTaskToGoogleCalendarAPI(created, activeToken);
          if (eventId) {
            created.googleCalendarEventId = eventId;
            created._calendarSynced = true;
            // Save googleCalendarEventId in the database
            fetch(`${apiUrl}/api/tasks/${created.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ googleCalendarEventId: eventId })
            }).catch(err => console.error('Failed saving googleCalendarEventId:', err));
          } else if (tokenExpired) {
            // Token was invalid - will re-auth on next create
            created._calendarSynced = false;
            created._calendarTokenExpired = true;
          } else {
            created._calendarSynced = false;
          }
        } else {
          created._calendarSynced = false;
        }
        set(state => ({ tasks: [...state.tasks, created] }));
        return created;
      }
      throw new Error('Create failed');
    } catch (e) {
      // Local fallback creation
      const localTask: Task & { _calendarSynced?: boolean } = {
        id: taskData.id || 'task-local-' + Date.now(),
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        status: taskData.status || 'pending',
        deadline: taskData.deadline || new Date(Date.now() + 3600 * 1000 * 24).toISOString(),
        estimatedMinutes: taskData.estimatedMinutes || 60,
        actualMinutes: taskData.actualMinutes || 0,
        category: taskData.category || 'Work',
        tags: taskData.tags || [],
        projectId: taskData.projectId || null,
        parentTaskId: null,
        subtasks: taskData.subtasks || [],
        attachments: [],
        recurrence: null,
        aiRiskScore: taskData.aiRiskScore || 10,
        aiInsight: taskData.aiInsight || 'On track.',
        aiSubtasks: taskData.aiSubtasks || [],
        scheduledStart: null,
        completedAt: null,
        xpReward: taskData.priority === 'critical' ? 120 : 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (activeToken) {
        syncTaskToGoogleCalendarAPI(localTask, activeToken).then(({ eventId }) => {
          if (eventId) {
            localTask.googleCalendarEventId = eventId;
            localTask._calendarSynced = true;
            set(state => ({
              tasks: state.tasks.map(t => t.id === localTask.id ? { ...t, googleCalendarEventId: eventId } : t)
            }));
          }
        });
      }
      set(state => ({ tasks: [...state.tasks, localTask] }));
      return localTask;
    }
  },

  updateTask: async (taskId, updates) => {
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/tasks/${taskId}`, {
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
          tasks: state.tasks.map(t => t.id === taskId ? updated : t)
        }));
      }
    } catch (e) {
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
      }));
    }
  },

  deleteTask: async (taskId) => {
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        set(state => ({ tasks: state.tasks.filter(t => t.id !== taskId) }));
      }
    } catch (e) {
      set(state => ({ tasks: state.tasks.filter(t => t.id !== taskId) }));
    }
  },

  completeTask: async (taskId) => {
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set(state => ({
          tasks: state.tasks.map(t => t.id === taskId ? data.task : t)
        }));

        // Fire satisfying checkmark confetti animation!
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#4F46E5', '#7C3AED', '#A5B4FC']
        });

        // Trigger profile refresh to reflect XP gains and level-ups
        await useAuthStore.getState().fetchProfile();
      }
    } catch (e) {
      // Offline fallback completion logic
      const target = get().tasks.find(t => t.id === taskId);
      if (target) {
        const xp = target.priority === 'critical' ? 150 : 80;
        const updated: Task = {
          ...target,
          status: 'completed',
          completedAt: new Date().toISOString()
        };
        set(state => ({
          tasks: state.tasks.map(t => t.id === taskId ? updated : t)
        }));
        confetti({
          particleCount: 50,
          spread: 50,
          colors: ['#7C3AED', '#4F46E5']
        });
        
        // Mock update User profile level-up checks locally
        const profile = useAuthStore.getState().user;
        if (profile) {
          const nextXp = profile.xp + xp;
          const nextLevel = Math.floor(nextXp / 500) + 1;
          useAuthStore.getState().updateProfile({
            xp: nextXp,
            level: nextLevel,
            streak: profile.streak + 1,
            productivityScore: Math.min(100, profile.productivityScore + 3)
          });
        }
      }
    }
  },

  parseNLP: async (text) => {
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/ai/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('NLP parse endpoint error:', e);
    }
    // Static fallback parser
    return {
      title: text,
      deadline: new Date(Date.now() + 3600 * 1000 * 48).toISOString(),
      priority: 'medium',
      estimatedMinutes: 60,
      tags: ['nlp-fallback'],
      category: 'Work',
      aiConfidence: 0.7
    };
  },

  generateSubtasks: async (taskId) => {
    const { token, apiUrl } = useAuthStore.getState();
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const res = await fetch(`${apiUrl}/api/ai/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: task.title })
      });
      if (res.ok) {
        const { subtasks } = await res.json();
        const mappedSubtasks = subtasks.map((stTitle: string) => ({
          id: 'sub-' + Math.random().toString(36).substr(2, 9),
          title: stTitle,
          completed: false
        }));
        await get().updateTask(taskId, { subtasks: mappedSubtasks });
      }
    } catch (e) {
      const defaultSubtasks = [
        'Research task guidelines',
        'Code final outline',
        'Verify functionality requirements'
      ].map(t => ({ id: 'sub-' + Math.random(), title: t, completed: false }));
      await get().updateTask(taskId, { subtasks: defaultSubtasks });
    }
  },

  analyzeRisk: async (taskId) => {
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/ai/analyze/risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ taskId })
      });
      if (res.ok) {
        const analysis = await res.json();
        await get().updateTask(taskId, {
          aiRiskScore: analysis.riskScore,
          aiInsight: analysis.reasoning,
          aiSubtasks: analysis.recommendation ? [analysis.recommendation] : []
        });
      }
    } catch (e) {
      console.error('Risk analysis API error:', e);
    }
  }
}));
