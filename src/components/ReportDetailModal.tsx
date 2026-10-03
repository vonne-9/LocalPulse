import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  MessageSquare,
  Send,
  AlertTriangle,
  Flame,
  Waves,
  Coffee,
  Trophy,
  Calendar,
  Share2,
  ExternalLink,
  ShieldCheck,
  Check,
  Users,
} from 'lucide-react';
import { ReportItem } from '../types';

interface ReportDetailModalProps {
  report: ReportItem | null;
  onClose: () => void;
  onVote: (id: string, type: 'up' | 'down') => void;
  onAddComment: (reportId: string, text: string, author?: string) => Promise<void>;
  onRsvp?: (id: string) => void;
  onResolve?: (id: string) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onVote,
  onAddComment,
  onRsvp,
  onResolve,
}) => {
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!report) return null;

  const isEmergency = report.type === 'emergency';
  const isEvent = report.type === 'event';

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(report.id, commentText.trim(), commentAuthor.trim() || undefined);
      setCommentText('');
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(
      `[LocalPulse Alert] ${report.title} - ${report.locationName}`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                report.severity === 'critical'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                  : report.severity === 'warning'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : isEvent
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {report.type.toUpperCase()} • {report.category.replace('_', ' ').toUpperCase()}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                report.status === 'resolved'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              Status: {report.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
              title="Copy share link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Title & Image */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight">
              {report.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                {report.locationName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Reported {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {report.distanceKm !== undefined && (
                <>
                  <span>•</span>
                  <span className="text-rose-300 font-semibold">
                    {report.distanceKm} km from you
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Image Banner if available */}
          {report.imageUrl && (
            <div className="rounded-2xl overflow-hidden max-h-72 border border-slate-700/60 shadow-lg relative">
              <img
                src={report.imageUrl}
                alt={report.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Description */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/70 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {report.description}
          </div>

          {/* Event Card Details if Event */}
          {isEvent && report.eventDetails && (
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider font-bold text-purple-300 mb-1">
                  Community Event Schedule
                </div>
                <div className="text-base font-bold text-white">
                  {report.eventDetails.date}
                </div>
                <div className="text-xs text-purple-200/80">
                  Venue: {report.eventDetails.locationVenue || report.locationName}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center px-3 py-1.5 rounded-lg bg-purple-900/60 border border-purple-700/50">
                  <div className="text-sm font-black text-purple-200">
                    {report.eventDetails.attendeesCount}
                  </div>
                  <div className="text-[10px] text-purple-300">Neighbors Going</div>
                </div>

                {onRsvp && (
                  <button
                    onClick={() => onRsvp(report.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                      report.eventDetails.userRsvp
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-500 hover:bg-purple-400 text-white'
                    }`}
                  >
                    {report.eventDetails.userRsvp ? 'Going (Cancel RSVP)' : 'RSVP to Attend'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Grounded Places with Google Maps link citations if available */}
          {report.groundedPlaces && report.groundedPlaces.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Verified Google Maps Locations
              </h4>
              <div className="space-y-2">
                {report.groundedPlaces.map((pl, idx) => (
                  <a
                    key={idx}
                    href={pl.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/70 hover:bg-slate-900 border border-slate-700/70 text-xs text-slate-200 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-rose-300">{pl.title}</div>
                      {pl.address && (
                        <div className="text-[11px] text-slate-400">{pl.address}</div>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Verification & Resident Action Bar */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">{report.verificationsCount}</span>
                <span>neighbors verified</span>
              </div>
              <button
                onClick={() => onVote(report.id, 'up')}
                className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-all active:scale-95"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verify / I'm here</span>
              </button>
            </div>

            {report.status !== 'resolved' && onResolve && (
              <button
                onClick={() => onResolve(report.id)}
                className="text-slate-400 hover:text-emerald-400 px-2 py-1 rounded hover:bg-slate-700/50 text-[11px] font-medium transition-colors"
              >
                Mark as Resolved ✓
              </button>
            )}
          </div>

          {/* Live Situation Comments & Resident Updates */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-400" />
              <span>Real-Time Citizen & Agency Updates ({report.comments.length})</span>
            </h3>

            {/* Comment List */}
            <div className="space-y-2.5 mb-4 max-h-56 overflow-y-auto pr-1">
              {report.comments.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-800/40 rounded-xl text-center">
                  No comments yet. Are you nearby? Post a real-time status update below!
                </p>
              ) : (
                report.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl text-xs border ${
                      c.isAuthority
                        ? 'bg-rose-950/20 border-rose-800/50 text-rose-100'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={c.isAuthority ? 'text-amber-400' : 'text-slate-300'}>
                          {c.author}
                        </span>
                        {c.isAuthority && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                            Verified Authority
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="leading-relaxed">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleCommentSubmit} className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Your Name (e.g. Neighbor on 4th)"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 placeholder-slate-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Share live situation update..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="sm:col-span-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 placeholder-slate-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs shadow disabled:opacity-50 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Live Update</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
