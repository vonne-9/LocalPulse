import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { UserLocation, ReportItem } from '../types';

interface LeafletMapProps {
  userLocation: UserLocation;
  reports: ReportItem[];
  radiusKm: number;
  onSelectReport: (report: ReportItem) => void;
  onMapClickReport?: (coords: { lat: number; lng: number }) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  userLocation,
  reports,
  radiusKm,
  onSelectReport,
  onMapClickReport,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 13,
        zoomControl: false,
      });

      // Dark theme map tiles from CartoDB Dark Matter
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);

      // Map click handler for dropping a report pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClickReport) {
          onMapClickReport({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });
    }

    return () => {
      // Clean up on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center & radar radius when userLocation or radiusKm changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([userLocation.lat, userLocation.lng], map.getZoom());

    // Update radius circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
    }

    radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
      radius: radiusKm * 1000,
      color: '#f43f5e',
      fillColor: '#f43f5e',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '4, 8',
    }).addTo(map);
  }, [userLocation, radiusKm]);

  // Update markers when reports change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 1. User Location Pulse Marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full bg-cyan-500/30 animate-ping"></div>
          <div class="relative w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .bindPopup(`
        <div class="text-xs p-1 font-sans">
          <strong class="text-cyan-600 block text-sm">You are here</strong>
          <span>${userLocation.name}</span>
          <div class="text-[10px] text-gray-500 mt-1">Alert radar active (${radiusKm} km)</div>
        </div>
      `);
    markersLayer.addLayer(userMarker);

    // 2. Incident & Daily & Event Markers
    reports.forEach((report) => {
      let iconColor = 'bg-slate-700 text-white';
      let iconSymbol = '📍';

      if (report.category === 'flood') {
        iconColor = 'bg-blue-600 text-white shadow-blue-500/50';
        iconSymbol = '🌊';
      } else if (report.category === 'wildfire') {
        iconColor = 'bg-orange-600 text-white shadow-orange-500/50';
        iconSymbol = '🔥';
      } else if (report.category === 'bakery_food') {
        iconColor = 'bg-amber-600 text-white shadow-amber-500/50';
        iconSymbol = '🥐';
      } else if (report.category === 'sports_recreation') {
        iconColor = 'bg-emerald-600 text-white shadow-emerald-500/50';
        iconSymbol = '🏸';
      } else if (report.type === 'event') {
        iconColor = 'bg-purple-600 text-white shadow-purple-500/50';
        iconSymbol = '🎉';
      } else if (report.severity === 'critical') {
        iconColor = 'bg-red-600 text-white shadow-red-500/50 animate-bounce';
        iconSymbol = '⚠️';
      }

      const reportIcon = L.divIcon({
        className: 'custom-report-marker',
        html: `
          <div class="relative cursor-pointer transition-transform hover:scale-125">
            <div class="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/80 ${iconColor} text-base">
              ${iconSymbol}
            </div>
            ${
              report.severity === 'critical'
                ? '<div class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white animate-ping"></div>'
                : ''
            }
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([report.coordinates.lat, report.coordinates.lng], { icon: reportIcon });

      // Click to open detailed modal
      marker.on('click', () => {
        onSelectReport(report);
      });

      markersLayer.addLayer(marker);
    });
  }, [reports, userLocation, onSelectReport]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 14);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Overlay Controls */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 shadow-xl flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span className="font-bold">Live Radar Active:</span>
          <span className="text-slate-400">{reports.length} incidents in view</span>
        </div>

        <div className="hidden sm:flex bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-xl p-2 text-[11px] text-slate-300 shadow-xl flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span>🌊 Flash Flood</span>
            <span>•</span>
            <span>🔥 Wildfire</span>
            <span>•</span>
            <span>🥐 Pastry Out</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>🏸 Badminton Full</span>
            <span>•</span>
            <span>🎉 Event</span>
            <span>•</span>
            <span className="text-cyan-400">📍 Click map to report</span>
          </div>
        </div>
      </div>

      {/* Recenter Button */}
      <button
        type="button"
        onClick={handleRecenter}
        className="absolute bottom-4 right-4 z-[400] bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold shadow-xl flex items-center gap-1.5 transition-all active:scale-95"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
        <span>Recenter Radar</span>
      </button>
    </div>
  );
};
