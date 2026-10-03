import React, { useState } from 'react';
import {
  X,
  Bell,
  Sliders,
  ShieldAlert,
  Coffee,
  Calendar,
  Volume2,
  CheckCircle,
  Radio,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { NotificationLog, ReportItem, UserLocation } from '../types';
import { playNotificationSound } from '../utils/audio';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  radiusKm: number;
  onRadiusChange: (newRadius: number) => void;
  notifications: NotificationLog[];
  onSelectNotification: (notif: NotificationLog) => void;
  userLocation: UserLocation;
  onTriggerTestPush: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  radiusKm,
  onRadiusChange,
  notifications,
  onSelectNotification,
  userLocation,
  onTriggerTestPush,
}) => {
  const [notifyEmergency, setNotifyEmergency] = useState(true);
  const [notifyDaily, setNotifyDaily] = useState(true);
  const [notifyEvents, setNotifyEvents] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleTest = () => {
    if (soundEnabled) {
      playNotificationSound('emergency');
    }
    onTriggerTestPush();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Location-Based Push Radar
              </h2>
              <p className="text-xs text-slate-400">
                Geofenced alerts triggered when situations happen near you
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          
          {/* Geofence Radius Slider */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white">Alert Radar Radius:</span>
              </div>
              <span className="text-base font-extrabold text-amber-400 bg-amber-950/40 px-3 py-0.5 rounded-full border border-amber-800/50">
                {radiusKm} km
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              value={radiusKm}
              onChange={(e) => onRadiusChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>0.5 km (Immediate block)</span>
              <span>5 km (Neighborhood)</span>
              <span>20 km (Metro area)</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Reports, flash flood warnings, court wait times, and bakery alerts within{' '}
              <strong className="text-slate-200">{radiusKm} km</strong> of{' '}
              <strong className="text-rose-400">{userLocation.name}</strong> will trigger immediate notifications.
            </p>
          </div>

          {/* Alert Type Toggles */}
          <div className="space-y-2.5">
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Notify Me About:
            </label>

            {/* Emergency */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-950/20 border border-red-900/40">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <div>
                  <div className="font-bold text-red-200 text-xs">Critical Emergency Hazards</div>
                  <div className="text-[11px] text-slate-400">Floods, wildfires, road blockages, storm alerts</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyEmergency}
                onChange={(e) => setNotifyEmergency(e.target.checked)}
                className="w-4 h-4 accent-red-500 cursor-pointer"
              />
            </div>

            {/* Daily */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/20 border border-amber-900/40">
              <div className="flex items-center gap-2.5">
                <Coffee className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-bold text-amber-200 text-xs">Daily Micro-Updates</div>
                  <div className="text-[11px] text-slate-400">Bakery stock / sell-outs, crowded badminton courts, parking</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyDaily}
                onChange={(e) => setNotifyDaily(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Events */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-900/40">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-bold text-purple-200 text-xs">Special Community Events</div>
                  <div className="text-[11px] text-slate-400">Markets, volunteer cleanups, local gatherings</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyEvents}
                onChange={(e) => setNotifyEvents(e.target.checked)}
                className="w-4 h-4 accent-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Sound & Dispatch Test */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-300" />
              <span className="text-xs font-semibold text-slate-200">Play Audio Chime on Alert</span>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-rose-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleTest}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>{testSent ? 'Alert Dispatched!' : 'Simulate Location Alert'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow"
            >
              Save Preferences
            </button>
          </div>

          {/* Recent Location Push Notifications History */}
          <div className="pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Recent Push Broadcasts ({notifications.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onSelectNotification(n)}
                  className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white truncate max-w-[260px]">
                      {n.title}
                    </span>
                    <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {n.distanceKm} km
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-1">{n.message}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
