import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  deadline: string;
  progress: number;
  taskCount: number;
  completedCount: number;
  aiHealthScore: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  loading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (project: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const projects = await res.json();
        set({ projects });
      }
    } catch (e) {
      console.error('Fetch projects API failed, using offline fallback');
    } finally {
      set({ loading: false });
    }
  },

  createProject: async (projData) => {
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(projData)
      });
      if (res.ok) {
        const created = await res.json();
        set(state => ({ projects: [...state.projects, created] }));
        return created;
      }
      throw new Error('Create project failed');
    } catch (e) {
      const fallback: Project = {
        id: projData.id || 'proj-local-' + Date.now(),
        name: projData.name || 'New Project',
        description: projData.description || '',
        color: projData.color || '#4F46E5',
        icon: projData.icon || 'Folder',
        deadline: projData.deadline || new Date(Date.now() + 3600 * 1000 * 24 * 5).toISOString(),
        progress: 0,
        taskCount: 0,
        completedCount: 0,
        aiHealthScore: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      set(state => ({ projects: [...state.projects, fallback] }));
      return fallback;
    }
  },

  updateProject: async (id, updates) => {
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/projects/${id}`, {
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
          projects: state.projects.map(p => p.id === id ? updated : p)
        }));
      }
    } catch (e) {
      set(state => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
      }));
    }
  },

  deleteProject: async (id) => {
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        set(state => ({ projects: state.projects.filter(p => p.id !== id) }));
      }
    } catch (e) {
      set(state => ({ projects: state.projects.filter(p => p.id !== id) }));
    }
  }
}));
