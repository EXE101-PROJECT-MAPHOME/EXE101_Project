import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  Filter,
  X,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { RentalFilters, defaultFilters } from '../constants/filters';

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
  const [draftFilters, setDraftFilters] = useState<RentalFilters>(filters);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    area: true,
    amenities: true,
    verification: false,
    availability: true,
  });

  const handleOpen = () => {
    setDraftFilters(filters);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleReset = () => {
    setDraftFilters(defaultFilters);
  };

  const handleApply = () => {
    onFiltersChange(draftFilters);
    setIsOpen(false);
  };

  const updateFilter = <K extends keyof RentalFilters>(
    key: K,
    value: RentalFilters[K]
  ) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const updateAmenity = (
    amenity: keyof RentalFilters['amenities'],
    value: boolean
  ) => {
    setDraftFilters((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [amenity]: value },
    }));
  };

  const selectedAmenitiesCount = Object.values(draftFilters.amenities).filter(
    Boolean
  ).length;

  const renderRadio = (
    value: string,
    currentValue: string,
    label: string,
    onSelect: () => void
  ) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onSelect}
      className={`flex-row items-center p-3 rounded-xl border mb-2 ${
        value === currentValue
          ? 'bg-emerald-50 border-emerald-500'
          : 'bg-white border-slate-200'
      }`}
    >
      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
          value === currentValue ? 'border-emerald-600' : 'border-slate-300'
        }`}
      >
        {value === currentValue && (
          <View className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
        )}
      </View>
      <Text
        className={`font-bold flex-1 ${
          value === currentValue ? 'text-emerald-800' : 'text-slate-600'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        onPress={handleOpen}
        className="flex-row items-center px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100 self-start"
      >
        <Filter size={16} color="#059669" className="mr-2" />
        <Text className="text-emerald-700 font-bold">Lọc & Sắp xếp</Text>
        {activeFiltersCount > 0 && (
          <View className="ml-2 w-5 h-5 rounded-full bg-emerald-600 items-center justify-center">
            <Text className="text-white text-[10px] font-black">
              {activeFiltersCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View className="flex-1 bg-slate-50">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 bg-white border-b border-slate-100">
            <Text className="text-xl font-black text-emerald-950">Bộ lọc</Text>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={handleReset} className="mr-4">
                <Text className="text-emerald-600 font-bold">Đặt lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClose}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {/* Sort By */}
            <View className="mb-6">
              <Text className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                Sắp xếp theo
              </Text>
              {[
                { value: 'distance', label: 'Khoảng cách gần nhất' },
                { value: 'price-asc', label: 'Giá thấp đến cao' },
                { value: 'price-desc', label: 'Giá cao đến thấp' },
                { value: 'area', label: 'Diện tích lớn nhất' },
              ].map((item) =>
                renderRadio(
                  item.value,
                  draftFilters.sortBy,
                  item.label,
                  () => updateFilter('sortBy', item.value as any)
                )
              )}
            </View>

            {/* Price Range */}
            <View className="mb-6">
              <TouchableOpacity
                onPress={() => toggleSection('price')}
                className="flex-row items-center justify-between py-2"
              >
                <Text className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Khoảng giá (VNĐ)
                </Text>
                {expandedSections.price ? (
                  <ChevronUp size={20} color="#94a3b8" />
                ) : (
                  <ChevronDown size={20} color="#94a3b8" />
                )}
              </TouchableOpacity>
              {expandedSections.price && (
                <View className="flex-row items-center mt-2">
                  <View className="flex-1">
                    <TextInput
                      className="bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700"
                      keyboardType="numeric"
                      placeholder="Từ (VD: 1000000)"
                      value={draftFilters.priceRange[0].toString()}
                      onChangeText={(val) => {
                        const num = parseInt(val) || 0;
                        updateFilter('priceRange', [num, draftFilters.priceRange[1]]);
                      }}
                    />
                  </View>
                  <Text className="mx-2 text-slate-400 font-bold">-</Text>
                  <View className="flex-1">
                    <TextInput
                      className="bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700"
                      keyboardType="numeric"
                      placeholder="Đến (VD: 5000000)"
                      value={draftFilters.priceRange[1].toString()}
                      onChangeText={(val) => {
                        const num = parseInt(val) || 0;
                        updateFilter('priceRange', [draftFilters.priceRange[0], num]);
                      }}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Amenities */}
            <View className="mb-6">
              <TouchableOpacity
                onPress={() => toggleSection('amenities')}
                className="flex-row items-center justify-between py-2"
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Tiện nghi
                  </Text>
                  {selectedAmenitiesCount > 0 && (
                    <View className="w-5 h-5 rounded-full bg-emerald-600 items-center justify-center">
                      <Text className="text-[10px] text-white font-black">
                        {selectedAmenitiesCount}
                      </Text>
                    </View>
                  )}
                </View>
                {expandedSections.amenities ? (
                  <ChevronUp size={20} color="#94a3b8" />
                ) : (
                  <ChevronDown size={20} color="#94a3b8" />
                )}
              </TouchableOpacity>
              {expandedSections.amenities && (
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {Object.entries(draftFilters.amenities).map(([key, val]) => {
                    const labels: Record<string, string> = {
                      wifi: 'WiFi',
                      furniture: 'Nội thất',
                      tv: 'TV',
                      washingMachine: 'Máy giặt',
                      kitchen: 'Bếp',
                      refrigerator: 'Tủ lạnh',
                      airConditioner: 'Máy lạnh',
                    };
                    const isChecked = val as boolean;
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => updateAmenity(key as any, !isChecked)}
                        className={`px-4 py-2 rounded-xl border ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <Text
                          className={`font-bold ${
                            isChecked ? 'text-white' : 'text-slate-600'
                          }`}
                        >
                          {labels[key] || key}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Availability & Verification */}
            <View className="mb-6">
              <Text className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                Tình trạng & Xác thực
              </Text>
              {[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'available', label: 'Chỉ hiển thị còn phòng' },
              ].map((item) =>
                renderRadio(
                  item.value,
                  draftFilters.availability,
                  item.label,
                  () => updateFilter('availability', item.value as any)
                )
              )}
              <View className="h-2" />
              {[
                { value: 'all', label: 'Tất cả mức xác thực' },
                { value: 'verified', label: 'Chỉ hiển thị tin đã xác thực GPS' },
              ].map((item) =>
                renderRadio(
                  item.value,
                  draftFilters.verificationLevel,
                  item.label,
                  () => updateFilter('verificationLevel', item.value as any)
                )
              )}
            </View>

            <View className="h-20" />
          </ScrollView>

          {/* Footer Apply Button */}
          <View className="p-4 bg-white border-t border-slate-100">
            <TouchableOpacity
              onPress={handleApply}
              className="w-full bg-emerald-600 py-4 rounded-2xl items-center justify-center shadow-sm"
            >
              <Text className="text-white font-black text-base uppercase tracking-wider">
                Áp dụng thay đổi
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
