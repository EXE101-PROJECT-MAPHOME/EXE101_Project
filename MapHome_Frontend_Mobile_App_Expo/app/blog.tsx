import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ROUTES, { navigateTo } from "@/constants/routes";
import {
  ArrowLeft,
  Search,
  Bookmark,
  BookmarkCheck,
  Clock3,
  Eye,
  Tag,
} from "lucide-react-native";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

type BlogPost = {
  id?: string;
  _id?: string;
  title: string;
  excerpt: string;
  author?: string;
  date?: string;
  image?: string;
  category?: string;
  readTime?: string;
  views?: number;
  tags?: string[];
};

const CATEGORIES = [
  "Tất cả",
  "Kinh nghiệm",
  "Hướng dẫn",
  "Thị trường",
  "Pháp luật",
  "Mẹo hay",
  "Tính năng",
];

export default function BlogScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [blogsRes, savedRes] = await Promise.all([
          api.get("/api/blogs").catch(() => ({ data: [] })),
          isAuthenticated
            ? api.get("/api/blogs/me/saved").catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
        ]);

        const mapped = (blogsRes.data || []).map((item: any) => ({
          ...item,
          id: item._id || item.id,
        }));

        setPosts(mapped);

        const savedIds = new Set<string>(
          (savedRes.data || []).map((item: any) => String(item._id || item.id)),
        );
        setBookmarked(savedIds);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const filteredPosts = useMemo(() => {
    return posts
      .filter((p) => category === "Tất cả" || p.category === category)
      .filter((p) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          p.title?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      });
  }, [posts, category, query]);

  const toggleSave = async (postId: string) => {
    if (!isAuthenticated) {
      Alert.alert("Cần đăng nhập", "Vui lòng đăng nhập để lưu bài viết.", [
        { text: "Để sau", style: "cancel" },
        { text: "Đăng nhập", onPress: () => navigateTo(router, ROUTES.LOGIN) },
      ]);
      return;
    }

    try {
      setSavingId(postId);
      const res = await api.post(`/api/blogs/${postId}/save`);
      const isSaved = !!res.data?.isSaved;
      setBookmarked((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(postId);
        else next.delete(postId);
        return next;
      });
    } catch {
      Alert.alert("Lỗi", "Không thể lưu bài viết. Vui lòng thử lại.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <View className="px-4 py-4 bg-white border-b border-slate-100 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3"
        >
          <ArrowLeft size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-2xl font-black text-emerald-700">
          Blog MapHome
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <View className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-3xl p-5 mb-4">
          <Text className="text-white text-xl font-black">
            Kiến thức & Kinh nghiệm thuê trọ
          </Text>
          <Text className="text-emerald-50 mt-1">
            Cập nhật bài viết hữu ích từ cộng đồng MapHome.
          </Text>
        </View>

        <View className="bg-white rounded-2xl border border-slate-200 h-12 px-3 flex-row items-center mb-4">
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm kiếm bài viết..."
            className="flex-1 ml-2"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setCategory(item)}
              className={`px-4 py-2 rounded-full mr-2 border ${category === item ? "bg-emerald-600 border-emerald-600" : "bg-white border-slate-200"}`}
            >
              <Text
                className={`font-bold text-xs ${category === item ? "text-white" : "text-slate-700"}`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color="#059669" />
          </View>
        ) : filteredPosts.length === 0 ? (
          <View className="py-16 items-center justify-center">
            <Text className="text-slate-500 font-bold">
              Không có bài viết phù hợp.
            </Text>
          </View>
        ) : (
          filteredPosts.map((post) => {
            const pid = String(post.id || post._id || "");
            const isSaved = bookmarked.has(pid);
            return (
              <View
                key={pid}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden mb-4"
              >
                {post.image ? (
                  <Image
                    source={{ uri: post.image }}
                    className="w-full h-44"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-44 bg-slate-100 items-center justify-center">
                    <Text className="text-slate-400 font-bold">
                      Không có ảnh
                    </Text>
                  </View>
                )}

                <View className="p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg flex-row items-center">
                      <Tag size={12} color="#059669" />
                      <Text className="text-[10px] text-emerald-700 font-bold ml-1">
                        {post.category || "Bài viết"}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => toggleSave(pid)}
                      disabled={savingId === pid}
                    >
                      {savingId === pid ? (
                        <ActivityIndicator size="small" color="#059669" />
                      ) : isSaved ? (
                        <BookmarkCheck size={18} color="#059669" />
                      ) : (
                        <Bookmark size={18} color="#64748b" />
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text
                    className="text-base font-black text-emerald-700 mb-2"
                    numberOfLines={2}
                  >
                    {post.title}
                  </Text>
                  <Text className="text-slate-600 mb-3" numberOfLines={3}>
                    {post.excerpt}
                  </Text>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Clock3 size={12} color="#94a3b8" />
                      <Text className="text-xs text-slate-500 ml-1">
                        {post.readTime || "5 phút đọc"}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Eye size={12} color="#94a3b8" />
                      <Text className="text-xs text-slate-500 ml-1">
                        {post.views || 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
