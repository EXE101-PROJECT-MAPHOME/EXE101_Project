import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';

import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';
import { RentalProperty, LandlordProfile } from './types';
import { SearchLocation } from './SearchByWorkplace';
import { Button } from '@/app/components/ui/button';
import { Layers, Navigation, Globe } from 'lucide-react';
import { getGoongStyleUrl, getGoongAttribution, GoongMapStyle, GOONG_MAP_STYLES, GOONG_MAPTILES_KEY, getGoongTransformRequest } from '@/app/utils/goongApi';

interface RentalMapViewProps {
  properties: RentalProperty[];
  selectedProperty: RentalProperty | null;
  onPropertySelect: (property: RentalProperty) => void;
  searchLocations?: SearchLocation[];
  searchRadius?: number; // in km
  searchCenter?: [number, number];
}

// Regular property icon (no pin)
const createPropertyIcon = (available: boolean, isVerified: boolean = false) => {
  const color = available ? '#059669' : '#9ca3af';
  const el = document.createElement('div');
  el.className = 'custom-marker';
  el.style.width = '32px';
  el.style.height = '32px';
  
  const verifiedBadge = isVerified
    ? `<div style="position: absolute; top: -4px; right: -4px; background: linear-gradient(135deg, #10b981, #059669); width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 8px rgba(6,78,59,0.3); display: flex; align-items: center; justify-content: center; z-index: 10;">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
      </div>`
    : '';

  el.innerHTML = `
    <div style="position: relative;">
      ${verifiedBadge}
      <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 6px 12px rgba(6,78,59,0.2); display: flex; align-items: center; justify-content: center; opacity: 0.95;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
      </div>
    </div>
  `;
  return el;
};

// Landlord-pinned property icon
const createPinnedPropertyIcon = (available: boolean) => {
  const gradient = available
    ? 'linear-gradient(135deg, #059669, #064e3b)'
    : 'linear-gradient(135deg, #f97316, #ea580c)';
  const glowColor = available ? 'rgba(5,150,105,0.4)' : 'rgba(249,115,22,0.4)';
  
  const el = document.createElement('div');
  el.className = 'pinned-marker';
  el.style.width = '42px';
  el.style.height = '42px';

  el.innerHTML = `
    <div style="position: relative;">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 64px; height: 64px; border-radius: 50%; background: ${glowColor}; animation: pin-glow 2s infinite;"></div>
      <div style="background: ${gradient}; width: 42px; height: 42px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 8px 16px rgba(6,78,59,0.3); display: flex; align-items: center; justify-content: center; position: relative; z-index: 2;">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    </div>
    <style>
      @keyframes pin-glow {
        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
      }
    </style>
  `;
  return el;
};

const createUserLocationIcon = () => {
  const el = document.createElement('div');
  el.className = 'user-location-marker';
  el.innerHTML = `
    <div style="position: relative;">
      <div style="background-color: #10b981; width: 44px; height: 44px; border-radius: 50%; border: 4px solid white; box-shadow: 0 8px 16px rgba(6,78,59,0.4); display: flex; align-items: center; justify-content: center; animation: pulse-aura 2.5s infinite ease-out; z-index: 10; position: relative;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90px; height: 90px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.15); border: 2px solid rgba(16, 185, 129, 0.3); animation: ripple-aura 2.5s infinite cubic-bezier(0.4, 0, 0.2, 1);"></div>
    </div>
  `;
  return el;
};

export function RentalMapView({ properties, selectedProperty, onPropertySelect, searchLocations, searchRadius = 1, searchCenter }: RentalMapViewProps) {
  const mapRef = useRef<goongjs.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<goongjs.Marker[]>([]);
  const searchMarkersRef = useRef<goongjs.Marker[]>([]);
  const userMarkerRef = useRef<goongjs.Marker | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [mapStyle, setMapStyle] = useState<GoongMapStyle>('light');
  const [showStyleSwitcher, setShowStyleSwitcher] = useState(false);
  
  const legendX = useMotionValue(16);
  const legendY = useMotionValue(16);

  const defaultCenter: [number, number] = [10.7769, 106.7009];
  const effectiveCenter = searchCenter || defaultCenter;

  // 1. Initialize Map (One-time)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    goongjs.accessToken = GOONG_MAPTILES_KEY;
    const styleUrl = getGoongStyleUrl(mapStyle);
    
    const map = new goongjs.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [effectiveCenter[1], effectiveCenter[0]], // searchCenter is [lat, lng], so map to [lng, lat]
      zoom: 13,
      attributionControl: false,
      transformRequest: getGoongTransformRequest
    });

    // Handle map style errors (e.g., invalid layer references)
    map.on('error', (error) => {
      if (error.error && error.error.message && error.error.message.includes('Source layer')) {
        console.warn('[RentalMapView] Map style layer error (non-critical):', error.error.message);
        // Ignore this error as it doesn't prevent map functionality
      } else {
        console.error('[RentalMapView] Map error:', error);
      }
    });

    // Disable built-in controls (we have custom ones below)
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Sync Properties and Search Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    searchMarkersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    searchMarkersRef.current = [];

    // Add Property Markers
    console.log('RentalMapView rendering properties:', properties.length, properties);
    properties.forEach((property) => {
      console.log('Adding marker for property:', property.name, 'location:', property.location, 'available:', property.available);
      const isPinned = !!property.pinInfo;
      const isVerified = property.greenBadge?.level === 'verified' || property.verificationLevel === 'verified';
      const el = isPinned
        ? createPinnedPropertyIcon(property.available)
        : createPropertyIcon(property.available, isVerified);

      const marker = new goongjs.Marker(el)
        .setLngLat([property.location[0], property.location[1]]) // Use [lng, lat] directly from backend
        .addTo(map);

      const pinBadgeHtml = isPinned
        ? `<div style="display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 4px 10px; border-radius: 12px; margin-bottom: 8px; border: 1px solid #f59e0b;">
             <span style="font-size: 12px;">📌</span>
             <span style="font-size: 11px; font-weight: 600; color: #92400e;">Chủ trọ đã ghim GPS</span>
           </div>`
        : '';

      const popupContent = `
        <div style="min-width: 220px; max-width: 280px; font-family: sans-serif; padding: 5px;">
          ${pinBadgeHtml}
          <img src="${property.image}" alt="${property.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600;">${property.name}</h3>
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #666;">${property.address}</p>
          <p style="margin: 0 0 4px 0; font-size: 18px; font-weight: 700; color: #2563eb;">${property.price.toLocaleString('vi-VN')}đ/tháng</p>
          <div style="display: flex; gap: 6px; font-size: 12px; color: #6b7280; margin-bottom: 4px;">
            <span>📐 ${property.area}m²</span>
            <span>${property.available ? '🟢 Còn' : '🔴 Hết'} phòng</span>
          </div>
          <button
            onclick="window.location.href='/room/${property.id}'"
            style="margin-top: 10px; width: 100%; padding: 8px 16px; background: ${isPinned ? 'linear-gradient(135deg, #10b981, #059669)' : '#2563eb'}; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;"
          >
            Xem chi tiết
          </button>
        </div>
      `;

      marker.setPopup(new goongjs.Popup({ offset: 25 }).setHTML(popupContent));
      el.addEventListener('click', () => onPropertySelect(property));
      markersRef.current.push(marker);
    });

    // Add Search Locations
    if (searchLocations) {
      searchLocations.forEach((loc, index) => {
        const el = document.createElement('div');
        el.innerHTML = `<div style="background-color: #f59e0b; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 16px;">${index+1}</div>`;
        const marker = new goongjs.Marker(el)
          .setLngLat([loc.coordinates[1], loc.coordinates[0]]) // search location is [lat, lng]
          .addTo(map);
        
        marker.setPopup(new goongjs.Popup({ offset: 18 }).setHTML(`
          <div style="padding: 5px; font-family: sans-serif;">
            <p style="margin: 0; font-weight: bold; color: #f59e0b;">Địa điểm ${index+1}</p>
            <p style="margin: 2px 0 0 0; font-size: 12px;">${loc.name}</p>
          </div>
        `));
        searchMarkersRef.current.push(marker);
      });
    }

    // Sync User Marker
    if (!userMarkerRef.current) {
      userMarkerRef.current = new goongjs.Marker(createUserLocationIcon())
        .setLngLat([effectiveCenter[1], effectiveCenter[0]])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([effectiveCenter[1], effectiveCenter[0]]);
    }

  }, [properties, searchLocations, effectiveCenter]);

  // Track the style that is actually loaded to avoid redundant setStyle calls
  const loadedStyleRef = useRef<string>(mapStyle);

  // 3. Auto-fly when searchCenter changes (e.g. user selects autocomplete address)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !searchCenter) return;
    
    map.flyTo({
      center: [searchCenter[1], searchCenter[0]], // [lng, lat]
      zoom: 14,
      duration: 1200,
      essential: true
    });
  }, [searchCenter]);

  // 4. Style Updates
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Only update if the style has changed from what we last set
    if (loadedStyleRef.current !== mapStyle) {
      const newStyleUrl = getGoongStyleUrl(mapStyle);
      mapRef.current.setStyle(newStyleUrl);
      loadedStyleRef.current = mapStyle;
    }
  }, [mapStyle]);

  // 4. Selection Updates
  useEffect(() => {
    if (selectedProperty && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedProperty.location[0], selectedProperty.location[1]],
        zoom: 15
      });
    }
  }, [selectedProperty]);

  const handleCenterOnUser = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [effectiveCenter[1], effectiveCenter[0]], zoom: 15 });
      userMarkerRef.current?.togglePopup();
    }
  };

  const pinnedCount = properties.filter(p => p.pinInfo).length;
  const regularCount = properties.length - pinnedCount;

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full rounded-lg" />

      {/* Legend */}
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={mapContainerRef}
        style={{ x: legendX, y: legendY, position: 'absolute', top: 0, left: 0 }}
        animate={{ opacity: showLegend ? 1 : 0, scale: showLegend ? 1 : 0.9 }}
        className="z-20 w-[220px] rounded-2xl overflow-hidden shadow-2xl bg-emerald-950/90 text-white backdrop-blur-md border border-emerald-800/30"
      >
        <div className="p-4 flex items-center justify-between border-b border-emerald-800/30">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Chú thích</span>
          <button onClick={() => setShowLegend(false)} className="text-white/40 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-800" />
            <div className="text-xs font-bold">Đã ghim vị trí ({pinnedCount})</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-900 border border-emerald-700/50 flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            </div>
            <div className="text-xs font-bold">Chưa ghim vị trí ({regularCount})</div>
          </div>
        </div>
      </motion.div>

      {/* My Location FAB */}
      <button 
        onClick={handleCenterOnUser}
        className="absolute top-8 right-8 z-10 size-14 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-emerald-500 transition-colors"
      >
        <Navigation className="size-6" />
      </button>

      {/* Style Switcher FAB */}
      <div className="absolute top-28 right-8 z-10 flex flex-col items-end gap-2">
        <AnimatePresence>
          {showStyleSwitcher && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-emerald-950/90 p-2 rounded-xl border border-emerald-800/50">
              {(Object.keys(GOONG_MAP_STYLES) as GoongMapStyle[]).map(s => (
                <button key={s} onClick={() => { setMapStyle(s); setShowStyleSwitcher(false); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg w-full ${mapStyle === s ? 'bg-emerald-500' : 'hover:bg-white/10'}`}>
                  <span className="text-xs font-bold line-clamp-1">{GOONG_MAP_STYLES[s].label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setShowStyleSwitcher(!showStyleSwitcher)} className="size-14 bg-emerald-950/90 text-emerald-400 rounded-2xl shadow-lg flex items-center justify-center border border-emerald-800/50">
          <Layers className="size-6" />
        </button>
      </div>
    </div>
  );
}