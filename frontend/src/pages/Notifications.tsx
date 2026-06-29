import React, { useEffect } from 'react';
import { useNotificationStore, Notification } from '../stores/useNotificationStore';
import { Bell, ShieldAlert, Sparkles, Check, Trash } from 'lucide-react';

export default function Notifications() {
  const { notifications, fetchNotifications, markAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotifIcon = (type: Notification['type']) => {
    switch (type) {
      case 'risk_alert':
        return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'achievement':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="space-y-6 max-w-3xl">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-200">Inbox Notifications</h1>
          <p className="text-xs text-gray-500">Track task alerts, deadline warnings, and AI morning briefing updates.</p>
        </div>
        {unreadNotifications.length > 0 && (
          <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
            {unreadNotifications.length} Unread
          </span>
        )}
      </div>

      {/* Notifications lists */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-gray-500 text-sm gap-2">
            <Bell className="w-8 h-8 opacity-40 text-brand-indigo animate-pulse" />
            <span>Inbox is clear. No active alerts.</span>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => !notif.read && markAsRead(notif.id)}
              className={`p-4 rounded-xl glass border transition-all flex items-start gap-4 cursor-pointer hover:border-indigo-500/10 ${
                notif.read ? 'opacity-65 border-white/5 bg-white/[0.01]' : 'border-indigo-500/20 bg-indigo-500/[0.02]'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${notif.read ? 'bg-white/5' : 'bg-indigo-500/10'}`}>
                {getNotifIcon(notif.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className={`text-xs font-semibold ${notif.read ? 'text-gray-400' : 'text-gray-200'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[9px] text-gray-500 font-mono">
                    {new Date(notif.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{notif.body}</p>
                {!notif.read && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
                    <Check className="w-3 h-3" /> Mark Read
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
