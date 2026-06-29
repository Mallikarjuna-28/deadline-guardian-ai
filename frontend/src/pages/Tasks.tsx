import React, { useState, useEffect, useCallback } from 'react';
import { useTaskStore, Task, requestGoogleCalendarAccess } from '../stores/useTaskStore';
import { useProjectStore } from '../stores/useProjectStore';
import { useAuthStore } from '../stores/useAuthStore';
import {
  Plus,
  Search,
  Sparkles,
  List,
  LayoutGrid,
  CheckCircle,
  Clock,
  Trash2,
  Brain,
  Tag,
  FolderOpen,
  Calendar,
  Link2
} from 'lucide-react';
import { PhotoScanner, ScannedTask } from '../components/tasks/PhotoScanner';
import { SkeletonKanban, SkeletonList } from '../components/shared/SkeletonLoader';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const getGoogleCalendarUrl = (task: Task) => {
  const title = encodeURIComponent(task.title);
  const details = encodeURIComponent(
    `Deadline Guardian AI Task\nPriority: ${task.priority.toUpperCase()}\nRisk Score: ${task.aiRiskScore || 0}%\nEstimated Duration: ${task.estimatedMinutes || 60} minutes.`
  );
  
  const deadlineDate = new Date(task.deadline);
  const durationMinutes = task.estimatedMinutes || 60;
  const startDate = new Date(deadlineDate.getTime() - durationMinutes * 60 * 1000);
  
  const startDateStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDateStr = deadlineDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}`;
};

export default function Tasks() {
  const {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    parseNLP,
    generateSubtasks,
    analyzeRisk
  } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();

  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [nlpText, setNlpText] = useState('');
  const [nlpParsing, setNlpParsing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'warn'>('success');
  const [connectingCalendar, setConnectingCalendar] = useState(false);

  const googleAccessToken = useAuthStore(s => s.googleAccessToken);

  // Form states for manual additions
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [newCategory, setNewCategory] = useState('Work');
  const [newProjectId, setNewProjectId] = useState('');
  const [newEstimate, setNewEstimate] = useState(60);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Keyboard shortcut: N to open add task form
  useKeyboardShortcuts({
    onNewTask: useCallback(() => setShowAddForm(true), [])
  });

  // PhotoScanner handler: bulk create from scanned image
  const handleScannedTasks = async (scannedTasks: ScannedTask[]) => {
    for (const task of scannedTasks) {
      await createTask({
        title: task.title,
        deadline: task.deadline || new Date(Date.now() + 3600 * 1000 * 48).toISOString(),
        priority: task.priority,
        category: 'Work',
        estimatedMinutes: 60
      });
    }
    showNotification(
      '📷 Tasks Added from Scan!',
      `✨ ${scannedTasks.length} task${scannedTasks.length !== 1 ? 's' : ''} extracted and added from your image.`,
      'success'
    );
  };

  const showNotification = (title: string, message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message
        });
      } catch (err) {
        console.error('Browser Notification error:', err);
      }
    }
  };

  const handleConnectCalendar = async () => {
    setConnectingCalendar(true);
    try {
      const token = await requestGoogleCalendarAccess();
      if (token) {
        showNotification('Google Calendar Connected!', '✅ Your Google Calendar is now connected. New tasks will sync automatically.', 'success');
      } else {
        showNotification('Calendar Connection', 'Connection was cancelled. You can connect later.', 'info');
      }
    } finally {
      setConnectingCalendar(false);
    }
  };

  const handleNLPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpText.trim()) return;

    setNlpParsing(true);
    try {
      const parsed = await parseNLP(nlpText);
      const created = await createTask({
        title: parsed.title || nlpText,
        deadline: parsed.deadline,
        priority: parsed.priority || 'medium',
        estimatedMinutes: parsed.estimatedMinutes || 60,
        category: parsed.category || 'Work',
        tags: parsed.tags || ['nlp']
      });
      setNlpText('');
      // Trigger risk scoring automatically
      await analyzeRisk(created.id);

      if ((created as any)._calendarSynced) {
        showNotification(
          '📅 Added to Google Calendar!',
          `"${created.title}" is now in your Google Calendar with reminders.`,
          'success'
        );
      } else if (!googleAccessToken) {
        showNotification(
          '✅ Task Created',
          `"${created.title}" added. Connect Google Calendar to auto-sync.`,
          'info'
        );
      } else {
        showNotification(
          '✅ Task Created',
          `"${created.title}" saved. Calendar sync failed — click the calendar icon to add manually.`,
          'warn'
        );
      }
    } catch (e) {
      console.error('NLP addition failed:', e);
    } finally {
      setNlpParsing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = await createTask({
      title: newTitle,
      deadline: newDeadline || new Date(Date.now() + 3600 * 1000 * 48).toISOString(),
      priority: newPriority,
      category: newCategory,
      projectId: newProjectId || null,
      estimatedMinutes: newEstimate,
      subtasks: []
    });

    setNewTitle('');
    setNewDeadline('');
    setNewPriority('medium');
    setNewProjectId('');
    setShowAddForm(false);

    await analyzeRisk(created.id);

    if ((created as any)._calendarSynced) {
      showNotification(
        '📅 Added to Google Calendar!',
        `"${created.title}" is now in your Google Calendar with reminders set.`,
        'success'
      );
    } else if (!googleAccessToken) {
      showNotification(
        '✅ Task Created',
        `"${created.title}" saved. Connect Google Calendar to auto-sync tasks.`,
        'info'
      );
    } else {
      showNotification(
        '✅ Task Created',
        `"${created.title}" saved. Calendar sync failed — click the 📅 icon to add manually.`,
        'warn'
      );
    }
  };

  const handleToggleSubtask = async (taskId: string, subId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subId ? { ...st, completed: !st.completed } : st
    );

    await updateTask(taskId, { subtasks: updatedSubtasks });
  };

  const handleMoveStatus = async (taskId: string, nextStatus: Task['status']) => {
    await updateTask(taskId, { status: nextStatus });
  };

  // Filters logic
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const kanbanColumns: { id: Task['status']; label: string; color: string }[] = [
    { id: 'pending', label: 'To Do', color: 'border-t-gray-500' },
    { id: 'in_progress', label: 'In Progress', color: 'border-t-indigo-500' },
    { id: 'completed', label: 'Completed', color: 'border-t-green-500' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Search and Navigation toggle Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-200">Tasks Board</h1>
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded-md transition-all ${view === 'kanban' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-brand-indigo w-48 sm:w-64"
            />
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-indigo hover:bg-indigo-600 text-white text-xs font-semibold transition-all shadow-md shadow-brand-indigo/15"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Manual</span>
          </button>
        </div>
      </div>

      {/* Google Calendar Connection Banner */}
      {!googleAccessToken && (
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border border-indigo-500/20">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📅</span>
            <div>
              <p className="text-xs font-semibold text-indigo-300">Connect Google Calendar</p>
              <p className="text-[10px] text-gray-400">Tasks will auto-sync to your calendar when you add them</p>
            </div>
          </div>
          <button
            onClick={handleConnectCalendar}
            disabled={connectingCalendar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all whitespace-nowrap"
          >
            <Link2 className="w-3 h-3" />
            {connectingCalendar ? 'Connecting...' : 'Connect Now'}
          </button>
        </div>
      )}

      {/* Calendar connected indicator */}
      {googleAccessToken && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-900/20 border border-green-500/15 text-green-400 text-[10px] font-semibold">
          <span>✅</span>
          <span>Google Calendar connected — tasks sync automatically when added</span>
        </div>
      )}

      {/* NLP Task Parser Prompt Input */}
      <div className="rounded-2xl glass-premium p-4 border border-indigo-500/20">
        <form onSubmit={handleNLPSubmit} className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <input
            type="text"
            value={nlpText}
            onChange={(e) => setNlpText(e.target.value)}
            placeholder="AI Quick Add: 'Finish review outline by Sunday 6pm, very critical, 2 hours'"
            className="flex-1 bg-transparent border-none text-sm placeholder-indigo-300/40 text-gray-200 focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            disabled={nlpParsing || !nlpText.trim()}
            className="px-4 py-1.5 rounded-lg bg-brand-indigo hover:bg-indigo-600 text-white font-semibold text-xs transition-colors"
          >
            {nlpParsing ? 'Analyzing...' : 'AI Add'}
          </button>
        </form>
        {/* Photo Scanner — scan handwritten lists or sticky notes */}
        <PhotoScanner onTasksExtracted={handleScannedTasks} />
      </div>

      {/* Manual Task form overlay */}
      {showAddForm && (
        <form onSubmit={handleManualSubmit} className="p-5 rounded-2xl glass border border-white/10 grid sm:grid-cols-2 gap-4 animate-fadeIn">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Task Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter task name"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Target Deadline</label>
            <input
              type="datetime-local"
              required
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
              >
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="DevOps">DevOps</option>
                <option value="Health">Health</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Project Hub</label>
              <select
                value={newProjectId}
                onChange={(e) => setNewProjectId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
              >
                <option value="">None (Personal)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                value={newEstimate}
                onChange={(e) => setNewEstimate(parseInt(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
              />
            </div>
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
            >
              Add Task
            </button>
          </div>
        </form>
      )}

      {/* Task Content Displays */}
      {(loading as boolean) ? (
        view === 'list' ? <SkeletonList count={5} /> : <SkeletonKanban />
      ) : view === 'list' ? (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-200">No tasks yet</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-xs">
                Add your first task above, use the AI Quick Add, or scan a handwritten list with 📷
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                + Add your first task
              </button>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className="p-4 rounded-xl glass border border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => completeTask(task.id)}
                    disabled={task.status === 'completed'}
                    className={`w-5 h-5 flex items-center justify-center border rounded-full transition-all ${
                      task.status === 'completed'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-500 hover:border-indigo-400'
                    }`}
                  >
                    {task.status === 'completed' ? '✓' : ''}
                  </button>
                  <div>
                    <h3 className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                      {task.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 items-center text-[10px] text-gray-500 mt-1">
                      <span className="font-mono">⌛ {new Date(task.deadline).toLocaleString()}</span>
                      <span>•</span>
                      <span className="capitalize">{task.priority}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 bg-white/5 rounded">{task.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={getGoogleCalendarUrl(task)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-indigo-500/15 text-gray-500 hover:text-indigo-400 transition-colors"
                    title="Add to Google Calendar"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded hover:bg-red-500/15 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* KANBAN LAYOUT BOARD */
        <div className="grid md:grid-cols-3 gap-6">
          {kanbanColumns.map(col => {
            const columnTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="space-y-4">
                <div className={`border-t-2 ${col.color} pt-2 flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5`}>
                  <span className="font-display font-semibold text-sm text-gray-200">{col.label}</span>
                  <span className="text-xs font-mono font-bold text-gray-400 px-2 py-0.2 bg-black/40 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[300px]">
                  {columnTasks.map(task => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl glass border border-indigo-950/40 space-y-3 hover:border-indigo-500/20 transition-all select-none group relative"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                          task.priority === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          task.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          'bg-white/5 text-gray-400'
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>
                        
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {col.id === 'pending' && (
                            <button
                              onClick={() => handleMoveStatus(task.id, 'in_progress')}
                              className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
                            >
                              Start
                            </button>
                          )}
                          {col.id === 'in_progress' && (
                            <button
                              onClick={() => completeTask(task.id)}
                              className="text-[10px] font-semibold text-green-400 hover:text-green-300"
                            >
                              Complete
                            </button>
                          )}
                          <a
                            href={getGoogleCalendarUrl(task)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-gray-500 hover:text-indigo-400 hover:bg-white/5"
                            title="Add to Google Calendar"
                          >
                            <Calendar className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-white/5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold text-gray-200 leading-snug">
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono">
                        <Clock className="w-3.5 h-3.5 text-gray-600" />
                        <span>{new Date(task.deadline).toLocaleString()}</span>
                      </div>

                      {/* Subtask list breakdown */}
                      {task.subtasks && task.subtasks.length > 0 ? (
                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Subtasks</div>
                          {task.subtasks.map(st => (
                            <label key={st.id} className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-gray-200">
                              <input
                                type="checkbox"
                                checked={st.completed}
                                onChange={() => handleToggleSubtask(task.id, st.id)}
                                className="w-3.5 h-3.5 bg-black/40 rounded border-white/10 text-brand-indigo focus:ring-0"
                              />
                              <span className={st.completed ? 'line-through text-gray-600' : ''}>{st.title}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        col.id !== 'completed' && (
                          <button
                            onClick={() => generateSubtasks(task.id)}
                            className="w-full py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                          >
                            <Brain className="w-3 h-3" />
                            <span>Auto Subtasks</span>
                          </button>
                        )
                      )}

                      {/* AI Risk Score badge details */}
                      {task.status !== 'completed' && task.aiRiskScore > 0 && (
                        <div className="flex justify-between items-center text-[10px] pt-2 border-t border-white/5 text-gray-500">
                          <span className="flex items-center gap-1 font-sans">
                            🧠 Risk Score:
                          </span>
                          <span className={`font-mono font-bold px-1.5 py-0.2 rounded ${
                            task.aiRiskScore >= 75 ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                            task.aiRiskScore >= 45 ? 'bg-orange-500/10 text-orange-400 border-orange-500/25' :
                            'bg-green-500/10 text-green-400 border border-green-500/25'
                          }`}>
                            {task.aiRiskScore}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 text-white px-5 py-3 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md transition-all animate-fade-in-up ${
          toastType === 'success' ? 'bg-green-950/90 border-green-500/30' :
          toastType === 'warn' ? 'bg-orange-950/90 border-orange-500/30' :
          'bg-indigo-950/90 border-indigo-500/30'
        }`}>
          <span className="text-lg">
            {toastType === 'success' ? '📅' : toastType === 'warn' ? '⚠️' : '🔔'}
          </span>
          <div>
            <p className="text-xs font-bold">
              {toastType === 'success' ? 'Calendar Synced!' : toastType === 'warn' ? 'Sync Failed' : 'Task Created'}
            </p>
            <p className="text-[11px] text-white/70">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white text-xs ml-2 font-bold transition-colors">✕</button>
        </div>
      )}
    </div>
  );
}
