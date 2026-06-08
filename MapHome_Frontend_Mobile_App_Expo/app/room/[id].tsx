import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  MapPin,
  ShieldCheck,
  Info,
  Wifi,
  Car,
  Wind,
  Tv,
  Sofa,
  WashingMachine,
  Utensils,
  Refrigerator,
  Phone,
  Calendar,
  Send,
  GitCompare,
} from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import api from "@/utils/api";
import { useCompare } from "@/contexts/CompareContext";
import { useAuth } from "@/contexts/AuthContext";
import { RoomMapPreview } from "../../components/RoomMapPreview";
import { BookingModal } from "../../components/BookingModal";
import ROUTES, { navigateTo } from "@/constants/routes";

const { width } = Dimensions.get("window");

export default function RoomDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<"info" | "reviews">("info");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const { isAuthenticated } = useAuth();
  const { addToCompare, removeFromCompare, isInCompare, compareList } =
    useCompare();
  // theme tokens (call hooks once)
  const tint = useThemeColor({}, "tint");
  const icon = useThemeColor({}, "icon");
  const info = useThemeColor({}, "info");
  const danger = useThemeColor({}, "danger");
  const warning = useThemeColor({}, "warning");
  const success = useThemeColor({}, "success");

  // Handle back navigation with fallback to home
  const handleGoBack = () => {
    if (navigation.canGoBack?.()) {
      router.back();
    } else {
      navigateTo(router, ROUTES.HOME, true);
    }
  };

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Loaded states
  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewsList, setReviewsList] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        // 1. Fetch details
        const detailRes = await api.get(`/api/properties/${id}`);
        // 2. Fetch reviews
        const reviewsRes = await api.get(`/api/reviews/property/${id}`);
        
        // 3. Fetch user's favorites if authenticated
        if (isAuthenticated) {
          try {
            const favRes = await api.get("/api/user/me/favorites");
            const favoritesList = favRes.data || [];
            const favIds = favoritesList.map((f: any) => f._id || f);
            setIsFavorite(favIds.includes(id as string));
          } catch (e) {}
        }

        // Map property
        const prop = detailRes.data;
        const mappedProperty = {
          id: prop._id || prop.id,
          _id: prop._id || prop.id,
          name: prop.name || "Phòng trọ cao cấp",
          address: prop.address || "Quận 1, TP. HCM",
          price: prop.price || 3000000,
          area: prop.area || 25,
          image:
            prop.image ||
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
          images:
            prop.images && prop.images.length > 0
              ? prop.images
              : [
                  prop.image ||
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
                ],
          available: prop.available !== undefined ? prop.available : true,
          verificationLevel:
            prop.verificationLevel ||
            (prop.badgeAwarded === "verified" ? "verified" : "none"),
          verifiedAt: prop.verifiedAt || prop.createdAt,
          locationAccuracy: prop.locationAccuracy || 5,
          location:
            prop.location && Array.isArray(prop.location)
              ? [prop.location[0], prop.location[1]]
              : [106.7009, 10.7769],
          amenities: {
            wifi: prop.amenities?.wifi || false,
            parking: prop.amenities?.parking || false,
            ac: prop.amenities?.ac || prop.amenities?.airConditioner || false,
            water: prop.amenities?.water || false,
            tv: prop.amenities?.tv || false,
            furniture: prop.amenities?.furniture || false,
            washingMachine: prop.amenities?.washingMachine || false,
            kitchen: prop.amenities?.kitchen || false,
            refrigerator: prop.amenities?.refrigerator || false,
          },
          description: prop.description || "Không có mô tả chi tiết.",
          landlordId: {
            fullName: prop.ownerName || "Chủ trọ MapHome",
            username: prop.landlordId?.username || "chutro",
            avatar:
              prop.landlordId?.avatar ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
            phone: prop.phone || "0901234567",
            email: prop.landlordId?.email || "chutro@example.com",
          },
        };

        setProperty(mappedProperty);

        // Map reviews
        const mappedReviews = (reviewsRes.data || []).map((r: any) => ({
          id: r._id || r.id,
          userName:
            r.userId?.fullName || r.userId?.username || "Người dùng MapHome",
          userAvatar:
            r.userId?.avatar ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
          rating: r.rating || 5,
          content: r.comment || "",
          createdAt: r.createdAt || new Date().toISOString(),
        }));
        setReviewsList(mappedReviews);

        // 4. Increment views
        api.post(`/api/properties/${id}/view`).catch(() => {});
      } catch (e) {
        console.error("Error fetching room detail", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const avgRating = useMemo(() => {
    if (reviewsList.length === 0) return "0.0";
    const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviewsList.length).toFixed(1);
  }, [reviewsList]);

  // Actions
  const handleShare = async () => {
    if (!property) return;
    try {
      await Share.share({
        message: `Khám phá phòng trọ tuyệt vời này trên MapHome: ${property.name}\nĐịa chỉ: ${property.address}\nGiá: ${property.price.toLocaleString("vi-VN")} đ/tháng`,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const handleCall = () => {
    if (!property) return;
    Linking.openURL(`tel:${property.landlordId.phone}`).catch(() => {
      Alert.alert("Lỗi", "Không thể thực hiện cuộc gọi từ thiết bị này.");
    });
  };

  const handleBook = () => {
    if (!property) return;
    setIsBookingModalVisible(true);
  };

  const handleSendReview = async () => {
    if (!comment.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung đánh giá.");
      return;
    }
    try {
      const res = await api.post("/api/reviews", {
        propertyId: id,
        rating,
        comment: comment.trim(),
      });
      if (res.status === 201 || res.status === 200) {
        const created = res.data;
        const newRev = {
          id: created._id || created.id || `r-local-${Date.now()}`,
          userName: "Bạn (Người dùng)",
          userAvatar:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
          rating: created.rating || rating,
          content: created.comment || comment,
          createdAt: created.createdAt || new Date().toISOString(),
        };
        setReviewsList([newRev, ...reviewsList]);
        setComment("");
        Alert.alert("Thành công", "Cảm ơn bạn đã gửi đánh giá!");
      }
    } catch (e: any) {
      Alert.alert(
        "Lỗi",
        e.response?.data?.message ||
          "Không thể gửi đánh giá. Bạn đã đăng nhập chưa?",
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <ActivityIndicator size="large" color={tint} />
        <Text className="text-slate-500 mt-2 font-semibold">
          Đang tải thông tin phòng trọ...
        </Text>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-xl font-bold text-emerald-700 mb-4">
          Không tìm thấy phòng trọ
        </Text>
        <TouchableOpacity
          onPress={handleGoBack}
          className="bg-emerald-600 px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-bold">Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const activeAmenities = Object.entries(property.amenities)
    .filter(([_, value]) => value)
    .map(([key]) => key);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-50"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Top Image Carousel */}
        <View className="relative h-72 w-full bg-slate-900">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {property.images.map((img: string, i: number) => (
              <Image
                key={i}
                source={{ uri: img }}
                className="h-full"
                style={{ width }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Overlay Buttons */}
          <SafeAreaView className="absolute top-0 left-0 right-0 p-4 flex-row justify-between items-center z-10">
            <TouchableOpacity
              onPress={handleGoBack}
              className="w-10 h-10 bg-black/40 rounded-full items-center justify-center"
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>

            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() =>
                  isInCompare(id as string)
                    ? removeFromCompare(id as string)
                    : addToCompare(property)
                }
                className="w-10 h-10 bg-black/40 rounded-full items-center justify-center mr-2"
              >
                <GitCompare
                  size={20}
                  color={isInCompare(id as string) ? success : "white"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                className="w-10 h-10 bg-black/40 rounded-full items-center justify-center mr-2"
              >
                <Share2 size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!isAuthenticated) {
                    Alert.alert("Lỗi", "Vui lòng đăng nhập để lưu phòng.");
                    return;
                  }
                  if (isTogglingFavorite) return;
                  setIsTogglingFavorite(true);
                  // Optimistic update
                  setIsFavorite(!isFavorite);
                  try {
                    await api.post("/api/user/me/favorites/toggle", { propertyId: id });
                  } catch (e) {
                    // Revert on error
                    setIsFavorite(isFavorite);
                    Alert.alert("Lỗi", "Không thể lưu phòng vào yêu thích.");
                  } finally {
                    setIsTogglingFavorite(false);
                  }
                }}
                disabled={isTogglingFavorite}
                className="w-10 h-10 bg-black/40 rounded-full items-center justify-center"
              >
                <Heart
                  size={20}
                  color={isFavorite ? danger : "white"}
                  fill={isFavorite ? danger : "transparent"}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Image index counter indicator */}
          <View className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-bold">
              1 / {property.images.length}
            </Text>
          </View>
        </View>

        {/* Content Wrapper */}
        <View className="px-4 py-6">
          {/* Main Title Block */}
          <Text className="text-2xl font-black text-emerald-700 mb-2 leading-tight">
            {property.name}
          </Text>

          <View className="flex-row items-center mb-4">
            <MapPin size={16} color={tint} />
            <Text
              className="text-slate-600 text-sm ml-1 flex-1"
              numberOfLines={2}
            >
              {property.address}
            </Text>
          </View>

          {/* Badges bar */}
          <View className="flex-row flex-wrap gap-2 mb-6">
            {property.verificationLevel === "verified" ? (
              <View className="flex-row items-center bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <ShieldCheck size={14} color={tint} />
                <Text className="text-xs text-emerald-700 font-bold ml-1">
                  Đã xác thực GPS (±{property.locationAccuracy}m)
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                <Info size={14} color={warning} />
                <Text className="text-xs text-amber-700 font-bold ml-1">
                  Chưa xác thực
                </Text>
              </View>
            )}
            <View className="flex-row items-center bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <Star size={14} color={warning} fill={warning} />
              <Text className="text-xs text-amber-700 font-bold ml-1">
                {avgRating} ({reviewsList.length} đánh giá)
              </Text>
            </View>
          </View>

          {/* Price & Area grid */}
          <View className="flex-row bg-white rounded-3xl p-5 border border-slate-100 shadow-sm justify-around mb-6">
            <View className="items-center">
              <Text className="text-xs text-slate-400 font-medium mb-1">
                Giá thuê
              </Text>
              <Text className="text-xl font-black text-emerald-600">
                {property.price.toLocaleString("vi-VN")}đ
              </Text>
              <Text className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                / tháng
              </Text>
            </View>
            <View className="w-px bg-slate-100" />
            <View className="items-center">
              <Text className="text-xs text-slate-400 font-medium mb-1">
                Diện tích
              </Text>
              <Text className="text-xl font-black text-emerald-700">
                {property.area} m²
              </Text>
              <Text className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                Diện tích phòng
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <View className="flex-row border-b border-slate-200 mb-6 bg-white rounded-2xl p-1 shadow-sm">
            <TouchableOpacity
              onPress={() => setActiveTab("info")}
              className={`flex-1 py-3 rounded-xl items-center justify-center flex-row ${activeTab === "info" ? "bg-emerald-600" : ""}`}
            >
              <Text
                className={`font-bold text-sm ${activeTab === "info" ? "text-white" : "text-slate-500"}`}
              >
                Thông tin phòng
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("reviews")}
              className={`flex-1 py-3 rounded-xl items-center justify-center flex-row ${activeTab === "reviews" ? "bg-emerald-600" : ""}`}
            >
              <Text
                className={`font-bold text-sm ${activeTab === "reviews" ? "text-white" : "text-slate-500"}`}
              >
                Đánh giá ({reviewsList.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab contents */}
          {activeTab === "info" ? (
            <View className="space-y-6">
              {/* Amenities Grid */}
              <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <Text className="text-lg font-black text-emerald-700 mb-4">
                  Tiện nghi phòng trọ
                </Text>

                <View className="flex-row flex-wrap">
                  {activeAmenities.map((amenity) => (
                    <View
                      key={amenity}
                      className="w-1/2 flex-row items-center mb-4 pr-2"
                    >
                      <View className="w-8 h-8 rounded-xl bg-emerald-50 items-center justify-center text-emerald-600 mr-2 border border-emerald-100">
                        {amenity === "wifi" && <Wifi size={16} color={tint} />}
                        {amenity === "parking" && (
                          <Car size={16} color={tint} />
                        )}
                        {amenity === "ac" && <Wind size={16} color={tint} />}
                        {amenity === "water" && <Info size={16} color={tint} />}
                        {amenity === "tv" && <Tv size={16} color={tint} />}
                        {amenity === "furniture" && (
                          <Sofa size={16} color={tint} />
                        )}
                        {amenity === "washingMachine" && (
                          <WashingMachine size={16} color={tint} />
                        )}
                        {amenity === "kitchen" && (
                          <Utensils size={16} color={tint} />
                        )}
                        {amenity === "refrigerator" && (
                          <Refrigerator size={16} color={tint} />
                        )}
                      </View>
                      <Text className="text-slate-700 text-sm font-semibold capitalize">
                        {amenity === "wifi" && "Wifi tốc độ cao"}
                        {amenity === "parking" && "Chỗ để xe"}
                        {amenity === "ac" && "Điều hòa"}
                        {amenity === "water" && "Nước nóng"}
                        {amenity === "tv" && "Tivi cáp"}
                        {amenity === "furniture" && "Đầy đủ nội thất"}
                        {amenity === "washingMachine" && "Máy giặt"}
                        {amenity === "kitchen" && "Khu bếp riêng"}
                        {amenity === "refrigerator" && "Tủ lạnh"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Description */}
              <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <Text className="text-lg font-black text-emerald-700 mb-3">
                  Mô tả chi tiết
                </Text>
                <Text className="text-slate-600 text-base leading-relaxed font-medium">
                  {property.description}
                </Text>
              </View>

              {/* GPS verification warning if verified */}
              {property.verificationLevel === "verified" && (
                <View className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100">
                  <Text className="text-emerald-700 font-black text-base mb-1">
                    ✓ Vị trí đã xác thực tại chỗ
                  </Text>
                  <Text className="text-emerald-700 text-xs font-medium leading-relaxed">
                    Chủ trọ đã ghim tọa độ này trực tiếp tại địa chỉ phòng trọ
                    qua thiết bị di động. Độ chính xác định vị ghi nhận là ±
                    {property.locationAccuracy} mét. Bạn có thể tin cậy 100% vào
                    bản đồ chỉ đường.
                  </Text>
                </View>
              )}

              {/* Mini Map */}
              <View className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
                <Text className="text-lg font-black text-emerald-700 mb-3">
                  Bản đồ vị trí
                </Text>
                <View className="h-56 w-full rounded-2xl overflow-hidden border border-slate-200">
                  <RoomMapPreview
                    latitude={property.location[1]}
                    longitude={property.location[0]}
                    name={property.name}
                    address={property.address}
                  />
                </View>
              </View>

              {/* Landlord Info */}
              <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-4">
                  <Image
                    source={{ uri: property.landlordId.avatar }}
                    className="w-14 h-14 rounded-2xl mr-3"
                  />
                  <View className="flex-1">
                    <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Chủ trọ đăng tin
                    </Text>
                    <Text className="text-base font-black text-emerald-700">
                      {property.landlordId.fullName}
                    </Text>
                    <Text className="text-xs text-slate-500 font-medium">
                      Hoạt động tích cực
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleCall}
                  className="w-12 h-12 bg-emerald-50 rounded-2xl border border-emerald-100 items-center justify-center"
                >
                  <Phone size={20} color={tint} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="space-y-6">
              {/* Review submit box */}
              <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <Text className="text-lg font-black text-emerald-700 mb-3">
                  Gửi đánh giá của bạn
                </Text>

                {/* Rating selection */}
                <View className="flex-row items-center mb-4">
                  <Text className="text-slate-500 font-bold mr-3 text-sm">
                    Điểm đánh giá:
                  </Text>
                  <View className="flex-row space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                      >
                        <Star
                          size={24}
                          color={warning}
                          fill={star <= rating ? warning : "transparent"}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Comment box */}
                <View className="flex-row bg-slate-50 rounded-2xl border border-slate-200 p-3 mb-4 items-end">
                  <TextInput
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Viết cảm nhận của bạn về phòng trọ..."
                    multiline
                    numberOfLines={3}
                    className="flex-1 text-slate-700 text-sm font-medium mr-2 max-h-24 py-1"
                  />
                  <TouchableOpacity
                    onPress={handleSendReview}
                    className="w-10 h-10 bg-emerald-600 rounded-xl items-center justify-center shadow-sm"
                  >
                    <Send size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reviews List */}
              <View className="space-y-4">
                {reviewsList.length === 0 ? (
                  <View className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 items-center justify-center">
                    <Text className="text-slate-400 font-bold text-center">
                      Chưa có đánh giá nào cho phòng trọ này.
                    </Text>
                  </View>
                ) : (
                  reviewsList.map((rev) => (
                    <View
                      key={rev.id}
                      className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100"
                    >
                      <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-row items-center">
                          <Image
                            source={{ uri: rev.userAvatar }}
                            className="w-10 h-10 rounded-xl mr-2"
                          />
                          <View>
                            <Text className="text-sm font-black text-emerald-700">
                              {rev.userName}
                            </Text>
                            <Text className="text-[10px] text-slate-400 font-bold">
                              {new Date(rev.createdAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg">
                          <Star size={12} color={warning} fill={warning} />
                          <Text className="text-xs font-black text-amber-700 ml-1">
                            {rev.rating}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-slate-600 text-sm leading-relaxed font-semibold">
                        {rev.content}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* Spacer */}
          <View className="h-24" />
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <SafeAreaView
        edges={["bottom"]}
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex-row shadow-[0_-8px_30px_rgb(0,0,0,0.04)]"
      >
        <TouchableOpacity
          onPress={handleCall}
          className="flex-1 bg-slate-50 border border-slate-200 h-14 rounded-2xl flex-row items-center justify-center mr-3"
        >
          <Phone size={18} color={icon} />
          <Text className="text-slate-700 font-black text-base ml-2">
            Gọi điện
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleBook}
          className="flex-1 bg-emerald-600 h-14 rounded-2xl flex-row items-center justify-center shadow-lg"
        >
          <Calendar size={18} color="white" />
          <Text className="text-white font-black text-base ml-2">
            Đặt lịch hẹn
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      <BookingModal
        visible={isBookingModalVisible}
        onClose={() => setIsBookingModalVisible(false)}
        property={property}
      />
    </KeyboardAvoidingView>
  );
}
