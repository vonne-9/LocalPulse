import React from 'react';
import {
  AlertTriangle,
  Flame,
  Waves,
  Coffee,
  Trophy,
  Calendar,
  MapPin,
  CheckCircle2,
  MessageSquare,
  ThumbsUp,
  Clock,
  ExternalLink,
  Users,
} from 'lucide-react';
import { ReportItem } from '../types';

interface ReportCardProps {
  report: ReportItem;
  onSelect: (report: ReportItem) => void;
  onVote: (id: string, type: 'up' | 'down') => void;
  onRsvp?: (id: string) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onSelect,
  onVote,
  onRsvp,
}) => {
  const isEmergency = report.type === 'emergency';
  const isEvent = report.type === 'event';
  const isDaily = report.type === 'daily';

  // Choose icon based on category
  const renderCategoryIcon = () => {
    switch (report.category) {
      case 'flood':
        return <Waves className="w-4 h-4 text-blue-400" />;
      case 'wildfire':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'bakery_food':
        return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'sports_recreation':
        return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'community_gathering':
      case 'volunteer':
        return <Calendar className="w-4 h-4 text-purple-400" />;
      default:
        return isEmergency ? (
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        ) : (
          <MapPin className="w-4 h-4 text-cyan-400" />
        );
    }
  };

  // Severity styling
  const getSeverityBadge = () => {
    switch (report.severity) {
      case 'critical':
        return (
          <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            Critical Emergency
          </span>
        );
      case 'warning':
        return (
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
            Hazard Alert
          </span>
        );
      case 'positive':
        return (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
            Community Event
          </span>
        );
      default:
        return (
          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full">
            Daily Live Update
          </span>
        );
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div
      onClick={() => onSelect(report)}
      className={`group cursor-pointer rounded-2xl transition-all duration-200 border bg-slate-800/80 hover:bg-slate-800 text-slate-100 p-4 sm:p-5 shadow-lg hover:shadow-xl flex flex-col justify-between ${
        report.severity === 'critical'
          ? 'border-red-500/50 hover:border-red-400/80 shadow-red-950/20'
          : isEvent
          ? 'border-purple-500/30 hover:border-purple-400/60'
          : 'border-slate-700/80 hover:border-slate-600'
      }`}
    >
      <div>
        {/* Top Badges & Meta */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {getSeverityBadge()}
            {report.distanceKm !== undefined && (
              <span className="text-[11px] font-semibold text-rose-300/90 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-400" />
                {report.distanceKm} km away
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3" />
            {timeAgo(report.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-amber-300 transition-colors line-clamp-2 mb-2 flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 p-1 rounded-md bg-slate-700/60 border border-slate-600/50">
            {renderCategoryIcon()}
          </span>
          <span>{report.title}</span>
        </h3>

        {/* Description snippet */}
        <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 mb-3 leading-relaxed">
          {report.description}
        </p>

        {/* Image Preview if available */}
        {report.imageUrl && (
          <div className="mb-3 rounded-xl overflow-hidden max-h-40 w-full relative bg-slate-900 border border-slate-700/60">
            <img
              src={report.imageUrl}
              alt={report.title}
              className="w-full h-36 object-cover object-center group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        {/* Event Details Card snippet */}
        {isEvent && report.eventDetails && (
          <div className="mb-3 p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-purple-200">
                {report.eventDetails.date}
              </div>
              <div className="text-[11px] text-purple-300/80">
                {report.eventDetails.locationVenue || report.locationName}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-purple-300 flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5" />
                {report.eventDetails.attendeesCount} going
              </span>
              {onRsvp && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRsvp(report.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    report.eventDetails.userRsvp
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-900/50 text-purple-200 border border-purple-700/60 hover:bg-purple-800'
                  }`}
                >
                  {report.eventDetails.userRsvp ? 'Going ✓' : 'RSVP'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Location Name */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="truncate">{report.locationName}</span>
        </div>
      </div>

      {/* Card Footer: Author & Social Actions */}
      <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="font-medium text-slate-300 truncate">{report.author.name}</span>
          {report.author.isVerifiedResident && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40 flex-shrink-0">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Verified
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-300">
          {/* Verification / Upvote button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onVote(report.id, 'up');
            }}
            className="flex items-center gap-1 hover:text-amber-400 transition-colors p-1"
            title="Verify this situation"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="font-semibold">{report.verificationsCount}</span>
          </button>

          {/* Comments count */}
          <span className="flex items-center gap-1 text-slate-400">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{report.commentsCount}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
