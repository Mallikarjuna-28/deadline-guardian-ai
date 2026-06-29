import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTaskStore } from '../stores/useTaskStore';
import { Settings as SettingsIcon, Shield, Sun, Moon, Calendar, Download, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { user, updateProfile, darkMode, toggleDarkMode } = useAuthStore();
  const { tasks } = useTaskStore();

  const [hoursStart, setHoursStart] = useState(user?.preferences?.workHoursStart || '09:00');
  const [hoursEnd, setHoursEnd] = useState(user?.preferences?.workHoursEnd || '17:00');
  const [calSync, setCalSync] = useState(true);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      preferences: {
        workStyle: user?.preferences?.workStyle || 'morning',
        deepWorkDuration: user?.preferences?.deepWorkDuration || 25,
        workHoursStart: hoursStart,
        workHoursEnd: hoursEnd
      }
    });
    alert('Settings preferences updated successfully.');
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ user, tasks }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", "deadline_guardian_data.json");
    dlAnchorElem.click();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      
      {/* Title */}
      <div className="border-b border-white/5 pb-4">
        <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-200">System Settings</h1>
        <p className="text-xs text-gray-500">Configure notification batch patterns, work schedules, calendar mappings.</p>
      </div>

      <form onSubmit={saveSettings} className="space-y-6">
        
        {/* Core preferences widget */}
        <div className="p-5 rounded-2xl glass border border-white/5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Preferences</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Preferred Focus Start</label>
              <input
                type="time"
                value={hoursStart}
                onChange={(e) => setHoursStart(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Preferred Focus End</label>
              <input
                type="time"
                value={hoursEnd}
                onChange={(e) => setHoursEnd(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div>
              <h4 className="text-xs font-semibold text-gray-200">Visual Dark Mode</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">Toggle interface themes.</p>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/5"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Integration preferences */}
        <div className="p-5 rounded-2xl glass border border-white/5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Integrations</h3>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-semibold text-gray-200">Google Calendar Sync</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">Auto write task events into google account.</p>
            </div>
            <input
              type="checkbox"
              checked={calSync}
              onChange={() => setCalSync(!calSync)}
              className="w-8 h-4 rounded-full bg-gray-800 border-transparent text-brand-indigo focus:ring-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Backup and export controls */}
        <div className="p-5 rounded-2xl glass border border-white/5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Account Data Actions</h3>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-semibold text-gray-200">Export Agenda Backups</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">Download full logs of tasks and goals as JSON.</p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Submit adjustments */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-violet text-white text-sm font-semibold hover:shadow-[0_0_15px_rgba(124,58,237,0.25)] transition-all"
          >
            Save Preferences
          </button>
        </div>

      </form>

    </div>
  );
}
