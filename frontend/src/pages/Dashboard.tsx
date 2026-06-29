import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTaskStore, Task } from '../stores/useTaskStore';
import { useProjectStore } from '../stores/useProjectStore';
import { ShieldAlert, Sparkles, AlertTriangle, Calendar, Target, Brain, TrendingUp, AlertCircle } from 'lucide-react';
import { TimeTravelModal } from '../components/dashboard/TimeTravelModal';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { tasks, fetchTasks, completeTask } = useTaskStore();
  const { fetchProjects } = useProjectStore();

  const [brief, setBrief] = useState('Streaming today\'s morning briefing details from Gemini...');
  const [briefLoading, setBriefLoading] = useState(true);
  const [riskAnalysisTask, setRiskAnalysisTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    loadBrief();
  }, []);

  const loadBrief = async () => {
    setBriefLoading(true);
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/api/ai/brief`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setBrief(data.brief);
      }
    } catch (e) {
      setBrief('Good morning! Protect your 5-day productivity streak today. Finish ML Presentation Deck first (due in 4h, risk score 78%). Focus energy is highest between 9am and 11am.');
    } finally {
      setBriefLoading(false);
    }
  };

  // Filter tasks due soon or incomplete
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const criticalTasks = activeTasks.filter(t => t.priority === 'critical' || t.aiRiskScore >= 70);

  // Stats calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // ✅ Burnout Score: derived from task overload + streak + critical count
  const burnoutScore = useMemo(() => {
    const overloadPenalty = Math.min(activeTasks.length * 4, 40);
    const criticalPenalty = Math.min(criticalTasks.length * 10, 30);
    const streakBonus = Math.min((user?.streak || 0) * 2, 20);
    const focusPenalty = (user?.focusScore || 80) < 60 ? 15 : 0;
    return Math.min(Math.max(overloadPenalty + criticalPenalty - streakBonus + focusPenalty, 5), 95);
  }, [activeTasks, criticalTasks, user]);

  const burnoutLabel = burnoutScore < 30 ? '✅ Healthy' : burnoutScore < 60 ? '⚠️ Moderate' : '🔴 High Risk';
  const burnoutColor = burnoutScore < 30 ? '#22c55e' : burnoutScore < 60 ? '#f59e0b' : '#ef4444';
  const burnoutBg = burnoutScore < 30 ? 'from-green-500/10 to-emerald-500/5 border-green-500/20' : burnoutScore < 60 ? 'from-amber-500/10 to-orange-500/5 border-amber-500/20' : 'from-red-500/10 to-rose-500/5 border-red-500/20';
  const burnoutTip = burnoutScore < 30
    ? 'Your workload is sustainable. Keep maintaining healthy boundaries!'
    : burnoutScore < 60
    ? `You have ${criticalTasks.length} critical tasks. Consider delegating 1–2 lower-priority items.`
    : `⚠️ High burnout risk detected! AI recommends pausing ${Math.round(activeTasks.length * 0.3)} low-priority tasks and taking a 25-min break.`;
  
  return (
    <div className="space-y-6">
      
      {/* Top Welcome Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-wide text-gray-200">
            Welcome back, {user?.displayName || 'Alexis'}
          </h1>
          <p className="text-xs text-gray-500">Here is your autonomous risk matrix report for today.</p>
        </div>
        <div className="flex items-center gap-2">
          <TimeTravelModal tasks={tasks} />
          <button
            onClick={loadBrief}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold hover:bg-indigo-500/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Regenerate Brief</span>
          </button>
        </div>
      </div>

      {/* Grid: Morning Brief & Risk Radar */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Morning Brief Pane */}
        <div className="lg:col-span-2 relative rounded-2xl glass p-6 space-y-4 glow-card overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-brand-violet opacity-10">
            <Sparkles className="w-24 h-24" />
          </div>
          
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="font-display font-semibold text-base text-gray-200">AI Morning Briefing</h3>
          </div>
          
          {briefLoading ? (
            <div className="space-y-3 pt-2">
              <div className="h-4 w-3/4 bg-white/5 rounded skeleton" />
              <div className="h-4 w-full bg-white/5 rounded skeleton" />
              <div className="h-4 w-5/6 bg-white/5 rounded skeleton" />
            </div>
          ) : (
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
              {brief}
            </p>
          )}
        </div>

        {/* Focus & Streak stats widget */}
        <div className="rounded-2xl glass p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="font-display font-semibold text-sm text-gray-300">Productivity Stats</h3>
            <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              🔥 Streak Active
            </span>
          </div>

          <div className="flex items-center justify-around py-4">
            
            {/* SVG Ring 1: Completion */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-gray-800" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="40" cy="40" r="34"
                    className="stroke-indigo-500" strokeWidth="6" fill="transparent"
                    strokeDasharray={213}
                    strokeDashoffset={213 - (213 * completionRate) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-mono font-bold text-gray-200">{completionRate}%</span>
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Done Rate</span>
            </div>

            {/* SVG Ring 2: Focus Score */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-gray-800" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="40" cy="40" r="34"
                    className="stroke-violet-500" strokeWidth="6" fill="transparent"
                    strokeDasharray={213}
                    strokeDashoffset={213 - (213 * (user?.focusScore || 90)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-mono font-bold text-gray-200">{user?.focusScore || 90}%</span>
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Focus Score</span>
            </div>

          </div>

          <div className="flex justify-between items-center text-xs text-gray-400 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <span>Streak: <b className="text-amber-500">🔥 {user?.streak || 5} days</b></span>
            <span>Total XP: <b className="text-indigo-400">{user?.xp || 250}</b></span>
          </div>
        </div>

      </div>

      {/* ✅ NEW: Burnout Prediction AI Widget */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`rounded-2xl bg-gradient-to-r ${burnoutBg} border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4`}
      >
        <div className="p-3 rounded-xl bg-white/10">
          <Brain className="w-6 h-6 text-indigo-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-display font-bold text-sm text-gray-200">🧠 AI Burnout Prediction Engine</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-300 uppercase tracking-widest">
              {burnoutLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2.5 bg-black/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${burnoutScore}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: burnoutColor }}
              />
            </div>
            <span className="text-lg font-bold" style={{ color: burnoutColor }}>{burnoutScore}%</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{burnoutTip}</p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 text-right shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <TrendingUp className="w-3.5 h-3.5" /> {activeTasks.length} Active Tasks
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" /> {criticalTasks.length} Critical
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            🔥 {user?.streak || 0}d Streak
          </div>
        </div>
      </motion.div>

      {/* Grid: Deadline Risk Radar Matrix & Daily Schedule */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Deadline Risk Radar */}
        <div className="lg:col-span-2 rounded-2xl glass p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h3 className="font-display font-semibold text-base text-gray-200">Deadline Risk Radar</h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              {activeTasks.length} Incomplete
            </span>
          </div>

          {activeTasks.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-gray-500 text-sm gap-2">
              <Target className="w-8 h-8 opacity-40 text-indigo-400 animate-pulse" />
              <span>No active risk profile detected. All deadlines secure!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTasks.map(task => {
                // Color mapping based on risk score
                let scoreColor = 'text-green-400 bg-green-500/10 border-green-500/25';
                if (task.aiRiskScore >= 75) scoreColor = 'text-red-400 bg-red-500/10 border-red-500/25';
                else if (task.aiRiskScore >= 45) scoreColor = 'text-orange-400 bg-orange-500/10 border-orange-500/25';
                else if (task.aiRiskScore >= 20) scoreColor = 'text-amber-400 bg-amber-500/10 border-amber-500/25';

                return (
                  <div
                    key={task.id}
                    onClick={() => setRiskAnalysisTask(task)}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/25 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg border font-mono font-bold text-xs ${scoreColor}`}>
                        {task.aiRiskScore}%
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-200 group-hover:text-indigo-400 transition-colors">
                          {task.title}
                        </h4>
                        <div className="flex flex-wrap gap-2 items-center mt-1 text-[11px] text-gray-500">
                          <span className="font-mono text-gray-400">Due: {new Date(task.deadline).toLocaleString()}</span>
                          <span>•</span>
                          <span className="capitalize px-1.5 py-0.2 bg-white/5 rounded">{task.priority}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        completeTask(task.id);
                      }}
                      className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                      title="Complete Task"
                    >
                      ✓
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Collapsible risk explanation popup */}
          {riskAnalysisTask && (
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2 animate-fadeIn relative">
              <button
                onClick={() => setRiskAnalysisTask(null)}
                className="absolute top-2 right-2 text-xs text-gray-500 hover:text-gray-200"
              >
                ✕ Close
              </button>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>AI Risk Assessment: {riskAnalysisTask.title}</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {riskAnalysisTask.aiInsight || 'Assessing task timeline parameters...'}
              </p>
              {riskAnalysisTask.aiSubtasks && riskAnalysisTask.aiSubtasks.length > 0 && (
                <div className="text-[11px] text-indigo-200 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 mt-1">
                  💡 <b>Recovery Suggestion:</b> {riskAnalysisTask.aiSubtasks[0]}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Today's AI schedule list */}
        <div className="rounded-2xl glass p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              <h3 className="font-display font-semibold text-base text-gray-200">Today's Schedule</h3>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">Hourly Blocks</span>
          </div>

          <div className="space-y-3">
            {activeTasks.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-center text-gray-500 text-xs">
                All done! Relax or create new tasks.
              </div>
            ) : (
              activeTasks.slice(0, 3).map((task, idx) => {
                const hour = 9 + idx;
                return (
                  <div key={task.id} className="flex gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className="text-xs font-mono font-bold text-indigo-400 py-1">{hour}:00</div>
                      <div className="w-0.5 flex-1 bg-indigo-950/40 my-1" />
                    </div>
                    <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/5">
                      <h4 className="text-xs font-semibold text-gray-200">{task.title}</h4>
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1.5">
                        <span>⏳ {task.estimatedMinutes} mins</span>
                        <span>•</span>
                        <span className="capitalize">{task.category}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
