import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  SlidersHorizontal,
  Target,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/ui/sheet";
import { Slider } from "@/app/components/ui/slider";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Badge } from "@/app/components/ui/badge";
import { RentalFilters } from "@/app/components/types";
import { defaultFilters } from "@/app/utils/filterConstants";

interface FilterPanelProps {
  filters: RentalFilters;
  onFiltersChange: (filters: RentalFilters) => void;
  activeFiltersCount: number;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  activeFiltersCount,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Draft state: temporary changes before Apply is clicked
  const [draftFilters, setDraftFilters] = useState<RentalFilters>(filters);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    area: true,
    amenities: true,
    verification: false,
    availability: true,
  });

  // Sync draft when panel opens
  const handleOpenChange = (open: boolean) => {
    if (open) setDraftFilters(filters); // Reset draft to current filters on open
    setIsOpen(open);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleReset = () => {
    setDraftFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const handleApply = () => {
    onFiltersChange(draftFilters); // This triggers the search in MapPage
    setIsOpen(false);
  };

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}tr`;
    }
    return `${value / 1000}k`;
  };

  const updateFilter = <K extends keyof RentalFilters>(
    key: K,
    value: RentalFilters[K],
  ) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const updateAmenity = (
    amenity: keyof RentalFilters["amenities"],
    value: boolean,
  ) => {
    setDraftFilters((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [amenity]: value },
    }));
  };

  const selectedAmenitiesCount = Object.values(draftFilters.amenities).filter(
    Boolean,
  ).length;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="relative w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-6 rounded-lg sm:rounded-2xl border-emerald-900/10 bg-white/50 backdrop-blur-md hover:bg-emerald-50 hover:border-emerald-600/30 text-emerald-950 font-bold transition-all duration-300 group text-sm sm:text-base"
        >
          <SlidersHorizontal className="size-3.5 sm:size-4 mr-1.5 sm:mr-2 text-emerald-600 transition-transform duration-500 group-hover:rotate-180" />
          <span className="hidden sm:inline">Lọc & Sắp xếp</span>
          <span className="sm:hidden">Lọc</span>
          {activeFiltersCount > 0 && (
            <div className="ml-1.5 sm:ml-2 size-5 rounded-full bg-emerald-600 text-[9px] sm:text-[10px] text-white flex items-center justify-center font-black animate-pulse">
              {activeFiltersCount}
            </div>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-full max-w-sm overflow-y-auto bg-white/80 backdrop-blur-3xl border-r border-emerald-900/10 p-4 sm:p-0 shadow-[24px_0_80px_-20px_rgba(6,78,59,0.15)]"
      >
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 will-change-transform">
          <SheetHeader className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="size-10 sm:size-12 rounded-lg sm:rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">
                <Filter className="size-5 sm:size-6" />
              </div>
              <div>
                <SheetTitle className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight leading-tight">
                  Bộ lọc
                </SheetTitle>
                <SheetDescription className="text-emerald-900/60 font-medium text-xs sm:text-sm">
                  Tinh chỉnh tìm kiếm của bạn
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between pt-2">
              <div className="bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-100">
                <Sparkles className="size-3 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                  {activeFiltersCount} Đang kích hoạt
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-emerald-900/40 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <X className="size-4 mr-2" />
                Đặt lại
              </Button>
            </div>

            {/* Sort By */}
            <div className="space-y-4 bg-emerald-900/[0.03] p-5 rounded-[24px] border border-emerald-900/5">
              <Label className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em]">
                Sắp xếp theo
              </Label>
              <RadioGroup
                value={draftFilters.sortBy}
                onValueChange={(value) =>
                  updateFilter("sortBy", value as RentalFilters["sortBy"])
                }
                className="grid grid-cols-1 gap-2"
              >
                {[
                  {
                    id: "sort-distance",
                    value: "distance",
                    label: "Khoảng cách gần nhất",
                  },
                  {
                    id: "sort-price-asc",
                    value: "price-asc",
                    label: "Giá thấp đến cao",
                  },
                  {
                    id: "sort-price-desc",
                    value: "price-desc",
                    label: "Giá cao đến thấp",
                  },
                  {
                    id: "sort-area",
                    value: "area",
                    label: "Diện tích lớn nhất",
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className={`
                    flex items-center space-x-3 p-3 rounded-xl border transition-all duration-300
                    ${
                      draftFilters.sortBy === item.value
                        ? "bg-white border-emerald-600/20 shadow-sm"
                        : "border-transparent hover:bg-white/50"
                    }
                  `}
                  >
                    <RadioGroupItem
                      value={item.value}
                      id={item.id}
                      className="text-emerald-600 border-emerald-200"
                    />
                    <Label
                      htmlFor={item.id}
                      className="cursor-pointer font-bold text-emerald-900/80 text-sm flex-1"
                    >
                      {item.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Radius */}
            <div className="space-y-5 p-5 rounded-[24px] border border-emerald-900/5 bg-white/40 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target className="size-12 text-emerald-600" />
              </div>
              <Label className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em] relative">
                Bán kính tìm kiếm
              </Label>
              <div className="space-y-6 pt-2 relative">
                <Slider
                  value={[draftFilters.radius]}
                  onValueChange={(value) => updateFilter("radius", value[0])}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full [&_[role=slider]]:bg-emerald-600 [&_[role=slider]]:border-emerald-950/20 [&_.relative]:bg-emerald-100"
                />
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-emerald-900/40">
                    1km
                  </span>
                  <div className="bg-emerald-900 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg shadow-emerald-900/20 transition-all duration-300 transform group-hover:scale-110">
                    {draftFilters.radius} KM
                  </div>
                  <span className="text-[10px] font-bold text-emerald-900/40">
                    20km
                  </span>
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <button
                onClick={() => toggleSection("price")}
                className="flex items-center justify-between w-full group"
              >
                <Label className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em] cursor-pointer group-hover:text-emerald-600 transition-colors">
                  Khoảng giá
                </Label>
                <div className="size-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-900/40 transition-all duration-300 group-hover:bg-emerald-100 group-hover:text-emerald-600">
                  {expandedSections.price ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {expandedSections.price && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-6 p-5 pt-2 rounded-[24px] bg-emerald-900/[0.02] border border-emerald-900/5 mt-2">
                      <Slider
                        value={draftFilters.priceRange}
                        onValueChange={(value) =>
                          updateFilter("priceRange", value as [number, number])
                        }
                        min={1000000}
                        max={10000000}
                        step={100000}
                        className="w-full [&_[role=slider]]:bg-emerald-600 [&_[role=slider]]:border-emerald-950/20"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-emerald-900/40">
                          {formatPrice(draftFilters.priceRange[0])}
                        </span>
                        <span className="text-xs font-black text-emerald-950 bg-white px-4 py-1.5 rounded-xl border border-emerald-950/5 shadow-sm">
                          {formatPrice(draftFilters.priceRange[0])} —{" "}
                          {formatPrice(draftFilters.priceRange[1])}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-900/40">
                          {formatPrice(draftFilters.priceRange[1])}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Area Range */}
            <div className="space-y-4">
              <button
                onClick={() => toggleSection("area")}
                className="flex items-center justify-between w-full group"
              >
                <Label className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em] cursor-pointer group-hover:text-emerald-600 transition-colors">
                  Diện tích (m²)
                </Label>
                <div className="size-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-900/40 transition-all duration-300 group-hover:bg-emerald-100 group-hover:text-emerald-600">
                  {expandedSections.area ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {expandedSections.area && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-6 p-5 pt-2 rounded-[24px] bg-emerald-900/[0.02] border border-emerald-900/5 mt-2">
                      <Slider
                        value={draftFilters.areaRange}
                        onValueChange={(value) =>
                          updateFilter("areaRange", value as [number, number])
                        }
                        min={10}
                        max={50}
                        step={5}
                        className="w-full [&_[role=slider]]:bg-emerald-600"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-emerald-900/40">
                          10m²
                        </span>
                        <span className="text-xs font-black text-emerald-950 bg-white px-4 py-1.5 rounded-xl border border-emerald-950/5 shadow-sm">
                          {draftFilters.areaRange[0]}m² -{" "}
                          {draftFilters.areaRange[1]}m²
                        </span>
                        <span className="text-[10px] font-bold text-emerald-900/40">
                          50m²
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <button
                onClick={() => toggleSection("amenities")}
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center gap-3">
                  <Label className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em] cursor-pointer group-hover:text-emerald-600 transition-colors">
                    Tiện nghi
                  </Label>
                  {selectedAmenitiesCount > 0 && (
                    <div className="size-5 rounded-full bg-emerald-600 text-[10px] text-white flex items-center justify-center font-black">
                      {selectedAmenitiesCount}
                    </div>
                  )}
                </div>
                <div className="size-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-900/40 transition-all duration-300 group-hover:bg-emerald-100 group-hover:text-emerald-600">
                  {expandedSections.amenities ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {expandedSections.amenities && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pt-2"
                  >
                    <div className="grid grid-cols-1 gap-1.5 p-1">
                      {Object.entries(filters.amenities).map(([key, value]) => {
                        const labels: Record<string, string> = {
                          wifi: "📶 WiFi tốc độ cao",
                          furniture: "🛋️ Đầy đủ nội thất",
                          tv: "📺 Smart TV",
                          washingMachine: "🧺 Máy giặt riêng",
                          kitchen: "🍳 Khu vực bếp",
                          refrigerator: "❄️ Tủ lạnh",
                          airConditioner: "❄️ Điều hòa",
                        };
                        return (
                          <div
                            key={key}
                            className={`
                            flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200
                            ${value ? "bg-emerald-50/50 border-emerald-600/20" : "border-transparent hover:bg-emerald-900/[0.02]"}
                          `}
                          >
                            <Checkbox
                              id={key}
                              checked={
                                draftFilters.amenities[
                                  key as keyof RentalFilters["amenities"]
                                ]
                              }
                              onCheckedChange={(checked) =>
                                updateAmenity(
                                  key as keyof RentalFilters["amenities"],
                                  checked as boolean,
                                )
                              }
                              className="border-emerald-200 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-transparent"
                            />
                            <Label
                              htmlFor={key}
                              className="cursor-pointer font-bold text-sm text-emerald-900/70 flex-1"
                            >
                              {labels[key]}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Availability */}
            <div className="space-y-4">
              <button
                onClick={() => toggleSection("availability")}
                className="flex items-center justify-between w-full group"
              >
                <Label className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em] cursor-pointer group-hover:text-emerald-600 transition-colors">
                  Tình trạng
                </Label>
                <div className="size-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-900/40 transition-all duration-300 group-hover:bg-emerald-100 group-hover:text-emerald-600">
                  {expandedSections.availability ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {expandedSections.availability && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pt-2"
                  >
                    <RadioGroup
                      value={draftFilters.availability}
                      onValueChange={(value) =>
                        updateFilter(
                          "availability",
                          value as RentalFilters["availability"],
                        )
                      }
                      className="grid grid-cols-1 gap-2"
                    >
                      {[
                        {
                          id: "availability-all",
                          value: "all",
                          label: "Tất cả",
                        },
                        {
                          id: "availability-available",
                          value: "available",
                          label: "🟢 Còn phòng",
                        },
                        {
                          id: "availability-unavailable",
                          value: "unavailable",
                          label: "🔴 Hết phòng",
                        },
                      ].map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200 ${draftFilters.availability === item.value ? "bg-white border-emerald-600/20 shadow-sm" : "border-transparent hover:bg-emerald-900/[0.02]"}`}
                        >
                          <RadioGroupItem
                            value={item.value}
                            id={item.id}
                            className="text-emerald-600 border-emerald-200"
                          />
                          <Label
                            htmlFor={item.id}
                            className="cursor-pointer font-bold text-sm text-emerald-900/70 flex-1"
                          >
                            {item.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Verification Level */}
            <div className="space-y-4">
              <button
                onClick={() => toggleSection("verification")}
                className="flex items-center justify-between w-full group"
              >
                <Label className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em] cursor-pointer group-hover:text-emerald-600 transition-colors">
                  Mức xác thực
                </Label>
                <div className="size-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-900/40 transition-all duration-300 group-hover:bg-emerald-100 group-hover:text-emerald-600">
                  {expandedSections.verification ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {expandedSections.verification && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pt-2"
                  >
                    <RadioGroup
                      value={draftFilters.verificationLevel}
                      onValueChange={(value) =>
                        updateFilter(
                          "verificationLevel",
                          value as RentalFilters["verificationLevel"],
                        )
                      }
                      className="grid grid-cols-1 gap-2"
                    >
                      {[
                        {
                          id: "verification-all",
                          value: "all",
                          label: "Tất cả listing",
                        },
                        {
                          id: "verification-verified",
                          value: "verified",
                          label: "✅ Host đã xác thực",
                        },
                        {
                          id: "verification-none",
                          value: "none",
                          label: "⚠️ Chưa xác thực",
                        },
                      ].map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200 ${draftFilters.verificationLevel === item.value ? "bg-white border-emerald-600/20 shadow-sm" : "border-transparent hover:bg-emerald-900/[0.02]"}`}
                        >
                          <RadioGroupItem
                            value={item.value}
                            id={item.id}
                            className="text-emerald-600 border-emerald-200"
                          />
                          <Label
                            htmlFor={item.id}
                            className="cursor-pointer font-bold text-sm text-emerald-900/70 flex-1"
                          >
                            {item.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Apply Button */}
          <div className="p-8 border-t border-emerald-900/5 bg-white/50 backdrop-blur-md">
            <Button
              className="w-full h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-950 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all will-change-transform"
              size="lg"
              onClick={handleApply}
            >
              Áp dụng thay đổi
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
