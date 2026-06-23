import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/app/utils/api";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Label } from "@/app/components/ui/label";
import {
  ArrowLeft,
  Home,
  Upload,
  MapPin,
  ShieldCheck,
  Camera,
  Loader2,
  X,
  ImageIcon,
  Check,
  Pin,
  Sparkles,
  CalendarDays,
  FileText,
  Map as MapIcon,
  ChevronRight,
  TrendingUp,
  User,
  Phone,
  Wifi,
  Wind,
  Refrigerator,
  UtensilsCrossed,
  Armchair,
  Waves,
  Tv,
  Search,
  Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LandlordPinMap } from "@/app/components/LandlordPinMap";
import { useProperties } from "@/app/contexts/useProperties";
import { useAuth } from "@/app/contexts/AuthContext";
import { getImageUrl } from "@/app/utils/avatarUtils";
import { toast } from "sonner";
import { RentalProperty, GreenBadgeLevel } from "@/app/components/types";
import {
  Province,
  District,
  Ward,
} from "@/app/data/vietnamLocations";
import { amenityLabels, amenityMeta } from "@/app/constants/amenities";
import {
  validatePropertyName,
  validatePrice,
  validateArea,
  validateDescription,
  validatePhone,
} from "@/app/utils/validationRules";
import { AlertCircle } from "lucide-react";
import {
  autocompletePlaces,
  geocodeByPlaceId,
  isGoongConfigured,
  type GoongPrediction,
  type GeocodeResult,
} from "@/app/utils/goongApi";
import {
  calculateDistance,
  formatDistance,
} from "@/app/utils/distanceCalculator";

type Step = "info" | "pin-map" | "verify" | "upload-photos" | "preview";

export function PostRoomPage() {
  const navigate = useNavigate();
  const { addProperty } = useProperties();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("info");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [locationData, setLocationData] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [pinnedLocation, setPinnedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [gpsLocationMismatch, setGpsLocationMismatch] = useState<{
    distanceKm: number;
    distanceM: number;
    isExcessive: boolean;
  } | null>(null);
  const [showMismatchConfirm, setShowMismatchConfirm] = useState(false);
  const [pinNote, setPinNote] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState({
    wifi: false,
    furniture: false,
    airConditioner: false,
    washingMachine: false,
    refrigerator: false,
    kitchen: false,
    tv: false,
  });
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    area: "",
    street: "",
    description: "",
    phone: "",
    ownerName: "",
  });

  // ─── Goong Search State ─────────────────────────────────────────────────────
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [addressPredictions, setAddressPredictions] = useState<
    GoongPrediction[]
  >([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({
    name: "",
    price: "",
    area: "",
    description: "",
    phone: "",
    address: "",
  });

  const [selectedProvince, setSelectedProvince] = useState<number | "">(79);
  const [selectedDistrict, setSelectedDistrict] = useState<number | "">("");
  const [selectedWard, setSelectedWard] = useState<number | "">("");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [availableWards, setAvailableWards] = useState<Ward[]>([]);

  useEffect(() => {
    api.get("/api/locations/provinces")
      .then(res => setProvinces(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      api.get(`/api/locations/districts/${selectedProvince}`)
        .then(res => setAvailableDistricts(res.data))
        .catch(console.error);
    } else {
      setAvailableDistricts([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      api.get(`/api/locations/wards/${selectedDistrict}`)
        .then(res => setAvailableWards(res.data))
        .catch(console.error);
    } else {
      setAvailableWards([]);
    }
  }, [selectedDistrict]);

  const fullAddress = useMemo(() => {
    const parts = [];
    if (formData.street) parts.push(formData.street);
    if (selectedWard) {
      const ward = availableWards.find((w: Ward) => w.code === selectedWard);
      if (ward) parts.push(ward.name);
    }
    if (selectedDistrict) {
      const district = availableDistricts.find(
        (d: District) => d.code === selectedDistrict,
      );
      if (district) parts.push(district.name);
    }
    if (selectedProvince) {
      const province = provinces.find(
        (p: Province) => p.code === selectedProvince,
      );
      if (province) parts.push(province.name);
    }
    return parts.join(", ");
  }, [
    formData.street,
    selectedWard,
    selectedDistrict,
    selectedProvince,
    availableWards,
    availableDistricts,
    provinces,
  ]);

  // Calculate GPS location mismatch distance
  useEffect(() => {
    if (pinnedLocation && locationData) {
      const distanceKm = calculateDistance(
        pinnedLocation.lat,
        pinnedLocation.lng,
        locationData.lat,
        locationData.lng,
      );
      const distanceM = distanceKm * 1000;
      const MISMATCH_THRESHOLD_M = 50; // 50 meters threshold
      setGpsLocationMismatch({
        distanceKm,
        distanceM,
        isExcessive: distanceM > MISMATCH_THRESHOLD_M,
      });
    } else {
      setGpsLocationMismatch(null);
    }
  }, [pinnedLocation, locationData]);

  const steps: { key: Step; label: string; icon: any }[] = [
    { key: "info", label: "Thông tin", icon: FileText },
    { key: "pin-map", label: "Ghim bản đồ", icon: MapIcon },
    { key: "verify", label: "Xác thực GPS", icon: ShieldCheck },
    { key: "upload-photos", label: "Tải ảnh", icon: Camera },
    { key: "preview", label: "Xem trước", icon: Sparkles },
  ];

  const handleAddressSearch = (value: string) => {
    setAddressSearchQuery(value);
    setAddressPredictions([]);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!value.trim() || !isGoongConfigured()) return;

    searchTimerRef.current = setTimeout(async () => {
      setIsSearchingAddress(true);
      const results = await autocompletePlaces(value);
      setAddressPredictions(results);
      setIsSearchingAddress(false);
    }, 400);
  };

  // Helper: Normalize location names for better matching
  const normalizeName = (name: string): string => {
    if (!name) return "";
    return (
      name
        .toLowerCase()
        .trim()
        // Remove common prefixes/suffixes
        .replace(
          /^(quận|huyện|phường|xã|thị trấn|tp\.|thành phố|t\.|q\.|h\.|p\.)[\s\.]*/,
          "",
        )
        .replace(/[\s\.]+/g, " ")
        .trim()
    );
  };

  // Helper: Find best match for a name from a list
  const findBestMatch = <T extends { name: string; code: string | number }>(
    searchName: string,
    items: T[],
  ): T | undefined => {
    const normalized = normalizeName(searchName);

    // 1. Try exact match first
    const exact = items.find((item) => normalizeName(item.name) === normalized);
    if (exact) return exact;

    // 2. Try word boundary match (prevents "3" matching inside "435")
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const partial = items.find((item) => {
      const itemNorm = normalizeName(item.name);
      if (!itemNorm) return false;
      // Use word boundaries. E.g. \b3\b will match "Quận 3" but NOT "435"
      const regexItem = new RegExp(`\\b${escapeRegExp(itemNorm)}\\b`);
      const regexSearch = new RegExp(`\\b${escapeRegExp(normalized)}\\b`);
      return regexItem.test(normalized) || regexSearch.test(itemNorm);
    });
    if (partial) return partial;

    // 3. Try matching isolated numbers as a last resort
    const numberMatch = normalized.match(/\b\d+\b/);
    if (numberMatch) {
      const num = numberMatch[0];
      return items.find((item) => {
        const itemNumberMatch = item.name.match(/\b\d+\b/);
        return itemNumberMatch && itemNumberMatch[0] === num;
      });
    }

    return undefined;
  };

  const autoPopulateLocation = async (result: GeocodeResult) => {
    const components = Array.isArray(result.address_components)
      ? result.address_components.filter(
          (
            component,
          ): component is GeocodeResult["address_components"][number] =>
            Boolean(
              component &&
              typeof component.long_name === "string" &&
              typeof component.short_name === "string" &&
              Array.isArray(component.types),
            ),
        )
      : [];
    const hasType = (
      component: GeocodeResult["address_components"][number],
      type: string,
    ) => component.types.includes(type);

    // Goong AI often returns "locality" for BOTH Province and District!
    // So relying purely on `types` like "administrative_area_level_1" will fail.
    // Instead, we will try to match ANY component's name against our known databases.
    
    // 1. Find Province
    let matchedProvince: Province | undefined;
    for (const comp of components) {
      matchedProvince = findBestMatch(comp.long_name, provinces);
      if (matchedProvince) break;
    }

    if (!matchedProvince) {
      console.warn("⚠️ AutoPopulate - Could not find City/Province in Goong result.", components);
      return;
    }

    console.log("🏙️ AutoPopulate - Province Matched:", matchedProvince);
    setSelectedProvince(matchedProvince.code);

    // 2. Find District
    try {
      const distRes = await api.get(`/api/locations/districts/${matchedProvince.code}`);
      const districtList: District[] = distRes.data;
      
      let matchedDistrict: District | undefined;
      for (const comp of components) {
        matchedDistrict = findBestMatch(comp.long_name, districtList);
        if (matchedDistrict) break;
      }

      if (!matchedDistrict) {
        console.warn("⚠️ AutoPopulate - Could not find District in Goong result.", components);
        return;
      }

      console.log("🏙️ AutoPopulate - District Matched:", matchedDistrict);
      setSelectedDistrict(matchedDistrict.code);

      // 3. Find Ward
      try {
        const wardRes = await api.get(`/api/locations/wards/${matchedDistrict.code}`);
        const wardList: Ward[] = wardRes.data;
        
        let matchedWard: Ward | undefined;
        for (const comp of components) {
          matchedWard = findBestMatch(comp.long_name, wardList);
          if (matchedWard) break;
        }

        if (matchedWard) {
          console.log("🏙️ AutoPopulate - Ward Matched:", matchedWard);
          setSelectedWard(matchedWard.code);
        } else {
          console.warn("⚠️ AutoPopulate - Could not find Ward in Goong result.", components);
        }
      } catch (e) {
        console.error("Failed to fetch wards for auto-populate", e);
      }
    } catch (e) {
      console.error("Failed to fetch districts for auto-populate", e);
    }
  };

  const handleSelectAddress = async (prediction: GoongPrediction) => {
    const result = await geocodeByPlaceId(prediction.place_id);
    if (result) {
      // 1. Set Coordinates
      setPinnedLocation({ lat: result.lat, lng: result.lng });

      // 2. Set Street Name (Main Text)
      setFormData((prev) => ({
        ...prev,
        street: prediction.structured_formatting.main_text,
      }));

      // 3. Clear predictions
      setAddressPredictions([]);
      setAddressSearchQuery(prediction.description);

      // 4. Try to auto-populate Province/District/Ward
      autoPopulateLocation(result);

      toast.success("Đã tự động xác định vị trí & địa chỉ! 📍");
    }
  };

  const handlePinMapUpdate = (
    lat: number,
    lng: number,
    address?: string,
    result?: GeocodeResult,
  ) => {
    setPinnedLocation({ lat, lng });

    if (result) {
      // Auto-populate form fields when pin is moved/placed
      autoPopulateLocation(result);

      // Update street if possible (use main_text if available, otherwise guess from formatted_address)
      if (result.formatted_address) {
        // Simple heuristic: street is usually the first part of address
        const streetPart = result.formatted_address.split(",")[0];
        if (streetPart && !formData.street) {
          setFormData((prev) => ({ ...prev, street: streetPart }));
        }
      }

      toast.success("Đã cập nhật thông tin địa chỉ từ bản đồ! ✨");
    }
  };

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  const handleNext = () => {
    if (step === "info") {
      // More aggressive validation for numeric fields
      const isPriceValid = (val: any) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
      };

      const newErrors = {
        name: validatePropertyName(formData.name).error || "",
        price: !isPriceValid(formData.price)
          ? "Giá thuê phải là một số dương"
          : "",
        area: !isPriceValid(formData.area)
          ? "Diện tích phải là một số dương"
          : "",
        description: validateDescription(formData.description).error || "",
        phone: validatePhone(formData.phone).error || "",
        ownerName: user?.role === "broker" && !formData.ownerName.trim()
          ? "Vui lòng nhập tên chủ nhà sở hữu"
          : "",
        address:
          !selectedProvince ||
          !selectedDistrict ||
          !selectedWard ||
          !formData.street
            ? "Vui lòng nhập đầy đủ địa chỉ"
            : "",
      };

      setFieldErrors(newErrors);

      if (Object.values(newErrors).some((error) => error)) {
        toast.error("Vui lòng kiểm tra lại thông tin!");
        return;
      }
    }

    if (step === "pin-map" && !pinnedLocation) {
      toast.error("Vui lòng ghim vị trí trên bản đồ!");
      return;
    }

    // Check GPS location mismatch warning
    if (step === "verify" && gpsLocationMismatch?.isExcessive) {
      setShowMismatchConfirm(true);
      return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].key);
    }
  };

  const handleConfirmMismatch = () => {
    setShowMismatchConfirm(false);
    toast.success("✓ Xác thực GPS thành công! Tiếp tục tải ảnh.", {
      style: {
        background: "#dcfce7",
        color: "#15803d",
        border: "1px solid #86efac",
      },
    });
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].key);
    }
  };

  const handleRejectMismatch = () => {
    setShowMismatchConfirm(false);
    toast.warning("⚠️ Bạn chọn tiếp tục với vị trí không khớp. Hãy cẩn thận!", {
      style: {
        background: "#fef3c7",
        color: "#92400e",
        border: "1px solid #fde68a",
      },
    });
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].key);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].key);
    }
  };

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setLocationData({
            lat: latitude,
            lng: longitude,
            accuracy: Math.round(accuracy),
          });
          setIsGettingLocation(false);
          toast.success("Đã xác thực vị trí thành công! 📍");
        },
        () => {
          setIsGettingLocation(false);
          toast.error(
            "Không thể lấy vị trí GPS. Vui lòng cho phép truy cập vị trí.",
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files).slice(0, 5 - uploadedImages.length);
      setIsUploading(true);

      const uploadedUrls: string[] = [];

      for (const file of fileArray) {
        const formDataUpload = new FormData();
        formDataUpload.append("image", file);
        try {
          const res = await api.post("/api/upload/single", formDataUpload);
          if (res.status === 200 || res.status === 201) {
            uploadedUrls.push(res.data.url);
          } else {
            toast.error("Lỗi khi tải ảnh lên " + file.name);
          }
        } catch (err: any) {
          console.error("Upload error:", err);
          const errorMsg = err.response?.data?.message || err.message || "Lỗi không xác định";
          toast.error(`Lỗi tải ảnh ${file.name}: ${errorMsg}`);
        }
      }

      setUploadedImages((prev) => [...prev, ...uploadedUrls]);
      setIsUploading(false);
      if (uploadedUrls.length > 0) {
        toast.success(`Đã tải lên ${uploadedUrls.length} ảnh thành công! ✨`);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = async () => {
    if (!pinnedLocation) {
      toast.error("Vui lòng ghim vị trí trên bản đồ trước khi đăng tin! 📍");
      return;
    }

    if (!user?.id && !(user as any)?._id) {
      toast.error("Lỗi: Vui lòng đăng nhập lại! 🔐");
      return;
    }

    let verificationLevel: GreenBadgeLevel = locationData ? "verified" : "none";
    const newProperty = {
      name: formData.name,
      address: fullAddress,
      price: Number(formData.price) || 0,
      location: [pinnedLocation.lng, pinnedLocation.lat] as [number, number],
      amenities: amenities,
      image: uploadedImages[0] || "",
      images: uploadedImages,
      area: Number(formData.area) || 0,
      description: formData.description,
      available: true,
      phone: formData.phone,
      ownerName: user?.role === "broker" ? formData.ownerName : (user?.fullName || user?.username || "Chủ trọ"),
      verificationLevel: verificationLevel,
      verifiedAt: locationData ? new Date().toISOString() : undefined,
      locationAccuracy: locationData?.accuracy,
      // Note: landlordId will be set by backend from req.user
      pinInfo: {
        pinnedAt: new Date().toISOString(),
        pinnedBy: user?.id || (user as any)?._id || "unknown",
        note: pinNote || undefined,
      },
    };

    try {
      const success = await addProperty(newProperty);
      if (success) {
        toast.success("Đăng tin thành công! ✨");
        navigate(user?.role === "broker" ? "/broker/dashboard" : "/landlord/dashboard");
      } else {
        toast.error("Không thể đăng tin. Vui lòng kiểm tra lại thông tin!");
      }
    } catch (err: any) {
      console.error("Submit error:", err);

      // Handle validation errors from backend
      const backendErrors = err.response?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        // Map backend errors to field errors
        const newErrors: Record<string, string> = {};
        backendErrors.forEach((error: any) => {
          const field = error.field || error.param;
          newErrors[field] = error.message;
        });
        setFieldErrors(newErrors);

        // Show first error as toast
        const firstError = backendErrors[0];
        toast.error(`❌ ${firstError.message}`);
      } else {
        // Fallback to generic error message
        const errorMsg =
          err.response?.data?.message || err.message || "Lỗi không xác định";
        toast.error(`❌ ${errorMsg}`);
      }
    }
  };

  const toggleAmenity = (key: string) => {
    setAmenities((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Background Aura */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-200/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/20 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 bg-white/70 backdrop-blur-sm border-b border-slate-200/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(user?.role === "broker" ? "/broker/dashboard" : "/landlord/dashboard")}
              className="rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="size-5 text-slate-600" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-lg shadow-lg">
                <Home className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">MapHome</h1>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">
                  Đăng tin
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate("/pricing")}
            className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all group"
          >
            <TrendingUp className="size-4 mr-2" />
            Gói dịch vụ
          </Button>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="relative z-40 bg-white/50 backdrop-blur-sm border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-[17px] z-0" />
            <motion.div
              className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-indigo-600 -translate-y-[17px] z-0"
              initial={{ width: "0%" }}
              animate={{
                width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.8, ease: "circOut" }}
            />

            {steps.map((s, i) => {
              const StepIcon = s.icon;
              const isActive = i === currentStepIndex;
              const isCompleted = i < currentStepIndex;

              return (
                <div
                  key={s.key}
                  className="relative z-10 flex flex-col items-center group"
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.25 : 1,
                      backgroundColor: isCompleted
                        ? "#10b981"
                        : isActive
                          ? "#4f46e5"
                          : "#f1f5f9",
                      borderColor: isCompleted
                        ? "#10b981"
                        : isActive
                          ? "#4f46e5"
                          : "#e2e8f0",
                      boxShadow: isActive
                        ? "0 8px 20px -8px rgba(79, 70, 229, 0.4)"
                        : isCompleted
                          ? "0 4px 12px -4px rgba(16, 185, 129, 0.3)"
                          : "none",
                    }}
                    className="size-10 rounded-lg flex items-center justify-center border-2 transition-all"
                  >
                    {isCompleted ? (
                      <Check className="size-5 text-white font-bold" />
                    ) : (
                      <StepIcon
                        className={`size-5 font-bold ${isActive ? "text-white" : "text-slate-400"}`}
                      />
                    )}
                  </motion.div>
                  <span
                    className={`text-[11px] mt-3 font-semibold uppercase tracking-tight transition-all ${isActive ? "text-indigo-600 font-bold" : "text-slate-500"}`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-30 flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.01, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden"
            >
              {/* ===== STEP 1: INFO ===== */}
              {step === "info" && (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    show: { transition: { staggerChildren: 0.08 } },
                  }}
                  className="p-6 sm:p-8 lg:p-10 space-y-10"
                >
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200"
                  >
                    <div className="flex gap-4 items-start sm:items-center">
                      <div className="w-14 h-14 bg-indigo-50 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                        <Home className="size-7 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                          Thông tin cơ bản
                        </h2>
                        <p className="text-sm text-slate-600 font-medium">
                          Bắt đầu với những thông tin quan trọng nhất
                        </p>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2 w-fit">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                        Chỉnh sửa
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                  >
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Tên phòng trọ / Căn hộ *
                        </Label>
                        <Input
                          placeholder="VD: Cửa sổ trời - Quận 1"
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (fieldErrors.name)
                              setFieldErrors({ ...fieldErrors, name: "" });
                          }}
                          onBlur={() =>
                            setFieldErrors({
                              ...fieldErrors,
                              name:
                                validatePropertyName(formData.name).error || "",
                            })
                          }
                          className={`h-12 rounded-lg border focus:ring-2 text-base font-medium bg-white transition-all ${
                            fieldErrors.name
                              ? "border-red-500 focus:ring-red-100"
                              : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                          }`}
                        />
                        {fieldErrors.name && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                            <AlertCircle className="size-3" />{" "}
                            {fieldErrors.name}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Giá thuê (đ/tháng) *
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="3000000"
                              value={formData.price}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  price: e.target.value,
                                });
                                if (fieldErrors.price)
                                  setFieldErrors({ ...fieldErrors, price: "" });
                              }}
                              onBlur={() =>
                                setFieldErrors({
                                  ...fieldErrors,
                                  price:
                                    validatePrice(formData.price).error || "",
                                })
                              }
                              className={`h-12 rounded-lg border focus:ring-2 text-base font-medium bg-white pl-10 transition-all ${
                                fieldErrors.price
                                  ? "border-red-500 focus:ring-red-100"
                                  : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                              }`}
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                              ₫
                            </span>
                          </div>
                          {fieldErrors.price && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                              <AlertCircle className="size-3" />{" "}
                              {fieldErrors.price}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Diện tích (m²) *
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="25"
                              value={formData.area}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  area: e.target.value,
                                });
                                if (fieldErrors.area)
                                  setFieldErrors({ ...fieldErrors, area: "" });
                              }}
                              onBlur={() =>
                                setFieldErrors({
                                  ...fieldErrors,
                                  area: validateArea(formData.area).error || "",
                                })
                              }
                              className={`h-12 rounded-lg border focus:ring-2 text-base font-medium bg-white pr-10 transition-all ${
                                fieldErrors.area
                                  ? "border-red-500 focus:ring-red-100"
                                  : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                              }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                              m²
                            </span>
                          </div>
                          {fieldErrors.area && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                              <AlertCircle className="size-3" />{" "}
                              {fieldErrors.area}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Mô tả chi tiết
                        </Label>
                        <textarea
                          placeholder="Mô tả không gian, tiện ích xung quanh..."
                          value={formData.description}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            });
                            if (fieldErrors.description)
                              setFieldErrors({
                                ...fieldErrors,
                                description: "",
                              });
                          }}
                          onBlur={() =>
                            setFieldErrors({
                              ...fieldErrors,
                              description:
                                validateDescription(formData.description)
                                  .error || "",
                            })
                          }
                          className={`w-full min-h-[140px] p-4 rounded-lg border focus:ring-2 text-base font-medium bg-white resize-none outline-none transition-all ${
                            fieldErrors.description
                              ? "border-red-500 focus:ring-red-100"
                              : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                          }`}
                        />
                        {fieldErrors.description && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                            <AlertCircle className="size-3" />{" "}
                            {fieldErrors.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6 bg-slate-50 p-6 rounded-lg border border-slate-200">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 mb-2">
                          <MapPin className="size-4 text-indigo-600" />
                          <span className="font-bold text-sm uppercase tracking-wide">
                            Địa chỉ & Liên hệ
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              Tỉnh / Thành phố
                            </Label>
                            <Select
                              value={selectedProvince.toString()}
                              onValueChange={(value) => {
                                setSelectedProvince(Number(value));
                                setSelectedDistrict("");
                                setSelectedWard("");
                              }}
                            >
                              <SelectTrigger className="h-11 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-100">
                                <SelectValue placeholder="Chọn tỉnh/thành phố" />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg border border-slate-200 shadow-lg">
                                {provinces.map((province) => (
                                  <SelectItem
                                    key={province.code}
                                    value={province.code.toString()}
                                    className="font-medium py-2"
                                  >
                                    {province.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              Quận/Huyện
                            </Label>
                            <Select
                              value={selectedDistrict.toString()}
                              onValueChange={(value) => {
                                setSelectedDistrict(Number(value));
                                setSelectedWard("");
                              }}
                            >
                              <SelectTrigger className="h-11 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-100">
                                <SelectValue placeholder="Chọn quận/huyện" />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg border border-slate-200 shadow-lg">
                                {availableDistricts.map((district) => (
                                  <SelectItem
                                    key={district.code}
                                    value={district.code.toString()}
                                    className="font-medium py-2"
                                  >
                                    {district.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              Phường/Xã
                            </Label>
                            <Select
                              value={selectedWard.toString()}
                              onValueChange={(v) => setSelectedWard(Number(v))}
                              disabled={!selectedDistrict}
                            >
                              <SelectTrigger className="h-11 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-100">
                                <SelectValue placeholder="Chọn phường/xã" />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg border border-slate-200 shadow-lg">
                                {availableWards.map((ward) => (
                                  <SelectItem
                                    key={ward.code}
                                    value={ward.code.toString()}
                                    className="font-medium py-2"
                                  >
                                    {ward.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              Tìm nhanh địa chỉ (Goong AI)
                            </Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                              <Input
                                placeholder="Gõ địa chỉ để tìm nhanh..."
                                value={addressSearchQuery}
                                onChange={(e) =>
                                  handleAddressSearch(e.target.value)
                                }
                                className="h-11 pl-10 rounded-lg border border-indigo-200 bg-indigo-50/30 focus:bg-white transition-all font-medium"
                              />
                              {isSearchingAddress && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-indigo-500 animate-spin" />
                              )}

                              {/* Autocomplete Results */}
                              <AnimatePresence>
                                {addressPredictions.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-[100] overflow-hidden"
                                  >
                                    {addressPredictions.map((p) => (
                                      <button
                                        key={p.place_id}
                                        onClick={() => handleSelectAddress(p)}
                                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-start gap-3 transition-colors border-b border-slate-100 last:border-0"
                                      >
                                        <MapPin className="size-4 text-indigo-500 mt-1 flex-shrink-0" />
                                        <div>
                                          <p className="text-sm font-bold text-slate-900">
                                            {p.structured_formatting.main_text}
                                          </p>
                                          <p className="text-[11px] text-slate-500">
                                            {
                                              p.structured_formatting
                                                .secondary_text
                                            }
                                          </p>
                                        </div>
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              Số nhà, tên đường
                            </Label>
                            <Input
                              placeholder="VD: Số 123 Đường Láng"
                              value={formData.street}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  street: e.target.value,
                                });
                                if (fieldErrors.address)
                                  setFieldErrors({
                                    ...fieldErrors,
                                    address: "",
                                  });
                              }}
                              className={`h-11 rounded-lg border bg-white font-medium focus:ring-2 transition-all ${
                                fieldErrors.address
                                  ? "border-red-500 focus:ring-red-100"
                                  : "border-slate-300 focus:ring-indigo-100"
                              }`}
                            />
                          </div>
                          {fieldErrors.address && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                              <AlertCircle className="size-3" />{" "}
                              {fieldErrors.address}
                            </p>
                          )}
                        </div>

                        {fullAddress && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-900 text-white rounded-lg p-6 shadow-lg relative overflow-hidden group border border-slate-700 mt-4"
                          >
                            <div className="absolute top-[-10%] right-[-5%] p-4 opacity-5 transform group-hover:scale-125 transition-transform duration-1000">
                              <Pin className="size-24 text-emerald-400" />
                            </div>
                            <div className="relative z-10 flex items-start gap-3">
                              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
                                <MapPin className="size-5 text-emerald-400" />
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                  Địa chỉ hiển thị
                                </div>
                                <p className="text-base font-semibold leading-tight">
                                  {fullAddress}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {user?.role === "broker" && (
                          <div className="space-y-2 pt-4 border-t border-slate-300">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Tên chủ nhà sở hữu *
                            </Label>
                            <Input
                              type="text"
                              placeholder="Nguyễn Văn A"
                              value={formData.ownerName}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  ownerName: e.target.value,
                                });
                                if (fieldErrors.ownerName)
                                  setFieldErrors({ ...fieldErrors, ownerName: "" });
                              }}
                              className={`h-12 rounded-lg border focus:ring-2 text-base font-medium bg-white transition-all ${
                                fieldErrors.ownerName
                                  ? "border-red-500 focus:ring-red-100"
                                  : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                              }`}
                            />
                            {fieldErrors.ownerName && (
                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                                <AlertCircle className="size-3" />{" "}
                                {fieldErrors.ownerName}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="space-y-2 pt-4 border-t border-slate-300">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {user?.role === "broker" ? "Số điện thoại liên hệ chủ nhà *" : "Số điện thoại liên hệ *"}
                          </Label>
                          <Input
                            type="tel"
                            placeholder="0912 345 678"
                            value={formData.phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              setFormData({
                                ...formData,
                                phone: val,
                              });
                              if (fieldErrors.phone)
                                setFieldErrors({ ...fieldErrors, phone: "" });
                            }}
                            onBlur={() =>
                              setFieldErrors({
                                ...fieldErrors,
                                phone:
                                  validatePhone(formData.phone).error || "",
                              })
                            }
                            className={`h-12 rounded-lg border focus:ring-2 text-base font-medium bg-white transition-all ${
                              fieldErrors.phone
                                ? "border-red-500 focus:ring-red-100"
                                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                            }`}
                          />
                          {fieldErrors.phone && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                              <AlertCircle className="size-3" />{" "}
                              {fieldErrors.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="space-y-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Check className="size-5 text-emerald-700" />
                        </div>
                        <h3 className="font-bold text-slate-900 uppercase tracking-wide text-sm">
                          Tiện ích kèm theo
                        </h3>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Đã chọn:{" "}
                        {Object.values(amenities).filter(Boolean).length}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(amenityMeta).map(([key, meta]) => {
                        const Icon = meta.icon;
                        const isActive =
                          amenities[key as keyof typeof amenities];
                        return (
                          <button
                            key={key}
                            onClick={() => toggleAmenity(key)}
                            className={`group relative p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-200 border-2 ${
                              isActive
                                ? "bg-emerald-100 border-emerald-400 shadow-md text-emerald-700"
                                : "bg-white border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg transition-all ${
                                isActive
                                  ? "bg-emerald-200 scale-110"
                                  : "bg-slate-100 group-hover:bg-indigo-100"
                              }`}
                            >
                              <Icon
                                className={`size-6 transition-all ${isActive ? "text-emerald-700" : "group-hover:text-indigo-600"}`}
                              />
                            </div>
                            <div className="text-center">
                              <p
                                className={`text-xs font-semibold uppercase tracking-tight leading-tight px-1 ${isActive ? "text-emerald-700" : "text-slate-900"}`}
                              >
                                {meta.label}
                              </p>
                            </div>
                            {isActive && (
                              <motion.div
                                layoutId="active-badge"
                                className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full shadow"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, scale: 0.95 },
                      show: { opacity: 1, scale: 1 },
                    }}
                    className="pt-6 flex flex-col gap-3"
                  >
                    <Button
                      onClick={handleNext}
                      className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-base font-bold shadow-md transition-all hover:shadow-lg active:scale-95 group"
                    >
                      Tiếp tục →
                    </Button>
                    <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Bước 1/5: Thông tin tổng quan
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {/* ===== STEP 2: PIN MAP ===== */}
              {step === "pin-map" && (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    show: { transition: { staggerChildren: 0.1 } },
                  }}
                  className="p-6 sm:p-8 lg:p-10 space-y-8"
                >
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="text-center space-y-3"
                  >
                    <div className="bg-amber-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                      <Pin className="size-8 text-amber-700" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      Ghim vị trí chính xác
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto font-medium">
                      Di chuyển bản đồ để ghim đúng vị trí phòng trọ. Đây là
                      thông tin quan trọng nhất để khách tìm thấy bạn.
                    </p>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  >
                    {[
                      {
                        icon: "🎯",
                        title: "Chính xác",
                        desc: "Giảm 90% cuộc gọi hỏi đường",
                        color: "bg-emerald-50 text-emerald-700",
                      },
                      {
                        icon: "⭐",
                        title: "Ưu tiên",
                        desc: "Hiển thị nổi bật trên bản đồ",
                        color: "bg-indigo-50 text-indigo-700",
                      },
                      {
                        icon: "🛡️",
                        title: "Tin cậy",
                        desc: "Đạt chuẩn Trust-Score cao",
                        color: "bg-purple-50 text-purple-700",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`${item.color} rounded-lg p-4 border border-white/50 shadow-sm hover:shadow-md transition-all`}
                      >
                        <div className="text-3xl mb-2">{item.icon}</div>
                        <p className="font-bold text-sm mb-1">{item.title}</p>
                        <p className="text-xs font-medium opacity-70">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </motion.div>

                  <div className="relative rounded-lg overflow-hidden border-4 border-white shadow-lg h-[400px]">
                    <LandlordPinMap
                      onPinLocation={handlePinMapUpdate}
                      initialLocation={
                        pinnedLocation
                          ? [pinnedLocation.lat, pinnedLocation.lng]
                          : undefined
                      }
                    />

                    {pinnedLocation && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-4 left-4 right-4 bg-slate-900/95 text-white p-4 rounded-lg border border-slate-700 shadow-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500 rounded-lg animate-pulse">
                            <Target className="size-5 text-white" />
                          </div>
                          <div className="text-sm">
                            <p className="text-xs font-semibold uppercase text-emerald-400">
                              Tọa độ
                            </p>
                            <p className="font-medium">
                              {pinnedLocation.lat.toFixed(6)},{" "}
                              {pinnedLocation.lng.toFixed(6)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-400">
                          ✅ Sẵn sàng
                        </span>
                      </motion.div>
                    )}
                  </div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, scale: 0.98 },
                      show: { opacity: 1, scale: 1 },
                    }}
                    className="space-y-2"
                  >
                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Ghi chú chỉ dẫn (Tùy chọn)
                    </Label>
                    <Input
                      placeholder="VD: Đi thẳng hẻm 12, nhà màu xanh cuối đường..."
                      value={pinNote}
                      onChange={(e) => setPinNote(e.target.value)}
                      className="h-12 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base font-medium bg-white"
                    />
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="flex gap-3 pt-4"
                  >
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 h-12 rounded-lg font-semibold text-slate-700 border-slate-300"
                    >
                      ← Quay lại
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-base font-bold shadow-md transition-all"
                    >
                      Xác thực GPS →
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {/* ===== STEP 3: GPS VERIFY ===== */}
              {step === "verify" && (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    show: { transition: { staggerChildren: 0.1 } },
                  }}
                  className="p-6 sm:p-8 lg:p-10 space-y-8"
                >
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="text-center space-y-3"
                  >
                    <div className="bg-emerald-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                      <ShieldCheck className="size-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      Xác thực GPS "Trust Score"
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto font-medium">
                      Tăng độ tin cậy tuyệt đối cho tin đăng. Tin đăng có GPS
                      được ưu tiên hiển thị gấp 5 lần.
                    </p>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-6"
                  >
                    <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-3 text-sm">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <ShieldCheck className="size-5" />
                      </div>
                      Lộ trình xác thực tin cậy
                    </h3>
                    <div className="space-y-3">
                      {[
                        {
                          step: "1",
                          title: "Chưa xác thực",
                          desc: "Tin hiển thị mờ, có nhãn cảnh báo",
                          color: "bg-slate-200",
                        },
                        {
                          step: "2",
                          title: "Xác thực SĐT (OTP)",
                          desc: "Xác minh chủ sở hữu số điện thoại",
                          color: "bg-blue-200",
                        },
                        {
                          step: locationData ? "✓" : "3",
                          title: "Xác thực GPS (Hoàn tất)",
                          desc: "Ghi nhận vị trí thực tế tại căn phòng",
                          color: locationData
                            ? "bg-emerald-500 text-white"
                            : "bg-emerald-200",
                          highlight: !!locationData,
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-all ${item.highlight ? "bg-white shadow-md scale-100" : "opacity-60"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0 font-bold text-sm`}
                          >
                            {item.step}
                          </div>
                          <div>
                            <p
                              className={`font-semibold text-sm ${item.highlight ? "text-emerald-600" : "text-slate-900"}`}
                            >
                              {item.title}
                            </p>
                            <p className="text-xs font-medium text-slate-500">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, scale: 0.98 },
                      show: { opacity: 1, scale: 1 },
                    }}
                    className="bg-white border border-slate-200 rounded-lg p-8 text-center shadow-sm"
                  >
                    {locationData ? (
                      <div className="space-y-4">
                        <div className="w-20 h-20 rounded-lg bg-emerald-50 flex items-center justify-center mx-auto shadow-md">
                          <MapPin className="size-10 text-emerald-600 animate-bounce" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-emerald-900 mb-2">
                            Xác thực thành công!
                          </h4>
                          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mt-4">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                                Độ chính xác
                              </p>
                              <p className="text-base font-bold text-slate-900">
                                ±{locationData.accuracy}m
                              </p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                                Tọa độ
                              </p>
                              <p className="text-xs font-bold text-slate-900">
                                {locationData.lat.toFixed(4)},{" "}
                                {locationData.lng.toFixed(4)}
                              </p>
                            </div>
                          </div>

                          {/* GPS Location Mismatch Warning */}
                          <AnimatePresence>
                            {gpsLocationMismatch && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`mt-6 p-4 rounded-lg border ${
                                  gpsLocationMismatch.isExcessive
                                    ? "bg-amber-50 border-amber-200"
                                    : "bg-emerald-50 border-emerald-200"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`p-2 rounded-lg flex-shrink-0 ${
                                      gpsLocationMismatch.isExcessive
                                        ? "bg-amber-100"
                                        : "bg-emerald-100"
                                    }`}
                                  >
                                    <MapPin
                                      className={`size-5 ${
                                        gpsLocationMismatch.isExcessive
                                          ? "text-amber-600"
                                          : "text-emerald-600"
                                      }`}
                                    />
                                  </div>
                                  <div className="text-left">
                                    <p
                                      className={`text-sm font-bold ${
                                        gpsLocationMismatch.isExcessive
                                          ? "text-amber-900"
                                          : "text-emerald-900"
                                      }`}
                                    >
                                      {gpsLocationMismatch.isExcessive
                                        ? "⚠️ Vị trí lệch quá xa"
                                        : "✓ Vị trí khớp tốt"}
                                    </p>
                                    <p
                                      className={`text-xs font-medium mt-1 ${
                                        gpsLocationMismatch.isExcessive
                                          ? "text-amber-700"
                                          : "text-emerald-700"
                                      }`}
                                    >
                                      Khoảng cách giữa vị trí ghim và GPS thực
                                      tế:{" "}
                                      <span className="font-bold">
                                        {gpsLocationMismatch.distanceM.toFixed(
                                          0,
                                        )}
                                        m
                                      </span>
                                      {gpsLocationMismatch.isExcessive && (
                                        <>
                                          <br />
                                          Vui lòng kiểm tra lại vị trí ghim trên
                                          bản đồ để đảm bảo chính xác.
                                        </>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="w-20 h-20 rounded-lg bg-slate-50 flex items-center justify-center mx-auto">
                          <Camera className="size-10 text-slate-300" />
                        </div>
                        <div className="max-w-sm mx-auto">
                          <h4 className="text-lg font-bold text-slate-900 mb-2">
                            Đứng tại phòng trọ
                          </h4>
                          <p className="text-sm font-medium text-slate-600 leading-relaxed">
                            Vui lòng cho phép MapHome truy cập vị trí của bạn để
                            hoàn tất chứng chỉ xác thực GPS.
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isGettingLocation}
                          className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-base font-bold shadow-md transition-all active:scale-95 border-none"
                        >
                          {isGettingLocation ? (
                            <>
                              <Loader2 className="size-5 mr-2 animate-spin" />
                              Đang định vị...
                            </>
                          ) : (
                            <>
                              <MapPin className="size-5 mr-2" />
                              Xác thực GPS ngay
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="flex gap-3 pt-4"
                  >
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 h-12 rounded-lg font-semibold text-slate-700 border-slate-300"
                    >
                      ← Quay lại
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-base font-bold shadow-md transition-all"
                    >
                      {locationData ? "Tải ảnh →" : "Bỏ qua xác thực"}
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {/* ===== STEP 4: UPLOAD PHOTOS ===== */}
              {step === "upload-photos" && (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    show: { transition: { staggerChildren: 0.1 } },
                  }}
                  className="p-6 sm:p-8 lg:p-10 space-y-8"
                >
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="text-center space-y-3"
                  >
                    <div className="bg-indigo-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                      <Camera className="size-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      Hình ảnh thực tế
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto font-medium">
                      Tải lên ít nhất 3 hình ảnh rõ nét. Hình ảnh đẹp giúp tăng
                      tỉ lệ chốt đơn lên 300%.
                    </p>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4"
                  >
                    {uploadedImages.map((img, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -3 }}
                        className="aspect-square rounded-lg overflow-hidden relative border-2 border-white shadow-md group"
                      >
                        <img
                          src={img}
                          alt="Upload"
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                        />
                        <button
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-500/90 text-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600"
                        >
                          <X className="size-4" />
                        </button>
                        {idx === 0 && (
                          <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-indigo-950/80 text-[8px] font-bold text-white rounded-md">
                            🌟 Ảnh bìa
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {uploadedImages.length < 5 && (
                      <label
                        className={`aspect-square rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-indigo-400 hover:bg-indigo-50 group ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <div className="p-2.5 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                          {isUploading ? (
                            <Loader2 className="size-6 text-indigo-600 animate-spin" />
                          ) : (
                            <Upload className="size-6 text-indigo-600" />
                          )}
                        </div>
                        <span className="text-[8px] font-semibold text-slate-500">
                          {isUploading ? "Tải..." : "Thêm ảnh"}
                        </span>
                      </label>
                    )}
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-6 flex items-start gap-4"
                  >
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <Sparkles className="size-6 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-900 mb-2">
                        Bí kíp chụp ảnh nghìn đơn
                      </h4>
                      <ul className="text-sm text-indigo-700 font-medium space-y-1 opacity-80">
                        <li>• Chụp vào ban ngày để có ánh sáng tự nhiên</li>
                        <li>• Sắp xếp phòng gọn gàng, sạch sẽ</li>
                        <li>• Chụp đủ các góc: Giường, phòng tắm, ban công</li>
                      </ul>
                    </div>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="flex gap-3 pt-4"
                  >
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 h-12 rounded-lg font-semibold text-slate-700 border-slate-300"
                    >
                      ← Quay lại
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-base font-bold shadow-md transition-all"
                    >
                      Xem trước →
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {/* ===== STEP 5: PREVIEW ===== */}
              {step === "preview" && (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    show: { transition: { staggerChildren: 0.1 } },
                  }}
                  className="p-6 sm:p-8 lg:p-10 space-y-8"
                >
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="text-center space-y-3"
                  >
                    <div className="bg-indigo-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                      <Sparkles className="size-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      Kiệt tác của bạn
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto font-medium">
                      Kiểm tra lại tất cả thông tin lần cuối trước khi đưa tin
                      đăng lên bản đồ.
                    </p>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, scale: 0.98 },
                      show: { opacity: 1, scale: 1 },
                    }}
                    className="max-w-2xl mx-auto"
                  >
                    <div className="bg-white rounded-lg border-4 border-white shadow-lg overflow-hidden relative group">
                      <div className="aspect-[16/10] relative">
                        <img
                          src={
                            getImageUrl(uploadedImages[0]) ||
                            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop"
                          }
                          className="w-full h-full object-cover transition-transform duration-500"
                          alt="Preview"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 text-white">
                          <div className="flex items-center gap-2 mb-2">
                            {locationData && (
                              <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                                <ShieldCheck className="size-3" /> Đã xác thực
                                GPS
                              </span>
                            )}
                            <span className="bg-white/20 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/30">
                              {formData.area} m²
                            </span>
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-bold leading-tight mb-1">
                            {formData.name || "Tên phòng trọ"}
                          </h3>
                          <p className="text-lg font-bold text-emerald-400">
                            {(Number(formData.price) || 0).toLocaleString()}{" "}
                            <span className="text-xs">₫/tháng</span>
                          </p>
                        </div>
                      </div>

                      <div className="p-6 space-y-6">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-slate-100 rounded-lg text-indigo-600">
                            <MapPin className="size-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">
                              Vị trí thực tế
                            </p>
                            <p className="font-bold text-slate-900">
                              {fullAddress}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-slate-100 rounded-lg text-indigo-600">
                              <User className="size-5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">
                                Người phụ trách
                              </p>
                              <p className="font-bold text-slate-900">
                                {user?.fullName || "Chủ trọ"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-slate-100 rounded-lg text-indigo-600">
                              <Phone className="size-5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">
                                Hotline liên hệ
                              </p>
                              <p className="font-bold text-slate-900">
                                {formData.phone}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 uppercase">
                            Tiện ích đi kèm
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(amenities)
                              .filter(([_, v]) => v)
                              .map(([k, _]) => (
                                <span
                                  key={k}
                                  className="px-3 py-1.5 bg-indigo-50 rounded-lg text-xs font-bold text-indigo-700 border border-indigo-200 flex items-center gap-1.5"
                                >
                                  <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                                  {
                                    amenityLabels[
                                      k as keyof typeof amenityLabels
                                    ]
                                  }
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 mb-4"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <CalendarDays className="size-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 mb-1">
                        Thời hạn đăng tin: 30 ngày
                      </h4>
                      <p className="text-xs text-amber-700 font-medium opacity-80 leading-relaxed">
                        Sau khi được duyệt, tin đăng của bạn sẽ hiển thị trên
                        bản đồ trong 30 ngày. Bạn có thể gia hạn bất cứ lúc nào
                        từ trang quản lý.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="flex gap-3 pt-4"
                  >
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 h-12 rounded-lg font-semibold text-slate-700 border-slate-300"
                    >
                      ← Quay lại
                    </Button>
                    <Button
                      onClick={handleFinalSubmit}
                      className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-base font-bold shadow-md transition-all"
                    >
                      XUẤT BẢN NGAY
                      <Check className="size-5 ml-2" />
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ===== MISMATCH CONFIRMATION MODAL ===== */}
          <AnimatePresence>
            {showMismatchConfirm && gpsLocationMismatch && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowMismatchConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-6"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-amber-100 rounded-full mb-4">
                      <AlertCircle className="size-8 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 text-center">
                      Vị trí không khớp
                    </h3>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-amber-900">
                        Khoảng cách lệch:
                      </span>
                      <span className="text-lg font-bold text-amber-600">
                        {gpsLocationMismatch.distanceM.toFixed(0)}m
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                      Vị trí bạn ghim trên bản đồ lệch hơn 50m so với vị trí GPS
                      thực tế. Bạn có 2 lựa chọn:
                    </p>
                    <div className="space-y-2 pt-2 border-t border-amber-200 text-xs text-amber-700 font-medium">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>
                          <strong>Xác thực:</strong> Tin cậy vị trí, tiếp tục
                          tải ảnh
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">⚠️</span>
                        <span>
                          <strong>Tiếp tục:</strong> Bỏ qua lệch, chấp nhận rủi
                          ro
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleRejectMismatch}
                      className="flex-1 h-10 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-md transition-all"
                    >
                      ⚠️ Tiếp tục
                    </Button>
                    <Button
                      onClick={handleConfirmMismatch}
                      className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md transition-all"
                    >
                      ✓ Xác thực
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function Target(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
