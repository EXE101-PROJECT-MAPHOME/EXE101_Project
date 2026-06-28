import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Plus, Target, Search, Sparkles, Building2, School, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import {
  autocompletePlaces,
  geocodeByPlaceId,
  isGoongConfigured,
  type GoongPrediction,
} from '@/app/utils/goongApi';


export interface SearchLocation {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
}

interface SearchByWorkplaceProps {
  onSearch: (locations: SearchLocation[]) => void;
  currentLocations: SearchLocation[];
}

// Popular locations in Ho Chi Minh City
const popularLocations: SearchLocation[] = [
  { id: 'bk', name: 'ĐH Bách Khoa TP.HCM', address: '268 Lý Thường Kiệt, Quận 10', coordinates: [10.7725, 106.6576] },
  { id: 'ktl', name: 'ĐH Kinh Tế - Luật', address: 'Khu phố 6, Thủ Đức', coordinates: [10.8714, 106.7830] },
  { id: 'khtn', name: 'ĐH Khoa Học Tự Nhiên', address: '227 Nguyễn Văn Cừ, Quận 5', coordinates: [10.7628, 106.6824] },
  { id: 'rmit', name: 'ĐH RMIT Việt Nam', address: '702 Nguyễn Văn Linh, Quận 7', coordinates: [10.7292, 106.6958] },
  { id: 'vincom', name: 'Vincom Center Đồng Khởi', address: '72 Lê Thánh Tôn, Quận 1', coordinates: [10.7790, 106.7016] },
  { id: 'bitexco', name: 'Bitexco Financial Tower', address: '2 Hải Triều, Quận 1', coordinates: [10.7717, 106.7042] },
  { id: 'pmi', name: 'KCN Tân Bình', address: 'Tây Thạnh, Tân Phú', coordinates: [10.8100, 106.6280] },
  { id: 'landmark', name: 'Landmark 81', address: '720A Điện Biên Phủ, Bình Thạnh', coordinates: [10.7952, 106.7219] },
];

export function SearchByWorkplace({ onSearch, currentLocations }: SearchByWorkplaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<SearchLocation[]>(currentLocations);
  const [customLocation, setCustomLocation] = useState({ name: '', address: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Goong Autocomplete State ───────────────────────────────────────────
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [predictions, setPredictions] = useState<GoongPrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredPopularLocations = popularLocations.filter(
    loc =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Goong Autocomplete Handler ─────────────────────────────────────────
  const handleAutocompleteInput = (value: string) => {
    setAutocompleteQuery(value);
    setPredictions([]);
    if (autocompleteTimerRef.current) clearTimeout(autocompleteTimerRef.current);
    if (!value.trim() || !isGoongConfigured()) return;

    autocompleteTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await autocompletePlaces(value);
      setPredictions(results);
      setIsSearching(false);
    }, 400); // debounce 400ms
  };

  const handleSelectPrediction = async (prediction: GoongPrediction) => {
    setIsGeocoding(true);
    setPredictions([]);
    const result = await geocodeByPlaceId(prediction.place_id);
    setIsGeocoding(false);

    if (result) {
      const newLocation: SearchLocation = {
        id: prediction.place_id,
        name: prediction.structured_formatting.main_text,
        address: prediction.structured_formatting.secondary_text || prediction.description,
        coordinates: [result.lat, result.lng],
      };
      addLocation(newLocation);
      setAutocompleteQuery('');
    }
  };

  const addLocation = (location: SearchLocation) => {
    if (!selectedLocations.find(l => l.id === location.id)) {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  const removeLocation = (id: string) => {
    setSelectedLocations(selectedLocations.filter(l => l.id !== id));
  };

  const handleApply = () => {
    onSearch(selectedLocations);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedLocations([]);
    onSearch([]);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="relative w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-6 rounded-lg sm:rounded-2xl border-emerald-900/10 bg-white/50 backdrop-blur-md hover:bg-emerald-50 hover:border-emerald-600/30 text-emerald-950 font-bold transition-all duration-300 group shadow-sm text-sm sm:text-base"
        >
          <Target className="size-3.5 sm:size-4 mr-1.5 sm:mr-2 text-emerald-600 group-hover:scale-125 transition-transform duration-500" />
          <span className="hidden sm:inline">Tìm gần chỗ làm/trường</span>
          <span className="sm:hidden">Trường / Chỗ làm</span>
          {currentLocations.length > 0 && (
            <div className="ml-1.5 sm:ml-2 size-5 rounded-full bg-emerald-600 text-[9px] sm:text-[10px] text-white flex items-center justify-center font-black animate-pulse">
              {currentLocations.length}
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white/80 backdrop-blur-3xl border-emerald-900/10 shadow-[0_32px_128px_-32px_rgba(6,78,59,0.2)] rounded-[32px]">
        <div className="p-8 space-y-8 max-h-[85vh] overflow-y-auto will-change-transform">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center text-white shadow-xl shadow-emerald-900/20">
                <Target className="size-7" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black text-emerald-950 tracking-tight leading-tight">Tìm trọ gần địa điểm</DialogTitle>
                <DialogDescription className="text-emerald-900/60 font-medium text-base">
                  Tối ưu hóa thời gian di chuyển của bạn tới nơi quan trọng
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>


        <div className="space-y-4 mt-4">
          {/* Selected Locations */}
          <AnimatePresence>
            {selectedLocations.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="flex items-center gap-2">
                   <Label className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">Đã chọn ({selectedLocations.length})</Label>
                   <div className="h-px flex-1 bg-emerald-900/5" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedLocations.map(loc => (
                    <motion.div
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      key={loc.id}
                      className="group flex items-center gap-2 pl-3 pr-2 py-2 bg-emerald-950 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/20 will-change-transform"
                    >
                      <MapPin className="size-3 text-emerald-400" />
                      {loc.name}
                      <button
                        onClick={() => removeLocation(loc.id)}
                        className="p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Search */}
          <div className="space-y-3 p-6 rounded-[24px] bg-emerald-900/[0.03] border border-emerald-900/5 relative group">
            <Label htmlFor="search-location" className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em] flex items-center gap-2">
               <Search className="size-3 text-emerald-600" /> Tìm kiếm địa điểm
            </Label>
            <Input
              id="search-location"
              placeholder="Nhập tên trường, công ty, địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 px-5 rounded-2xl bg-white border-transparent focus:border-emerald-600/30 focus:ring-emerald-600/5 text-emerald-950 font-bold placeholder:text-emerald-900/40 transition-all text-base shadow-sm"
            />
          </div>


          {/* Popular Locations */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em] flex items-center gap-2">
               <Sparkles className="size-3 text-emerald-600" /> Địa điểm phổ biến
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto px-1 pb-4 custom-scrollbar">
              {filteredPopularLocations.map((loc, idx) => {
                const isSelected = selectedLocations.find(l => l.id === loc.id);
                return (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={loc.id}
                    onClick={() => addLocation(loc)}
                    disabled={!!isSelected}
                    className={`
                      group text-left p-4 rounded-[20px] border transition-all duration-300 relative overflow-hidden will-change-transform
                      ${isSelected 
                        ? 'bg-emerald-50 border-emerald-600 shadow-sm opacity-60' 
                        : 'bg-white border-emerald-900/5 hover:border-emerald-600/40 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`
                        size-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                        ${isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}
                      `}>
                        {loc.name.includes('ĐH') ? <School className="size-5" /> : <Building2 className="size-5" />}
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <h4 className="font-black text-emerald-950 text-sm tracking-tight">{loc.name}</h4>
                        <p className="text-[11px] font-medium text-emerald-900/40 truncate mt-0.5">{loc.address}</p>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {isSelected ? (
                          <div className="bg-emerald-600/10 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Đã chọn</div>
                        ) : (
                          <Plus className="size-5 text-emerald-900/20 group-hover:text-emerald-600 transition-colors" />
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>


          {/* Custom Location Input — Goong Autocomplete */}
          <div className="pt-6 border-t border-emerald-900/5 space-y-4">
            <Label className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em] flex items-center gap-2">
              <Plus className="size-3 text-emerald-600" />
              {isGoongConfigured() ? 'Tìm địa điểm bất kỳ (Goong AI)' : 'Hoặc thêm địa chỉ tùy chỉnh'}
            </Label>

            {isGoongConfigured() ? (
              /* ── Goong Autocomplete Input ── */
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-emerald-600/50" />
                  <Input
                    placeholder="Nhập địa chỉ, tên đường, công ty... (Goong AI)"
                    value={autocompleteQuery}
                    onChange={(e) => handleAutocompleteInput(e.target.value)}
                    className="h-12 pl-10 pr-10 rounded-xl bg-emerald-950/5 border-transparent focus:bg-white focus:border-emerald-600/30"
                  />
                  {(isSearching || isGeocoding) && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-emerald-600 animate-spin" />
                  )}
                </div>

                {/* Predictions Dropdown */}
                <AnimatePresence>
                  {predictions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl shadow-emerald-900/10 border border-emerald-900/5 overflow-hidden z-50"
                    >
                      {predictions.map((p) => (
                        <button
                          key={p.place_id}
                          onClick={() => handleSelectPrediction(p)}
                          className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-start gap-3 transition-colors border-b border-emerald-900/5 last:border-0"
                        >
                          <MapPin className="size-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-emerald-950">{p.structured_formatting.main_text}</p>
                            <p className="text-xs text-emerald-900/50">{p.structured_formatting.secondary_text}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isGoongConfigured() && (
                  <p className="text-[10px] text-amber-600 font-bold mt-1">
                    ⚠️ Chưa có Goong API Key — tính năng tìm kiếm địa chỉ chưa khả dụng.
                  </p>
                )}
              </div>
            ) : (
              /* ── Fallback: Manual Input (no Goong key yet) ── */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Tên địa điểm (VD: Nhà của tôi)"
                    value={customLocation.name}
                    onChange={(e) => setCustomLocation({ ...customLocation, name: e.target.value })}
                    className="h-12 rounded-xl bg-emerald-950/5 border-transparent focus:bg-white focus:border-emerald-600/30"
                  />
                  <Input
                    placeholder="Địa chỉ cụ thể tại TP.HCM"
                    value={customLocation.address}
                    onChange={(e) => setCustomLocation({ ...customLocation, address: e.target.value })}
                    className="h-12 rounded-xl bg-emerald-950/5 border-transparent focus:bg-white focus:border-emerald-600/30"
                  />
                </div>
                <p className="text-[10px] text-amber-600 font-bold">
                  ⚠️ Chưa có Goong API Key — tọa độ sẽ được đặt mặc định tại Quận 1, TP.HCM.
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 rounded-2xl border-emerald-950/10 text-emerald-950 font-black text-xs uppercase tracking-widest hover:bg-emerald-950 hover:text-white hover:border-transparent transition-all"
                  disabled={!customLocation.name || !customLocation.address}
                  onClick={() => {
                    const newLocation: SearchLocation = {
                      id: `custom-${Date.now()}`,
                      name: customLocation.name,
                      address: customLocation.address,
                      coordinates: [10.7769, 106.7009], // Default HCM until Goong key is set
                    };
                    addLocation(newLocation);
                    setCustomLocation({ name: '', address: '' });
                  }}
                >
                  <Plus className="size-4 mr-2" />
                  Thêm địa điểm của tôi
                </Button>
              </>
            )}
          </div>


          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-emerald-900/5">
            <Button 
              variant="outline" 
              onClick={handleClear} 
              className="h-14 rounded-2xl border-emerald-950/10 text-emerald-950 font-black text-xs uppercase tracking-widest hover:bg-emerald-50"
            >
              Xóa tất cả
            </Button>
            <Button 
              onClick={handleApply} 
              className="h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-950 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all will-change-transform" 
              disabled={selectedLocations.length === 0}
            >
              Áp dụng ({selectedLocations.length})
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>



    </Dialog>
  );
}