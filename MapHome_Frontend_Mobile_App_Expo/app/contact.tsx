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
  ChevronDown,
} from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import ROUTES, { safeBack } from "@/constants/routes";
import api from "../utils/api";
import { LinearGradient } from "expo-linear-gradient";

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
  const tint = useThemeColor({}, "tint");
  const info = useThemeColor({}, "info");
  const warning = useThemeColor({}, "warning");
  const icon = useThemeColor({}, "icon");

  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs = [
    { q: "Làm sao để xác thực tài khoản?", a: "Bạn có thể xác thực qua SMS OTP hoặc GPS trực tiếp khi đăng tin trọ." },
    { q: "Có mất phí khi đăng tin không?", a: "Hiện tại dịch vụ hoàn toàn miễn phí cho tất cả chủ trọ." },
    { q: "Làm sao để báo cáo lừa đảo?", a: "Vui lòng liên hệ support@timnhatro.vn hoặc dùng tính năng báo cáo trực tiếp trong tin đăng." },
    { q: "Hỗ trợ 24/7 không?", a: "Đội ngũ chuyên viên sẽ phản hồi bạn trong giờ làm việc (8h-18h hàng ngày)." },
  ];

  const submit = async () => {
    if (!form.name.trim()) {
      Alert.alert("Lỗi", "Họ và tên không được để trống.");
      return;
    }
    if (form.name.trim().length < 2) {
      Alert.alert("Lỗi", "Họ và tên phải có ít nhất 2 ký tự.");
      return;
    }
    if (!form.email.trim()) {
      Alert.alert("Lỗi", "Email không được để trống.");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email.trim())) {
      Alert.alert("Lỗi", "Định dạng email không hợp lệ.");
      return;
    }
    if (form.phone.trim()) {
      const phonePattern = /^(?:\+?84|0)(3|5|7|8|9)[0-9]{8}$/;
      if (!phonePattern.test(form.phone.trim().replace(/\s/g, ""))) {
        Alert.alert("Lỗi", "Số điện thoại không hợp lệ. Ví dụ: 0912345678");
        return;
      }
    }
    if (!form.subject.trim()) {
      Alert.alert("Lỗi", "Chủ đề không được để trống.");
      return;
    }
    if (!form.message.trim()) {
      Alert.alert("Lỗi", "Nội dung tin nhắn không được để trống.");
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
            onPress={() => safeBack(router)}
            className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3"
          >
            <ArrowLeft size={18} color={icon} />
          </TouchableOpacity>
          <Text className="text-2xl font-black text-emerald-700">Liên hệ</Text>
        </View>

        <LinearGradient
          colors={['#16a34a', '#2563eb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="mx-4 mt-4 rounded-3xl p-5"
        >
          <Text className="text-white text-xl font-black mb-1">
            MapHome Support
          </Text>
          <Text className="text-emerald-50">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn 7 ngày/tuần.
          </Text>
        </LinearGradient>

        <View className="mx-4 mt-4 bg-white rounded-3xl p-5 border border-slate-100">
          <Text className="text-base font-black text-emerald-700 mb-4">
            Thông tin liên hệ
          </Text>

          <TouchableOpacity
            className="flex-row items-start mb-4"
            onPress={() => Linking.openURL("mailto:support@timnhatro.vn")}
          >
            <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center mr-3">
              <Mail size={18} color={tint} />
            </View>
            <View>
              <Text className="text-xs text-slate-400 font-semibold">
                Email
              </Text>
              <Text className="text-slate-800 font-bold">
                Maphome2026@gmail.com
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-start mb-4"
            onPress={() => Linking.openURL("tel:0243654321")}
          >
            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
              <Phone size={18} color={info} />
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
              <MapPin size={18} color={info} />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-400 font-semibold">
                Địa chỉ
              </Text>
              <Text className="text-slate-800 font-bold">
                Số 1, Đại Cồ Việt{"\n"}Hai Bà Trưng, Hà Nội
              </Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center mr-3">
              <Clock3 size={18} color={warning} />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-400 font-semibold">
                Giờ làm việc
              </Text>
              <Text className="text-slate-800 font-bold">
                Thứ 2 - Thứ 6: 8:00 - 18:00
              </Text>
              <Text className="text-slate-800 font-bold">
                Thứ 7: 9:00 - 17:00
              </Text>
              <Text className="text-slate-500 font-semibold text-xs mt-0.5">
                Chủ nhật: Nghỉ
              </Text>
            </View>
          </View>
        </View>

        <View className="mx-4 mt-4 bg-white rounded-3xl p-5 border border-slate-100">
          <Text className="text-base font-black text-emerald-700 mb-4">
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

        <View className="mx-4 mt-4 bg-white rounded-3xl p-5 border border-slate-100 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-1.5 h-6 bg-blue-500 rounded-full mr-2" />
            <Text className="text-base font-black text-slate-800">
              Câu hỏi thường gặp
            </Text>
          </View>

          {faqs.map((faq, index) => {
            const isOpen = expandedFAQ === index;
            return (
              <View
                key={index}
                className="py-3 border-b border-slate-100 last:border-b-0"
              >
                <TouchableOpacity
                  onPress={() => setExpandedFAQ(isOpen ? null : index)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between"
                >
                  <Text className="text-slate-800 font-bold flex-1 pr-4">
                    <Text className="text-blue-600 font-bold">Q: </Text>
                    {faq.q}
                  </Text>
                  <ChevronDown
                    size={16}
                    color="#64748b"
                    style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                  />
                </TouchableOpacity>
                {isOpen && (
                  <View className="mt-2 pl-4">
                    <Text className="text-slate-600 text-sm leading-relaxed">
                      {faq.a}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
