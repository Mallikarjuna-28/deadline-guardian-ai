import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { ShieldAlert, Chrome, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const { loginWithGoogle, login, register, loading } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (isSignUp) {
      if (!displayName.trim()) return;
      await register(email, password, displayName);
    } else {
      await login(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center p-6 select-none relative">
      <div className="absolute -inset-0 bg-[radial-gradient(ellipse_at_center,rgba(91,76,245,0.06),transparent_70%)] pointer-events-none" />
      
      <div className="max-w-md w-full relative">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-brand-indigo to-brand-violet blur-xl opacity-10" />
        
        <div className="relative rounded-2xl bg-white border border-[#E2DFFF] shadow-[0_20px_50px_rgba(91,76,245,0.06)] p-8 text-center space-y-6">
          
          {/* Logo Brand info */}
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-brand-indigo to-brand-violet shadow-xl shadow-brand-indigo/35 text-white animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="font-display font-bold text-2xl tracking-wide text-[#1A1635]">
              Deadline Guardian <span className="text-[#5B4CF5]">AI</span>
            </h1>
            <p className="text-xs text-[#8B87A8] max-w-xs">
              {isSignUp ? 'Create your guardian account.' : 'Access your autonomous AI dashboard.'}
            </p>
          </div>

          {/* Social Sign-In buttons */}
          <div className="space-y-3">
            <button
              onClick={loginWithGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-5 py-2.5 rounded-xl bg-white border border-[#E2DFFF] text-[#4A4568] hover:bg-[#F0EFFF] font-semibold transition-all hover:scale-[1.01] shadow-[0_2px_10px_rgba(91,76,245,0.04)] text-sm"
            >
              <Chrome className="w-4 h-4 text-red-500" />
              <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="h-[1px] flex-1 bg-[#E2DFFF]" />
            <span className="text-[10px] text-[#8B87A8] uppercase font-bold">Or Email</span>
            <div className="h-[1px] flex-1 bg-[#E2DFFF]" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#8B87A8] tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#8B87A8]" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alexis Smith"
                  className="w-full bg-white border border-[#E2DFFF] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#5B4CF5] text-[#1A1635]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-[#8B87A8] tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#8B87A8]" /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alexis@gmail.com"
                className="w-full bg-white border border-[#E2DFFF] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#5B4CF5] text-[#1A1635]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-[#8B87A8] tracking-wider flex items-center gap-1.5 justify-between w-full">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#8B87A8]" /> Password
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#E2DFFF] rounded-xl pl-3.5 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#5B4CF5] text-[#1A1635]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#8B87A8] hover:text-[#4A4568]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#5B4CF5] hover:bg-[#4A3DE0] text-white font-semibold transition-all hover:scale-[1.01] shadow-[0_4px_16px_rgba(91,76,245,0.2)] text-sm"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle isSignUp link */}
          <div className="text-xs text-[#8B87A8]">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#5B4CF5] hover:text-[#4A3DE0] font-semibold"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

          <div className="flex items-center gap-3 my-2">
            <div className="h-[1px] flex-1 bg-[#E2DFFF]" />
            <span className="text-[10px] text-[#8B87A8] uppercase font-bold">Developer tools</span>
            <div className="h-[1px] flex-1 bg-[#E2DFFF]" />
          </div>

          <button
            onClick={() => login('dev@google.com')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-2.5 rounded-xl bg-[#EDE9FF] border border-[#C5BFFF] hover:bg-[#E2DFFF] font-semibold transition-all text-[#5B4CF5] text-sm shadow-[0_2px_8px_rgba(91,76,245,0.05)]"
          >
            <Lock className="w-4 h-4 text-[#5B4CF5] animate-pulse" />
            <span>Bypass with Dev Account</span>
          </button>

          <div className="text-[10px] text-[#8B87A8] border-t border-[#E2DFFF] pt-4">
            Secured by Firebase Auth. Google Cloud deployment sandbox.
          </div>
        </div>
      </div>
    </div>
  );
}
