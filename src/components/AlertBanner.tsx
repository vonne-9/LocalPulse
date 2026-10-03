import React from 'react';
import { AlertTriangle, Flame, Waves, ArrowRight, X } from 'lucide-react';
import { ReportItem } from '../types';

interface AlertBannerProps {
  criticalAlerts: ReportItem[];
  onSelectAlert: (alert: ReportItem) => void;
  onDismiss: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  criticalAlerts,
  onSelectAlert,
  onDismiss,
}) => {
  if (criticalAlerts.length === 0) return null;

  const topAlert = criticalAlerts[0];
  const isFlood = topAlert.category === 'flood';
  const isFire = topAlert.category === 'wildfire';

  return (
    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg border-b border-red-500/40 relative z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
            {isFlood ? (
              <Waves className="w-5 h-5 text-white" />
            ) : isFire ? (
              <Flame className="w-5 h-5 text-amber-200" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            )}
          </div>
          <div className="truncate">
            <span className="font-extrabold uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded text-xs mr-2">
              EMERGENCY WARNING
            </span>
            <span className="font-bold">{topAlert.title}</span>
            <span className="hidden md:inline text-white/90 text-xs ml-2">
              — {topAlert.locationName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onSelectAlert(topAlert)}
            className="flex items-center gap-1.5 bg-white text-red-700 hover:bg-red-50 font-semibold px-3 py-1 rounded-full text-xs shadow-sm transition-all"
          >
            <span>Live Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDismiss}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
            title="Dismiss top banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
