import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Calendar,
  MapPin,
  Camera,
  Send,
  Loader2,
  Navigation,
  RefreshCw,
  SunMedium,
  CheckCircle2,
} from 'lucide-react';
import { SeverityLevel, UserLocation } from '../types';
import { DeviceImagePicker } from './DeviceImagePicker';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: UserLocation;
  onSubmitReport: (reportData: any) => Promise<void>;
}

export type SimplifiedCategory = 'emergency' | 'daily_updates' | 'events';

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  onSubmitReport,
}) => {
  // Category state: restricted to just Emergency, Daily Updates, and Events
  const [category, setCategory] = useState<SimplifiedCategory>('emergency');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState(userLocation.name);
  const [lat, setLat] = useState(userLocation.lat);
  const [lng, setLng] = useState(userLocation.lng);
  const [authorName, setAuthorName] = useState('Local Resident');
  const [imageUrl, setImageUrl] = useState('');

  // GPS state
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Event-specific fields
  const [eventDate, setEventDate] = useState('This Weekend, 6:00 PM');
  const [eventVenue, setEventVenue] = useState(userLocation.name);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fetch device GPS when modal opens
  const fetchGpsLocation = () => {
    if ('geolocation' in navigator) {
      setIsGettingGps(true);
      setGpsStatus('Acquiring real-time GPS coordinates...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setLat(latitude);
          setLng(longitude);
          setGpsAccuracy(Math.round(accuracy));
          setIsGettingGps(false);
          setGpsStatus(`GPS Acquired (±${Math.round(accuracy)}m accuracy)`);
          setLocationName(
            `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Near ${userLocation.name})`
          );
        },
        (error) => {
          console.warn('GPS Error:', error.message);
          setIsGettingGps(false);
          setGpsStatus('GPS permission not granted, using current map location');
          setLat(userLocation.lat);
          setLng(userLocation.lng);
          setLocationName(userLocation.name);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    } else {
      setGpsStatus('Geolocation not supported by device');
      setLat(userLocation.lat);
      setLng(userLocation.lng);
      setLocationName(userLocation.name);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGpsLocation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const type =
        category === 'emergency'
          ? 'emergency'
          : category === 'events'
          ? 'event'
          : 'daily';

      const severity: SeverityLevel =
        category === 'emergency'
          ? 'critical'
          : category === 'events'
          ? 'positive'
          : 'info';

      const categoryLabel =
        category === 'emergency'
          ? 'Emergency'
          : category === 'events'
          ? 'Events'
          : 'Daily Updates';

      await onSubmitReport({
        type,
        category: categoryLabel.toLowerCase().replace(' ', '_'),
        title,
        description,
        locationName,
        coordinates: { lat, lng },
        severity,
        authorName,
        tags: [categoryLabel, 'Verified Citizen Report'],
        imageUrl: imageUrl || undefined,
        eventDate: category === 'events' ? eventDate : undefined,
        eventVenue: category === 'events' ? eventVenue : undefined,
      });

      onClose();
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              Report Local Situation
            </h2>
            <p className="text-xs text-slate-400">
              Pin a real-time situation to the Google Map using your live GPS location.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Live Device GPS Banner */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/70 to-slate-900 border border-blue-600/40 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Navigation className={`w-4 h-4 ${isGettingGps ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                  <span>Device GPS Location</span>
                  {gpsAccuracy !== null && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Live GPS</span>
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-blue-300/90 truncate max-w-[280px] sm:max-w-sm">
                  {isGettingGps
                    ? 'Acquiring high-accuracy GPS coordinates...'
                    : `${lat.toFixed(4)}, ${lng.toFixed(4)} ${gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}`}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchGpsLocation}
              disabled={isGettingGps}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
              title="Refresh GPS coordinates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGettingGps ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Categories: Emergency, Daily Updates, Events */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 text-xs uppercase tracking-wider">
              Category *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* 1. Emergency */}
              <button
                type="button"
                onClick={() => setCategory('emergency')}
                className={`py-3 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all ${
                  category === 'emergency'
                    ? 'bg-red-600/30 border-red-500 text-white shadow-lg shadow-red-950/50 scale-[1.02]'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 ${category === 'emergency' ? 'text-red-400' : 'text-red-400/80'}`} />
                <span className="text-xs">Emergency</span>
              </button>

              {/* 2. Daily Updates */}
              <button
                type="button"
                onClick={() => setCategory('daily_updates')}
                className={`py-3 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all ${
                  category === 'daily_updates'
                    ? 'bg-amber-600/30 border-amber-500 text-white shadow-lg shadow-amber-950/50 scale-[1.02]'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <SunMedium className={`w-5 h-5 ${category === 'daily_updates' ? 'text-amber-400' : 'text-amber-400/80'}`} />
                <span className="text-xs">Daily Updates</span>
              </button>

              {/* 3. Events */}
              <button
                type="button"
                onClick={() => setCategory('events')}
                className={`py-3 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all ${
                  category === 'events'
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-lg shadow-purple-950/50 scale-[1.02]'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <Calendar className={`w-5 h-5 ${category === 'events' ? 'text-purple-400' : 'text-purple-400/80'}`} />
                <span className="text-xs">Events</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-xs">
              Situation Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                category === 'emergency'
                  ? 'e.g. Flash Flood on 19th Ave & Winston Dr, Road Blockage'
                  : category === 'events'
                  ? 'e.g. SF Hacks 2026 Opening Ceremony at Student Center'
                  : 'e.g. Bakery Pastries Sold Out, Sports Courts Wait Time ~30m'
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 placeholder-slate-500 shadow-inner"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-xs">
              Situation Details & Ground Conditions
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you see: water depth, crowd levels, queue duration, road hazards, or event schedule..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 placeholder-slate-500 resize-none shadow-inner"
            />
          </div>

          {/* Location Name & Reporter Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Location / Landmark Name</span>
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. SFSU Student Center, Sunset Blvd & Taraval"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                Your Reporter Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Verified Resident, Community Volunteer"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Event-specific fields if Events category is selected */}
          {category === 'events' && (
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-purple-200 font-semibold mb-1 text-xs">
                  Event Date & Time
                </label>
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  placeholder="e.g. Today, 5:00 PM - 9:00 PM"
                  className="w-full bg-slate-800 border border-purple-700/60 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-purple-200 font-semibold mb-1 text-xs">
                  Venue / Stage
                </label>
                <input
                  type="text"
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  placeholder="e.g. Jack Adams Hall, Central Lawn"
                  className="w-full bg-slate-800 border border-purple-700/60 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          )}

          {/* Device Image Import & Photo Evidence */}
          <DeviceImagePicker
            value={imageUrl}
            onChange={setImageUrl}
            label="Situation Photo / Evidence"
          />

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-rose-900/30 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Pinning Situation to Map...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Broadcast Situation to Map</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
