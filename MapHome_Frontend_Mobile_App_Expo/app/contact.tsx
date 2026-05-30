import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Send,
  Clock3,
} from "lucide-react-native";
import api from "../utils/api";

export default function ContactScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const submit = async () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.subject.trim() ||
      !form.message.trim()
    ) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/contacts", form);
      Alert.alert(
        "Thành công",
        "Đã gửi liên hệ. Chúng tôi sẽ phản hồi sớm nhất.",
      );
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Không thể gửi liên hệ.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3"
          >
            <ArrowLeft size={18} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-2xl font-black text-emerald-950">Liên hệ</Text>
        </View>

        <View className="mx-4 mt-4 rounded-3xl bg-gradient-to-r from-emerald-600 to-blue-600 p-5">
          <Text className="text-white text-xl font-black mb-1">
            MapHome Support
          </Text>
          <Text className="text-emerald-50">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn 7 ngày/tuần.
          </Text>
        </View>

        <View className="mx-4 mt-4 bg-white rounded-3xl p-5 border border-slate-100">
          <Text className="text-base font-black text-emerald-950 mb-4">
            Thông tin liên hệ
          </Text>

          <TouchableOpacity
            className="flex-row items-start mb-4"
            onPress={() => Linking.openURL("mailto:support@timnhatro.vn")}
          >
            <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center mr-3">
              <Mail size={18} color="#059669" />
            </View>
            <View>
              <Text className="text-xs text-slate-400 font-semibold">
                Email
              </Text>
              <Text className="text-slate-800 font-bold">
                support@timnhatro.vn
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-start mb-4"
            onPress={() => Linking.openURL("tel:0243654321")}
          >
            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
              <Phone size={18} color="#2563eb" />
            </View>
            <View>
              <Text className="text-xs text-slate-400 font-semibold">
                Điện thoại
              </Text>
              <Text className="text-slate-800 font-bold">024 3654 321</Text>
            </View>
          </TouchableOpacity>

          <View className="flex-row items-start mb-4">
            <View className="w-10 h-10 rounded-xl bg-purple-50 items-center justify-center mr-3">
              <MapPin size={18} color="#7c3aed" />
            </View>
            <View>
              <Text className="text-xs text-slate-400 font-semibold">
                Địa chỉ
              </Text>
              <Text className="text-slate-800 font-bold">
                Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội
              </Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center mr-3">
              <Clock3 size={18} color="#d97706" />
            </View>
            <View>
              <Text className="text-xs text-slate-400 font-semibold">
                Giờ làm việc
              </Text>
              <Text className="text-slate-800 font-bold">
                Thứ 2 - Thứ 6: 8:00 - 18:00
              </Text>
              <Text className="text-slate-700 font-semibold text-xs">
                Thứ 7: 9:00 - 17:00
              </Text>
            </View>
          </View>
        </View>

        <View className="mx-4 mt-4 bg-white rounded-3xl p-5 border border-slate-100">
          <Text className="text-base font-black text-emerald-950 mb-4">
            Gửi tin nhắn
          </Text>

          <TextInput
            value={form.name}
            onChangeText={(v) => setForm((prev) => ({ ...prev, name: v }))}
            placeholder="Họ tên *"
            className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 mb-3"
          />
          <TextInput
            value={form.email}
            onChangeText={(v) => setForm((prev) => ({ ...prev, email: v }))}
            placeholder="Email *"
            keyboardType="email-address"
            autoCapitalize="none"
            className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 mb-3"
          />
          <TextInput
            value={form.phone}
            onChangeText={(v) => setForm((prev) => ({ ...prev, phone: v }))}
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 mb-3"
          />
          <TextInput
            value={form.subject}
            onChangeText={(v) => setForm((prev) => ({ ...prev, subject: v }))}
            placeholder="Chủ đề *"
            className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 mb-3"
          />
          <TextInput
            value={form.message}
            onChangeText={(v) => setForm((prev) => ({ ...prev, message: v }))}
            placeholder="Nội dung *"
            multiline
            textAlignVertical="top"
            className="min-h-[110px] px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 mb-4"
          />

          <TouchableOpacity
            onPress={submit}
            disabled={loading}
            className="h-12 rounded-xl bg-emerald-600 items-center justify-center flex-row"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Send size={16} color="white" />
                <Text className="text-white font-black ml-2">Gửi liên hệ</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
