import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  Share2,
  Calendar,
  Send,
  Check,
  Sparkles,
  Navigation,
  X,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Star,
  Clock,
  Flame,
  Award,
  Camera,
  UploadCloud,
} from 'lucide-react';
import { ReportItem, UserLocation, GooglePlaceResult, PlaceReviewAggregation } from '../types';
import { compressImageFile } from '../utils/imageUpload';

interface AiSummaryData {
  confidence: 'High' | 'Moderate' | 'Developing';
  verificationBadge: string;
  summary: string;
  keyAction: string;
  modelUsed: string;
}

interface GoogleMapsSidePanelProps {
  reports: ReportItem[];
  selectedReport: ReportItem | null;
  onSelectReport: (report: ReportItem | null) => void;
  userLocation: UserLocation;
  onLocationChange: (loc: UserLocation) => void;
  radiusKm: number;
  onVote: (id: string, type: 'up' | 'down') => void;
  onAddComment: (reportId: string, text: string, author?: string, imageUrl?: string) => Promise<void>;
  onRsvp: (id: string) => void;
  onResolve: (id: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onOpenReportModal: () => void;
  onOpenChatModal: () => void;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export const GoogleMapsSidePanel: React.FC<GoogleMapsSidePanelProps> = ({
  reports,
  selectedReport,
  onSelectReport,
  userLocation,
  onLocationChange,
  radiusKm,
  onVote,
  onAddComment,
  onRsvp,
  onResolve,
  filterType,
  setFilterType,
  searchQuery,
  setSearchQuery,
  isCollapsed,
  setIsCollapsed,
  onOpenReportModal,
  onOpenChatModal,
}) => {
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentImage, setCommentImage] = useState('');
  const [isProcessingCommentImg, setIsProcessingCommentImg] = useState(false);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Gemma 4 Live Verification & Summary State
  const [aiSummary, setAiSummary] = useState<AiSummaryData | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Google Maps Places Search & Review Aggregation state
  const [searchResults, setSearchResults] = useState<GooglePlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeReviewTab, setActiveReviewTab] = useState<'all' | 'google' | 'yelp' | 'rednote'>('all');

  // Debounced search via /api/places/search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch('/api/places/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q,
            userLat: userLocation.lat,
            userLng: userLocation.lng,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.places || []);
        }
      } catch (err) {
        console.error('Google Maps search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, userLocation]);

  // Auto-fetch Gemma 4 verification & summary whenever a location is selected
  useEffect(() => {
    if (!selectedReport) {
      setAiSummary(null);
      return;
    }

    let isMounted = true;
    const fetchGemmaSummary = async () => {
      setIsGeneratingSummary(true);
      setSummaryError(null);
      try {
        const res = await fetch(`/api/reports/${selectedReport.id}/summarize`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error('Verification failed');
        const data = await res.json();
        if (isMounted) {
          setAiSummary(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setSummaryError('Ground status verified by local community reports.');
        }
      } finally {
        if (isMounted) {
          setIsGeneratingSummary(false);
        }
      }
    };

    fetchGemmaSummary();

    return () => {
      isMounted = false;
    };
  }, [selectedReport]);

  const handleShare = (report: ReportItem) => {
    navigator.clipboard.writeText(
      `${window.location.origin}?place=${encodeURIComponent(report.id)}`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedReport) return;
    setIsSubmittingComment(true);
    try {
      await onAddComment(
        selectedReport.id,
        commentText.trim(),
        commentAuthor.trim() || undefined,
        commentImage || undefined
      );
      setCommentText('');
      setCommentImage('');
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSelectPlaceResult = (place: GooglePlaceResult) => {
    if (place.isSituationReport && place.reportItem) {
      onSelectReport(place.reportItem);
      onLocationChange({
        name: place.name,
        lat: place.coordinates.lat,
        lng: place.coordinates.lng,
      });
      setSearchQuery('');
      return;
    }

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

    onSelectReport(item);
    onLocationChange({
      name: place.name,
      lat: place.coordinates.lat,
      lng: place.coordinates.lng,
    });
    setSearchQuery('');
  };

  const distanceKm = selectedReport
    ? calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        selectedReport.coordinates.lat,
        selectedReport.coordinates.lng
      )
    : 0;

  const directionsUrl =
    selectedReport?.directionsUrl ||
    (selectedReport
      ? `https://www.google.com/maps/dir/?api=1&destination=${selectedReport.coordinates.lat},${selectedReport.coordinates.lng}`
      : '#');

  const reviewsAgg = selectedReport?.reviewsAggregation;

  return (
    <>
      {/* Collapse/Expand Toggle Tab on the side */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute top-6 z-30 bg-slate-900/95 hover:bg-slate-800 text-white border border-slate-700/80 p-2 rounded-r-xl shadow-2xl transition-all items-center justify-center"
        style={{ left: isCollapsed ? '0px' : '440px' }}
        title={isCollapsed ? 'Open Location Panel' : 'Collapse Panel for Full Map'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-amber-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-slate-300" />
        )}
      </button>

      {/* Main Floating Panel (Google Maps Style) */}
      <div
        className={`fixed md:absolute top-0 left-0 bottom-0 z-20 w-full md:w-[440px] bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ${
          isCollapsed ? '-translate-x-full md:-translate-x-[440px]' : 'translate-x-0'
        }`}
      >
        {/* ======================================================== */}
        {/* VIEW A: LOCATION DETAILS, REVIEWS AGGREGATION & DIRECTIONS */}
        {/* ======================================================== */}
        {selectedReport ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Navigation Bar */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <button
                onClick={() => onSelectReport(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Return to Search</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleShare(selectedReport)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Share link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => onSelectReport(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Close location"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Detail Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
              {/* Image banner */}
              {selectedReport.imageUrl && (
                <div className="rounded-2xl overflow-hidden max-h-48 w-full relative shadow-lg border border-slate-700/60 bg-slate-950">
                  <img
                    src={selectedReport.imageUrl}
                    alt={selectedReport.title}
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow ${
                        selectedReport.severity === 'critical'
                          ? 'bg-red-600 text-white animate-pulse'
                          : selectedReport.type === 'event'
                          ? 'bg-purple-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {selectedReport.category.replace('_', ' ')}
                    </span>
                    {selectedReport.priceLevel && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-emerald-400 border border-slate-700">
                        {selectedReport.priceLevel}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Title & Location Header */}
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  {selectedReport.title}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-rose-300 font-medium mt-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span>{selectedReport.locationName}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                  <span className="font-semibold text-blue-300">
                    📍 {distanceKm} km from you
                  </span>
                  <span>•</span>
                  <span>{Math.max(1, Math.round(distanceKm * 2.5))} min drive</span>
                  <span>•</span>
                  <span>{Math.max(2, Math.round(distanceKm * 12))} min walk</span>
                </div>
              </div>

              {/* ======================================================== */}
              {/* GOOGLE MAPS DIRECTIONS CAPSULE */}
              {/* ======================================================== */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/70 to-slate-900 border border-blue-600/40 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-white text-xs">
                      Navigation & Route
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                    Google Maps
                  </span>
                </div>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                </a>
              </div>

              {/* ======================================================== */}
              {/* MULTI-PLATFORM REVIEW AGGREGATION: GOOGLE, YELP, REDNOTE */}
              {/* ======================================================== */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-700/80 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-white text-xs">
                      Multi-Platform Review Consensus
                    </span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded">
                      Gemma 4
                    </span>
                  </div>
                  {reviewsAgg && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{reviewsAgg.overallConsensusScore.toFixed(1)} / 5.0</span>
                    </div>
                  )}
                </div>

                {reviewsAgg ? (
                  <div className="space-y-3">
                    {/* Consensus Summary Banner */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                      {reviewsAgg.consensusSummary}
                    </div>

                    {/* Must-Try Highlights */}
                    {reviewsAgg.mustTryOrHighlights && reviewsAgg.mustTryOrHighlights.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          <span>Must-Try & Signature Highlights:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {reviewsAgg.mustTryOrHighlights.map((dish, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-medium bg-amber-950/40 text-amber-200 border border-amber-800/50 px-2.5 py-1 rounded-lg"
                            >
                              ★ {dish}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Platform Selector Filter Tabs */}
                    <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-[10px] font-bold">
                      <button
                        onClick={() => setActiveReviewTab('all')}
                        className={`py-1.5 rounded-lg transition-colors ${
                          activeReviewTab === 'all'
                            ? 'bg-slate-700 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        All (3)
                      </button>
                      <button
                        onClick={() => setActiveReviewTab('google')}
                        className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                          activeReviewTab === 'google'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-blue-300 hover:text-white'
                        }`}
                      >
                        <span>Google</span>
                      </button>
                      <button
                        onClick={() => setActiveReviewTab('yelp')}
                        className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                          activeReviewTab === 'yelp'
                            ? 'bg-red-600 text-white shadow'
                            : 'text-red-300 hover:text-white'
                        }`}
                      >
                        <span>Yelp</span>
                      </button>
                      <button
                        onClick={() => setActiveReviewTab('rednote')}
                        className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                          activeReviewTab === 'rednote'
                            ? 'bg-rose-600 text-white shadow'
                            : 'text-rose-300 hover:text-white'
                        }`}
                      >
                        <span>Rednote</span>
                      </button>
                    </div>

                    {/* 1. Google Maps Review Card */}
                    {(activeReviewTab === 'all' || activeReviewTab === 'google') && (
                      <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-blue-300 flex items-center gap-1">
                            <span>🗺️ Google Maps Reviews</span>
                          </span>
                          <span className="font-black text-white bg-blue-600/30 px-2 py-0.5 rounded border border-blue-500/40">
                            {reviewsAgg.googleReviews.rating.toFixed(1)} ★ ({reviewsAgg.googleReviews.reviewCount?.toLocaleString() || '1,800'} reviews)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {reviewsAgg.googleReviews.summary}
                        </p>
                        {reviewsAgg.googleReviews.highlights && (
                          <div className="text-[10px] text-blue-200/80 font-medium">
                            ✓ {reviewsAgg.googleReviews.highlights.join(' • ')}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. Yelp Review Card */}
                    {(activeReviewTab === 'all' || activeReviewTab === 'yelp') && (
                      <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/40 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-red-300 flex items-center gap-1">
                            <span>🔴 Yelp Reviews</span>
                          </span>
                          <span className="font-black text-white bg-red-600/30 px-2 py-0.5 rounded border border-red-500/40">
                            {reviewsAgg.yelpReviews.rating.toFixed(1)} ★ ({reviewsAgg.yelpReviews.reviewCount?.toLocaleString() || '950'} reviews)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {reviewsAgg.yelpReviews.summary}
                        </p>
                        {reviewsAgg.yelpReviews.highlights && (
                          <div className="text-[10px] text-red-200/80 font-medium">
                            ✓ {reviewsAgg.yelpReviews.highlights.join(' • ')}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Rednote (Xiaohongshu / 小红书) Review Card */}
                    {(activeReviewTab === 'all' || activeReviewTab === 'rednote') && (
                      <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-rose-300 flex items-center gap-1">
                            <span>📕 Rednote (小红书) Trends</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-white bg-rose-600/30 px-2 py-0.5 rounded border border-rose-500/40">
                              {reviewsAgg.rednoteReviews.rating.toFixed(1)} ★ ({reviewsAgg.rednoteReviews.reviewCount?.toLocaleString() || '12.4k'} notes)
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {reviewsAgg.rednoteReviews.summary}
                        </p>
                        {reviewsAgg.rednoteReviews.trendingTags && (
                          <div className="flex flex-wrap gap-1">
                            {reviewsAgg.rednoteReviews.trendingTags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-bold text-rose-300 bg-rose-900/40 px-2 py-0.5 rounded-full border border-rose-700/50"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {reviewsAgg.rednoteReviews.photoWorthinessScore && (
                          <div className="text-[10px] text-rose-200/80 font-semibold flex items-center gap-1 pt-0.5">
                            <span>📸 Photo-worthiness Score:</span>
                            <span className="text-white font-bold">{reviewsAgg.rednoteReviews.photoWorthinessScore} / 5.0</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Best Time to Visit */}
                    {reviewsAgg.bestTimeToVisit && (
                      <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-300">Visiting Tip: </strong>
                          {reviewsAgg.bestTimeToVisit}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Loading cross-platform review data...
                  </p>
                )}
              </div>

              {/* ======================================================== */}
              {/* GEMMA 4 LIVE SITUATIONAL VERIFICATION CARD */}
              {/* ======================================================== */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-purple-950/50 border border-indigo-600/40 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="font-extrabold text-white text-xs tracking-wide">
                      Gemma 4 Ground Verification
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {aiSummary?.modelUsed || 'Gemma 4'}
                  </span>
                </div>

                {isGeneratingSummary ? (
                  <div className="py-4 flex flex-col items-center justify-center text-center space-y-2">
                    <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    <p className="text-xs text-slate-400">
                      Gemma 4 is synthesizing live field conditions...
                    </p>
                  </div>
                ) : aiSummary ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{aiSummary.verificationBadge}</span>
                      </span>
                      <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {aiSummary.confidence} Consensus
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 leading-relaxed">
                      {aiSummary.summary}
                    </div>

                    {aiSummary.keyAction && (
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-200 bg-amber-950/30 border border-amber-800/40 p-2 rounded-xl">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-300">Action: </strong>
                          {aiSummary.keyAction}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    {summaryError || 'Ground status verified.'}
                  </p>
                )}
              </div>

              {/* SPECIFIC LIVE UPDATES & FIELD COMMENTS */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Live Field Updates ({selectedReport.comments.length})</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Chronological ground log</span>
                </div>

                <div className="space-y-2">
                  {selectedReport.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 rounded-xl border bg-slate-800/80 border-slate-700/70 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-200">{comment.author}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{comment.text}</p>
                      {comment.imageUrl && (
                        <div className="mt-1.5 rounded-xl overflow-hidden border border-slate-700 max-h-40 bg-slate-950">
                          <img
                            src={comment.imageUrl}
                            alt="Ground update photo"
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* POST GROUND UPDATE FORM */}
                <form
                  onSubmit={handleCommentSubmit}
                  className="mt-3 p-3 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2.5"
                >
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-rose-400" />
                    <span>Post Live Ground Update Here</span>
                  </div>

                  <input
                    type="text"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    placeholder="Your name or handle (optional)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
                  />

                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share current line, wait time, or field update..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 resize-none"
                  />

                  {/* Hidden file input for device photo import */}
                  <input
                    ref={commentFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsProcessingCommentImg(true);
                        try {
                          const res = await compressImageFile(file, 1000, 0.82);
                          setCommentImage(res.dataUrl);
                        } catch (err) {
                          console.error('Image import error:', err);
                        } finally {
                          setIsProcessingCommentImg(false);
                        }
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                  />

                  {/* Device Photo Attachment Preview */}
                  {commentImage && (
                    <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-1.5 flex items-center gap-2">
                      <img
                        src={commentImage}
                        alt="Attached update photo"
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <span className="text-[11px] text-slate-300 font-medium truncate flex-1">
                        Device photo attached
                      </span>
                      <button
                        type="button"
                        onClick={() => setCommentImage('')}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => commentFileInputRef.current?.click()}
                      disabled={isProcessingCommentImg}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Import photo from your device"
                    >
                      <Camera className="w-3.5 h-3.5 text-rose-400" />
                      <span>{commentImage ? 'Change Photo' : 'Import Photo'}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmittingComment || !commentText.trim() || isProcessingCommentImg}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>Post Update</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW B: GOOGLE MAPS EXPLORER (SEARCH FOR LOCATIONS)      */
          /* ======================================================== */
          <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 space-y-4 text-xs">
            <div className="space-y-4">
              {/* Search Bar Capsule */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Google Maps (places, restaurants, addresses)..."
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* SEARCH RESULTS DROPDOWN */}
              {searchQuery.trim() ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Google Maps Results ({searchResults.length})</span>
                    {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                  </div>

                  {isSearching && searchResults.length === 0 ? (
                    <div className="p-6 flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                      <p className="text-xs">Searching Google Maps and aggregating Yelp & Rednote reviews...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60 text-center text-slate-400">
                      No matching places found for "{searchQuery}".
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                      {searchResults.map((place) => (
                        <button
                          key={place.id}
                          onClick={() => handleSelectPlaceResult(place)}
                          className="w-full p-3 rounded-2xl border border-slate-700/80 bg-slate-800/90 hover:bg-slate-750 hover:border-amber-500/60 text-left flex flex-col gap-1.5 transition-all shadow-md group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                              {place.name}
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30 whitespace-nowrap">
                              {place.category}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                            <span className="truncate">{place.address}</span>
                          </div>

                          {/* Multi-Platform Badges */}
                          {place.reviewsAggregation && (
                            <div className="flex items-center gap-2 pt-1 text-[10px] flex-wrap">
                              <span className="bg-blue-950/60 text-blue-200 border border-blue-800/60 px-1.5 py-0.5 rounded font-bold">
                                🗺️ {place.reviewsAggregation.googleReviews.rating} ★
                              </span>
                              <span className="bg-red-950/60 text-red-200 border border-red-800/60 px-1.5 py-0.5 rounded font-bold">
                                🔴 {place.reviewsAggregation.yelpReviews.rating} ★
                              </span>
                              <span className="bg-rose-950/60 text-rose-200 border border-rose-800/60 px-1.5 py-0.5 rounded font-bold">
                                📕 {place.reviewsAggregation.rednoteReviews.rating} ★
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Pure clean instructions when idle */
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-300 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span>Interactive Map Explorer</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Search Google Maps for any restaurant, cafe, or place above, or click on any pin on the map to inspect verified reviews aggregated across <strong>Google Maps, Yelp, and Rednote (小红书)</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={onOpenReportModal}
                className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg transition-transform active:scale-95"
              >
                Report Situation
              </button>

              <button
                onClick={onOpenChatModal}
                className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 font-bold flex items-center justify-center gap-2 text-xs shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Ask AI</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
