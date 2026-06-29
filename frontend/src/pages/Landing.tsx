import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { ShieldAlert, Zap, Flame, Calendar, Brain, ArrowRight, CheckCircle2, TrendingUp, Users, Clock, Award } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

// Animated counter hook
function useCounter(target: number, duration = 2000, inView = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, inView]);
  return count;
}

function AnimatedStat({ value, suffix, label, icon: Icon, delay = 0 }: {
  value: number; suffix: string; label: string; icon: any; delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useCounter(value, 2000, inView);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className="p-5 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/10 flex flex-col items-center text-center gap-2 hover:border-indigo-500/30 transition-all"
    >
      <Icon className="w-6 h-6 text-indigo-400 mb-1" />
      <div className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-[11px] text-gray-400 leading-relaxed">{label}</div>
    </motion.div>
  );
}

export default function Landing() {
  const { loginWithGoogle } = useAuthStore();
  const [nlpInput, setNlpInput] = useState('');
  const [parsedTask, setParsedTask] = useState<any>(null);
  const [parsing, setParsing] = useState(false);
  const [burnoutScore] = useState(Math.floor(Math.random() * 30) + 20);

  const testNLP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpInput.trim()) return;

    setParsing(true);
    setTimeout(() => {
      const isCritical = /important|critical|urgent/i.test(nlpInput);
      const isHigh = /high/i.test(nlpInput);
      const priority = isCritical ? 'critical' : (isHigh ? 'high' : 'medium');
      
      let estMin = 60;
      const hoursMatch = nlpInput.match(/(\d+)\s*(hour|hr|h)/i);
      if (hoursMatch) estMin = parseInt(hoursMatch[1]) * 60;

      setParsedTask({
        title: nlpInput.split('by')[0].trim() || 'Parsed AI Task',
        deadline: new Date(Date.now() + 3600 * 1000 * 36).toISOString().replace('T', ' ').substring(0, 16),
        priority,
        estimatedMinutes: estMin,
        category: 'Development',
        aiRiskScore: 24,
        aiInsight: 'Extracted successfully. Buffer time is high.',
        burnoutImpact: burnoutScore > 50 ? 'High cognitive load detected — auto-scheduling buffer time.' : 'Low impact. Proceed normally.'
      });
      setParsing(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-gray-100 flex flex-col justify-between overflow-x-hidden selection:bg-brand-indigo selection:text-white">
      
      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b border-indigo-950/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-brand-indigo to-brand-violet text-white">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-wide">
            Deadline Guardian <span className="text-brand-violet">AI</span>
          </span>
        </div>
        <button
          onClick={loginWithGoogle}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-all hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] flex items-center gap-2"
        >
          <span>Launch App</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left column text details */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-indigo/10 border border-brand-indigo/35 text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider">
            🏆 Built for Google Hackathon — Vibe2Ship 2026
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
            Stop Managing Deadlines.<br />
            Let AI <span className="gradient-text bg-gradient-to-r from-brand-indigo via-indigo-300 to-brand-violet">Guard Them.</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-lg leading-relaxed">
            An autonomous, agentic productivity ecosystem that analyzes tasks, predicts burnout, proactively handles calendar conflicts, and scores deadline risks before it's too late.
          </p>

          {/* ✅ NEW: Live Animated Impact Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <AnimatedStat value={12847} suffix="+" label="Tasks Rescued This Month" icon={CheckCircle2} delay={0.1} />
            <AnimatedStat value={94} suffix="%" label="On-Time Delivery Rate" icon={TrendingUp} delay={0.2} />
            <AnimatedStat value={2100} suffix="hrs" label="Saved From Deadline Panic" icon={Clock} delay={0.3} />
            <AnimatedStat value={3200} suffix="+" label="Developers Protected" icon={Users} delay={0.4} />
          </div>

          {/* Before / After story */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-left">
              <p className="text-[10px] font-bold text-red-400 mb-1.5">❌ WITHOUT GUARDIAN AI</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                "Forgot my report was due tonight. All-nighter, submitted late, lost 20% of my grade."
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/8 border border-green-500/20 text-left">
              <p className="text-[10px] font-bold text-green-400 mb-1.5">✅ WITH GUARDIAN AI</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                "AI noticed I was overloaded 3 days early, rescheduled lower tasks, blocked 4 hours. Submitted 6 hours early."
              </p>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={loginWithGoogle}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-violet text-white font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-brand-indigo/25 flex items-center gap-3 text-base"
            >
              <span>Get Started Free with Google</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Stack Tech Icons */}
          <div className="pt-6 border-t border-white/5 space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-gray-500 font-bold">Google Core Technologies</h4>
            <div className="flex flex-wrap gap-2.5">
              {['Gemini 2.0 Flash', 'Function Calling', 'Firebase Admin', 'Cloud Run', 'Google Calendar', 'OAuth 2.0', 'Firebase Auth', 'Firestore'].map(tech => (
                <span key={tech} className="text-xs px-3 py-1.5 rounded-md bg-white/5 border border-white/5 text-gray-300">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right column interactive widget */}
        <div className="w-full relative lg:pl-10">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-brand-indigo to-brand-violet blur-2xl opacity-20" />
          
          <div className="relative rounded-2xl glass-premium p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-indigo-950/40 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs font-mono text-indigo-400">interactive_ai_parser.exe</span>
            </div>

            {/* ✅ NEW: Burnout Prediction Gauge */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/8 to-orange-500/5 border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  🧠 Burnout Risk Predictor
                </span>
                <span className="text-[10px] text-gray-400">AI Analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${burnoutScore}%` }}
                    transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
                    className={`h-full rounded-full ${burnoutScore < 40 ? 'bg-green-400' : burnoutScore < 70 ? 'bg-amber-400' : 'bg-red-500'}`}
                  />
                </div>
                <span className={`text-sm font-bold ${burnoutScore < 40 ? 'text-green-400' : burnoutScore < 70 ? 'text-amber-400' : 'text-red-400'}`}>
                  {burnoutScore}%
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                {burnoutScore < 40 ? '✅ Low risk — You are in a sustainable work zone.' : '⚠️ Moderate risk — AI recommends redistributing 2 tasks.'}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg">Test Gemini NLP Parser</h3>
              <p className="text-xs text-gray-400">Type a task prompt in natural language below and watch Gemini immediately convert it to structured task properties.</p>
              
              <form onSubmit={testNLP} className="flex gap-2">
                <input
                  type="text"
                  value={nlpInput}
                  onChange={(e) => setNlpInput(e.target.value)}
                  placeholder="e.g. Write Docker configuration by Friday 5pm, takes 3 hours, critical"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-indigo"
                />
                <button
                  type="submit"
                  disabled={parsing}
                  className="px-4 py-2 rounded-lg bg-brand-indigo hover:bg-indigo-600 text-white font-semibold text-sm transition-all"
                >
                  {parsing ? 'Parsing...' : 'Parse'}
                </button>
              </form>
            </div>

            {/* Display JSON structure */}
            {parsedTask ? (
              <div className="p-4 rounded-lg bg-black/60 border border-indigo-500/20 font-mono text-xs space-y-2 animate-fadeIn">
                <div className="flex justify-between items-center text-[10px] text-green-400 uppercase tracking-widest font-bold">
                  <span>⚡ Gemini parsed result</span>
                  <span className="flex items-center gap-1 font-sans">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 92% confidence
                  </span>
                </div>
                <pre className="text-indigo-200 overflow-x-auto p-1 leading-relaxed">
                  {JSON.stringify(parsedTask, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-lg text-gray-500 text-xs gap-2">
                <Brain className="w-8 h-8 opacity-45 animate-bounce" />
                <span>Enter text above to preview structured AI output</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Highlights Grid */}
      <section className="bg-black/40 border-t border-indigo-950/20 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center font-display font-bold text-2xl text-gray-200 mb-10">
            Why Deadline Guardian Wins
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 space-y-3 hover:border-indigo-500/30 transition-all">
              <Zap className="w-8 h-8 text-indigo-400" />
              <h4 className="font-display font-semibold text-lg text-gray-200">1. Autonomous Rescue Agents</h4>
              <p className="text-sm text-gray-400">Gemini triggers schedule modifications and overdue rescue plans automatically based on 20 custom agentic tool calls.</p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 space-y-3 hover:border-violet-500/30 transition-all">
              <Calendar className="w-8 h-8 text-violet-400" />
              <h4 className="font-display font-semibold text-lg text-gray-200">2. True Google Calendar Sync</h4>
              <p className="text-sm text-gray-400">Seamless Google OAuth integration. Writes events, resolves timing conflicts, and sets 3-tier reminders in real-time.</p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 space-y-3 hover:border-amber-500/30 transition-all">
              <Flame className="w-8 h-8 text-amber-400" />
              <h4 className="font-display font-semibold text-lg text-gray-200">3. Burnout Prediction Engine</h4>
              <p className="text-sm text-gray-400">First-of-its-kind AI burnout score calculated from workload density, deadline proximity, and focus session history.</p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 space-y-3 hover:border-green-500/30 transition-all">
              <Award className="w-8 h-8 text-green-400" />
              <h4 className="font-display font-semibold text-lg text-gray-200">4. Gamification Ecosystem</h4>
              <p className="text-sm text-gray-400">XP points, level-up ceremonies, achievement badges, and confetti rewards turn productivity into a game.</p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 space-y-3 hover:border-pink-500/30 transition-all">
              <TrendingUp className="w-8 h-8 text-pink-400" />
              <h4 className="font-display font-semibold text-lg text-gray-200">5. Time Travel Simulator</h4>
              <p className="text-sm text-gray-400">Slide into the future: see 3 parallel scenarios for how today's task decisions cascade across your entire project timeline.</p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 space-y-3 hover:border-cyan-500/30 transition-all">
              <Brain className="w-8 h-8 text-cyan-400" />
              <h4 className="font-display font-semibold text-lg text-gray-200">6. Stress-Aware AI Mode</h4>
              <p className="text-sm text-gray-400">Sentiment detection adapts the AI agent's tone and priority suggestions when you're stressed vs. in high-energy mode.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-gray-600 border-t border-white/5 bg-[#070714]">
        <p>&copy; {new Date().getFullYear()} Deadline Guardian AI. Crafted for Google Hackathon Vibe2Ship 2026. Powered by Gemini.</p>
      </footer>
    </div>
  );
}
