import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MapPin, X, Plus, Target, Search, Sparkles, Building2, School } from 'lucide-react-native';
import {
  autocompletePlaces,
  geocodeByPlaceId,
  isGoongConfigured,
  GoongPrediction,
} from '../utils/goongApi';

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

export function SearchByWorkplace({
  onSearch,
  currentLocations,
}: SearchByWorkplaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<SearchLocation[]>(currentLocations);
  const [customLocation, setCustomLocation] = useState({ name: '', address: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [predictions, setPredictions] = useState<GoongPrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredPopularLocations = popularLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    }, 400);
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
    if (!selectedLocations.find((l) => l.id === location.id)) {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  const removeLocation = (id: string) => {
    setSelectedLocations(selectedLocations.filter((l) => l.id !== id));
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
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="flex-row items-center px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100 self-start mt-2"
      >
        <Target size={16} color="#059669" className="mr-2" />
        <Text className="text-emerald-700 font-bold">Tìm gần chỗ làm/trường</Text>
        {currentLocations.length > 0 && (
          <View className="ml-2 w-5 h-5 rounded-full bg-emerald-600 items-center justify-center">
            <Text className="text-white text-[10px] font-black">
              {currentLocations.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 bg-slate-50">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 bg-white border-b border-slate-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-emerald-600 items-center justify-center mr-3">
                <Target size={20} color="white" />
              </View>
              <Text className="text-lg font-black text-emerald-950">
                Tìm trọ gần địa điểm
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {/* Selected Locations */}
            {selectedLocations.length > 0 && (
              <View className="mb-4">
                <Text className="text-[10px] font-black text-emerald-950 uppercase tracking-widest mb-2">
                  Đã chọn ({selectedLocations.length})
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {selectedLocations.map((loc) => (
                    <View
                      key={loc.id}
                      className="flex-row items-center bg-emerald-950 px-3 py-1.5 rounded-xl"
                    >
                      <MapPin size={12} color="#34d399" className="mr-1.5" />
                      <Text className="text-white text-xs font-bold mr-2">
                        {loc.name}
                      </Text>
                      <TouchableOpacity onPress={() => removeLocation(loc.id)}>
                        <X size={14} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Custom Location Search */}
            <View className="mb-6 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm relative z-50">
              <Text className="text-[10px] font-black text-emerald-950 uppercase tracking-widest mb-3 flex-row items-center">
                <Search size={12} color="#059669" /> Tìm kiếm địa điểm mới (Goong AI)
              </Text>
              <View className="relative">
                <TextInput
                  placeholder="Nhập tên trường, công ty..."
                  value={autocompleteQuery}
                  onChangeText={handleAutocompleteInput}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 pr-10"
                />
                {(isSearching || isGeocoding) && (
                  <ActivityIndicator
                    size="small"
                    color="#059669"
                    className="absolute right-3 top-3"
                  />
                )}
              </View>

              {/* Predictions */}
              {predictions.length > 0 && (
                <View className="absolute top-[85px] left-4 right-4 bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden z-50">
                  {predictions.map((p) => (
                    <TouchableOpacity
                      key={p.place_id}
                      onPress={() => handleSelectPrediction(p)}
                      className="flex-row items-start px-4 py-3 border-b border-slate-50"
                    >
                      <MapPin size={16} color="#059669" className="mt-0.5 mr-3" />
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-emerald-950">
                          {p.structured_formatting.main_text}
                        </Text>
                        <Text className="text-xs text-slate-500 mt-0.5">
                          {p.structured_formatting.secondary_text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Popular Locations */}
            <View className="mb-6 z-10">
              <Text className="text-[10px] font-black text-emerald-950 uppercase tracking-widest mb-3 flex-row items-center">
                <Sparkles size={12} color="#059669" /> Địa điểm phổ biến
              </Text>
              <View className="gap-3">
                {filteredPopularLocations.map((loc) => {
                  const isSelected = !!selectedLocations.find((l) => l.id === loc.id);
                  return (
                    <TouchableOpacity
                      key={loc.id}
                      disabled={isSelected}
                      onPress={() => addLocation(loc)}
                      className={`flex-row items-start p-3 rounded-xl border ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 opacity-70'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                          isSelected ? 'bg-emerald-600' : 'bg-emerald-50'
                        }`}
                      >
                        {loc.name.includes('ĐH') ? (
                          <School
                            size={20}
                            color={isSelected ? 'white' : '#059669'}
                          />
                        ) : (
                          <Building2
                            size={20}
                            color={isSelected ? 'white' : '#059669'}
                          />
                        )}
                      </View>
                      <View className="flex-1 justify-center">
                        <Text className="font-black text-emerald-950 text-sm">
                          {loc.name}
                        </Text>
                        <Text className="text-xs font-medium text-slate-500 mt-0.5">
                          {loc.address}
                        </Text>
                      </View>
                      <View className="justify-center ml-2">
                        {isSelected ? (
                          <Text className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-100 px-2 py-1 rounded-full">
                            Đã chọn
                          </Text>
                        ) : (
                          <Plus size={20} color="#cbd5e1" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="h-20" />
          </ScrollView>

          {/* Action Buttons */}
          <View className="p-4 bg-white border-t border-slate-100 flex-row gap-3">
            <TouchableOpacity
              onPress={handleClear}
              className="flex-1 border border-slate-200 py-4 rounded-2xl items-center justify-center bg-slate-50"
            >
              <Text className="text-slate-600 font-black text-sm uppercase tracking-wider">
                Xóa tất cả
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApply}
              disabled={selectedLocations.length === 0}
              className={`flex-1 py-4 rounded-2xl items-center justify-center ${
                selectedLocations.length === 0 ? 'bg-slate-300' : 'bg-emerald-600'
              }`}
            >
              <Text className="text-white font-black text-sm uppercase tracking-wider">
                Áp dụng ({selectedLocations.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
