import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNotificationStore } from '../../stores/useNotificationStore';
import {
  ShieldAlert,
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Calendar,
  MessageSquareCode,
  Timer,
  Flame,
  Trophy,
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
}

export default function Shell({ children, activePage, setActivePage }: ShellProps) {
  const { user, logout, darkMode, toggleDarkMode } = useAuthStore();
  const { notifications } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks Board', icon: CheckSquare },
    { id: 'projects', label: 'Projects Hub', icon: FolderKanban },
    { id: 'calendar', label: 'Calendar View', icon: Calendar },
    { id: 'agent', label: 'AI Guardian', icon: MessageSquareCode, badge: 'Agent' },
    { id: 'focus', label: 'Pomodoro Focus', icon: Timer },
    { id: 'habits', label: 'Habits Tracker', icon: Flame },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'notifications', label: 'Inbox', icon: Bell, alertCount: unreadCount },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Bottom nav shows only the 5 most important items on mobile
  const bottomNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'agent', label: 'AI', icon: MessageSquareCode },
    { id: 'focus', label: 'Focus', icon: Timer },
    { id: 'notifications', label: 'Inbox', icon: Bell, alertCount: unreadCount },
  ];

  const navigate = (page: string) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-[#0A0A1A] text-gray-100' : 'bg-[#F8F7FF] text-gray-800'}`}>
      
      {/* Desktop Sidebar Navigation */}
      <aside className={`hidden lg:flex w-64 border-r flex-col justify-between p-4 glass ${darkMode ? 'border-indigo-950/40 text-gray-200' : 'border-[#E2DFFF] bg-white'}`}>
        
        {/* Top Header Logo */}
        <div>
          <div className="flex items-center gap-3 mb-8 px-2 py-1">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-brand-indigo to-brand-violet shadow-lg shadow-brand-indigo/35 text-white">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-wide gradient-text bg-gradient-to-r from-indigo-200 via-indigo-100 to-indigo-300">
                Guardian AI
              </h1>
              <span className="text-[10px] text-brand-violet uppercase tracking-wider font-semibold">
                Deadline System
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-indigo/25 to-brand-violet/10 text-indigo-300 font-medium border-l-2 border-brand-indigo'
                      : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-brand-violet text-white uppercase tracking-widest scale-90">
                      {item.badge}
                    </span>
                  )}
                  {item.alertCount ? (
                    <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white animate-bounce">
                      {item.alertCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card Profile & Actions */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          {user && (
            <div
              onClick={() => navigate('profile')}
              className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full border border-indigo-400/40 object-cover"
                />
                <div className="overflow-hidden">
                  <h4 className="text-xs font-semibold truncate text-gray-200">{user.displayName}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold px-1 py-0.2 bg-indigo-500/20 text-indigo-400 rounded-md">
                      LVL {user.level}
                    </span>
                    <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-medium">
                      🔥 {user.streak}d streak
                    </span>
                  </div>
                </div>
              </div>

              {/* Level XP Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>XP: {user.xp % 500} / 500</span>
                  <span>Progress</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-indigo to-brand-violet rounded-full transition-all duration-500"
                    style={{ width: `${((user.xp % 500) / 500) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Theme toggler and logout */}
          <div className="flex items-center justify-between gap-2 px-2 text-sm">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          {/* Drawer panel */}
          <div
            className={`relative w-72 max-w-[85vw] h-full flex flex-col justify-between p-4 z-10 overflow-y-auto ${darkMode ? 'bg-[#0D0D20] border-r border-indigo-950/40' : 'bg-white border-r border-gray-200'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Logo row */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-tr from-brand-indigo to-brand-violet text-white">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <span className="font-display font-bold text-base gradient-text bg-gradient-to-r from-indigo-200 to-violet-300">
                    Guardian AI
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {menuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-indigo/25 to-brand-violet/10 text-indigo-300 font-medium'
                          : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.alertCount ? (
                        <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white">
                          {item.alertCount}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>
            {/* Bottom user card in drawer */}
            {user && (
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 rounded-full border border-indigo-400/40" />
                  <div>
                    <p className="text-xs font-semibold text-gray-200">{user.displayName}</p>
                    <p className="text-[10px] text-indigo-400">LVL {user.level} · 🔥 {user.streak}d</p>
                  </div>
                </div>
                <div className="flex justify-between px-1">
                  <button onClick={toggleDarkMode} className="p-2 rounded-lg text-gray-400 hover:text-amber-400">
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <button onClick={logout} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400">
                    <LogOut className="w-3.5 h-3.5" /> Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content display screen */}
      <main className="flex-1 flex flex-col overflow-y-auto max-h-screen relative">
        {!import.meta.env.VITE_FIREBASE_API_KEY && (
          <div className="bg-amber-500/10 border-b border-amber-500/25 text-amber-300 text-xs px-4 py-2 text-center font-medium animate-fadeIn">
            ⚠️ Running in demo mode — connect Firebase/Gemini credentials in .env for full features
          </div>
        )}
        <header className={`p-4 border-b flex justify-between items-center glass ${darkMode ? 'border-indigo-950/20' : 'border-[#E2DFFF] bg-white'}`}>
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold capitalize text-gray-400">
              Workspace / {activePage}
            </h2>
          </div>
          {user && (
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full select-none animate-pulse">
              🛡️ Deadline Monitoring System Armed
            </div>
          )}
        </header>

        <section className="flex-1 p-4 sm:p-6 relative overflow-hidden pb-20 lg:pb-6">
          <div className="absolute top-[-10%] left-[20%] w-[35vw] h-[35vh] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] right-[10%] w-[30vw] h-[30vh] bg-violet-600/5 rounded-full blur-[130px] pointer-events-none z-0" />
          <div className="relative z-10">
            {children}
          </div>
        </section>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-center justify-around px-2 py-2 ${darkMode ? 'bg-[#0D0D20]/95 border-indigo-950/40 backdrop-blur-md' : 'bg-white/95 border-gray-200 backdrop-blur-md'}`}>
        {bottomNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-400 rounded-full" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : ''}`} />
              <span className="text-[9px] font-semibold">{item.label}</span>
              {item.alertCount ? (
                <span className="absolute top-1 right-1.5 w-4 h-4 flex items-center justify-center text-[8px] font-bold rounded-full bg-red-500 text-white">
                  {item.alertCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
