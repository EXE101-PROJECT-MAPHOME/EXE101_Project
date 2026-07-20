import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useNavigate } from "react-router-dom";
import { RentalMapView } from "@/app/components/RentalMapView";
import { PropertyList } from "@/app/components/PropertyList";
import { PropertyCard } from "@/app/components/PropertyCard";
import { useProperties } from "@/app/contexts/useProperties";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  RentalProperty,
  RentalFilters,
  PropertyWithDistance,
} from "@/app/components/types";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Search,
  MapIcon,
  List,
  X,
  Home,
  ArrowLeft,
  Heart,
  Loader2,
  MapPin,
  Lock,
} from "lucide-react";
import { FilterPanel } from "@/app/components/FilterPanel";
import { defaultFilters } from "@/app/utils/filterConstants";
import {
  SearchByWorkplace,
  SearchLocation,
} from "@/app/components/SearchByWorkplace";
import {
  addDistanceToProperties,
  formatDistance,
  findOptimalLocation,
} from "@/app/utils/distanceCalculator";
import { useFavorites } from "@/app/hooks/useFavorites";
import { CompareFloatingBar } from "@/app/components/CompareFloatingBar";
import {
  autocompletePlaces,
  geocodeByPlaceId,
  type GoongPrediction,
} from "@/app/utils/goongApi";

export function MapPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { properties, searchProperties, loading, searchSummary } =
    useProperties();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-slate-50 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 px-6 flex items-center justify-between shadow-sm relative z-50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-emerald-50 rounded-xl transition-colors duration-300 h-10 w-10 flex items-center justify-center"
            >
              <ArrowLeft className="size-5 text-slate-700" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="size-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <Home className="size-5 text-white" />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-emerald-950 to-emerald-700 bg-clip-text text-transparent tracking-tighter">
                MapHome
              </span>
            </div>
          </div>
        </header>

        {/* Lock Screen Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-emerald-50/20 via-slate-50 to-green-50/20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_20px_50px_-12px_rgba(6,78,59,0.08)] flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full mb-6 flex items-center justify-center border border-emerald-100 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-green-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Lock className="size-8 text-emerald-600 relative z-10 animate-pulse" />
            </div>

            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
              Đăng nhập để xem bản đồ
            </h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs mb-8">
              Hãy đăng nhập tài khoản của bạn để khám phá hàng ngàn phòng trọ xung quanh trên bản đồ tương tác thông minh.
            </p>

            <button
              onClick={() => navigate("/login")}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base h-14 rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 mb-4"
            >
              Đăng nhập ngay
            </button>

            <button
              onClick={() => navigate("/register")}
              className="w-full bg-white hover:bg-slate-50 border border-emerald-600/30 text-emerald-700 font-black text-base h-14 rounded-2xl hover:border-emerald-600 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              Tạo tài khoản mới
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const [selectedProperty, setSelectedProperty] =
    useState<RentalProperty | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [searchMode, setSearchMode] = useState<"address" | "name">("address");
  const [filters, setFilters] = useState<RentalFilters>(defaultFilters);
  const [searchLocations, setSearchLocations] = useState<SearchLocation[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { isFavorite, favoritesCount } = useFavorites();

  // Autocomplete state
  const [predictions, setPredictions] = useState<GoongPrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // Skip the debounce useEffect once (used after manual geocoding to avoid double-search + 500 error)
  const skipNextDebounceRef = useRef(false);

  // User location (Initial fallback: HCM Opera House area)
  const [userLocation, setUserLocation] = useState<[number, number]>([
    10.7769, 106.7009,
  ]);
  // GPS original location - saved separately so we can return to it when search is cleared
  const gpsLocationRef = useRef<[number, number]>([10.7769, 106.7009]);
  const [isLocating, setIsLocating] = useState(false);
  // Force recenter trigger (increments to force child map to fly even if coordinates unchanged)
  const [recenterKey, setRecenterKey] = useState(0);

  // Get real-time location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const gpsLoc: [number, number] = [latitude, longitude];
          setUserLocation(gpsLoc);
          gpsLocationRef.current = gpsLoc; // Save the real GPS location
          setIsLocating(false);
          console.log("GPS Location updated:", latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
          // Keep using fallback
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    }
  }, []);

  // Calculate optimal center point for multi-location search
  const searchCenter: [number, number] = useMemo(() => {
    if (searchLocations.length === 0) return userLocation;
    if (searchLocations.length === 1) return searchLocations[0].coordinates;
    return findOptimalLocation(searchLocations.map((l) => l.coordinates));
  }, [searchLocations, userLocation]);

  // Server-side search trigger
  const performSearch = (
    term: string = searchTerm,
    location: [number, number] = userLocation,
  ) => {
    const selectedAmenities = Object.entries(filters.amenities)
      .filter(([_, value]) => value)
      .map(([key]) => key)
      .join(",");

    // Only apply price/area filters if user has actively changed them from defaults
    const isPriceChanged =
      filters.priceRange[0] !== defaultFilters.priceRange[0] ||
      filters.priceRange[1] !== defaultFilters.priceRange[1];
    const isAreaChanged =
      filters.areaRange[0] !== defaultFilters.areaRange[0] ||
      filters.areaRange[1] !== defaultFilters.areaRange[1];

    searchProperties({
      q: term || undefined,
      minPrice: isPriceChanged ? filters.priceRange[0] : undefined,
      maxPrice: isPriceChanged ? filters.priceRange[1] : undefined,
      minArea: isAreaChanged ? filters.areaRange[0] : undefined,
      maxArea: isAreaChanged ? filters.areaRange[1] : undefined,
      amenities: selectedAmenities || undefined,
      verified: filters.verificationLevel === "verified" ? "true" : undefined,
      lat: location[0],
      lng: location[1],
      radius: filters.radius,
      limit: 100,
    });
  };

  useEffect(() => {
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      performSearch();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, filters, userLocation]);

  // Autocomplete Handlers
  const handleAutocompleteInput = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(true);
    setPredictions([]);

    if (autocompleteTimerRef.current)
      clearTimeout(autocompleteTimerRef.current);
    if (!value.trim()) return;

    autocompleteTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await autocompletePlaces(value);
      setPredictions(results);
      setIsSearching(false);
    }, 400);
  };

  const handleSelectPrediction = async (prediction: GoongPrediction) => {
    setIsGeocoding(true);
    setPredictions([]);
    setShowDropdown(false);

    // Set search term for UI - use a cleaner name (e.g. "Quận 1" instead of "Quận 1, Hồ Chí Minh...")
    const cleanTerm =
      prediction.structured_formatting.main_text || prediction.description;
    setSearchTerm(cleanTerm);

    const result = await geocodeByPlaceId(prediction.place_id);
    setIsGeocoding(false);

    if (result) {
      const newLoc: [number, number] = [result.lat, result.lng];
      // Flag to skip debounce on next render (userLocation change will trigger it)
      skipNextDebounceRef.current = true;
      setUserLocation(newLoc);
      // When we have exact coordinates, don't pass text query (q)
      // so backend uses ONLY geospatial search ($nearSphere) - avoids MongoDB conflict
      performSearch("", newLoc);
      console.log("Map centered to:", result.lat, result.lng);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // If there are predictions, select the first one
      if (predictions.length > 0) {
        handleSelectPrediction(predictions[0]);
      } else {
        // Otherwise just trigger the search immediately
        performSearch();
      }
      setPredictions([]); // Close suggestions
    }
  };

  // Add distances to all properties

  const propertiesWithDistance = useMemo(() => {
    return addDistanceToProperties(properties, searchCenter);
  }, [properties, searchCenter]);

  // Apply all filters
  const filteredProperties = useMemo(() => {
    let result = propertiesWithDistance;

    // Text search
    if (searchTerm) {
      result = result.filter(
        (property: PropertyWithDistance) =>
          property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Favorites filter
    if (showFavoritesOnly) {
      result = result.filter((property: PropertyWithDistance) =>
        isFavorite(property.id),
      );
    }

    // Radius filter
    result = result.filter(
      (property: PropertyWithDistance) => property.distance <= filters.radius,
    );

    // Sorting
    switch (filters.sortBy) {
      case "price-asc":
        result.sort(
          (a: PropertyWithDistance, b: PropertyWithDistance) =>
            a.price - b.price,
        );
        break;
      case "price-desc":
        result.sort(
          (a: PropertyWithDistance, b: PropertyWithDistance) =>
            b.price - a.price,
        );
        break;
      case "distance":
        result.sort(
          (a: PropertyWithDistance, b: PropertyWithDistance) =>
            a.distance - b.distance,
        );
        break;
      case "area":
        result.sort(
          (a: PropertyWithDistance, b: PropertyWithDistance) => b.area - a.area,
        );
        break;
    }

    return result;
  }, [
    propertiesWithDistance,
    searchTerm,
    filters,
    showFavoritesOnly,
    isFavorite,
  ]);

  const searchPropertySuggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];

    return propertiesWithDistance
      .filter(
        (property: PropertyWithDistance) =>
          property.name.toLowerCase().includes(query) ||
          property.address.toLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [propertiesWithDistance, searchTerm]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (
      filters.priceRange[0] !== defaultFilters.priceRange[0] ||
      filters.priceRange[1] !== defaultFilters.priceRange[1]
    )
      count++;
    if (
      filters.areaRange[0] !== defaultFilters.areaRange[0] ||
      filters.areaRange[1] !== defaultFilters.areaRange[1]
    )
      count++;
    if (Object.values(filters.amenities).some((v) => v)) count++;
    if (filters.availability !== "all") count++;
    if (filters.verificationLevel !== "all") count++;
    if (filters.radius !== defaultFilters.radius) count++;
    return count;
  }, [filters]);

  // Local fallback for first-load listings; backend summary is preferred after search.
  const localPriceRange = useMemo(() => {
    const pinned = filteredProperties.filter(
      (p: PropertyWithDistance) => p.pinInfo,
    );
    const source = pinned.length > 0 ? pinned : filteredProperties;
    if (source.length === 0) return { min: 0, max: 0 };
    const prices = source.map((p: PropertyWithDistance) => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [filteredProperties]);

  const priceRange = searchSummary?.priceRange ?? localPriceRange;

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-xl border-b border-white/20 z-[100] shadow-2xl shadow-emerald-900/5 will-change-transform w-full"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 w-full">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="mr-1 sm:mr-2 hover:bg-emerald-50 rounded-lg sm:rounded-2xl transition-colors duration-300 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
              >
                <ArrowLeft className="size-4 sm:size-5 text-emerald-950" />
              </Button>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="size-8 sm:size-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg sm:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20 flex-shrink-0">
                  <Home className="size-4 sm:size-6 text-white" />
                </div>
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-emerald-950 to-emerald-700 bg-clip-text text-transparent tracking-tighter hidden sm:block">
                  MapHome
                </h1>
              </div>
            </div>

            <div className="flex gap-1 sm:gap-2 p-0.5 sm:p-1 bg-emerald-950/5 backdrop-blur-md rounded-lg sm:rounded-2xl border border-emerald-950/5 flex-shrink">
              {/* Yêu thích */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`
                  flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-300 will-change-transform
                  ${
                    showFavoritesOnly
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-[1.02]"
                      : "text-emerald-950/60 hover:text-emerald-950 hover:bg-white/60"
                  }
                `}
              >
                <Heart
                  className={`size-3.5 sm:size-4 transition-all duration-300 flex-shrink-0 ${showFavoritesOnly ? "fill-current scale-110" : ""}`}
                />
                <span className="hidden sm:inline">Yêu thích</span>
                <span
                  className={`text-[9px] sm:text-xs px-1 sm:px-1.5 py-0 sm:py-0.5 rounded-full font-black
                  ${
                    showFavoritesOnly ? "bg-white/20" : "bg-emerald-950/8"
                  }`}
                >
                  {favoritesCount}
                </span>
              </button>

              {/* Bản đồ */}
              <button
                onClick={() => setViewMode("map")}
                className={`
                  flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 will-change-transform
                  ${
                    viewMode === "map"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]"
                      : "text-emerald-950/60 hover:text-emerald-950 hover:bg-white/60"
                  }
                `}
              >
                <MapIcon className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Bản đồ</span>
              </button>

              {/* Danh sách */}
              <button
                onClick={() => setViewMode("list")}
                className={`
                  flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 will-change-transform
                  ${
                    viewMode === "list"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]"
                      : "text-emerald-950/60 hover:text-emerald-950 hover:bg-white/60"
                  }
                `}
              >
                <List className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Danh sách</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full">
            <div className="relative w-full sm:flex-1 group flex bg-white/60 border border-emerald-900/10 rounded-2xl shadow-sm focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300 z-10">
              <div className="absolute inset-0 bg-emerald-100/50 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 -z-10" />
              
              <select 
                value={searchMode}
                onChange={(e) => setSearchMode((e.target as HTMLSelectElement).value as "address" | "name")}
                className="h-14 bg-transparent pl-4 pr-2 text-sm font-bold text-emerald-700 outline-none border-r border-emerald-900/10 cursor-pointer rounded-l-2xl hover:bg-emerald-50/50 transition-colors"
              >
                <option value="address">Địa chỉ</option>
                <option value="name">Tên trọ</option>
              </select>

              <div className="flex items-center pl-3">
                <Search className="size-5 text-emerald-950/40" />
              </div>

              <input
                type="text"
                placeholder={searchMode === 'address' ? "Nhập tên đường, phường, quận..." : "Nhập tên phòng trọ..."}
                value={searchTerm}
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (searchMode === 'address') {
                    handleAutocompleteInput(target.value);
                  } else {
                    setSearchTerm(target.value);
                    setShowDropdown(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (searchMode === 'address' && predictions.length > 0) {
                      handleSelectPrediction(predictions[0]);
                    } else {
                      performSearch(searchTerm);
                    }
                    setPredictions([]);
                    setShowDropdown(false);
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="flex-1 h-14 bg-transparent px-3 text-emerald-950 font-medium placeholder:text-emerald-950/30 outline-none border-none rounded-r-2xl"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
                {(isSearching || isGeocoding) && (
                  <Loader2 className="size-4 text-emerald-600 animate-spin" />
                )}
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setPredictions([]);
                      // Close any open detail panel and return to map view
                      setSelectedProperty(null);
                      setViewMode("map");
                      // Return map to original GPS location and reload all properties
                      const gpsLoc = gpsLocationRef.current;
                      console.log("[MapPage] clear clicked, gpsLoc:", gpsLoc);
                      skipNextDebounceRef.current = true;
                      setUserLocation(gpsLoc);
                      performSearch("", gpsLoc);
                      // Force child map to recenter even if gpsLoc equals current userLocation
                      setRecenterKey((k) => k + 1);
                      // Auto-recenter to GPS location immediately (no toast):
                      // skipNextDebounceRef already set above, setUserLocation + performSearch will trigger map fly
                    }}
                    className="size-8 bg-emerald-50 hover:bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-950 group transition-all duration-300"
                  >
                    <X className="size-4 opacity-50 group-hover:opacity-100" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showDropdown && searchMode === 'address' && predictions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_-10px_rgba(6,78,59,0.2)] border border-emerald-900/5 overflow-hidden z-[110] p-2"
                  >
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {predictions.map((p) => (
                        <button
                          key={p.place_id}
                          onClick={() => handleSelectPrediction(p)}
                          className="w-full text-left px-4 py-3.5 hover:bg-emerald-50/80 rounded-2xl flex items-start gap-3 transition-colors group relative overflow-hidden"
                        >
                          <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <MapPin className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-emerald-950 truncate group-hover:text-emerald-900">
                              {p.structured_formatting.main_text}
                            </p>
                            <p className="text-[10px] font-medium text-emerald-900/40 truncate group-hover:text-emerald-900/60 font-mono uppercase tracking-tight">
                              {p.structured_formatting.secondary_text}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showDropdown && searchMode === 'name' && searchPropertySuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_-10px_rgba(6,78,59,0.18)] border border-emerald-900/5 overflow-hidden z-[105] p-2"
                  >
                    <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950/40">
                        Kết quả phòng trọ
                      </p>
                      <p className="text-[10px] font-bold text-emerald-600">
                        {searchPropertySuggestions.length} phòng
                      </p>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar space-y-1 px-1 pb-1">
                      {searchPropertySuggestions.map((property) => (
                        <button
                          key={property.id}
                          onClick={() => {
                            setSelectedProperty(property);
                            setViewMode("map");
                            setSearchTerm(property.name);
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3.5 rounded-2xl hover:bg-emerald-50/80 transition-colors flex items-start justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-emerald-950 truncate">
                              {property.name}
                            </p>
                            <p className="text-[11px] font-medium text-emerald-900/45 truncate mt-0.5">
                              {property.address}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-black text-emerald-600 whitespace-nowrap">
                              {property.price.toLocaleString("vi-VN")}đ
                            </p>
                            <p className="text-[10px] font-bold text-emerald-950/35 uppercase tracking-widest">
                              / tháng
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  activeFiltersCount={activeFiltersCount}
                />
              </div>
              <div className="flex-1 sm:flex-initial">
                <SearchByWorkplace
                  onSearch={setSearchLocations}
                  currentLocations={searchLocations}
                />
              </div>
            </div>
          </div>

          {/* Search Location Tags */}
          {searchLocations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600">Tìm gần:</span>
              {searchLocations.map((loc) => (
                <span
                  key={loc.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm"
                >
                  📍 {loc.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative pt-[185px] sm:pt-40 w-full">
        {viewMode === "map" ? (
          <div className="h-full w-full relative">
            {/* Map */}
            <div className="h-full w-full relative transition-all duration-500 ease-in-out">
              <div className="h-full w-full p-2 sm:p-4 overflow-hidden">
                <RentalMapView
                  properties={filteredProperties}
                  selectedProperty={selectedProperty}
                  onPropertySelect={setSelectedProperty}
                  searchLocations={searchLocations}
                  searchRadius={filters.radius}
                  searchCenter={searchCenter}
                  recenterLocation={gpsLocationRef.current}
                  recenterKey={recenterKey}
                />
              </div>

              {/* Floating Footer Stats bounded by the map container */}
              <motion.footer
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  delay: 0.5,
                }}
                className="absolute bottom-6 left-0 right-0 px-4 pointer-events-none flex justify-center z-[100]"
                style={{
                  left: selectedProperty ? "16px" : "0px",
                  right: selectedProperty ? "416px" : "0px",
                  padding: selectedProperty ? "0" : "0 16px",
                }}
              >
                <div
                  className="bg-emerald-950/90 backdrop-blur-2xl border border-white/10 rounded-[30px] md:rounded-[40px] py-3 px-4 md:py-4 md:px-8 shadow-[0_32px_64px_-16px_rgba(6,78,59,0.5)] flex flex-col xl:flex-row xl:justify-between xl:items-center text-white gap-4 pointer-events-auto overflow-hidden w-full"
                  style={{
                    maxWidth: "80rem",
                  }}
                >
                  <div className="flex items-center flex-wrap gap-4 md:gap-6 flex-1 min-w-0">
                    <div className="flex flex-col flex-shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/40 mb-0.5">
                        Tìm thấy
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="size-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xl font-black text-white">
                          {filteredProperties.length}
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:block h-10 w-px bg-white/10 flex-shrink-0" />

                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/40 mb-0.5">
                        Khoảng giá
                      </span>
                      <div className="text-lg md:text-xl font-black text-white italic leading-tight truncate">
                        <div className="block truncate">
                          {priceRange.min === 0 && priceRange.max === 0
                            ? "0"
                            : priceRange.min === priceRange.max
                              ? priceRange.min.toLocaleString("vi-VN")
                              : `${priceRange.min.toLocaleString("vi-VN")} - ${priceRange.max.toLocaleString("vi-VN")}`}
                        </div>
                        <div className="text-[10px] md:text-xs text-emerald-100/60 font-medium mt-0.5 md:mt-1">
                          đ/tháng
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-3 flex-shrink-0 w-full xl:w-auto">
                    <div className="px-3 py-2 md:px-5 md:py-2.5 bg-white/10 rounded-[16px] md:rounded-[20px] flex items-center gap-3 border border-white/5 shadow-inner w-full xl:w-auto">
                      <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <div className="size-1.5 bg-orange-400 rounded-full" />
                          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap">
                            Ghim:{" "}
                            {filteredProperties.filter((p) => p.pinInfo).length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <div className="size-1.5 bg-green-400 rounded-full" />
                          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap">
                            Còn phòng:{" "}
                            {
                              filteredProperties.filter((p) => p.available)
                                .length
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {searchLocations.length > 0 && (
                      <div className="hidden sm:flex px-3 py-2 md:px-5 md:py-2.5 bg-emerald-500 text-white rounded-[16px] md:rounded-[20px] items-center gap-2 font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 w-full xl:w-auto justify-center">
                        📍 {searchLocations.length} Địa điểm
                      </div>
                    )}
                  </div>
                </div>
              </motion.footer>
            </div>

            {/* Detail Panel */}
            <AnimatePresence>
              {selectedProperty && (
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 220 }}
                  className="absolute top-0 right-0 z-[120] h-full w-full max-w-[400px] bg-white border-l border-emerald-50 shadow-[-10px_0_40px_-10px_rgba(6,78,59,0.1)] overflow-y-auto will-change-transform"
                >
                  <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-emerald-50 p-5 flex justify-between items-center z-10">
                    <h2 className="text-xl font-black bg-gradient-to-r from-emerald-950 to-emerald-600 bg-clip-text text-transparent tracking-tight">
                      Chi tiết phòng trọ
                    </h2>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedProperty(null)}
                      className="hover:rotate-90 transition-transform duration-200"
                    >
                      <X className="size-5" />
                    </Button>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 pb-36"
                  >
                    <PropertyCard property={selectedProperty} />
                    {/* Pin Info */}
                    {selectedProperty.pinInfo && (
                      <div className="mt-6 p-4 bg-emerald-50/50 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100/30 rounded-bl-full -mr-10 -mt-10" />
                        <div className="flex items-center gap-2 mb-2 relative z-10">
                          <span className="text-lg">📌</span>
                          <p className="text-sm font-black text-emerald-900 uppercase tracking-tighter">
                            Chủ trọ đã ghim vị trí
                          </p>
                        </div>
                        {selectedProperty.pinInfo.note && (
                          <p className="text-sm text-emerald-800 italic mb-3 font-medium relative z-10 leading-relaxed">
                            "{selectedProperty.pinInfo.note}"
                          </p>
                        )}
                        <div className="flex items-center gap-2 relative z-10">
                          <div className="size-1.5 bg-emerald-400 rounded-full" />
                          <p className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">
                            Ghim ngày:{" "}
                            {new Date(
                              selectedProperty.pinInfo.pinnedAt,
                            ).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Distance Info */}
                    <div className="mt-4 p-4 bg-emerald-950 rounded-3xl border border-emerald-800 shadow-xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2 relative z-10">
                        📍 Khoảng cách tiếp cận
                      </p>
                      <div className="flex items-baseline gap-1 relative z-10">
                        <p className="text-3xl font-black text-white tracking-tighter">
                          {formatDistance(
                            propertiesWithDistance.find(
                              (p) => p.id === selectedProperty.id,
                            )?.distance || 0,
                          )}
                        </p>
                      </div>
                      <p className="text-[11px] font-medium text-emerald-100/40 mt-2 relative z-10">
                        {searchLocations.length > 0
                          ? `Từ ${searchLocations.length === 1 ? searchLocations[0].name : `${searchLocations.length} địa điểm đã chọn`}`
                          : "Từ vị trí hiện tại của bạn"}
                      </p>
                    </div>

                    {/* View Detail Button */}
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-8 w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-sm uppercase tracking-widest h-14 rounded-2xl shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 will-change-transform"
                      onClick={() => navigate(`/room/${selectedProperty.id}`)}
                    >
                      Chi tiết đầy đủ
                      <ArrowLeft className="size-4 rotate-180" />
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-full w-full p-6">
            <div className="max-w-7xl mx-auto h-full">
              <PropertyList
                properties={filteredProperties}
                onPropertySelect={setSelectedProperty}
                loading={loading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Footer Stats */}

      <CompareFloatingBar />
    </div>
  );
}
