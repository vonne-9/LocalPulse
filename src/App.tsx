import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Flame,
  Waves,
  Coffee,
  Trophy,
  Calendar,
  Filter,
  Search,
  MapPin,
  Compass,
  Radio,
  Plus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Users,
  Sliders,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { ReportItem, NotificationLog, UserLocation, GroundedPlace, GooglePlaceResult } from './types';
import { ReportModal } from './components/ReportModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { GoogleMapsView } from './components/GoogleMapsView';
import { GoogleMapsSidePanel } from './components/GoogleMapsSidePanel';
import { GeminiChatDrawer } from './components/GeminiChatDrawer';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { PushNotificationToast } from './components/PushNotificationToast';
import { playNotificationSound } from './utils/audio';

export default function App() {
  // State - Default to SFSU Campus for SF Hacks x GDG Hackathon
  const [userLocation, setUserLocation] = useState<UserLocation>({
    name: 'SFSU Campus & Parkmerced (SF Hacks)',
    lat: 37.7241,
    lng: -122.4799,
  });

  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters - Google Maps UI/UX Main Canvas
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState<boolean>(false);

  // Modals & Drawers
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState<boolean>(false);
  const [isRadiusModalOpen, setIsRadiusModalOpen] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<NotificationLog | null>(null);
  const [showCriticalBanner, setShowCriticalBanner] = useState<boolean>(true);

  // Fetch reports based on location & radius
  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/reports?userLat=${userLocation.lat}&userLng=${userLocation.lng}&maxDistanceKm=${radiusKm}`
      );
      if (!res.ok) throw new Error('Failed to load reports');
      const data = await res.json();
      setReports(data.reports || []);
      setError(null);
    } catch (err: any) {
      console.error('Fetch reports error:', err);
      setError('Unable to load real-time alerts. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.warn('Notifications fetch warning:', err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchNotifications();
  }, [userLocation, radiusKm]);

  // Critical alerts for top banner
  const criticalAlerts = useMemo(() => {
    return reports.filter(
      (r) => r.type === 'emergency' && r.severity === 'critical' && r.status === 'active'
    );
  }, [reports]);

  // Filtered reports for the feed
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Type filter
      if (filterType !== 'all' && r.type !== filterType) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(query);
        const matchesDesc = r.description.toLowerCase().includes(query);
        const matchesLoc = r.locationName.toLowerCase().includes(query);
        const matchesTags = r.tags.some((t) => t.toLowerCase().includes(query));
        return matchesTitle || matchesDesc || matchesLoc || matchesTags;
      }
      return true;
    });
  }, [reports, filterType, searchQuery]);

  // Statistics counters
  const emergencyCount = reports.filter((r) => r.type === 'emergency').length;
  const dailyCount = reports.filter((r) => r.type === 'daily').length;
  const eventCount = reports.filter((r) => r.type === 'event').length;

  // Handle report creation
  const handleCreateReport = async (reportData: any) => {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });

    if (!res.ok) {
      throw new Error('Failed to submit report');
    }

    const data = await res.json();
    if (data.report) {
      setReports((prev) => [data.report, ...prev]);
    }
    if (data.notification) {
      setNotifications((prev) => [data.notification, ...prev]);
      setActiveToast(data.notification);
      playNotificationSound(data.report.severity === 'critical' ? 'emergency' : 'info');
    }
  };

  // Upvote / Verify
  const handleVote = async (id: string, type: 'up' | 'down') => {
    try {
      const res = await fetch(`/api/reports/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType: type }),
      });
      if (res.ok) {
        const data = await res.json();
        setReports((prev) => prev.map((r) => (r.id === id ? data.report : r)));
        if (selectedReport && selectedReport.id === id) {
          setSelectedReport(data.report);
        }
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  // Add Comment / Live Situation Update
  const handleAddComment = async (reportId: string, text: string, author?: string, imageUrl?: string) => {
    const res = await fetch(`/api/reports/${reportId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author, imageUrl }),
    });
    if (!res.ok) throw new Error('Failed to post comment');
    const data = await res.json();
    setReports((prev) => prev.map((r) => (r.id === reportId ? data.report : r)));
    if (selectedReport && selectedReport.id === reportId) {
      setSelectedReport(data.report);
    }
  };

  // Event RSVP
  const handleRsvp = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}/rsvp`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setReports((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  eventDetails: data.eventDetails,
                }
              : r
          )
        );
        if (selectedReport && selectedReport.id === id) {
          setSelectedReport({
            ...selectedReport,
            eventDetails: data.eventDetails,
          });
        }
      }
    } catch (err) {
      console.error('RSVP error:', err);
    }
  };

  // Resolve
  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}/resolve`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setReports((prev) => prev.map((r) => (r.id === id ? data.report : r)));
        if (selectedReport && selectedReport.id === id) {
          setSelectedReport(data.report);
        }
      }
    } catch (err) {
      console.error('Resolve error:', err);
    }
  };

  // Trigger test location push notification
  const handleTriggerTestPush = () => {
    const testNotif: NotificationLog = {
      id: `test-${Date.now()}`,
      reportId: reports[0]?.id || 'rep-1',
      type: 'emergency',
      title: 'SIMULATED RADAR ALERT: Water Level Rising',
      message: `Emergency sensor triggered at 0.5 km radius from ${userLocation.name}. Keep roads clear.`,
      timestamp: new Date().toISOString(),
      distanceKm: 0.5,
      severity: 'critical',
    };
    setNotifications((prev) => [testNotif, ...prev]);
    setActiveToast(testNotif);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Real-time Location Push Notification Toast Dropdown */}
      <PushNotificationToast
        notification={activeToast}
        onDismiss={() => setActiveToast(null)}
        onView={(n) => {
          setActiveToast(null);
          const found = reports.find((r) => r.id === n.reportId);
          if (found) setSelectedReport(found);
          else setIsRadiusModalOpen(true);
        }}
      />

      {/* Main Full-Bleed Google Maps Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <GoogleMapsView
          userLocation={userLocation}
          reports={reports}
          radiusKm={radiusKm}
          onSelectReport={(r) => setSelectedReport(r)}
          onMapClickReport={(coords) => {
            setIsReportModalOpen(true);
          }}
        />
      </div>

      {/* Google Maps Interactive Side Bar (To Search for Location & View Live Updates) */}
      <GoogleMapsSidePanel
        reports={reports}
        selectedReport={selectedReport}
        onSelectReport={setSelectedReport}
        userLocation={userLocation}
        onLocationChange={setUserLocation}
        radiusKm={radiusKm}
        onVote={handleVote}
        onAddComment={handleAddComment}
        onRsvp={handleRsvp}
        onResolve={handleResolve}
        filterType={filterType}
        setFilterType={setFilterType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isCollapsed={isSidePanelCollapsed}
        setIsCollapsed={setIsSidePanelCollapsed}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenChatModal={() => setIsChatDrawerOpen(true)}
      />

      {/* Floating Map Controls (Top Right: Google Maps Style) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setIsRadiusModalOpen(true)}
          className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 hover:border-amber-400 text-white px-3.5 py-2 rounded-2xl text-xs font-semibold shadow-2xl flex items-center gap-1.5 transition-colors"
          title="Configure alert radius"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span>{radiusKm} km radius</span>
        </button>

        <button
          onClick={fetchReports}
          className="p-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white shadow-2xl transition-all"
          title="Refresh Map Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Floating Action Buttons (Bottom Right: Google Maps Style) */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-2.5 pointer-events-auto">
        <button
          onClick={() => setIsChatDrawerOpen(true)}
          className="bg-slate-900/95 backdrop-blur-md hover:bg-slate-800 border border-slate-700 text-cyan-400 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask AI</span>
        </button>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold px-5 py-3.5 rounded-2xl text-xs shadow-2xl shadow-rose-950/60 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <span>Report Situation</span>
        </button>
      </div>

      {/* MODALS */}
      
      {/* 1. Report Creation Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userLocation={userLocation}
        onSubmitReport={handleCreateReport}
      />

      {/* 2. Report Detail & Live Comments Modal */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onVote={handleVote}
        onAddComment={handleAddComment}
        onRsvp={handleRsvp}
        onResolve={handleResolve}
      />

      {/* 3. Multi-turn Gemini Chatbot Drawer */}
      <GeminiChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        userLocation={userLocation}
        reports={reports}
        onSelectPlace={(place) => {
          const item: ReportItem = {
            id: place.id,
            type: 'daily',
            category: place.category.toLowerCase().includes('bakery') ? 'bakery_food' : 'daily',
            title: place.name,
            description: place.reviewsAggregation?.consensusSummary || `${place.name} located at ${place.address}.`,
            locationName: place.address,
            coordinates: place.coordinates,
            severity: 'info',
            status: 'active',
            author: {
              name: 'Google Maps Verified Place',
              badge: 'Verified Business',
              isVerifiedResident: true,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            votes: { up: 24, down: 0 },
            verificationsCount: 24,
            commentsCount: 1,
            comments: [
              {
                id: `c-${Date.now()}`,
                author: 'Local Guide',
                text: place.reviewsAggregation?.mustTryOrHighlights?.[0] || 'Highly recommended neighborhood spot.',
                createdAt: new Date().toISOString(),
              },
            ],
            tags: [place.category, place.priceLevel || '$$', 'Verified Place'],
            imageUrl: place.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
            priceLevel: place.priceLevel || '$$',
            directionsUrl: place.directionsUrl || `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`,
            reviewsAggregation: place.reviewsAggregation,
          };
          setSelectedReport(item);
          setUserLocation({
            name: place.name,
            lat: place.coordinates.lat,
            lng: place.coordinates.lng,
          });
        }}
      />

      {/* 4. Location Push Geofence Radius & Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isRadiusModalOpen}
        onClose={() => setIsRadiusModalOpen(false)}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        notifications={notifications}
        onSelectNotification={(notif) => {
          setIsRadiusModalOpen(false);
          const found = reports.find((r) => r.id === notif.reportId);
          if (found) setSelectedReport(found);
        }}
        userLocation={userLocation}
        onTriggerTestPush={handleTriggerTestPush}
      />

    </div>
  );
}
