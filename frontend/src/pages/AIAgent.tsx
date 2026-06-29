import React, { useState, useEffect, useRef } from 'react';
import { useAgentStore, ChatMessage } from '../stores/useAgentStore';
import { useTaskStore } from '../stores/useTaskStore';
import { Send, Mic, Volume2, VolumeX, Sparkles, RefreshCw, Cpu } from 'lucide-react';
import { AgentActions, AgentAction } from '../components/agent/AgentActions';
import { detectSentiment } from '../services/sentiment.service';
import { useAuthStore } from '../stores/useAuthStore';

export default function AIAgent() {
  const {
    messages,
    sendMessage,
    statusText,
    isTyping,
    clearHistory,
    voiceInputActive,
    setVoiceInputActive,
    voiceOutputActive,
    setVoiceOutputActive
  } = useAgentStore();

  const { fetchTasks } = useTaskStore();
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const sentiment = detectSentiment(input);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, statusText]);

  const toggleVoiceInput = () => {
    if (voiceInputActive) {
      recognitionRef.current?.stop();
      setVoiceInputActive(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => setVoiceInputActive(true);
        rec.onresult = (e: any) => {
          const speechResult = e.results[0][0].transcript;
          setInput(speechResult);
        };
        rec.onerror = () => setVoiceInputActive(false);
        rec.onend = () => setVoiceInputActive(false);

        recognitionRef.current = rec;
        rec.start();
      } else {
        alert('Web Speech API not supported. Please try Chrome!');
      }
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    const textToSend = input;
    setInput('');
    await sendMessage(textToSend);
  };

  const handleChipClick = async (text: string) => {
    if (isTyping) return;
    await sendMessage(text);
  };

  // Parse proposed actions from a model message
  function getActionsFromMessage(msg: ChatMessage): AgentAction[] {
    if (!msg.toolFired) return [];
    const actionableTools = ['reschedule_task', 'bulk_reschedule', 'create_task', 'update_task', 'generate_daily_plan', 'generate_weekly_plan', 'generate_rescue_plan', 'compute_all_risks'];
    if (!actionableTools.includes(msg.toolFired.name)) return [];
    
    return [{
      id: `action-${msg.id}`,
      label: formatActionLabel(msg.toolFired.name, msg.toolFired.params),
      reason: (msg.toolFired.params as any)?.reason || 'AI recommendation based on your schedule',
      toolName: msg.toolFired.name,
      toolArgs: msg.toolFired.params as Record<string, unknown>
    }];
  }

  function formatActionLabel(toolName: string, args: any): string {
    switch (toolName) {
      case 'reschedule_task':
        return `Reschedule "${args?.taskTitle || 'task'}" to ${args?.newDeadline ? new Date(args.newDeadline).toLocaleDateString() : 'new date'}`;
      case 'bulk_reschedule':
        return `Reschedule ${args?.reschedules?.length || 'multiple'} tasks to reduce overload`;
      case 'create_task':
        return `Create new task: "${args?.title || 'Untitled'}"`;
      case 'update_task':
        return `Update task${args?.priority ? ` priority to ${args.priority}` : ''}`;
      case 'generate_daily_plan':
        return "Reorganize today's schedule for maximum focus";
      case 'generate_weekly_plan':
        return "Generate optimized weekly task distribution plan";
      case 'generate_rescue_plan':
        return "Create emergency recovery plan for overdue tasks";
      case 'compute_all_risks':
        return "Recalculate risk scores for all active tasks";
      default:
        return toolName.replace(/_/g, ' ');
    }
  }

  async function executeAgentAction(action: AgentAction): Promise<void> {
    const { token, apiUrl } = useAuthStore.getState();
    if (action.toolName === 'reschedule_task' || action.toolName === 'update_task') {
      const taskId = (action.toolArgs as any).taskId;
      if (taskId) {
        await fetch(`${apiUrl}/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(action.toolArgs)
        });
      }
    } else if (action.toolName === 'create_task') {
      await fetch(`${apiUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(action.toolArgs)
      });
    } else if (action.toolName === 'bulk_reschedule') {
      const reschedules = (action.toolArgs as any).reschedules || [];
      for (const r of reschedules) {
        if (r.taskId) {
          await fetch(`${apiUrl}/api/tasks/${r.taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ deadline: r.newDeadline })
          });
        }
      }
    }
    // Refresh task list after action
    await fetchTasks();
  }

  const promptChips = [
    'What should I do right now?',
    'Am I on track?',
    'Reschedule my week',
    'Break down my biggest task'
  ];

  return (
    <div className="h-[80vh] flex flex-col justify-between rounded-2xl glass border border-indigo-950/40 overflow-hidden">
      
      {/* Agent Top Header Panel */}
      <div className="p-4 border-b border-indigo-950/40 bg-white/[0.02] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-violet text-white pulse-glow-violet shadow-lg">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-gray-200">Guardian AI Agent</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-gray-400 font-mono">Model: Gemini 2.0 Flash • 20 Tools Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceOutputActive(!voiceOutputActive)}
            className={`p-2 rounded-lg border transition-colors ${
              voiceOutputActive ? 'border-brand-indigo bg-brand-indigo/10 text-indigo-300' : 'border-white/5 text-gray-500 hover:text-gray-300'
            }`}
            title="Toggle voice speech synthesis output"
          >
            {voiceOutputActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            onClick={clearHistory}
            className="p-2 rounded-lg border border-white/5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Clear Chat Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Thread Panel */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map(msg => {
          const isModel = msg.role === 'model';
          const actions = isModel ? getActionsFromMessage(msg) : [];
          return (
            <div key={msg.id} className={`flex gap-3 max-w-xl ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isModel ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400' : 'bg-white/10 text-gray-200'
              }`}>
                {isModel ? '🤖' : 'U'}
              </div>

              {/* Chat Bubble + Actions */}
              <div className="space-y-2 flex-1">
                <div className={`p-3.5 rounded-2xl border text-sm leading-relaxed ${
                  isModel
                    ? 'bg-white/5 border-white/5 text-gray-300 rounded-tl-none'
                    : 'bg-gradient-to-r from-brand-indigo to-brand-violet border-brand-indigo/25 text-white rounded-tr-none'
                }`}>
                  <p className="whitespace-pre-line">{msg.parts}</p>
                </div>

                {/* Tool execution log */}
                {isModel && msg.toolFired && (
                  <div className="p-2.5 rounded-xl bg-black/40 border border-indigo-500/20 font-mono text-[10px] text-indigo-300 space-y-1">
                    <span className="text-green-400 font-sans font-bold flex items-center gap-1">
                      🔧 AI Tool Call Triggered:
                    </span>
                    <div><b>Tool:</b> {msg.toolFired.name}()</div>
                    <div><b>Args:</b> {JSON.stringify(msg.toolFired.params)}</div>
                  </div>
                )}

                {/* Approve/Reject Actions */}
                {actions.length > 0 && (
                  <AgentActions
                    actions={actions}
                    onExecute={executeAgentAction}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3 items-center mr-auto">
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              🤖
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold uppercase tracking-widest animate-pulse font-mono">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{statusText || 'AI is thinking...'}</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {messages.length <= 2 && !isTyping && (
        <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-indigo-950/20">
          {promptChips.map(chip => (
            <button
              key={chip}
              onClick={() => handleChipClick(chip)}
              className="text-[11px] px-3 py-1.5 rounded-full border border-white/5 bg-white/5 hover:border-indigo-500/25 hover:text-indigo-300 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-indigo-950/40 bg-white/[0.01]">
        {/* Sentiment indicator */}
        {sentiment !== 'normal' && input.length > 3 && (
          <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg mb-2 ${
            sentiment === 'stressed'
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : 'bg-green-500/10 text-green-400 border border-green-500/20'
          }`}>
            <span>{sentiment === 'stressed' ? '😰' : '⚡'}</span>
            <span>
              {sentiment === 'stressed'
                ? 'Stress detected — switching to support mode'
                : 'High energy — performance mode activated'}
            </span>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2">
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-3 rounded-xl border transition-colors ${
              voiceInputActive ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-white/5 text-gray-500 hover:text-gray-300'
            }`}
            title="Voice Input"
          >
            <Mic className="w-4 h-4" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={isTyping ? 'Please wait for AI response...' : 'Ask your AI guardian to reschedule tasks, analyze risk, or plan blocks...'}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-brand-indigo disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="p-3 rounded-xl bg-brand-indigo hover:bg-indigo-600 text-white font-semibold transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
