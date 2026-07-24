import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import goongjs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";
import { RentalProperty, LandlordProfile } from "./types";
import { SearchLocation } from "./SearchByWorkplace";
import { Button } from "@/app/components/ui/button";
import { Layers, Navigation, Globe, Info, Clock } from "lucide-react";
import {
  getGoongStyleUrl,
  getGoongAttribution,
  GoongMapStyle,
  GOONG_MAP_STYLES,
  GOONG_MAPTILES_KEY,
  getGoongTransformRequest,
  autocompletePlaces,
  geocodeByPlaceId
} from "@/app/utils/goongApi";

interface RentalMapViewProps {
  properties: RentalProperty[];
  selectedProperty: RentalProperty | null;
  onPropertySelect: (property: RentalProperty | null) => void;
  searchLocations?: SearchLocation[];
  searchRadius?: number; // in km
  searchCenter?: [number, number];
  // Optional: when recenterKey changes, map will fly to recenterLocation
  recenterLocation?: [number, number];
  recenterKey?: number;
}

// Regular property icon (no pin)
const createPropertyIcon = (
  available: boolean,
  isVerified: boolean = false,
) => {
  const color = available ? "#059669" : "#9ca3af";
  const el = document.createElement("div");
  el.className = "custom-marker";
  el.style.width = "32px";
  el.style.height = "32px";

  const verifiedBadge = isVerified
    ? `<div style="position: absolute; top: -4px; right: -4px; background: linear-gradient(135deg, #10b981, #059669); width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 8px rgba(6,78,59,0.3); display: flex; align-items: center; justify-content: center; z-index: 10;">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
      </div>`
    : "";

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
    ? "linear-gradient(135deg, #059669, #064e3b)"
    : "linear-gradient(135deg, #f97316, #ea580c)";
  const glowColor = available ? "rgba(5,150,105,0.4)" : "rgba(249,115,22,0.4)";

  const el = document.createElement("div");
  el.className = "pinned-marker";
  el.style.width = "42px";
  el.style.height = "42px";

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
  const el = document.createElement("div");
  el.className = "user-location-marker";
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

export function RentalMapView({
  properties,
  selectedProperty,
  onPropertySelect,
  searchLocations,
  searchRadius = 1,
  searchCenter,
  recenterLocation,
  recenterKey,
}: RentalMapViewProps) {
  const mapRef = useRef<goongjs.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<goongjs.Marker[]>([]);
  const searchMarkersRef = useRef<goongjs.Marker[]>([]);
  const userMarkerRef = useRef<goongjs.Marker | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [mapStyle, setMapStyle] = useState<GoongMapStyle>("light");
  const [showStyleSwitcher, setShowStyleSwitcher] = useState(false);
  const [isochronePolygon, setIsochronePolygon] = useState<any>(null);
  const [isLoadingIsochrone, setIsLoadingIsochrone] = useState(false);
  const [isochroneMinutes, setIsochroneMinutes] = useState(15);
  const [isochroneProperties, setIsochroneProperties] = useState<RentalProperty[] | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeStats, setRouteStats] = useState<{distance: number, durationDriving: number, durationWalking?: number, durationCycling?: number, destinationName: string} | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Use either isochrone filtered properties or default properties
  const displayProperties = isochroneProperties || properties;

  // Sync Legend show state on window resize (Web vs Mobile mode transition)
  useEffect(() => {
    const handleResize = () => {
      setShowLegend(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const defaultCenter: [number, number] = [10.7769, 106.7009];
  const effectiveCenter = searchCenter || defaultCenter;

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  const BACKEND_URL = import.meta.env.VITE_USE_LOCAL_BACKEND === "true" 
    ? (import.meta.env.VITE_LOCAL_BACKEND_URL || "http://localhost:5000") 
    : import.meta.env.VITE_API_BASE;

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
      transformRequest: getGoongTransformRequest,
    });

    // Handle map style errors (e.g., invalid layer references)
    map.on("error", (error) => {
      if (
        error.error &&
        error.error.message &&
        error.error.message.includes("Source layer")
      ) {
        console.warn(
          "[RentalMapView] Map style layer error (non-critical):",
          error.error.message,
        );
        // Ignore this error as it doesn't prevent map functionality
      } else {
        console.error("[RentalMapView] Map error:", error);
      }
    });

    // Disable built-in controls (we have custom ones below)
    mapRef.current = map;

    // Add map click listener to deselect property
    map.on("click", () => {
      onPropertySelect(null);
    });

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
    markersRef.current.forEach((m) => m.remove());
    searchMarkersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    searchMarkersRef.current = [];

    // Add Property Markers
    console.log(
      "RentalMapView rendering properties:",
      displayProperties.length,
      displayProperties,
    );
    displayProperties.forEach((property) => {
      console.log(
        "Adding marker for property:",
        property.name,
        "location:",
        property.location,
        "available:",
        property.available,
      );
      const isPinned = !!property.pinInfo;
      const isVerified =
        property.greenBadge?.level === "verified" ||
        property.verificationLevel === "verified";
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
        : "";

      const popupContent = `
        <div style="min-width: 220px; max-width: 280px; font-family: sans-serif; padding: 5px;">
          ${pinBadgeHtml}
          <img src="${property.image}" alt="${property.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600;">${property.name}</h3>
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #666;">${property.address}</p>
          <p style="margin: 0 0 4px 0; font-size: 18px; font-weight: 700; color: #2563eb;">${property.price.toLocaleString("vi-VN")}đ/tháng</p>
          <div style="display: flex; gap: 6px; font-size: 12px; color: #6b7280; margin-bottom: 4px;">
            <span>📐 ${property.area}m²</span>
            <span>${property.available ? "🟢 Còn" : "🔴 Hết"} phòng</span>
          </div>
          <button
            onclick="window.location.href='/room/${property.id}'"
            style="margin-top: 10px; width: 100%; padding: 8px 16px; background: ${isPinned ? "linear-gradient(135deg, #10b981, #059669)" : "#2563eb"}; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;"
          >
            Xem chi tiết
          </button>
        </div>
      `;

      marker.setPopup(new goongjs.Popup({ offset: 25 }).setHTML(popupContent));
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onPropertySelect(property);
      });
      markersRef.current.push(marker);
    });

    // Add Search Locations
    if (searchLocations) {
      searchLocations.forEach((loc, index) => {
        const el = document.createElement("div");
        el.innerHTML = `<div style="background-color: #f59e0b; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 16px;">${index + 1}</div>`;
        const marker = new goongjs.Marker(el)
          .setLngLat([loc.coordinates[1], loc.coordinates[0]]) // search location is [lat, lng]
          .addTo(map);

        marker.setPopup(
          new goongjs.Popup({ offset: 18 }).setHTML(`
          <div style="padding: 5px; font-family: sans-serif;">
            <p style="margin: 0; font-weight: bold; color: #f59e0b;">Địa điểm ${index + 1}</p>
            <p style="margin: 2px 0 0 0; font-size: 12px;">${loc.name}</p>
          </div>
        `),
        );
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
  }, [displayProperties, searchLocations, effectiveCenter]);

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
      essential: true,
    });
  }, [searchCenter]);

  // 3b. If parent requests a forced recenter (even when coords unchanged), fly to recenterLocation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !recenterLocation) return;

    console.log(
      "[RentalMapView] recenter effect fired, key=",
      recenterKey,
      "recenterLocation=",
      recenterLocation,
      "mapRef=",
      !!mapRef.current,
    );
    try {
      map.flyTo({
        center: [recenterLocation[1], recenterLocation[0]],
        zoom: 15,
        duration: 1000,
        essential: true,
      });
    } catch (err) {
      console.warn("[RentalMapView] forced recenter failed", err);
    }
  }, [recenterKey, recenterLocation]);

  // 4. Style Updates
  useEffect(() => {
    if (!mapRef.current) return;

    // Only update if the style has changed from what we last set
    if (loadedStyleRef.current !== mapStyle) {
      const newStyleUrl = getGoongStyleUrl(mapStyle);
      mapRef.current.setStyle(newStyleUrl);
      loadedStyleRef.current = mapStyle;
      
      // Need to re-add layers after style change if they exist
      if (isochronePolygon) {
        drawIsochrone(isochronePolygon);
      }
      if (routeData) {
        drawRoute(routeData);
      }
    }
  }, [mapStyle]);

  // 5. Draw Isochrone Polygon
  const drawIsochrone = (polygon: any) => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.isStyleLoaded()) {
      map.once("styledata", () => drawIsochrone(polygon));
      return;
    }
    
    // Remove if exists
    if (map.getLayer("isochrone-layer")) map.removeLayer("isochrone-layer");
    if (map.getLayer("isochrone-outline")) map.removeLayer("isochrone-outline");
    if (map.getSource("isochrone")) map.removeSource("isochrone");

    map.addSource("isochrone", {
      type: "geojson",
      data: polygon,
    });

    map.addLayer({
      id: "isochrone-layer",
      type: "fill",
      source: "isochrone",
      paint: {
        "fill-color": "#10b981", // Emerald 500
        "fill-opacity": 0.2,
      },
    });

    map.addLayer({
      id: "isochrone-outline",
      type: "line",
      source: "isochrone",
      paint: {
        "line-color": "#059669", // Emerald 600
        "line-width": 3,
        "line-dasharray": [2, 2],
      },
    });
  };

  useEffect(() => {
    if (isochronePolygon) {
      drawIsochrone(isochronePolygon);
    } else {
      const map = mapRef.current;
      if (map) {
        if (map.getLayer("isochrone-layer")) map.removeLayer("isochrone-layer");
        if (map.getLayer("isochrone-outline")) map.removeLayer("isochrone-outline");
        if (map.getSource("isochrone")) map.removeSource("isochrone");
      }
    }
  }, [isochronePolygon]);

  // Handle Fetch Isochrone
  const handleFetchIsochrone = async (customCenter?: [number, number], customMinutes?: number) => {
    // If no params and already active, turn it off
    if (!customCenter && !customMinutes && isochroneProperties) {
      setIsochronePolygon(null);
      setIsochroneProperties(null);
      setIsochroneMinutes(15);
      return;
    }

    if (!MAPBOX_TOKEN) {
      alert("Vui lòng cấu hình VITE_MAPBOX_TOKEN trong file .env!");
      return;
    }

    const centerToUse = customCenter || effectiveCenter;
    const minutesToUse = customMinutes || isochroneMinutes;

    setIsLoadingIsochrone(true);
    try {
      const lng = centerToUse[1];
      const lat = centerToUse[0];
      
      // 1. Fetch N-min driving polygon from Mapbox
      const mapboxUrl = `https://api.mapbox.com/isochrone/v1/mapbox/driving/${lng},${lat}?contours_minutes=${minutesToUse}&polygons=true&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(mapboxUrl);
      const data = await res.json();
      
      if (!data.features || data.features.length === 0) {
        throw new Error("Không lấy được vùng đẳng thời");
      }
      
      const polygonFeature = data.features[0];
      setIsochronePolygon(polygonFeature);
      setIsochroneMinutes(minutesToUse);

      // 2. Extract coordinates ring to send to backend
      const coordinates = polygonFeature.geometry.coordinates[0]; // Get outer ring
      
      const backendRes = await fetch(`${BACKEND_URL}/api/map/properties-in-polygon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ polygon: coordinates })
      });

      const backendData = await backendRes.json();
      if (backendData.success) {
        setIsochroneProperties(backendData.data);
      } else {
        alert("Có lỗi khi lấy danh sách phòng trọ từ server.");
      }

      // 3. Zoom map to fit polygon
      if (mapRef.current) {
        // Calculate bounding box rough estimate
        const lats = coordinates.map((c: number[]) => c[1]);
        const lngs = coordinates.map((c: number[]) => c[0]);
        const sw = [Math.min(...lngs), Math.min(...lats)];
        const ne = [Math.max(...lngs), Math.max(...lats)];
        mapRef.current.fitBounds([sw, ne] as any, { padding: 40 });
      }

    } catch (error) {
      console.error("Isochrone Error:", error);
      alert(`Đã xảy ra lỗi khi tính toán vùng ${minutesToUse} phút!`);
    } finally {
      setIsLoadingIsochrone(false);
    }
  };

  // Draw Route Line
  const drawRoute = (geojson: any) => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.isStyleLoaded()) {
      map.once("styledata", () => drawRoute(geojson));
      return;
    }
    
    if (map.getLayer("route-layer")) map.removeLayer("route-layer");
    if (map.getSource("route")) map.removeSource("route");

    map.addSource("route", {
      type: "geojson",
      data: geojson,
    });

    map.addLayer({
      id: "route-layer",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round"
      },
      paint: {
        "line-color": "#3b82f6", // Blue 500
        "line-width": 5,
        "line-opacity": 0.9
      }
    });
  };

  useEffect(() => {
    if (routeData) {
      drawRoute(routeData);
    } else {
      const map = mapRef.current;
      if (map) {
        if (map.getLayer("route-layer")) map.removeLayer("route-layer");
        if (map.getSource("route")) map.removeSource("route");
      }
    }
  }, [routeData]);

  const handleFetchRoute = async (destLat: number, destLng: number, destName: string) => {
    if (!MAPBOX_TOKEN) {
      alert("Vui lòng cấu hình VITE_MAPBOX_TOKEN trong file .env!");
      return;
    }

    setIsLoadingRoute(true);
    try {
      const startLng = effectiveCenter[1];
      const startLat = effectiveCenter[0];
      
      const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${destLng},${destLat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(mapboxUrl);
      const data = await res.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error("Không tìm thấy đường đi");
      }
      
      const route = data.routes[0];
      const routeGeoJSON = {
        type: "Feature",
        properties: {},
        geometry: route.geometry
      };
      
      // Fetch other modes silently
      let durationWalking = undefined;
      let durationCycling = undefined;
      try {
        const [walkRes, cycRes] = await Promise.all([
          fetch(`https://api.mapbox.com/directions/v5/mapbox/walking/${startLng},${startLat};${destLng},${destLat}?access_token=${MAPBOX_TOKEN}`),
          fetch(`https://api.mapbox.com/directions/v5/mapbox/cycling/${startLng},${startLat};${destLng},${destLat}?access_token=${MAPBOX_TOKEN}`)
        ]);
        const walkData = await walkRes.json();
        const cycData = await cycRes.json();
        durationWalking = walkData.routes?.[0]?.duration;
        durationCycling = cycData.routes?.[0]?.duration;
      } catch (e) {
        console.log("Failed to fetch other modes", e);
      }
      
      setRouteData(routeGeoJSON);
      setRouteStats({
        distance: route.distance, // in meters
        durationDriving: route.duration, // in seconds
        durationWalking,
        durationCycling,
        destinationName: destName
      });

      // Zoom to fit route
      if (mapRef.current) {
        const coordinates = route.geometry.coordinates;
        const lats = coordinates.map((c: number[]) => c[1]);
        const lngs = coordinates.map((c: number[]) => c[0]);
        const sw = [Math.min(...lngs), Math.min(...lats)];
        const ne = [Math.max(...lngs), Math.max(...lats)];
        mapRef.current.fitBounds([sw, ne] as any, { padding: 60 });
      }

    } catch (error) {
      console.error("Routing Error:", error);
      alert(`Đã xảy ra lỗi khi tìm đường!`);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // 6. Listen to AI Triggers
  useEffect(() => {
    const handleAITrigger = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { minutes, location } = customEvent.detail;
      
      if (location && location !== "") {
        setIsLoadingIsochrone(true);
        try {
          // Geocode location
          const predictions = await autocompletePlaces(location);
          if (predictions && predictions.length > 0) {
            const geo = await geocodeByPlaceId(predictions[0].place_id);
            if (geo) {
              const newCenter: [number, number] = [geo.lat, geo.lng];
              await handleFetchIsochrone(newCenter, minutes);
              return;
            }
          }
          alert(`AI không tìm thấy tọa độ của: ${location}`);
          setIsLoadingIsochrone(false);
        } catch (err) {
          console.error("Geocoding failed for AI trigger", err);
          setIsLoadingIsochrone(false);
        }
      } else {
        // Just use current center
        await handleFetchIsochrone(effectiveCenter, minutes);
      }
    };

    const handleRouteTrigger = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { location } = customEvent.detail;
      
      if (location && location !== "") {
        setIsLoadingRoute(true);
        try {
          // Geocode location
          const predictions = await autocompletePlaces(location);
          if (predictions && predictions.length > 0) {
            const geo = await geocodeByPlaceId(predictions[0].place_id);
            if (geo) {
              await handleFetchRoute(geo.lat, geo.lng, location);
              return;
            }
          }
          alert(`AI không tìm thấy tọa độ đích đến: ${location}`);
          setIsLoadingRoute(false);
        } catch (err) {
          console.error("Geocoding failed for AI Route trigger", err);
          setIsLoadingRoute(false);
        }
      }
    };

    window.addEventListener('AI_TRIGGER_ISOCHRONE', handleAITrigger);
    window.addEventListener('AI_TRIGGER_ROUTE', handleRouteTrigger);
    return () => {
      window.removeEventListener('AI_TRIGGER_ISOCHRONE', handleAITrigger);
      window.removeEventListener('AI_TRIGGER_ROUTE', handleRouteTrigger);
    };
  }, [effectiveCenter, handleFetchIsochrone]);

  // 7. Selection Updates
  useEffect(() => {
    if (selectedProperty && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedProperty.location[0], selectedProperty.location[1]],
        zoom: 15,
      });
    }
  }, [selectedProperty]);

  const handleCenterOnUser = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [effectiveCenter[1], effectiveCenter[0]],
        zoom: 15,
      });
      userMarkerRef.current?.togglePopup();
    }
  };

  const pinnedCount = properties.filter((p) => p.pinInfo).length;
  const regularCount = properties.length - pinnedCount;

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return <>{mins} <span className="text-sm font-medium">phút</span></>;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (remainingMins === 0) return <>{hours} <span className="text-sm font-medium">giờ</span></>;
    return <span className="text-base font-black">{hours} <span className="text-xs font-medium">giờ</span> {remainingMins} <span className="text-xs font-medium">phút</span></span>;
  };

  return (
    <div ref={parentRef} className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full rounded-lg" />

      {/* Legend Toggle Button / Legend Box */}
      <AnimatePresence mode="wait">
        {!showLegend ? (
          <motion.button
            key="legend-trigger"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setShowLegend(true)}
            className="absolute top-4 left-4 md:top-8 md:left-8 z-20 size-10 md:size-14 bg-emerald-950/90 text-emerald-400 border border-emerald-800/30 rounded-xl md:rounded-2xl shadow-xl flex items-center justify-center hover:bg-emerald-900 transition-colors backdrop-blur-md"
            title="Xem chú thích"
          >
            <Info className="size-5 md:size-6" />
          </motion.button>
        ) : (
          <motion.div
            key="legend-panel"
            drag
            dragMomentum={false}
            dragConstraints={parentRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-4 left-4 md:top-8 md:left-8 z-20 w-[220px] rounded-2xl overflow-hidden shadow-2xl bg-emerald-950/90 text-white backdrop-blur-md border border-emerald-800/30"
          >
            <div className="p-4 flex items-center justify-between border-b border-emerald-800/30">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                Chú thích
              </span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-white/40 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-800" />
                <div className="text-xs font-bold">
                  Đã ghim vị trí ({pinnedCount})
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-900 border border-emerald-700/50 flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                </div>
                <div className="text-xs font-bold">
                  Chưa ghim vị trí ({regularCount})
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Isochrone "15 Mins" FAB */}
      <button
        onClick={() => handleFetchIsochrone()}
        disabled={isLoadingIsochrone}
        className={`absolute top-4 right-20 md:top-8 md:right-28 z-10 h-10 md:h-14 px-4 font-bold text-white rounded-xl md:rounded-2xl shadow-lg flex items-center justify-center transition-all ${
          isochroneProperties 
            ? "bg-rose-500 hover:bg-rose-600" 
            : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400"
        } ${isLoadingIsochrone ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        <Clock className="size-5 md:size-6 mr-2" />
        {isLoadingIsochrone 
          ? "Đang vẽ vùng..." 
          : isochroneProperties 
            ? "Hủy tìm quanh tôi"
            : "Tìm trọ quanh tôi"}
      </button>

      {/* Route Info Panel */}
      <AnimatePresence>
        {routeStats && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-[210px] left-4 md:top-[240px] md:left-8 z-10 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-indigo-100 p-4 w-[280px]"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{routeStats.destinationName}</h4>
              <button 
                onClick={() => {
                  setRouteData(null);
                  setRouteStats(null);
                }}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-blue-50 rounded-xl p-2 flex flex-col items-center justify-center">
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-1">Quãng đường</span>
                <span className="text-blue-700 font-black text-lg">
                  {(routeStats.distance / 1000).toFixed(1)} <span className="text-sm font-medium">km</span>
                </span>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2 flex flex-col items-center justify-center">
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mb-1">🚗 Ô tô/Xe máy</span>
                <span className="text-emerald-700 font-black text-lg">
                  {formatDuration(routeStats.durationDriving)}
                </span>
              </div>
              {routeStats.durationWalking && (
                <div className="bg-orange-50 rounded-xl p-2 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-1">🚶 Đi bộ</span>
                  <span className="text-orange-700 font-black text-lg text-center leading-tight">
                    {formatDuration(routeStats.durationWalking)}
                  </span>
                </div>
              )}
              {routeStats.durationCycling && (
                <div className="bg-purple-50 rounded-xl p-2 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-purple-500 font-bold uppercase tracking-wider mb-1">🚲 Xe đạp</span>
                  <span className="text-purple-700 font-black text-lg text-center leading-tight">
                    {formatDuration(routeStats.durationCycling)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Location FAB */}
      <button
        onClick={handleCenterOnUser}
        className="absolute top-4 right-4 md:top-8 md:right-8 z-10 size-10 md:size-14 bg-emerald-600 text-white rounded-xl md:rounded-2xl shadow-lg flex items-center justify-center hover:bg-emerald-500 transition-colors"
      >
        <Navigation className="size-5 md:size-6" />
      </button>

      {/* Style Switcher FAB */}
      <div className="absolute top-16 right-4 md:top-28 md:right-8 z-10 flex flex-col items-end gap-2">
        <AnimatePresence>
          {showStyleSwitcher && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-emerald-950/90 p-2 rounded-xl border border-emerald-800/50"
            >
              {(Object.keys(GOONG_MAP_STYLES) as GoongMapStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setMapStyle(s);
                    setShowStyleSwitcher(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg w-full ${mapStyle === s ? "bg-emerald-500" : "hover:bg-white/10"}`}
                >
                  <span className="text-xs font-bold line-clamp-1">
                    {GOONG_MAP_STYLES[s].label}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setShowStyleSwitcher(!showStyleSwitcher)}
          className="size-10 md:size-14 bg-emerald-950/90 text-emerald-400 rounded-xl md:rounded-2xl shadow-lg flex items-center justify-center border border-emerald-800/50"
        >
          <Layers className="size-5 md:size-6" />
        </button>
      </div>
    </div>
  );
}
