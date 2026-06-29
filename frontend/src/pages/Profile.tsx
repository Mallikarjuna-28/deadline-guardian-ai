import React from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTaskStore } from '../stores/useTaskStore';
import { User, Shield, Flame, Trophy, Calendar, Mail, Clock } from 'lucide-react';

export default function Profile() {
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const onTimeCount = tasks.filter(t => t.status === 'completed' && t.aiRiskScore < 50).length; // Mock on-time calculation
  const onTimeRate = completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 0;

  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : new Date().toLocaleDateString();

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Title */}
      <div className="border-b border-white/5 pb-4">
        <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-200">User Profile</h1>
        <p className="text-xs text-gray-500">Overview of your productivity ranks, levels, and badges progress.</p>
      </div>

      {/* Main card profile */}
      <div className="rounded-2xl glass-premium p-6 border border-indigo-500/20 grid md:grid-cols-3 gap-6 items-center">
        
        {/* Avatar */}
        <div className="flex flex-col items-center text-center space-y-3 md:border-r md:border-white/5 md:pr-6">
          <img
            src={user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
            alt={user?.displayName}
            className="w-24 h-24 rounded-full border-2 border-indigo-400/40 object-cover shadow-lg"
          />
          <div>
            <h2 className="font-display font-bold text-lg text-gray-200">{user?.displayName || 'Google Hacker'}</h2>
            <div className="flex items-center gap-1.5 justify-center mt-1 text-[11px] text-gray-500">
              <Mail className="w-3 h-3" />
              <span>{user?.email}</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg uppercase tracking-wider">
            LVL {user?.level || 1} Productive Warrior
          </span>
        </div>

        {/* Stats metrics meters */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Streak Record</span>
            <div className="flex items-center gap-1.5 text-amber-500 font-bold text-lg font-mono">
              <Flame className="w-5 h-5 fill-current" />
              <span>{user?.streak || 5} Days Active</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Focus Hours</span>
            <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-lg font-mono">
              <Clock className="w-5 h-5" />
              <span>16.7 Hours Deep</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">On-Time Accuracy</span>
            <div className="flex items-center gap-1.5 text-green-400 font-bold text-lg font-mono">
              <Shield className="w-5 h-5" />
              <span>{onTimeRate || 92}% Accuracy</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Member Since</span>
            <div className="flex items-center gap-1.5 text-violet-400 font-bold text-lg font-mono">
              <Calendar className="w-5 h-5" />
              <span>{joinDate}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Badges brief summary */}
      <div className="p-5 rounded-2xl glass border border-white/5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Unlocked Achievements</h3>
        </div>

        <div className="flex flex-wrap gap-3">
          {['On-time Warrior', 'Early Bird', 'Focus Master'].map((badge, idx) => (
            <div key={badge} className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-300 font-medium flex items-center gap-2">
              <span>🏆</span>
              <span>{badge}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
