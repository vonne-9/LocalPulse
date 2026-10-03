import React, { useState } from 'react';
import {
  Radio,
  MapPin,
  Bell,
  Plus,
  MessageSquareText,
  Compass,
  Sliders,
  ChevronDown,
  Navigation,
  Check,
} from 'lucide-react';
import { UserLocation, NotificationLog } from '../types';

interface NavbarProps {
  userLocation: UserLocation;
  onLocationChange: (loc: UserLocation) => void;
  radiusKm: number;
  onOpenRadiusModal: () => void;
  notifications: NotificationLog[];
  onOpenNotifications: () => void;
  onOpenReportModal: () => void;
  onOpenChatModal: () => void;
  onOpenMapsScout: () => void;
  activeTab: 'map' | 'scout';
  setActiveTab: (tab: 'map' | 'scout') => void;
}

const PRESET_LOCATIONS: UserLocation[] = [
  { name: 'SFSU Campus & Parkmerced (SF Hacks)', lat: 37.7241, lng: -122.4799 },
  { name: 'Central Downtown District', lat: 37.7819, lng: -122.4048 },
  { name: 'Riverside & Waterfront', lat: 37.7749, lng: -122.4194 },
  { name: 'Valley & Parkside', lat: 37.758, lng: -122.446 },
  { name: 'Highland & Ridge District', lat: 37.7858, lng: -122.4064 },
  { name: 'Metro North Corridor', lat: 37.8044, lng: -122.2712 },
];

export const Navbar: React.FC<NavbarProps> = ({
  userLocation,
  onLocationChange,
  radiusKm,
  onOpenRadiusModal,
  notifications,
  onOpenNotifications,
  onOpenReportModal,
  onOpenChatModal,
  onOpenMapsScout,
  activeTab,
  setActiveTab,
}) => {
  const [showLocMenu, setShowLocMenu] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        onLocationChange({
          name: 'My Exact GPS Location',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setShowLocMenu(false);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        // Fallback default
        onLocationChange({
          name: 'Civic Center (GPS Fallback)',
          lat: 37.7792,
          lng: -122.4191,
        });
        setShowLocMenu(false);
      },
      { timeout: 7000 }
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Live Status */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 shadow-md shadow-rose-900/40">
              <Radio className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  LocalPulse
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Radar Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Emergency & Community Crowdsource
              </p>
            </div>
          </div>

          {/* Location & Radius Geofence Pill */}
          <div className="relative hidden md:flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-full px-3 py-1.5 text-xs shadow-inner">
            <button
              onClick={() => setShowLocMenu(!showLocMenu)}
              className="flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-semibold max-w-[140px] truncate">{userLocation.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <span className="text-slate-600">|</span>

            <button
              onClick={onOpenRadiusModal}
              className="flex items-center gap-1 text-slate-300 hover:text-amber-400 transition-colors"
              title="Configure notification radius"
            >
              <Sliders className="w-3 h-3 text-amber-400" />
              <span className="font-medium">{radiusKm} km alert radius</span>
            </button>

            {/* Location Selector Dropdown */}
            {showLocMenu && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-slate-200 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                  Select Local Center
                </div>
                {PRESET_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => {
                      onLocationChange(loc);
                      setShowLocMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700/70 flex items-center justify-between transition-colors"
                  >
                    <span>{loc.name}</span>
                    {userLocation.name === loc.name && (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>
                ))}
                <div className="border-t border-slate-700/60 mt-1 pt-1 px-2">
                  <button
                    onClick={handleUseCurrentGPS}
                    disabled={isLocating}
                    className="w-full flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg py-1.5 text-xs font-medium transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{isLocating ? 'Locating...' : 'Use My Live GPS'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* View Mode Switcher (Google Map Canvas & Maps Scout) */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/70 text-xs">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'map'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Interactive Map
            </button>
            <button
              onClick={() => setActiveTab('scout')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
                activeTab === 'scout'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/50'
              }`}
              title="Google Maps Grounding Scout"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Places Scout</span>
            </button>
          </div>

          {/* Right Action Icons & Primary CTA */}
          <div className="flex items-center gap-2">
            {/* Gemini AI Copilot */}
            <button
              onClick={onOpenChatModal}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 hover:text-cyan-300 transition-all flex items-center gap-1.5 text-xs font-medium"
              title="Ask LocalPulse AI Assistant"
            >
              <MessageSquareText className="w-4 h-4" />
              <span className="hidden lg:inline">AI Copilot</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title="Location Push Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Report Button */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-lg shadow-rose-900/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Report Situation</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
