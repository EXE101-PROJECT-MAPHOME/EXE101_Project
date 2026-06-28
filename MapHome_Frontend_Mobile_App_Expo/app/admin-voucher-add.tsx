import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Ticket, Calendar as CalendarIcon, Check, X, ShieldCheck } from 'lucide-react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import ROUTES, { safeBack } from "@/constants/routes";
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminVoucherAddScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [code, setCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [showOnHome, setShowOnHome] = useState(false);
  
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 86400000));
  const [isActive, setIsActive] = useState(true);
  
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check auth
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-emerald-700 font-black text-xl text-center mb-3">Truy cập bị từ chối</Text>
      </SafeAreaView>
    );
  }

  const handleConfirmDate = (date: Date) => {
    if (datePickerType === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setDatePickerVisibility(false);
  };

  const showDatePicker = (type: 'start' | 'end') => {
    setDatePickerType(type);
    setDatePickerVisibility(true);
  };

  const handleSave = async () => {
    if (!code || !discountPercentage) {
      Alert.alert("Lỗi", "Vui lòng nhập Mã Voucher và % Giảm giá");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: code.toUpperCase(),
        discountPercentage: Number(discountPercentage),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        maxUses: maxUses ? Number(maxUses) : null,
        isActive,
        title,
        description,
        bannerImage,
        showOnHome,
      };

      await api.post("/api/vouchers", payload);
      Alert.alert("Thành công", "Tạo voucher thành công!", [
        { text: "OK", onPress: () => safeBack(router, ROUTES.ADMIN_DASHBOARD) }
      ]);
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể tạo voucher");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <LinearGradient
          colors={['#16a34a', '#4f46e5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-4 py-4 flex-row items-center"
        >
          <TouchableOpacity 
            onPress={() => safeBack(router)}
            className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center mr-3"
          >
            <ArrowLeft size={18} color="white" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-black text-white">Thêm Mã Giảm Giá</Text>
            <Text className="text-xs text-emerald-100 font-bold">Thiết lập khuyến mãi mới</Text>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          
          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
            <Text className="font-bold text-slate-700 mb-2">Mã Voucher (Code) *</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="VD: MAPHOME2026"
              autoCapitalize="characters"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 font-bold text-slate-800 uppercase mb-4"
            />

            <Text className="font-bold text-slate-700 mb-2">Phần trăm giảm (%) *</Text>
            <TextInput
              value={discountPercentage}
              onChangeText={setDiscountPercentage}
              placeholder="1-100"
              keyboardType="number-pad"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 font-bold text-slate-800 mb-4"
            />

            <Text className="font-bold text-slate-700 mb-2">Giới hạn số lần dùng (để trống: vô hạn)</Text>
            <TextInput
              value={maxUses}
              onChangeText={setMaxUses}
              placeholder="VD: 100"
              keyboardType="number-pad"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 font-bold text-slate-800 mb-4"
            />
          </View>

          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
            <View className="flex-row justify-between mb-4">
              <View className="w-[48%]">
                <Text className="font-bold text-slate-700 mb-2 flex-row"><CalendarIcon size={14} color="#64748b" /> Ngày bắt đầu</Text>
                <TouchableOpacity 
                  onPress={() => showDatePicker('start')}
                  className="h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 justify-center"
                >
                  <Text className="font-bold text-slate-800">{startDate.toLocaleDateString('vi-VN')}</Text>
                </TouchableOpacity>
              </View>

              <View className="w-[48%]">
                <Text className="font-bold text-slate-700 mb-2 flex-row"><CalendarIcon size={14} color="#64748b" /> Ngày kết thúc</Text>
                <TouchableOpacity 
                  onPress={() => showDatePicker('end')}
                  className="h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 justify-center"
                >
                  <Text className="font-bold text-slate-800">{endDate.toLocaleDateString('vi-VN')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text className="font-bold text-slate-700 mb-3">Trạng thái Kích hoạt</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={() => setIsActive(true)}
                className={`flex-1 h-12 rounded-xl flex-row items-center justify-center border ${isActive ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200'}`}
              >
                {isActive && <Check size={16} color="#22c55e" />}
                <Text className={`font-bold ml-2 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>Hoạt động</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setIsActive(false)}
                className={`flex-1 h-12 rounded-xl flex-row items-center justify-center border ${!isActive ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-slate-200'}`}
              >
                {!isActive && <X size={16} color="#ef4444" />}
                <Text className={`font-bold ml-2 ${!isActive ? 'text-red-700' : 'text-slate-500'}`}>Tạm dừng</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
            <Text className="font-black text-emerald-700 text-base mb-4">Cấu hình Quảng cáo</Text>

            <Text className="font-bold text-slate-700 mb-2">Tiêu đề quảng cáo</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="VD: Siêu Sale Mùa Tựu Trường"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 font-bold text-slate-800 mb-4"
            />

            <Text className="font-bold text-slate-700 mb-2">Mô tả quảng cáo</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="VD: Giảm 50% gói VIP cho sinh viên"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 font-bold text-slate-800 mb-4"
            />

            <Text className="font-bold text-slate-700 mb-2">Link ảnh Banner (URL)</Text>
            <TextInput
              value={bannerImage}
              onChangeText={setBannerImage}
              placeholder="https://example.com/banner.jpg"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 font-bold text-slate-800 mb-4"
            />

            <Text className="font-bold text-slate-700 mb-3">Hiển thị lên Trang chủ</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={() => setShowOnHome(true)}
                className={`flex-1 h-12 rounded-xl flex-row items-center justify-center border ${showOnHome ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200'}`}
              >
                {showOnHome && <Check size={16} color="#22c55e" />}
                <Text className={`font-bold ml-2 ${showOnHome ? 'text-emerald-700' : 'text-slate-500'}`}>Hiển thị</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setShowOnHome(false)}
                className={`flex-1 h-12 rounded-xl flex-row items-center justify-center border ${!showOnHome ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-slate-200'}`}
              >
                {!showOnHome && <X size={16} color="#ef4444" />}
                <Text className={`font-bold ml-2 ${!showOnHome ? 'text-red-700' : 'text-slate-500'}`}>Ẩn</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-4 shadow-lg">
        <TouchableOpacity 
          onPress={handleSave}
          disabled={isSubmitting}
          className={`${isSubmitting ? 'bg-emerald-800/50' : 'bg-emerald-600'} h-14 rounded-2xl flex-row items-center justify-center`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ticket size={18} color="white" />
              <Text className="text-white font-black text-lg ml-2">Lưu Voucher</Text>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={datePickerType === 'start' ? startDate : endDate}
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisibility(false)}
      />
    </SafeAreaView>
  );
}
