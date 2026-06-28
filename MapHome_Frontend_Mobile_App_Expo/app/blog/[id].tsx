import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Clock, Eye, Heart, MessageCircle, Bookmark, Calendar } from "lucide-react-native";
import api from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import CustomAlert from "../../components/CustomAlert";

export default function BlogDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isAuthenticated, user } = useAuth();

  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    onConfirm: () => {},
    hideButtons: false,
  });

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "info" = "info",
    onConfirm = () => {},
    hideButtons = false,
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm,
      hideButtons,
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/blogs/${id}`);
        setBlog(res.data);
      } catch (err) {
        showAlert("Lỗi", "Không thể tải chi tiết bài viết.", "error", () => router.back());
      } finally {
        setLoading(false);
      }
    };

    const checkSaved = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await api.get("/api/blogs/me/saved");
        const savedIds = new Set<string | number>(res.data.map((b: any) => b._id));
        if (savedIds.has(id as string)) {
          setIsSaved(true);
        }
      } catch (err) {
        console.log(err);
      }
    };

    if (id) {
      fetchBlog();
      checkSaved();
    }
  }, [id, isAuthenticated]);

  const toggleBookmark = async () => {
    if (!isAuthenticated) {
      showAlert("Thông báo", "Vui lòng đăng nhập để lưu bài viết.", "info", () => {
        hideAlert();
        router.push("/login");
      });
      return;
    }
    try {
      const res = await api.post(`/api/blogs/${id}/save`);
      setIsSaved(res.data.isSaved);
      showAlert("Thành công", res.data.isSaved ? "Đã lưu bài viết." : "Đã bỏ lưu bài viết.", "success", hideAlert, true);
      setTimeout(hideAlert, 1500);
    } catch (err) {
      showAlert("Lỗi", "Không thể lưu bài viết.", "error");
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
      </SafeAreaView>
    );
  }

  if (!blog) return null;

  // Simple HTML stripper for mobile since we don't have react-native-render-html
  const plainTextContent = (blog.content || blog.excerpt || "Chưa có nội dung chi tiết.").replace(/<[^>]+>/g, '');

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          alertConfig.onConfirm();
          hideAlert();
        }}
        hideButtons={alertConfig.hideButtons}
      />
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 bg-white z-10 shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center"
        >
          <ArrowLeft size={20} color="#334155" />
        </TouchableOpacity>
        <Text className="font-bold text-slate-800 text-base">Bài viết</Text>
        <TouchableOpacity
          onPress={toggleBookmark}
          className={`w-10 h-10 rounded-full items-center justify-center ${isSaved ? "bg-emerald-100" : "bg-slate-100"}`}
        >
          <Bookmark size={20} color={isSaved ? "#059669" : "#64748b"} fill={isSaved ? "#059669" : "transparent"} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Featured Image */}
        {blog.image ? (
          <Image
            source={{ uri: blog.image }}
            style={{ width, height: 250 }}
            resizeMode="cover"
            className="bg-slate-200"
          />
        ) : (
          <View style={{ width, height: 200 }} className="bg-emerald-50 items-center justify-center">
            <Text className="text-emerald-300 font-bold text-2xl">MapHome Blog</Text>
          </View>
        )}

        <View className="p-5">
          {/* Metadata */}
          <View className="flex-row items-center flex-wrap gap-2 mb-3">
            <View className="bg-emerald-100 px-3 py-1 rounded-full">
              <Text className="text-emerald-700 font-bold text-xs">{blog.category}</Text>
            </View>
            <View className="flex-row items-center">
              <Calendar size={12} color="#94a3b8" />
              <Text className="text-slate-500 text-xs ml-1">{blog.date}</Text>
            </View>
            {blog.readTime && (
              <View className="flex-row items-center">
                <Clock size={12} color="#94a3b8" />
                <Text className="text-slate-500 text-xs ml-1">{blog.readTime}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text className="text-2xl font-black text-slate-900 mb-5 leading-8">
            {blog.title}
          </Text>

          {/* Author Info & Stats */}
          <View className="flex-row items-center justify-between py-4 border-y border-slate-100 mb-6">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-emerald-500 items-center justify-center mr-3">
                <Text className="text-white font-bold text-lg">
                  {blog.authorAvatar || blog.author?.charAt(0) || "A"}
                </Text>
              </View>
              <View>
                <Text className="font-bold text-slate-900">{blog.author || "Tác giả ẩn danh"}</Text>
                <Text className="text-xs text-slate-500">Quản trị viên / Tác giả</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center">
                <Eye size={14} color="#94a3b8" />
                <Text className="text-xs text-slate-500 ml-1 font-semibold">{blog.views || 0}</Text>
              </View>
              <View className="flex-row items-center">
                <Heart size={14} color="#94a3b8" />
                <Text className="text-xs text-slate-500 ml-1 font-semibold">{blog.likes || 0}</Text>
              </View>
            </View>
          </View>

          {/* Content */}
          <Text className="text-slate-700 text-base leading-7 mb-8">
            {plainTextContent}
          </Text>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <View className="flex-row items-center flex-wrap gap-2 mb-10">
              <Text className="text-slate-500 font-bold text-sm">Tags:</Text>
              {blog.tags.map((tag: string) => (
                <View key={tag} className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  <Text className="text-slate-600 font-bold text-xs">#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
