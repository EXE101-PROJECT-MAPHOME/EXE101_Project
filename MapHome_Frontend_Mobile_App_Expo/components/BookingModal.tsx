import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
} from "lucide-react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import api from "@/utils/api";

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  property: any;
}

const TIME_SLOTS = [
  { value: "08:00", label: "08:00 - 09:00" },
  { value: "09:00", label: "09:00 - 10:00" },
  { value: "10:00", label: "10:00 - 11:00" },
  { value: "11:00", label: "11:00 - 12:00" },
  { value: "14:00", label: "14:00 - 15:00" },
  { value: "15:00", label: "15:00 - 16:00" },
  { value: "16:00", label: "16:00 - 17:00" },
  { value: "17:00", label: "17:00 - 18:00" },
  { value: "18:00", label: "18:00 - 19:00" },
  { value: "19:00", label: "19:00 - 20:00" },
];

export function BookingModal({ visible, onClose, property }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Today at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Max date (30 days from today)
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 30);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirmDate = (date: Date) => {
    setSelectedDate(date);
    hideDatePicker();
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
    // Reset state after a short delay
    setTimeout(() => {
      setSelectedDate(undefined);
      setSelectedTime("");
      setCustomerName("");
      setCustomerPhone("");
      setNote("");
      setIsSuccess(false);
    }, 300);
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      Alert.alert("Lỗi", "Vui lòng chọn ngày xem phòng.");
      return;
    }
    if (!selectedTime) {
      Alert.alert("Lỗi", "Vui lòng chọn khung giờ.");
      return;
    }
    if (!customerName.trim() || customerName.trim().length < 2) {
      Alert.alert("Lỗi", "Vui lòng nhập họ tên hợp lệ (ít nhất 2 ký tự).");
      return;
    }
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(customerPhone.replace(/\s/g, ""))) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại hợp lệ.");
      return;
    }

    try {
      setIsLoading(true);
      // Construct ISO date at noon to avoid timezone issues
      const dateToSend = new Date(selectedDate);
      dateToSend.setHours(12, 0, 0, 0);

      const res = await api.post("/api/bookings", {
        propertyId: property.id || property._id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.replace(/\s/g, ""),
        bookingDate: dateToSend.toISOString(),
        bookingTime: selectedTime,
        note: note.trim() || undefined,
      });

      if (res.status === 200 || res.status === 201) {
        setIsSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Đã có lỗi xảy ra khi đặt lịch.";
      Alert.alert("Lỗi đặt lịch", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/50"
      >
        <TouchableOpacity 
          style={{ flex: 1 }} 
          activeOpacity={1} 
          onPress={handleClose} 
        />
        
        <View className="bg-white rounded-t-3xl pt-2 pb-6 max-h-[90%]">
          {/* Handle bar */}
          <View className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-2" />

          {isSuccess ? (
            <View className="items-center justify-center p-8 min-h-[300px]">
              <View className="w-20 h-20 bg-emerald-100 rounded-full items-center justify-center mb-4">
                <CheckCircle2 size={40} color="#059669" />
              </View>
              <Text className="text-2xl font-black text-emerald-700 mb-2">
                Đặt lịch thành công!
              </Text>
              <Text className="text-slate-500 text-center font-medium">
                Chủ nhà sẽ sớm liên hệ lại với bạn.
              </Text>
            </View>
          ) : (
            <>
              {/* Header */}
              <View className="px-5 pb-4 border-b border-slate-100 flex-row items-center justify-between">
                <View>
                  <Text className="text-xl font-black text-slate-800">Đặt lịch xem phòng</Text>
                  <Text className="text-sm text-slate-500 mt-1" numberOfLines={1}>
                    {property?.name} - {property?.address}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} className="p-2 bg-slate-100 rounded-full">
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
                {/* Property Info Mini */}
                <View className="flex-row bg-slate-50 rounded-2xl p-3 mb-6 border border-slate-100">
                  <Image 
                    source={{ uri: property?.image || property?.images?.[0] }} 
                    className="w-16 h-16 rounded-xl mr-3"
                  />
                  <View className="flex-1 justify-center">
                    <Text className="text-sm font-bold text-slate-800 mb-1" numberOfLines={1}>
                      {property?.name}
                    </Text>
                    <Text className="text-sm font-black text-emerald-600">
                      {property?.price?.toLocaleString("vi-VN")} đ/tháng
                    </Text>
                  </View>
                </View>

                {/* Date Selection */}
                <View className="mb-6">
                  <Text className="text-sm font-bold text-slate-700 mb-3 flex-row items-center">
                    Chọn ngày xem nhà *
                  </Text>
                  <TouchableOpacity
                    onPress={showDatePicker}
                    className="flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl"
                  >
                    <View className="flex-row items-center">
                      <CalendarIcon size={20} color="#3b82f6" className="mr-3" />
                      <Text className={`text-base font-medium ${selectedDate ? 'text-slate-800' : 'text-slate-400'}`}>
                        {selectedDate 
                          ? selectedDate.toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' }) 
                          : "Chọn ngày (Tối đa 30 ngày)"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirmDate}
                    onCancel={hideDatePicker}
                    minimumDate={today}
                    maximumDate={maxDate}
                    locale="vi"
                    confirmTextIOS="Xác nhận"
                    cancelTextIOS="Hủy"
                  />
                </View>

                {/* Time Selection */}
                <View className="mb-6">
                  <Text className="text-sm font-bold text-slate-700 mb-3 flex-row items-center">
                    Chọn khung giờ *
                  </Text>
                  <View className="flex-row flex-wrap justify-between">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = selectedTime === slot.value;
                      return (
                        <TouchableOpacity
                          key={slot.value}
                          onPress={() => setSelectedTime(slot.value)}
                          className={`w-[48%] py-3 rounded-xl border mb-3 items-center justify-center ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-500' 
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <Text className={`text-sm font-bold ${
                            isSelected ? 'text-blue-700' : 'text-slate-600'
                          }`}>
                            {slot.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* User Info Form */}
                <View className="mb-6">
                  <View className="mb-4">
                    <Text className="text-sm font-bold text-slate-700 mb-2">Họ tên của bạn *</Text>
                    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1">
                      <User size={18} color="#94a3b8" />
                      <TextInput
                        className="flex-1 text-slate-800 text-base font-medium ml-3 h-12"
                        placeholder="Nguyễn Văn A"
                        placeholderTextColor="#94a3b8"
                        value={customerName}
                        onChangeText={setCustomerName}
                      />
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-bold text-slate-700 mb-2">Số điện thoại *</Text>
                    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1">
                      <Phone size={18} color="#94a3b8" />
                      <TextInput
                        className="flex-1 text-slate-800 text-base font-medium ml-3 h-12"
                        placeholder="0912 345 678"
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                      />
                    </View>
                  </View>

                  <View className="mb-8">
                    <Text className="text-sm font-bold text-slate-700 mb-2">Ghi chú (Tùy chọn)</Text>
                    <View className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                      <TextInput
                        className="text-slate-800 text-base font-medium h-24"
                        placeholder="Thêm ghi chú cho chủ nhà..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        textAlignVertical="top"
                        value={note}
                        onChangeText={setNote}
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Submit Button */}
              <View className="px-5 pt-2 border-t border-slate-100">
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  className="bg-emerald-600 h-14 rounded-2xl flex-row items-center justify-center shadow-sm active:opacity-80"
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <CalendarIcon size={20} color="white" />
                      <Text className="text-white font-black text-lg ml-2">Xác nhận đặt lịch</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
