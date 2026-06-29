import React, { useEffect, useState } from 'react';
import { useHabitStore, Habit } from '../stores/useHabitStore';
import { Flame, Plus, Sparkles, CheckCircle, Trash2 } from 'lucide-react';

export default function Habits() {
  const { habits, fetchHabits, createHabit, toggleHabit, deleteHabit } = useHabitStore();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [icon, setIcon] = useState('Flame');

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createHabit({
      name,
      frequency,
      icon,
      completions: [],
      streak: 0,
      longestStreak: 0
    });

    setName('');
    setShowAddForm(false);
  };

  const isCompletedToday = (habit: Habit) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return habit.completions.some(c => c.startsWith(todayStr));
  };

  return (
    <div className="space-y-6">
      
      {/* Header sections */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-200">Habits Tracker</h1>
          <p className="text-xs text-gray-500">Form productive routines, guard your streak, and build daily momentum.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-indigo hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Routine</span>
        </button>
      </div>

      {/* Habit Adding Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl glass border border-white/10 space-y-4 animate-fadeIn max-w-md">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Routine Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Inbox Zero Review"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Icon Badge</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
              >
                <option value="Flame">🔥 Fire Streak</option>
                <option value="Book">📚 Study Book</option>
                <option value="Compass">🧭 Compass Direction</option>
                <option value="CheckSquare">✓ Checklist Done</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
            >
              Add Routine
            </button>
          </div>
        </form>
      )}

      {/* Habit Lists grid display */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.length === 0 ? (
          <div className="col-span-full h-48 flex flex-col items-center justify-center text-center text-gray-500 text-sm gap-2">
            <Flame className="w-8 h-8 opacity-40 text-orange-400 animate-pulse" />
            <span>Establish a daily check habit! Users with daily habits complete 30% more tasks on time.</span>
          </div>
        ) : (
          habits.map(habit => {
            const completed = isCompletedToday(habit);
            return (
              <div
                key={habit.id}
                className={`p-5 rounded-2xl glass border transition-all flex flex-col justify-between group ${
                  completed ? 'border-green-500/20 bg-green-500/[0.02]' : 'border-white/5'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">
                      {habit.icon === 'Flame' ? '🔥' : habit.icon === 'Book' ? '📚' : habit.icon === 'Compass' ? '🧭' : '✓'}
                    </span>
                    <div>
                      <h3 className={`font-display font-semibold text-sm ${completed ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                        {habit.name}
                      </h3>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        {habit.frequency}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/15 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-6 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold font-mono">
                    <Flame className="w-4 h-4 fill-current animate-bounce" />
                    <span>{habit.streak}d streak (Max: {habit.longestStreak}d)</span>
                  </div>

                  <button
                    onClick={() => toggleHabit(habit.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      completed
                        ? 'bg-green-500/10 text-green-400 border border-green-500/25'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{completed ? 'Routine Done' : 'Check Off'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Suggestion box */}
      <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex gap-3 max-w-2xl">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-xs text-indigo-200 leading-relaxed">
          💡 <b>AI Suggestion:</b> Consider establishing a <b>"Daily Dashboard Review"</b> routine. Users tracking their agendas daily resolve 40% more task conflicts autonomously before deadlines hit.
        </p>
      </div>

    </div>
  );
}
