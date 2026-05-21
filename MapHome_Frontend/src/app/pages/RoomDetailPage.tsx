import { useState, useEffect, useRef, useMemo } from "react";
import {
  validateReviewRating,
  validateReviewComment,
} from "@/app/utils/validationRules";
import { AlertCircle } from "lucide-react";
import { getAvatarUrl } from "@/app/utils/avatarUtils";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import goongjs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";
import {
  getGoongStyleUrl,
  getGoongAttribution,
  GOONG_API_KEY,
  GOONG_MAPTILES_KEY,
  getGoongTransformRequest,
} from "@/app/utils/goongApi";
import {
  MapPin,
  Star,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  Shield,
  ShieldCheck,
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  Maximize2,
  Expand,
  ArrowLeft,
  Info,
  Check,
  LayoutGrid,
  List,
  Clock,
  Home,
  Zap,
  Wifi,
  Wind,
  Droplets,
  Tv,
  Sofa,
  WashingMachine,
  Utensils,
  Refrigerator,
  Car,
  GraduationCap,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { Navbar } from "@/app/components/Navbar";
import api from "@/app/utils/api";
import { Footer } from "@/app/components/Footer";
import { VerificationBadge } from "@/app/components/VerificationBadge";
import { BookingDialog } from "@/app/components/BookingDialog";
import { ReportPropertyDialog } from "@/app/components/ReportPropertyDialog";
import { UserRequestInspectionDialog } from "@/app/components/UserRequestInspectionDialog";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { CompareFloatingBar } from "@/app/components/CompareFloatingBar";
import { useProperties } from "@/app/contexts/useProperties";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  RentalProperty,
  LandlordProfile,
  Review,
} from "@/app/components/types";
import { useRecentlyViewed } from "@/app/hooks/useRecentlyViewed";

// === SUB-COMPONENTS ===

const MiniMap = ({ property }: { property: RentalProperty }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<goongjs.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      goongjs.accessToken = GOONG_MAPTILES_KEY;

      const coords: [number, number] = Array.isArray(property.location)
        ? [property.location[0], property.location[1]] // [lng, lat]
        : [(property.location as any).lng, (property.location as any).lat];

      mapInstance.current = new goongjs.Map({
        container: mapRef.current,
        style: getGoongStyleUrl("light"),
        center: coords,
        zoom: 15,
        attributionControl: false,
        transformRequest: getGoongTransformRequest,
      });

      mapInstance.current.addControl(
        new goongjs.NavigationControl(),
        "top-right",
      );

      // Create marker element
      const el = document.createElement("div");
      el.className = "custom-mini-marker";
      el.innerHTML = `
        <div class="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg border-2 border-green-600">
          <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
        </div>
      `;

      new goongjs.Marker(el).setLngLat(coords).addTo(mapInstance.current);

      // If pinned, we can add a simple circle highlight using a marker with CSS scale or a layer
      if (property.pinInfo) {
        const circleEl = document.createElement("div");
        circleEl.style.width = "100px";
        circleEl.style.height = "100px";
        circleEl.style.borderRadius = "50%";
        circleEl.style.backgroundColor = "rgba(249, 115, 22, 0.1)";
        circleEl.style.border = "2px solid rgba(249, 115, 22, 0.3)";

        new goongjs.Marker(circleEl)
          .setLngLat(coords)
          .addTo(mapInstance.current);
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [property]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Vị trí & Tiện ích</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
          onClick={() =>
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${Array.isArray(property.location) ? property.location[1] : (property.location as any).lat},${Array.isArray(property.location) ? property.location[0] : (property.location as any).lng}`,
              "_blank",
            )
          }
        >
          Mở trong Google Maps
        </Button>
      </div>
      <div
        ref={mapRef}
        className="h-[400px] w-full rounded-2xl border-2 border-white shadow-xl overflow-hidden z-0"
      />
      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
        <p className="text-sm text-orange-900 font-medium">
          Vị trí chính xác đã ghim
        </p>
        <p className="text-xs text-orange-700 mt-1">
          Bản đồ hiển thị vị trí được chủ trọ xác thực trực tiếp.
        </p>
      </div>
    </div>
  );
};

const FullscreenGallery = ({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) => {
  const [index, setIndex] = useState(initialIndex);

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
        onClick={onClose}
      >
        <X className="size-8" />
      </Button>

      <div className="relative w-full max-w-5xl aspect-video flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          onClick={() => setIndex((index - 1 + images.length) % images.length)}
        >
          <ChevronLeft className="size-10" />
        </Button>

        <img
          src={images[index]}
          alt={`Gallery ${index + 1}`}
          className="max-h-full max-w-full object-contain shadow-2xl"
        />

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          onClick={() => setIndex((index + 1) % images.length)}
        >
          <ChevronRight className="size-10" />
        </Button>
      </div>

      <div className="absolute bottom-10 flex gap-2 overflow-x-auto p-2 max-w-full">
        {images.map((img, i) => (
          <div
            key={i}
            className={`w-16 h-12 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
              i === index
                ? "border-green-500 scale-110"
                : "border-transparent opacity-50"
            }`}
            onClick={() => setIndex(i)}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
};

const UnverifiedWarning = () => (
  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
    <Info className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
    <div>
      <p className="font-bold text-amber-900 text-sm">Tin đăng chưa xác thực</p>
      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
        Phòng trọ này chưa được kiểm duyệt trực tiếp bởi đội ngũ MapHome. Vui
        lòng kiểm tra kỹ thông tin và xem phòng trực tiếp trước khi giao dịch.
      </p>
    </div>
  </div>
);

const LocationVerificationInfo = ({
  locationAccuracy,
}: {
  locationAccuracy: string | number;
}) => (
  <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3">
    <ShieldCheck className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
    <div>
      <p className="font-bold text-green-900 text-sm">
        Vị trí đã xác thực GPS{" "}
        {typeof locationAccuracy === "number"
          ? `±${locationAccuracy}m`
          : locationAccuracy}
      </p>
      <p className="text-xs text-green-700 mt-1 leading-relaxed">
        Chủ trọ đã ghim vị trí này trực tiếp tại nhà trọ. Tọa độ được MapHome
        xác nhận là chính xác. Bạn có thể yên tâm sử dụng bản đồ để tìm đường.
      </p>
    </div>
  </div>
);

// === MAIN PAGE COMPONENT ===

export function RoomDetailPage() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"info" | "reviews" | "nearby">(
    "info",
  );
  const [fullscreenGallery, setFullscreenGallery] = useState<number | null>(
    null,
  );
  const [favorite, setFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isRequestInspectionOpen, setIsRequestInspectionOpen] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const { user } = useAuth();
  const { properties, loading: loadingProps } = useProperties();
  const { trackView } = useRecentlyViewed();

  const property = useMemo(
    () => properties.find((p) => p.id === routeId || p._id === routeId),
    [routeId, properties],
  );

  const landlord = useMemo(() => {
    if (!property) return null;
    // Fallback to a default landlord profile if not found
    return (
      typeof property.landlordId === "object" ? property.landlordId : null
    ) as LandlordProfile;
  }, [property]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!property) return;

      // Track this property as recently viewed
      trackView({
        id: property._id || property.id,
        name: property.name,
        address: property.address,
        price: property.price,
        area: property.area,
        image: (property.images?.[0] || property.image) ?? "",
        available: property.available,
        viewedAt: new Date().toISOString(),
      });

      try {
        const propertyKey = property._id || property.id;
        const res = await api.get(`/api/reviews/property/${propertyKey}`);
        if (res.status === 200) {
          const data = res.data;
          const mapped: Review[] = (Array.isArray(data) ? data : []).map(
            (item: any) => ({
              id: item._id || item.id,
              propertyId:
                typeof item.propertyId === "object"
                  ? item.propertyId?._id || item.propertyId?.id || propertyKey
                  : item.propertyId || propertyKey,
              userName:
                item.userId?.fullName ||
                item.userId?.username ||
                "Người dùng MapHome",
              userAvatar: item.userId?.avatar || "/avatars/default.png",
              rating: Number(item.rating) || 0,
              content: item.comment || "",
              createdAt: item.createdAt || new Date().toISOString(),
            }),
          );
          setReviews(mapped);
        }
      } catch (err) {
        setReviews([]);
      }
    };

    fetchReviews();
  }, [property]);

  if (loadingProps) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-4 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy phòng trọ</h1>
        <Button onClick={() => navigate("/map")}>Quay lại bản đồ</Button>
      </div>
    );
  }

  const galleryImages =
    property.images && property.images.length > 0
      ? property.images
      : [property.image];
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "0.0";

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFavorite = (propertyId: string) => {
    setFavorite(!favorite);
    // Logic to save to storage/API
  };

  const handleSubmitReview = async () => {
    const ratingValid = validateReviewRating(newRating);
    const commentValid = validateReviewComment(newReview);

    if (!ratingValid.valid || !commentValid.valid) {
      setReviewError(ratingValid.error || commentValid.error || "");
      toast.error(
        ratingValid.error ||
          commentValid.error ||
          "Vui lòng kiểm tra lại đánh giá! ❌",
      );
      return;
    }

    if (!user) {
      toast.error("Vui lòng đăng nhập để gửi đánh giá! 🔐");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");

    try {
      const res = await api.post("/api/reviews", {
        propertyId: property._id || property.id,
        rating: newRating,
        comment: newReview,
      });

      if (res.status === 200 || res.status === 201) {
        const created = res.data;
        const review: Review = {
          id: created._id || created.id,
          propertyId: created.propertyId || property._id || property.id,
          userName: user.fullName || user.username || "Người dùng MapHome",
          userAvatar: user.avatar || "/avatars/default.png",
          rating: Number(created.rating) || newRating,
          content: created.comment || newReview,
          createdAt: created.createdAt || new Date().toISOString(),
        };

        setReviews((prev) => [review, ...prev]);
        setNewReview("");
        setNewRating(5);
      }
    } catch (err) {
      console.error("Review error:", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const propertyId = property._id || property.id;
  const similarProperties = properties
    .filter((p) => (p._id || p.id) !== propertyId)
    .slice(0, 4);

  const activeAmenities = Object.entries(property.amenities)
    .filter(([_, v]) => v)
    .map(([key]) => key);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Fullscreen Gallery */}
      {fullscreenGallery !== null && (
        <FullscreenGallery
          images={galleryImages}
          initialIndex={fullscreenGallery}
          onClose={() => setFullscreenGallery(null)}
        />
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <button
              onClick={() => navigate("/")}
              className="hover:text-green-600 transition-colors"
            >
              Trang chủ
            </button>
            <span>/</span>
            <button
              onClick={() => navigate("/map")}
              className="hover:text-green-600 transition-colors"
            >
              Tìm trọ
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px]">
              {property.name}
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto px-4 py-6"
        >
          {/* === GALLERY === */}
          <div className="mb-6">
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden shadow-xl">
              {/* Main image */}
              <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="col-span-2 row-span-2 relative cursor-pointer group"
                onClick={() => setFullscreenGallery(0)}
              >
                <ImageWithFallback
                  src={galleryImages[0]}
                  alt={property.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                <div className="absolute bottom-3 left-3 flex gap-2">
                  {property.pinInfo && (
                    <Badge className="bg-orange-500 text-white shadow-lg">
                      📌 Chủ trọ đã ghim
                    </Badge>
                  )}
                  <Badge
                    variant={property.available ? "default" : "secondary"}
                    className="shadow-lg"
                  >
                    {property.available ? "🟢 Còn phòng" : "🔴 Hết phòng"}
                  </Badge>
                </div>
              </motion.div>
              {/* Smaller images */}
              {galleryImages.slice(1, 5).map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * (i + 1), duration: 0.5 }}
                  className="relative cursor-pointer group overflow-hidden"
                  onClick={() => setFullscreenGallery(i + 1)}
                >
                  <ImageWithFallback
                    src={img}
                    alt={`Ảnh ${i + 2}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                  {/* Show more overlay on last */}
                  {i === 3 && galleryImages.length > 5 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        +{galleryImages.length - 5} ảnh
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            {/* Gallery expand button */}
            <div className="flex justify-end mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFullscreenGallery(0)}
                className="text-xs"
              >
                <Expand className="size-3.5 mr-1.5" />
                Xem tất cả {galleryImages.length} ảnh
              </Button>
            </div>
          </div>

          {/* === CONTENT GRID === */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      {property.name}
                    </h1>
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <MapPin className="size-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{property.address}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <VerificationBadge
                        level={property.verificationLevel}
                        verifiedAt={property.verifiedAt}
                        locationAccuracy={property.locationAccuracy}
                        size="md"
                      />
                      {property.pinInfo && (
                        <Badge
                          className="bg-orange-100 text-orange-800 border border-orange-200"
                          variant="outline"
                        >
                          📌 GPS đã ghim
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-sm text-amber-600">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{avgRating}</span>
                        <span className="text-gray-400">
                          ({reviews.length} đánh giá)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleFavorite(property.id)}
                      className="h-10 w-10"
                    >
                      <Heart
                        className={`size-5 ${favorite ? "fill-red-500 text-red-500" : "text-gray-500"}`}
                      />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleShare}
                      className="h-10 w-10"
                    >
                      {copied ? (
                        <Check className="size-5 text-green-600" />
                      ) : (
                        <Share2 className="size-5 text-gray-500" />
                      )}
                    </Button>
                    <ReportPropertyDialog
                      propertyId={property._id || property.id}
                      propertyName={property.name}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Price & Area bar */}
              <div className="flex items-center gap-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-5 border border-blue-100">
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {property.price.toLocaleString("vi-VN")}đ
                  </p>
                  <p className="text-sm text-gray-500">/tháng</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {property.area}m²
                  </p>
                  <p className="text-sm text-gray-500">Diện tích</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(property.price / property.area).toLocaleString(
                      "vi-VN",
                    )}
                    đ
                  </p>
                  <p className="text-sm text-gray-500">/m²/tháng</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b">
                <div className="flex gap-1">
                  {[
                    { key: "info" as const, label: "Thông tin", icon: Home },
                    {
                      key: "reviews" as const,
                      label: `Đánh giá (${reviews.length})`,
                      icon: Star,
                    },
                    {
                      key: "nearby" as const,
                      label: "Tiện ích lân cận",
                      icon: MapPin,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                        activeTab === tab.key
                          ? "border-green-600 text-green-700"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <tab.icon className="size-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === "info" && (
                  <div className="space-y-6">
                    {/* Verification Info */}
                    {property.verificationLevel === "none" && (
                      <UnverifiedWarning />
                    )}
                    {property.verificationLevel === "verified" &&
                      property.locationAccuracy && (
                        <LocationVerificationInfo
                          locationAccuracy={property.locationAccuracy}
                        />
                      )}

                    {/* Features/Amenities */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 bg-white p-6 rounded-2xl border shadow-sm">
                      <h3 className="col-span-full font-bold text-gray-900 mb-2">
                        Tiện nghi phòng
                      </h3>
                      {activeAmenities.map((key) => (
                        <div
                          key={key}
                          className="flex items-center gap-3 text-sm text-gray-700"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                            {key === "wifi" && <Wifi className="size-4" />}
                            {key === "parking" && <Car className="size-4" />}
                            {key === "ac" && <Wind className="size-4" />}
                            {key === "airConditioner" && (
                              <Wind className="size-4" />
                            )}
                            {key === "water" && <Droplets className="size-4" />}
                            {key === "tv" && <Tv className="size-4" />}
                            {key === "furniture" && <Sofa className="size-4" />}
                            {key === "washingMachine" && (
                              <WashingMachine className="size-4" />
                            )}
                            {key === "kitchen" && (
                              <Utensils className="size-4" />
                            )}
                            {key === "refrigerator" && (
                              <Refrigerator className="size-4" />
                            )}
                          </div>
                          <span>
                            {key === "wifi" && "Wifi miễn phí"}
                            {key === "parking" && "Chỗ để xe"}
                            {key === "ac" && "Máy lạnh"}
                            {key === "airConditioner" && "Máy lạnh"}
                            {key === "water" && "Nước nóng"}
                            {key === "tv" && "Tivi"}
                            {key === "furniture" && "Nội thất"}
                            {key === "washingMachine" && "Máy giặt"}
                            {key === "kitchen" && "Nhà bếp"}
                            {key === "refrigerator" && "Tủ lạnh"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-4">Mô tả</h3>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                        {property.description}
                      </p>
                    </div>

                    {/* Address Detail */}
                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-4">Địa chỉ</h3>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <MapPin className="size-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {property.address}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {property.address.split(",").slice(-2).join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-6">
                        Đánh giá từ cộng đồng
                      </h3>
                      {reviews.length === 0 ? (
                        <p className="text-center text-gray-500 py-10">
                          Chưa có đánh giá nào. Hãy là người đầu tiên!
                        </p>
                      ) : (
                        <div className="space-y-8">
                          {reviews.map((review) => (
                            <div key={review.id} className="flex gap-4">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                <img
                                  src={
                                    getAvatarUrl(review.userAvatar) ||
                                    "/avatars/default.png"
                                  }
                                  alt={review.userName}
                                  className="w-full h-full object-cover"
                                  style={{
                                    imageRendering: "-webkit-optimize-contrast",
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-bold text-gray-900">
                                    {review.userName}
                                  </h4>
                                  <span className="text-xs text-gray-400">
                                    {new Date(
                                      review.createdAt,
                                    ).toLocaleDateString("vi-VN")}
                                  </span>
                                </div>
                                <div className="flex gap-0.5 mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`size-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                                    />
                                  ))}
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                  {review.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {user && (
                      <div className="bg-white p-6 rounded-2xl border shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">
                          Thêm đánh giá của bạn
                        </h3>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-sm text-gray-600">
                            Đánh giá chung:
                          </span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setNewRating(star)}
                                className="transition-transform hover:scale-125"
                              >
                                <Star
                                  className={`size-6 ${star <= newRating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          placeholder="Chia sẻ trải nghiệm của bạn về căn phòng này..."
                          className={`w-full min-h-[120px] p-4 rounded-xl border focus:ring-2 outline-none transition-all resize-none text-sm ${
                            reviewError
                              ? "border-red-500 focus:ring-red-100"
                              : "border-gray-200 focus:ring-green-500/20 focus:border-green-500"
                          }`}
                          value={newReview}
                          onChange={(e) => {
                            setNewReview(e.target.value);
                            if (reviewError) setReviewError("");
                          }}
                        />
                        {reviewError && (
                          <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-bold">
                            <AlertCircle className="size-3" /> {reviewError}
                          </p>
                        )}
                        <div className="flex justify-end mt-4">
                          <Button
                            className="bg-green-600 hover:bg-green-700 h-10 px-6 font-medium"
                            disabled={!newReview.trim() || isSubmittingReview}
                            onClick={handleSubmitReview}
                          >
                            {isSubmittingReview
                              ? "Đang gửi..."
                              : "Gửi đánh giá"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "nearby" && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                      <MiniMap property={property} />
                    </div>

                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <GraduationCap className="size-5 text-indigo-600" />
                        Trường học & Địa danh lân cận
                      </h3>

                      {property.nearbyLandmarks &&
                      property.nearbyLandmarks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {property.nearbyLandmarks.map((landmark, idx) => (
                            <div
                              key={idx}
                              className="group p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                  {landmark.name.includes("ĐH") ||
                                  landmark.name.includes("Trường") ? (
                                    <GraduationCap className="size-5" />
                                  ) : (
                                    <MapPin className="size-5" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">
                                    {landmark.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Khu vực lân cận
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-black text-indigo-600">
                                  {landmark.distanceText}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-sm text-slate-500">
                            Đang cập nhật dữ liệu tiện ích lân cận...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Sidebar */}
            <div className="space-y-6">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* CTA Card */}
                <Card className="shadow-lg border-green-200 overflow-hidden rounded-2xl">
                  <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 text-white">
                    <p className="text-2xl font-bold">
                      {property.price.toLocaleString("vi-VN")}đ
                      <span className="text-base font-normal opacity-80">
                        /tháng
                      </span>
                    </p>
                    <p className="text-sm opacity-80 mt-1">
                      {property.area}m² •{" "}
                      {property.address.split(",").pop()?.trim()}
                    </p>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <Button
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 h-12 shadow-md"
                      size="lg"
                      onClick={() => setIsBookingOpen(true)}
                    >
                      <Calendar className="size-5 mr-2" />
                      Đặt lịch xem phòng
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="w-full h-11"
                        onClick={() =>
                          (window.location.href = `tel:${property.phone.replace(/\s/g, "")}`)
                        }
                      >
                        <Phone className="size-4 mr-2" />
                        Gọi ngay
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full h-11 text-green-700 border-green-200 hover:bg-green-50"
                      >
                        <MessageCircle className="size-4 mr-2" />
                        Nhắn Zalo
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Landlord Card */}
                {landlord && (
                  <Card className="shadow-md rounded-2xl overflow-hidden border-none bg-gray-50/50">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                          {landlord.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">
                              {landlord.name}
                            </h3>
                            {landlord.verified && (
                              <ShieldCheck className="size-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-amber-600">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-semibold">
                              {landlord.rating}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 bg-white rounded-xl shadow-sm">
                          <p className="text-base font-bold text-gray-900">
                            {landlord.totalListings}
                          </p>
                          <p className="text-[10px] text-gray-500">Tin đăng</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-xl shadow-sm">
                          <p className="text-base font-bold text-green-600">
                            {landlord.responseRate}%
                          </p>
                          <p className="text-[10px] text-gray-500">Phản hồi</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-xl shadow-sm">
                          <p className="text-base font-bold text-blue-600">
                            {landlord.yearsJoined}
                          </p>
                          <p className="text-[10px] text-gray-500">Năm t/g</p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs h-8"
                        onClick={() => navigate(`/profile/${landlord.id}`)}
                      >
                        Xem trang cá nhân chủ trọ →
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Safety Tips */}
                <Card className="bg-amber-50/50 border-amber-100 rounded-2xl border-dashed">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-sm">
                      <Shield className="size-4" />
                      Lưu ý an toàn
                    </h4>
                    <ul className="text-[11px] text-amber-800 space-y-2">
                      <li className="flex gap-2">
                        <span className="text-amber-400">•</span>
                        <span>Xem phòng trực tiếp trước khi đặt cọc</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-amber-400">•</span>
                        <span>Không chuyển tiền trước khi ký hợp đồng</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-amber-400">•</span>
                        <span>Kiểm tra giấy tờ sở hữu nhà cẩn thận</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* === SIMILAR PROPERTIES === */}
          <div className="mt-16 pb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Phòng trọ tương tự gần đây
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Gợi ý dành riêng cho bạn dựa trên vị trí
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/map")}
                className="rounded-full px-5 hover:bg-gray-100"
              >
                Xem tất cả
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProperties.map((sp) => (
                <Card
                  key={sp.id}
                  className="cursor-pointer hover:shadow-xl transition-all overflow-hidden group rounded-2xl border-none shadow-sm"
                  onClick={() => navigate(`/room/${sp.id}`)}
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={sp.images[0]}
                      alt={sp.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white/90 text-gray-900 backdrop-blur-sm border-none shadow-sm">
                        {sp.area}m²
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm truncate mb-1 group-hover:text-blue-600 transition-colors">
                      {sp.name}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                      <MapPin className="size-3 flex-shrink-0" />
                      <span className="truncate">
                        {sp.address.split(",").slice(-2).join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                      <p className="text-base font-bold text-green-600">
                        {sp.price.toLocaleString("vi-VN")}đ
                      </p>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {sp.distance < 1
                          ? `${Math.round(sp.distance * 1000)}m`
                          : `${sp.distance.toFixed(1)}km`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
      <CompareFloatingBar />

      <BookingDialog
        open={isBookingOpen}
        onOpenChange={setIsBookingOpen}
        property={property}
      />

      <UserRequestInspectionDialog
        open={isRequestInspectionOpen}
        onOpenChange={setIsRequestInspectionOpen}
        property={property}
        currentUserId={(user as any)?._id || user?.id || ""}
        currentUserName={user?.fullName || user?.username || ""}
      />
    </div>
  );
}
