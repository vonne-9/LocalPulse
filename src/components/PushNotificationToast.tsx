import React from 'react';
import { Bell, AlertTriangle, Coffee, Calendar, X, ArrowRight, MapPin } from 'lucide-react';
import { NotificationLog } from '../types';

interface PushNotificationToastProps {
  notification: NotificationLog | null;
  onDismiss: () => void;
  onView: (notif: NotificationLog) => void;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  notification,
  onDismiss,
  onView,
}) => {
  if (!notification) return null;

  const isEmergency = notification.severity === 'critical';

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div
        className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md text-white flex flex-col gap-2 ${
          isEmergency
            ? 'bg-red-950/95 border-red-500/80 shadow-red-950/50'
            : 'bg-slate-900/95 border-slate-700 shadow-slate-950/50'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isEmergency ? 'bg-red-600 animate-pulse' : 'bg-amber-600'
              }`}
            >
              {isEmergency ? (
                <AlertTriangle className="w-4 h-4 text-white" />
              ) : (
                <Bell className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/20">
                Location Push Alert
              </span>
              <h4 className="font-bold text-xs text-white mt-0.5 line-clamp-1">
                {notification.title}
              </h4>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-white/60 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-white/70 flex items-center gap-1 font-semibold">
            <MapPin className="w-3 h-3 text-rose-300" />
            {notification.distanceKm} km from you
          </span>
          <button
            onClick={() => onView(notification)}
            className="flex items-center gap-1 bg-white text-slate-900 hover:bg-slate-100 font-bold px-3 py-1 rounded-lg text-[11px] shadow transition-colors"
          >
            <span>View Incident</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
