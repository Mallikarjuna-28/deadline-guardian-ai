import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useTaskStore } from './useTaskStore';
import { useProjectStore } from './useProjectStore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  parts: string;
  toolFired?: {
    name: string;
    params: any;
  };
}

interface AgentState {
  messages: ChatMessage[];
  statusText: string | null;
  isTyping: boolean;
  voiceInputActive: boolean;
  voiceOutputActive: boolean;
  setVoiceInputActive: (active: boolean) => void;
  setVoiceOutputActive: (active: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  messages: [
    {
      id: 'welcome',
      role: 'model',
      parts: "Hello! I am your **Deadline Guardian AI**. I monitor your deadlines, calculate task completion risks, and can take action to help resolve calendar conflicts. Try typing **'create task'** or ask me to **'reschedule overdue tasks'** to see my tools in action!"
    }
  ],
  statusText: null,
  isTyping: false,
  voiceInputActive: false,
  voiceOutputActive: false,

  setVoiceInputActive: (active) => set({ voiceInputActive: active }),
  setVoiceOutputActive: (active) => set({ voiceOutputActive: active }),

  clearHistory: () => set({
    messages: [
      {
        id: 'welcome',
        role: 'model',
        parts: "Chat history cleared. How can I help you guard your deadlines today?"
      }
    ],
    statusText: null,
    isTyping: false
  }),

  sendMessage: async (text) => {
    if (!text.trim()) return;

    const userMsgId = 'msg-' + Date.now();
    const newUserMsg: ChatMessage = { id: userMsgId, role: 'user', parts: text };

    set(state => ({
      messages: [...state.messages, newUserMsg],
      isTyping: true,
      statusText: 'Analyzing inquiry...'
    }));

    const { token, apiUrl } = useAuthStore.getState();

    // Map conversation history
    const history = get().messages.map(m => ({
      role: m.role,
      parts: m.parts
    }));

    const assistantMsgId = 'msg-ai-' + Date.now();
    let currentResponseContent = '';

    // Create target assistant slot
    set(state => ({
      messages: [
        ...state.messages,
        { id: assistantMsgId, role: 'model', parts: '' }
      ]
    }));

    const url = `${apiUrl}/api/ai/chat?message=${encodeURIComponent(text)}&history=${encodeURIComponent(JSON.stringify(history))}&token=${token}`;

    const eventSource = new EventSource(url);

    eventSource.addEventListener('content', (event: MessageEvent) => {
      const chunk = JSON.parse(event.data);
      currentResponseContent += chunk;
      set(state => ({
        messages: state.messages.map(m =>
          m.id === assistantMsgId ? { ...m, parts: currentResponseContent } : m
        )
      }));
    });

    eventSource.addEventListener('status', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      set({ statusText: data.message });
    });

    eventSource.addEventListener('tool', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      set(state => ({
        messages: state.messages.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                toolFired: { name: data.tool, params: data.params }
              }
            : m
        )
      }));
    });

    eventSource.addEventListener('update', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'tasks') {
        useTaskStore.getState().fetchTasks();
      }
      if (data.type === 'projects') {
        useProjectStore.getState().fetchProjects();
      }
    });

    eventSource.addEventListener('done', () => {
      eventSource.close();
      set({ isTyping: false, statusText: null });

      // TTS voice synthesis fallback if user requested voice outputs
      if (get().voiceOutputActive && 'speechSynthesis' in window) {
        // Strip markdown stars/links for speech readability
        const cleanSpeech = currentResponseContent.replace(/[*#`_\-]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanSpeech);
        window.speechSynthesis.speak(utterance);
      }
    });

    eventSource.onerror = (e) => {
      console.error('SSE connection encountered a problem:', e);
      eventSource.close();
      set({ isTyping: false, statusText: null });

      // Fallback content on network issues
      if (currentResponseContent === '') {
        set(state => ({
          messages: state.messages.map(m =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  parts: 'I ran into an issue communicating with my backend server. Please verify the backend service is running locally on port 8080 and try again!'
                }
              : m
          )
        }));
      }
    };
  }
}));
