import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export interface Notification {
  id: string;
  type: 'risk_alert' | 'overdue' | 'streak_risk' | 'achievement' | 'calendar_import' | 'report_ready';
  title: string;
  body: string;
  read: boolean;
  taskId?: string;
  projectId?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  addNotification: (notif: Partial<Notification>) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const notifications = await res.json();
        set({ notifications });
      }
    } catch (e) {
      console.error('Fetch notifications error, using fallbacks');
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        set(state => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
        }));
      }
    } catch (e) {
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      }));
    }
  },

  addNotification: (notif) => {
    const freshNotif: Notification = {
      id: notif.id || 'notif-local-' + Date.now(),
      type: notif.type || 'risk_alert',
      title: notif.title || 'System Notification',
      body: notif.body || '',
      read: false,
      createdAt: new Date().toISOString(),
      taskId: notif.taskId,
      projectId: notif.projectId
    };
    set(state => ({ notifications: [freshNotif, ...state.notifications] }));
  }
}));
