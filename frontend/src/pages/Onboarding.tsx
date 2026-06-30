import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTaskStore } from '../stores/useTaskStore';
import { ShieldAlert, Compass, Target, Calendar, ClipboardCheck, Play } from 'lucide-react';

export default function Onboarding() {
  const { user, completeOnboarding } = useAuthStore();
  const { createTask, parseNLP } = useTaskStore();
  
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [role, setRole] = useState('professional');
  const [workStyle, setWorkStyle] = useState<'morning' | 'night'>('morning');
  const [deepWorkDuration, setDeepWorkDuration] = useState(25);
  const [firstTaskText, setFirstTaskText] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    { id: 'student', label: 'Student', desc: 'Focusing on assignments and study blocks' },
    { id: 'professional', label: 'Professional', desc: 'Managing job tasks and project deadlines' },
    { id: 'entrepreneur', label: 'Entrepreneur', desc: 'Juggling multiple clients and product targets' },
    { id: 'other', label: 'Other', desc: 'Organizing personal goals and daily plans' }
  ];

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const finishOnboarding = async () => {
    setLoading(true);
    
    // Parse and create first task if present
    if (firstTaskText.trim()) {
      try {
        const parsed = await parseNLP(firstTaskText);
        await createTask({
          title: parsed.title || firstTaskText,
          deadline: parsed.deadline,
          priority: parsed.priority || 'medium',
          estimatedMinutes: parsed.estimatedMinutes || 60,
          category: parsed.category || 'Work',
          tags: ['first-task', ...parsed.tags]
        });
      } catch (e) {
        console.error('Failed to parse onboarding task:', e);
        await createTask({
          title: firstTaskText,
          priority: 'medium',
          deadline: new Date(Date.now() + 3600 * 1000 * 48).toISOString()
        });
      }
    }

    // Complete onboarding preferences
    await completeOnboarding({
      workStyle,
      deepWorkDuration,
      workHoursStart: workStyle === 'morning' ? '09:00' : '13:00',
      workHoursEnd: workStyle === 'morning' ? '17:00' : '21:00'
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] text-[#1A1635] flex items-center justify-center p-6">
      <div className="max-w-xl w-full relative">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-brand-indigo to-brand-violet blur-2xl opacity-5" />
        
        <div className="relative rounded-2xl bg-white border border-[#E2DFFF] shadow-[0_8px_30px_rgba(91,76,245,0.06)] p-8 space-y-8">
          
          {/* Top Progress bar tracker */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-[#5B4CF5] font-semibold tracking-widest uppercase">
              <span>Step {step} of 5</span>
              <span>{Math.round((step / 5) * 100)}% Complete</span>
            </div>
            <div className="w-full h-1.5 bg-[#F0EFFF] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-indigo to-brand-violet rounded-full transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#EDE9FF] text-[#5B4CF5] border border-[#E2DFFF] rounded-xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#1A1635]">
                  Welcome to Deadline Guardian AI
                </h2>
              </div>
              <p className="text-sm text-[#4A4568]">
                Let's configure your autonomous productivity engine. First, what should we call you?
              </p>
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-[#8B87A8] tracking-wider">Your Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alexis"
                  className="w-full bg-white border border-[#E2DFFF] rounded-lg px-4 py-2.5 text-sm text-[#1A1635] focus:outline-none focus:border-[#5B4CF5]"
                />
              </div>
            </div>
          )}

          {/* STEP 2: ROLE SELECTION */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#EDE9FF] text-[#5B4CF5] border border-[#E2DFFF] rounded-xl">
                  <Compass className="w-6 h-6" />
                </div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#1A1635]">
                  Select Your Main Focus
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`p-4 rounded-xl text-left border transition-all ${
                      role === r.id
                        ? 'border-[#5B4CF5] bg-[#EDE9FF] text-[#5B4CF5]'
                        : 'border-[#E2DFFF] bg-white text-[#4A4568] hover:bg-[#F8F7FF]'
                    }`}
                  >
                    <h4 className="text-sm font-semibold">{r.label}</h4>
                    <p className="text-xs text-[#8B87A8] mt-1">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: WORK STYLE */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#EDE9FF] text-[#5B4CF5] border border-[#E2DFFF] rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#1A1635]">
                  Define Your Work Style
                </h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-[#8B87A8] tracking-wider">Productivity Window</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setWorkStyle('morning')}
                      className={`py-3 rounded-lg font-semibold text-sm transition-all border ${
                        workStyle === 'morning'
                          ? 'border-[#5B4CF5] bg-[#EDE9FF] text-[#5B4CF5]'
                          : 'border-[#E2DFFF] bg-white text-[#4A4568]'
                      }`}
                    >
                      🌅 Morning Person
                    </button>
                    <button
                      onClick={() => setWorkStyle('night')}
                      className={`py-3 rounded-lg font-semibold text-sm transition-all border ${
                        workStyle === 'night'
                          ? 'border-[#5B4CF5] bg-[#EDE9FF] text-[#5B4CF5]'
                          : 'border-[#E2DFFF] bg-white text-[#4A4568]'
                      }`}
                    >
                      🌃 Night Owl
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-[#8B87A8] tracking-wider">
                    Focus Session Length: {deepWorkDuration} mins
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="5"
                    value={deepWorkDuration}
                    onChange={(e) => setDeepWorkDuration(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#F0EFFF] rounded-lg appearance-none cursor-pointer accent-[#5B4CF5]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: GOOGLE CALENDAR SYNC */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#EDE9FF] text-[#5B4CF5] border border-[#E2DFFF] rounded-xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#1A1635]">
                  Sync Google Calendar
                </h2>
              </div>
              <p className="text-sm text-[#4A4568]">
                Granting access allows the AI guardian to pull live events, highlight scheduling overlaps, and automatically block out preparation hours for upcoming tasks.
              </p>
              <div className="p-4 rounded-xl bg-[#F5F3FF] border border-[#E2DFFF] text-center space-y-3">
                <h4 className="text-xs font-semibold text-[#5B4CF5]">Fast Google OAuth Import</h4>
                <button
                  type="button"
                  onClick={() => alert('Calendar synced successfully (Sandbox mode active).')}
                  className="px-4 py-2 bg-[#5B4CF5] text-white rounded-lg text-xs font-semibold hover:bg-[#4A3DE0] transition-colors"
                >
                  Authorize Google Calendar API
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: CREATE FIRST TASK VIA NLP */}
          {step === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#EDE9FF] text-[#5B4CF5] border border-[#E2DFFF] rounded-xl">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#1A1635]">
                  Establish Your First Task
                </h2>
              </div>
              <p className="text-sm text-[#4A4568]">
                Type what you need to do in plain English. Gemini will extract the deadline, estimate the duration, and calculate risk parameters.
              </p>
              <div className="space-y-2">
                <textarea
                  value={firstTaskText}
                  onChange={(e) => setFirstTaskText(e.target.value)}
                  placeholder="e.g. Finish final research draft by Monday morning, very critical, should take 4 hours"
                  className="w-full h-24 bg-white border border-[#E2DFFF] rounded-lg px-4 py-2 text-sm text-[#1A1635] focus:outline-none focus:border-[#5B4CF5] resize-none"
                />
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex justify-between items-center border-t border-[#E2DFFF] pt-6">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                step === 1 ? 'text-[#8B87A8] cursor-not-allowed' : 'text-[#4A4568] hover:text-[#1A1635] hover:bg-[#F0EFFF]'
              }`}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#5B4CF5] hover:bg-[#4A3DE0] text-white text-sm font-semibold transition-all flex items-center gap-2"
            >
              <span>{step === 5 ? (loading ? 'Launching...' : 'Finish Setup') : 'Continue'}</span>
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
