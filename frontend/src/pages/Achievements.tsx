import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { Trophy, Shield, Sun, Flame, Award, HelpCircle } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  xp: number;
  isCurrentUser: boolean;
}

export default function Achievements() {
  const { user } = useAuthStore();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user?.level]);

  const fetchStats = async () => {
    const { token, apiUrl } = useAuthStore.getState();
    try {
      const bRes = await fetch(`${apiUrl}/api/gamification/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lRes = await fetch(`${apiUrl}/api/gamification/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (bRes.ok) {
        const bData = await bRes.json();
        setBadges(bData.badges);
      }
      if (lRes.ok) {
        const lData = await lRes.json();
        setLeaderboard(lData);
      }
    } catch (e) {
      // Local fallbacks
      setBadges([
        { id: 'b1', name: 'On-time Warrior', description: 'Complete a task on time.', unlocked: true, icon: 'Shield' },
        { id: 'b2', name: 'Early Bird', description: 'Complete a task 24h prior to deadline.', unlocked: (user?.level || 1) > 1, icon: 'Sun' },
        { id: 'b3', name: 'Focus Master', description: 'Finish 5 Pomodoro focus sessions.', unlocked: (user?.level || 1) > 2, icon: 'Flame' },
        { id: 'b4', name: 'Time Lord', description: 'Maintain a 10-day productivity streak.', unlocked: false, icon: 'Award' }
      ]);
      setLeaderboard([
        { rank: 1, displayName: 'Time Lord', xp: 4200, isCurrentUser: false },
        { rank: 2, displayName: 'Procrastinator Healer', xp: 2900, isCurrentUser: false },
        { rank: 3, displayName: user?.displayName || 'Google Guardian (You)', xp: user?.xp || 250, isCurrentUser: true },
        { rank: 4, displayName: 'Deadline Dasher', xp: 200, isCurrentUser: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string, unlocked: boolean) => {
    const cls = `w-8 h-8 ${unlocked ? 'text-indigo-400' : 'text-gray-600'}`;
    switch (iconName) {
      case 'Shield': return <Shield className={cls} />;
      case 'Sun': return <Sun className={cls} />;
      case 'Flame': return <Flame className={cls} />;
      case 'Award': return <Award className={cls} />;
      default: return <HelpCircle className={cls} />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-white/5 pb-4">
        <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-200">Achievements Hub</h1>
        <p className="text-xs text-gray-500">Collect experience points, level up, unlock badges, and climb the leaderboard.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Badges Collection grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="font-display font-semibold text-base text-gray-200">Badges Gallery</h3>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="h-24 rounded-2xl bg-white/5 skeleton" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl glass border flex gap-4 items-center transition-all ${
                    badge.unlocked
                      ? 'border-indigo-500/20 bg-indigo-500/[0.02]'
                      : 'border-white/5 opacity-55'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${badge.unlocked ? 'bg-indigo-500/10' : 'bg-white/5'}`}>
                    {getIcon(badge.icon, badge.unlocked)}
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${badge.unlocked ? 'text-gray-200' : 'text-gray-500'}`}>
                      {badge.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{badge.description}</p>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${badge.unlocked ? 'text-green-400' : 'text-gray-600'}`}>
                      {badge.unlocked ? '✓ Unlocked' : '✕ Locked'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: weekly leaderboards */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Award className="w-4 h-4 text-violet-400" />
            <h3 className="font-display font-semibold text-base text-gray-200">Weekly Leaderboard</h3>
          </div>

          <div className="rounded-2xl glass border border-indigo-950/40 p-4 divide-y divide-white/5 space-y-3">
            {leaderboard.map(entry => (
              <div
                key={entry.rank}
                className={`flex justify-between items-center py-2.5 ${
                  entry.isCurrentUser ? 'text-indigo-400 font-bold bg-indigo-500/5 px-2.5 rounded-xl border border-indigo-500/10' : 'text-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs text-gray-500 w-4">#{entry.rank}</span>
                  <span className="text-xs">{entry.displayName}</span>
                </div>
                <span className="font-mono font-bold text-xs">{entry.xp} XP</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
