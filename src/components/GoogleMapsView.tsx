import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { UserLocation, ReportItem } from '../types';
import { MapPin, AlertTriangle, ExternalLink } from 'lucide-react';

interface GoogleMapsViewProps {
  userLocation: UserLocation;
  reports: ReportItem[];
  radiusKm: number;
  onSelectReport: (report: ReportItem) => void;
  onMapClickReport?: (coords: { lat: number; lng: number }) => void;
}

// Map Camera Controller to re-center when userLocation changes
function MapCameraController({ userLocation }: { userLocation: UserLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
  }, [map, userLocation]);

  return null;
}

export const GoogleMapsView: React.FC<GoogleMapsViewProps> = ({
  userLocation,
  reports,
  radiusKm,
  onSelectReport,
  onMapClickReport,
}) => {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  const [selectedMarkerReport, setSelectedMarkerReport] = useState<ReportItem | null>(null);

  if (!apiKey) {
    return (
      <div className="h-[480px] w-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <MapPin className="w-10 h-10 text-amber-400 animate-bounce" />
        <h3 className="font-bold text-white text-base">Google Maps API Key Required</h3>
        <p className="text-xs text-slate-400 max-w-md">
          Please add your Google Maps API key in the environment variables as{' '}
          <code className="text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
      <APIProvider apiKey={apiKey}>
        <Map
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={{ lat: userLocation.lat, lng: userLocation.lng }}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI={false}
          colorScheme="DARK"
          style={{ width: '100%', height: '100%' }}
          onClick={(e) => {
            if (e.detail.latLng && onMapClickReport) {
              onMapClickReport({
                lat: e.detail.latLng.lat,
                lng: e.detail.latLng.lng,
              });
            }
          }}
        >
          <MapCameraController userLocation={userLocation} />

          {/* User Location Marker */}
          <AdvancedMarker
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            title="Your Location"
          >
            <div className="relative flex items-center justify-center w-8 h-8">
              <div className="absolute w-8 h-8 rounded-full bg-cyan-400/40 animate-ping"></div>
              <div className="relative w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg"></div>
            </div>
          </AdvancedMarker>

          {/* Incident & Situation Markers */}
          {reports.map((report) => {
            let markerColor = 'bg-slate-700 text-white';
            let iconSymbol = '📍';

            if (report.category === 'flood') {
              markerColor = 'bg-blue-600 text-white shadow-blue-500/50';
              iconSymbol = '🌊';
            } else if (report.category === 'wildfire') {
              markerColor = 'bg-orange-600 text-white shadow-orange-500/50';
              iconSymbol = '🔥';
            } else if (report.category === 'bakery_food') {
              markerColor = 'bg-amber-600 text-white shadow-amber-500/50';
              iconSymbol = '🥐';
            } else if (report.category === 'sports_recreation') {
              markerColor = 'bg-emerald-600 text-white shadow-emerald-500/50';
              iconSymbol = '🏸';
            } else if (report.type === 'event') {
              markerColor = 'bg-purple-600 text-white shadow-purple-500/50';
              iconSymbol = '🎉';
            } else if (report.severity === 'critical') {
              markerColor = 'bg-red-600 text-white shadow-red-500/50 animate-bounce';
              iconSymbol = '⚠️';
            }

            return (
              <AdvancedMarker
                key={report.id}
                position={{ lat: report.coordinates.lat, lng: report.coordinates.lng }}
                title={report.title}
                onClick={() => {
                  setSelectedMarkerReport(report);
                  onSelectReport(report);
                }}
              >
                <div className="relative cursor-pointer transition-transform hover:scale-125">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/90 ${markerColor} text-base`}
                  >
                    {iconSymbol}
                  </div>
                  {report.severity === 'critical' && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white animate-ping" />
                  )}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Info Window on marker click */}
          {selectedMarkerReport && (
            <InfoWindow
              position={{
                lat: selectedMarkerReport.coordinates.lat,
                lng: selectedMarkerReport.coordinates.lng,
              }}
              onCloseClick={() => setSelectedMarkerReport(null)}
            >
              <div className="p-1 max-w-[220px] text-slate-900 font-sans text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300">
                  {selectedMarkerReport.type}
                </span>
                <h4 className="font-bold text-sm text-slate-950 mt-1 line-clamp-2">
                  {selectedMarkerReport.title}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                  {selectedMarkerReport.description}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500">
                    {selectedMarkerReport.locationName}
                  </span>
                  <button
                    onClick={() => {
                      onSelectReport(selectedMarkerReport);
                      setSelectedMarkerReport(null);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded text-[11px] font-bold transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Floating Header Banner */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 shadow-xl flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-white">Google Maps Connected:</span>
          <span className="text-slate-300">{reports.length} incidents plotted</span>
        </div>
      </div>
    </div>
  );
};
