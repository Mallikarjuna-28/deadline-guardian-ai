import { create } from 'zustand';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile as updateProfileFirebase, signOut as fbSignOut, GoogleAuthProvider } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  productivityScore: number;
  focusScore: number;
  onboardingComplete: boolean;
  preferences: {
    workStyle: 'morning' | 'night';
    deepWorkDuration: number;
    workHoursStart: string;
    workHoursEnd: string;
  };
  createdAt?: string;
}

interface AuthState {
  token: string | null;
  googleAccessToken: string | null;
  user: UserProfile | null;
  loading: boolean;
  darkMode: boolean;
  apiUrl: string;
  login: (email?: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (preferences: UserProfile['preferences']) => Promise<void>;
  toggleDarkMode: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('dg_token'),
  googleAccessToken: localStorage.getItem('dg_google_access_token'),
  user: null,
  loading: false,
  darkMode: localStorage.getItem('dg_theme') === 'dark',
  apiUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080',

  initialize: () => {
    const { darkMode } = get();
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Auto-migrate or clear the old hardcoded dev-user-123 token
    const storedToken = localStorage.getItem('dg_token');
    if (storedToken === 'dev-user-123') {
      localStorage.removeItem('dg_token');
      set({ token: null, user: null });
    } else {
      get().fetchProfile();
    }
  },

  login: async (email = 'hacker@google.com', password?: string) => {
    set({ loading: true });
    const isMock = !import.meta.env.VITE_FIREBASE_API_KEY;
    if (isMock) {
      const mockToken = `mock_user__${email}__${email.split('@')[0]}`;
      localStorage.setItem('dg_token', mockToken);
      set({ token: mockToken });
      await get().fetchProfile();
    } else {
      try {
        if (!password) {
          const mockToken = `mock_user__${email}__${email.split('@')[0]}`;
          localStorage.setItem('dg_token', mockToken);
          set({ token: mockToken });
          await get().fetchProfile();
        } else {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const token = await cred.user.getIdToken();
          localStorage.setItem('dg_token', token);
          set({ token });
          await get().fetchProfile();
        }
      } catch (error: any) {
        console.error('Firebase Auth sign in failed:', error);
        alert(`Authentication failed: ${error.message}`);
      }
    }
    set({ loading: false });
  },

  loginWithGoogle: async () => {
    set({ loading: true });
    const isMock = !import.meta.env.VITE_FIREBASE_API_KEY;
    if (isMock) {
      const mockToken = 'mock_user__google-user@gmail.com__Google_Guardian';
      localStorage.setItem('dg_token', mockToken);
      set({ token: mockToken });
      await get().fetchProfile();
    } else {
      try {
        const cred = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(cred);
        const googleAccessToken = credential?.accessToken || null;
        if (googleAccessToken) {
          localStorage.setItem('dg_google_access_token', googleAccessToken);
          set({ googleAccessToken });
        }
        const token = await cred.user.getIdToken();
        localStorage.setItem('dg_token', token);
        set({ token });
        await get().fetchProfile();
      } catch (error: any) {
        console.error('Google Auth popup failed:', error);
        alert(`Google Sign-In failed: ${error.message}`);
      }
    }
    set({ loading: false });
  },

  register: async (email, password, displayName) => {
    set({ loading: true });
    const isMock = !import.meta.env.VITE_FIREBASE_API_KEY;
    if (isMock) {
      const mockToken = `mock_user__${email}__${displayName.replace(/\s+/g, '_')}`;
      localStorage.setItem('dg_token', mockToken);
      set({ token: mockToken });
      // Create user details in memory / mock db manually
      const { apiUrl } = get();
      try {
        await fetch(`${apiUrl}/api/users/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`
          },
          body: JSON.stringify({ displayName, email, onboardingComplete: false })
        });
      } catch (e) {
        console.error(e);
      }
      await get().fetchProfile();
    } else {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfileFirebase(cred.user, { displayName });
        const token = await cred.user.getIdToken();
        localStorage.setItem('dg_token', token);
        set({ token });
        await get().fetchProfile();
      } catch (error: any) {
        console.error('Firebase Auth registration failed:', error);
        alert(`Registration failed: ${error.message}`);
      }
    }
    set({ loading: false });
  },

  logout: () => {
    localStorage.removeItem('dg_token');
    localStorage.removeItem('dg_google_access_token');
    if (import.meta.env.VITE_FIREBASE_API_KEY) {
      fbSignOut(auth).catch(e => console.error(e));
    }
    set({ token: null, googleAccessToken: null, user: null });
  },

  fetchProfile: async () => {
    const { token, apiUrl } = get();
    if (!token) return;

    try {
      const res = await fetch(`${apiUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        set({ user });
      }
    } catch (e) {
      console.error('Failed fetching user profile:', e);
      // Local fallback profile based on mockToken contents
      let emailVal = 'hacker@google.com';
      let nameVal = 'Google Guardian';
      if (token && token.startsWith('mock_user__')) {
        const parts = token.split('__');
        emailVal = parts[1] || emailVal;
        const rawName = parts[2] || '';
        nameVal = rawName.replace(/_/g, ' ');
        nameVal = nameVal.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      set({
        user: {
          uid: token || 'dev-user-123',
          email: emailVal,
          displayName: nameVal,
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
          xp: 250,
          level: 2,
          streak: 5,
          lastActiveDate: new Date().toISOString(),
          productivityScore: 84,
          focusScore: 92,
          onboardingComplete: true,
          preferences: {
            workStyle: 'morning',
            deepWorkDuration: 25,
            workHoursStart: '09:00',
            workHoursEnd: '17:00'
          }
        }
      });
    }
  },

  updateProfile: async (updates) => {
    const { token, apiUrl, user } = get();
    if (!token) return;

    try {
      const res = await fetch(`${apiUrl}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        set({ user: updated });
      }
    } catch (e) {
      console.error('Update profile error:', e);
      set({ user: { ...user, ...updates } as UserProfile });
    }
  },

  completeOnboarding: async (preferences) => {
    const isMock = !import.meta.env.VITE_FIREBASE_API_KEY;
    let displayName = 'Google Guardian';
    let email = 'hacker@google.com';
    let photoURL = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';

    const token = get().token;
    if (isMock && token && token.startsWith('mock_user__')) {
      const parts = token.split('__');
      email = parts[1] || email;
      const rawName = parts[2] || '';
      displayName = rawName.replace(/_/g, ' ');
      displayName = displayName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else if (!isMock && auth.currentUser) {
      displayName = auth.currentUser.displayName || 'Google Guardian';
      email = auth.currentUser.email || '';
      photoURL = auth.currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
    }

    await get().updateProfile({
      uid: isMock ? (token || 'dev-user-123') : auth.currentUser?.uid,
      displayName,
      email,
      photoURL,
      xp: 100,
      level: 1,
      streak: 1,
      lastActiveDate: new Date().toISOString(),
      productivityScore: 75,
      focusScore: 75,
      onboardingComplete: true,
      preferences
    });
  },

  toggleDarkMode: () => {
    const nextDark = !get().darkMode;
    localStorage.setItem('dg_theme', nextDark ? 'dark' : 'light');
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ darkMode: nextDark });
  }
}));
