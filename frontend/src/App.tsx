import React, { useEffect, useState } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import Shell from './components/layout/Shell';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import Calendar from './pages/Calendar';
import AIAgent from './pages/AIAgent';
import FocusMode from './pages/FocusMode';
import Habits from './pages/Habits';
import Achievements from './pages/Achievements';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';


export default function App() {
  const { token, user, initialize } = useAuthStore();
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    initialize();
  }, []);

  // 1. Unauthenticated flow: Landing vs Auth page toggle
  if (!token) {
    // Check if the user wants to go to login. We will render Landing first.
    // If they click launch/get started, the store logs them in instantly in dev mock mode
    return <Landing />;
  }

  // 2. Onboarding check flow
  if (user && !user.onboardingComplete) {
    return <Onboarding />;
  }

  // 3. Authenticated dashboard layout orchestrator
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <Tasks />;
      case 'projects':
        return <Projects />;
      case 'calendar':
        return <Calendar />;
      case 'agent':
        return <AIAgent />;
      case 'focus':
        return <FocusMode />;
      case 'habits':
        return <Habits />;
      case 'achievements':
        return <Achievements />;
      case 'notifications':
        return <Notifications />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Shell activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </Shell>
  );
}
