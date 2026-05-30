import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  HelpCircle,
  ShieldCheck,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import api from "../utils/api";

const FAQS = [
  {
    question: "Làm sao để tìm trọ gần nơi làm việc hoặc trường học?",
    answer:
      "Bạn có thể vào màn Bản đồ, nhập địa điểm và dùng bộ lọc khoảng cách để tìm phòng phù hợp.",
  },
  {
    question: "Ý nghĩa của xác thực Trust is King là gì?",
    answer:
      "Tin có xác thực GPS được chủ trọ xác nhận vị trí tại chỗ, giúp tăng độ tin cậy khi xem phòng.",
  },
  {
    question: "MapHome có thu phí người tìm trọ không?",
    answer:
      "Hiện tại MapHome không thu phí người tìm trọ. Bạn có thể sử dụng các tính năng cốt lõi miễn phí.",
  },
  {
    question: "Tôi phát hiện tin giả thì làm gì?",
    answer:
      "Hãy liên hệ hỗ trợ hoặc báo cáo ngay trong ứng dụng để đội ngũ kiểm duyệt xử lý.",
  },
];

export default function PolicyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/api/settings/public");
        const policies = res.data?.policies || {};
        setTerms(
          policies.termsOfService || "Điều khoản dịch vụ đang được cập nhật.",
        );
        setPrivacy(
          policies.privacyPolicy || "Chính sách bảo mật đang được cập nhật.",
        );
      } catch {
        setTerms("Điều khoản dịch vụ đang được cập nhật.");
        setPrivacy("Chính sách bảo mật đang được cập nhật.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3"
        >
          <ArrowLeft size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-2xl font-black text-emerald-950">
          Trợ giúp & Chính sách
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#059669" size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        >
          <View className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-5 mb-4">
            <HelpCircle size={28} color="white" />
            <Text className="text-white text-xl font-black mt-2">
              Thông tin pháp lý và hướng dẫn
            </Text>
            <Text className="text-emerald-50 mt-1">
              Tổng hợp FAQ, điều khoản sử dụng và chính sách bảo mật của
              MapHome.
            </Text>
          </View>

          <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-4">
            <View className="flex-row items-center mb-3">
              <ShieldCheck size={18} color="#059669" />
              <Text className="text-base font-black text-emerald-950 ml-2">
                FAQ nhanh
              </Text>
            </View>

            {FAQS.map((item, index) => {
              const opened = expandedFaq === index;
              return (
                <View key={index} className="border-b border-slate-100 py-2">
                  <TouchableOpacity
                    onPress={() => setExpandedFaq(opened ? null : index)}
                    className="flex-row items-center justify-between py-2"
                  >
                    <Text className="font-bold text-slate-800 flex-1 pr-3">
                      {item.question}
                    </Text>
                    {opened ? (
                      <ChevronUp size={16} color="#64748b" />
                    ) : (
                      <ChevronDown size={16} color="#64748b" />
                    )}
                  </TouchableOpacity>
                  {opened && (
                    <Text className="text-slate-600 leading-6 pb-2">
                      {item.answer}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-4">
            <View className="flex-row items-center mb-3">
              <FileText size={18} color="#0f766e" />
              <Text className="text-base font-black text-emerald-950 ml-2">
                Điều khoản dịch vụ
              </Text>
            </View>
            <Text className="text-slate-700 leading-6">{terms}</Text>
          </View>

          <View className="bg-white rounded-3xl p-5 border border-slate-100">
            <View className="flex-row items-center mb-3">
              <FileText size={18} color="#2563eb" />
              <Text className="text-base font-black text-emerald-950 ml-2">
                Chính sách bảo mật
              </Text>
            </View>
            <Text className="text-slate-700 leading-6">{privacy}</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
