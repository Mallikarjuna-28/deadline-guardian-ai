import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../stores/useTaskStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Target } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FocusMode() {
  const { tasks } = useTaskStore();
  const { user, updateProfile } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'work' | 'short' | 'long'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioRef] = useState<HTMLAudioElement | null>(null); // Placeholder for actual audio loops

  const activeTasks = tasks.filter(t => t.status !== 'completed');

  // Map timer lengths
  const durationMap = {
    work: (user?.preferences?.deepWorkDuration || 25) * 60,
    short: 5 * 60,
    long: 15 * 60
  };

  useEffect(() => {
    setTimeLeft(durationMap[activeTab]);
    setIsActive(false);
  }, [activeTab, user?.preferences?.deepWorkDuration]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(durationMap[activeTab]);
  };

  const handleTimerComplete = async () => {
    setIsActive(false);
    confetti({
      particleCount: 100,
      spread: 70,
      colors: ['#A5B4FC', '#4F46E5', '#7C3AED']
    });

    if (activeTab === 'work') {
      const xpReward = 50;
      alert(`🎉 Focus Session Complete! Unlocked +${xpReward} XP.`);
      
      // Update profile XP locally/remotely
      if (user) {
        const nextXp = user.xp + xpReward;
        const nextLevel = Math.floor(nextXp / 500) + 1;
        await updateProfile({
          xp: nextXp,
          level: nextLevel,
          focusScore: Math.min(100, (user.focusScore || 90) + 3)
        });
      }
    }
    
    // Reset timer
    setTimeLeft(durationMap[activeTab]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentDuration = durationMap[activeTab];
  const progressPercent = ((currentDuration - timeLeft) / currentDuration) * 100;
  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  const currentTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="max-w-xl mx-auto space-y-8 py-4">
      
      {/* Timer Toggles */}
      <div className="flex justify-center bg-white/5 border border-white/10 rounded-xl p-1 max-w-sm mx-auto">
        {(['work', 'short', 'long'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
              activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'work' ? 'Deep Focus' : tab === 'short' ? 'Short Break' : 'Long Break'}
          </button>
        ))}
      </div>

      {/* SVG Circular Countdown Ring */}
      <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
        
        {/* Outer ambient glow */}
        <div className="absolute -inset-1 rounded-full bg-brand-indigo/10 blur-xl opacity-75 pulse-glow-violet" />
        
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="144" cy="144" r="90" className="stroke-gray-800" strokeWidth="8" fill="transparent" />
          <circle
            cx="144"
            cy="144"
            r="90"
            className="stroke-indigo-500 transition-all duration-300"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={565}
            strokeDashoffset={565 - (565 * progressPercent) / 100}
            strokeLinecap="round"
          />
        </svg>

        {/* Text countdown metrics */}
        <div className="absolute flex flex-col items-center space-y-1">
          <span className="font-display font-bold text-5xl tracking-wide text-gray-100 font-mono">
            {formatTime(timeLeft)}
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            {activeTab === 'work' ? 'Deep Work Session' : 'Relax/Break'}
          </span>
        </div>
      </div>

      {/* Controller Buttons */}
      <div className="flex justify-center items-center gap-6">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-3 rounded-xl border transition-colors ${
            soundEnabled ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-white/5 text-gray-500 hover:text-gray-300'
          }`}
          title="Toggle ambient background noise loops"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5 animate-bounce" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleTimer}
          className="p-5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all"
        >
          {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
        </button>

        <button
          onClick={resetTimer}
          className="p-3 rounded-xl border border-white/5 text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Task Context Anchoring */}
      {activeTab === 'work' && (
        <div className="p-5 rounded-2xl glass border border-indigo-950/40 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Anchor Focus Task</h4>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Focus Target</label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
            >
              <option value="">Select a task to anchor to this session</option>
              {activeTasks.map(t => (
                <option key={t.id} value={t.id}>{t.title} ({t.priority})</option>
              ))}
            </select>
          </div>

          {currentTask && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-indigo-200">
              💡 You are currently working on <b>"{currentTask.title}"</b>. Finish this focus block to earn <b>+50 XP</b>.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
