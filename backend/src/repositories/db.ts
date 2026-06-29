import * as admin from 'firebase-admin';

// Initialize Firebase Admin if environment variables are set
let db: admin.firestore.Firestore | null = null;
let useMockDb = true;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    db = admin.firestore();
    useMockDb = false;
    console.log('Successfully connected to Firebase Firestore Admin SDK');
  } catch (error) {
    console.error('Firebase Admin init failed, falling back to Mock Database:', error);
  }
} else {
  console.log('Firebase credentials missing. Using Mock In-Memory Database for demonstration.');
}

// In-Memory Database structure
interface InMemoryStore {
  users: Record<string, any>;
  tasks: Record<string, Record<string, any>>;
  projects: Record<string, Record<string, any>>;
  habits: Record<string, Record<string, any>>;
  notifications: Record<string, Record<string, any>>;
  memory: Record<string, Record<string, any>>;
}

const mockStore: InMemoryStore = {
  users: {},
  tasks: {},
  projects: {},
  habits: {},
  notifications: {},
  memory: {}
};

// Seed mock data for demonstration
const seedMockData = (userId: string) => {
  if (mockStore.users[userId]) return;

  let email = 'hacker@google.com';
  let displayName = 'Google Guardian';

  if (userId && userId.startsWith('mock_user__')) {
    const parts = userId.split('__');
    email = parts[1] || email;
    const namePart = parts[2] || '';
    displayName = namePart.replace(/_/g, ' ');
    // Capitalize words
    displayName = displayName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  mockStore.users[userId] = {
    uid: userId,
    email,
    displayName,
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
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockStore.tasks[userId] = {
    'task-1': {
      id: 'task-1',
      title: 'Finish ML Hackathon presentation deck',
      description: 'Prepare final pitch slides showcasing Gemini 2.0 Flash features.',
      priority: 'critical',
      status: 'in_progress',
      deadline: new Date(Date.now() + 3600 * 1000 * 4).toISOString(), // due in 4 hours (risk!)
      estimatedMinutes: 120,
      actualMinutes: 45,
      category: 'Work',
      tags: ['hackathon', 'gemini', 'pitch'],
      projectId: 'proj-1',
      parentTaskId: null,
      subtasks: [
        { id: 'sub-1', title: 'Outline script', completed: true },
        { id: 'sub-2', title: 'Generate visual assets', completed: false },
        { id: 'sub-3', title: 'Record demo video', completed: false }
      ],
      attachments: [],
      recurrence: null,
      aiRiskScore: 78,
      aiInsight: 'This is at high risk of delay since it typically takes 2 hours and you only have 4 hours left today, with other tasks scheduled in parallel.',
      aiSubtasks: ['Review speech notes', 'Compress demo recording', 'Test presentation remote'],
      scheduledStart: new Date().toISOString(),
      completedAt: null,
      xpReward: 150,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    'task-2': {
      id: 'task-2',
      title: 'Submit Google Cloud Run Dockerfile configurations',
      description: 'Optimize Nginx settings for the containerized frontend distribution.',
      priority: 'high',
      status: 'pending',
      deadline: new Date(Date.now() + 3600 * 1000 * 25).toISOString(), // due in 25 hours
      estimatedMinutes: 60,
      actualMinutes: 0,
      category: 'DevOps',
      tags: ['cloud-run', 'docker', 'gcp'],
      projectId: 'proj-1',
      parentTaskId: null,
      subtasks: [],
      attachments: [],
      recurrence: null,
      aiRiskScore: 25,
      aiInsight: 'On track. Plenty of buffer time available for setup.',
      aiSubtasks: [],
      scheduledStart: null,
      completedAt: null,
      xpReward: 80,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    'task-3': {
      id: 'task-3',
      title: 'Review calendar sync client settings',
      description: 'Inspect refresh token timeouts and error handling patterns.',
      priority: 'medium',
      status: 'completed',
      deadline: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // completed 2 hours ago
      estimatedMinutes: 30,
      actualMinutes: 35,
      category: 'Work',
      tags: ['oauth', 'api'],
      projectId: null,
      parentTaskId: null,
      subtasks: [],
      attachments: [],
      recurrence: null,
      aiRiskScore: 0,
      aiInsight: 'Completed on time. Good job!',
      aiSubtasks: [],
      scheduledStart: null,
      completedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      xpReward: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };

  mockStore.projects[userId] = {
    'proj-1': {
      id: 'proj-1',
      name: 'Deadline Guardian Launch',
      description: 'Deliver the core product launch goals.',
      color: '#4F46E5',
      icon: 'Rocket',
      deadline: new Date(Date.now() + 3600 * 1000 * 72).toISOString(),
      progress: 33,
      taskCount: 3,
      completedCount: 1,
      aiHealthScore: 85,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };

  mockStore.habits[userId] = {
    'habit-1': {
      id: 'habit-1',
      name: 'Morning Planning Session',
      icon: 'Compass',
      frequency: 'daily',
      streak: 4,
      longestStreak: 12,
      completions: [
        new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        new Date(Date.now() - 3600 * 1000 * 48).toISOString()
      ],
      createdAt: new Date().toISOString()
    }
  };

  mockStore.notifications[userId] = {
    'notif-1': {
      id: 'notif-1',
      type: 'risk_alert',
      title: 'Critical Deadline Risk Detected',
      body: 'Your task "Finish ML Hackathon presentation deck" has a 78% risk of overdue completion.',
      read: false,
      taskId: 'task-1',
      createdAt: new Date().toISOString()
    }
  };
};

export const dbService = {
  isMock: () => useMockDb,

  preseedMockUser: (userId: string, data: any): void => {
    // Populate database mock template first
    seedMockData(userId);
    // Overwrite with dynamic token properties (e.g. decoded email, displayName, photoURL)
    mockStore.users[userId] = {
      ...mockStore.users[userId],
      ...data,
      uid: userId
    };
  },

  // User Operations
  getUser: async (userId: string): Promise<any> => {
    if (useMockDb) {
      seedMockData(userId);
      return mockStore.users[userId] || null;
    }
    try {
      const doc = await db!.collection('users').doc(userId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Firestore getUser failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      return mockStore.users[userId] || null;
    }
  },

  setUser: async (userId: string, data: any): Promise<void> => {
    if (useMockDb) {
      mockStore.users[userId] = { ...mockStore.users[userId], ...data, uid: userId };
      return;
    }
    try {
      await db!.collection('users').doc(userId).set(data, { merge: true });
    } catch (error) {
      console.error('Firestore setUser failed, falling back to mock database:', error);
      useMockDb = true;
      mockStore.users[userId] = { ...mockStore.users[userId], ...data, uid: userId };
    }
  },

  // Task Operations
  getTasks: async (userId: string): Promise<any[]> => {
    if (useMockDb) {
      seedMockData(userId);
      return Object.values(mockStore.tasks[userId] || {});
    }
    try {
      const snap = await db!.collection('users').doc(userId).collection('tasks').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Firestore getTasks failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      return Object.values(mockStore.tasks[userId] || {});
    }
  },

  saveTask: async (userId: string, taskId: string, data: any): Promise<any> => {
    if (useMockDb) {
      seedMockData(userId);
      const original = mockStore.tasks[userId][taskId] || {};
      const updated = {
        ...original,
        ...data,
        id: taskId,
        createdAt: original.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockStore.tasks[userId][taskId] = updated;
      return updated;
    }
    try {
      const ref = db!.collection('users').doc(userId).collection('tasks').doc(taskId);
      await ref.set(data, { merge: true });
      const snap = await ref.get();
      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error('Firestore saveTask failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      const original = mockStore.tasks[userId][taskId] || {};
      const updated = {
        ...original,
        ...data,
        id: taskId,
        createdAt: original.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockStore.tasks[userId][taskId] = updated;
      return updated;
    }
  },

  deleteTask: async (userId: string, taskId: string): Promise<void> => {
    if (useMockDb) {
      seedMockData(userId);
      delete mockStore.tasks[userId][taskId];
      return;
    }
    try {
      await db!.collection('users').doc(userId).collection('tasks').doc(taskId).delete();
    } catch (error) {
      console.error('Firestore deleteTask failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      delete mockStore.tasks[userId][taskId];
    }
  },

  // Projects
  getProjects: async (userId: string): Promise<any[]> => {
    if (useMockDb) {
      seedMockData(userId);
      return Object.values(mockStore.projects[userId] || {});
    }
    try {
      const snap = await db!.collection('users').doc(userId).collection('projects').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Firestore getProjects failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      return Object.values(mockStore.projects[userId] || {});
    }
  },

  saveProject: async (userId: string, projectId: string, data: any): Promise<any> => {
    if (useMockDb) {
      seedMockData(userId);
      const original = mockStore.projects[userId][projectId] || {};
      const updated = {
        ...original,
        ...data,
        id: projectId,
        createdAt: original.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockStore.projects[userId][projectId] = updated;
      return updated;
    }
    try {
      const ref = db!.collection('users').doc(userId).collection('projects').doc(projectId);
      await ref.set(data, { merge: true });
      const snap = await ref.get();
      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error('Firestore saveProject failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      const original = mockStore.projects[userId][projectId] || {};
      const updated = {
        ...original,
        ...data,
        id: projectId,
        createdAt: original.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockStore.projects[userId][projectId] = updated;
      return updated;
    }
  },

  deleteProject: async (userId: string, projectId: string): Promise<void> => {
    if (useMockDb) {
      seedMockData(userId);
      delete mockStore.projects[userId][projectId];
      return;
    }
    try {
      await db!.collection('users').doc(userId).collection('projects').doc(projectId).delete();
    } catch (error) {
      console.error('Firestore deleteProject failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      delete mockStore.projects[userId][projectId];
    }
  },

  // Habits
  getHabits: async (userId: string): Promise<any[]> => {
    if (useMockDb) {
      seedMockData(userId);
      return Object.values(mockStore.habits[userId] || {});
    }
    try {
      const snap = await db!.collection('users').doc(userId).collection('habits').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Firestore getHabits failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      return Object.values(mockStore.habits[userId] || {});
    }
  },

  saveHabit: async (userId: string, habitId: string, data: any): Promise<any> => {
    if (useMockDb) {
      seedMockData(userId);
      const original = mockStore.habits[userId][habitId] || {};
      const updated = {
        ...original,
        ...data,
        id: habitId,
        createdAt: original.createdAt || new Date().toISOString(),
      };
      mockStore.habits[userId][habitId] = updated;
      return updated;
    }
    try {
      const ref = db!.collection('users').doc(userId).collection('habits').doc(habitId);
      await ref.set(data, { merge: true });
      const snap = await ref.get();
      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error('Firestore saveHabit failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      const original = mockStore.habits[userId][habitId] || {};
      const updated = {
        ...original,
        ...data,
        id: habitId,
        createdAt: original.createdAt || new Date().toISOString(),
      };
      mockStore.habits[userId][habitId] = updated;
      return updated;
    }
  },

  deleteHabit: async (userId: string, habitId: string): Promise<void> => {
    if (useMockDb) {
      seedMockData(userId);
      delete mockStore.habits[userId][habitId];
      return;
    }
    try {
      await db!.collection('users').doc(userId).collection('habits').doc(habitId).delete();
    } catch (error) {
      console.error('Firestore deleteHabit failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      delete mockStore.habits[userId][habitId];
    }
  },

  // Notifications
  getNotifications: async (userId: string): Promise<any[]> => {
    if (useMockDb) {
      seedMockData(userId);
      return Object.values(mockStore.notifications[userId] || {}).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    try {
      const snap = await db!.collection('users').doc(userId).collection('notifications').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Firestore getNotifications failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      return Object.values(mockStore.notifications[userId] || {}).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  },

  saveNotification: async (userId: string, notifId: string, data: any): Promise<any> => {
    if (useMockDb) {
      seedMockData(userId);
      const original = mockStore.notifications[userId][notifId] || {};
      const updated = {
        ...original,
        ...data,
        id: notifId,
        createdAt: original.createdAt || new Date().toISOString(),
      };
      mockStore.notifications[userId][notifId] = updated;
      return updated;
    }
    try {
      const ref = db!.collection('users').doc(userId).collection('notifications').doc(notifId);
      await ref.set(data, { merge: true });
      const snap = await ref.get();
      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error('Firestore saveNotification failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      const original = mockStore.notifications[userId][notifId] || {};
      const updated = {
        ...original,
        ...data,
        id: notifId,
        createdAt: original.createdAt || new Date().toISOString(),
      };
      mockStore.notifications[userId][notifId] = updated;
      return updated;
    }
  },

  // Memory
  getMemory: async (userId: string): Promise<any[]> => {
    if (useMockDb) {
      seedMockData(userId);
      return Object.values(mockStore.memory[userId] || {});
    }
    try {
      const snap = await db!.collection('users').doc(userId).collection('agentMemory').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Firestore getMemory failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      return Object.values(mockStore.memory[userId] || {});
    }
  },

  saveMemory: async (userId: string, key: string, value: any): Promise<void> => {
    if (useMockDb) {
      seedMockData(userId);
      mockStore.memory[userId][key] = { key, value, context: 'user_agent_chat', updatedAt: new Date().toISOString() };
      return;
    }
    try {
      await db!.collection('users').doc(userId).collection('agentMemory').doc(key).set({
        key,
        value,
        context: 'user_agent_chat',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Firestore saveMemory failed, falling back to mock database:', error);
      useMockDb = true;
      seedMockData(userId);
      mockStore.memory[userId][key] = { key, value, context: 'user_agent_chat', updatedAt: new Date().toISOString() };
    }
  }
};
