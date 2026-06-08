import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Check,
  Shield,
  FileText,
  UserCheck,
  Award,
  TrendingUp,
  Star,
  MapPin,
  Clock,
  Search,
  FileCheck,
  Calendar,
  Users,
  ChevronRight,
  Sparkles,
  Home,
} from "lucide-react";

const VERIFICATION_FEE = 119000;
const RENEWAL_FEE = 199000;

const howItWorksSteps = [
  {
    icon: FileText,
    title: "Đăng ký & thanh toán",
    description: `Điền form đăng ký và thanh toán phí dịch vụ ${VERIFICATION_FEE.toLocaleString("vi-VN")}đ một lần`,
    step: "01",
  },
  {
    icon: UserCheck,
    title: "Đội ngũ MapHome đến kiểm tra thực tế",
    description:
      "Chuyên viên sẽ đến kiểm tra địa chỉ, điều kiện phòng trọ, và chụp ảnh thực tế",
    step: "02",
  },
  {
    icon: Award,
    title: "Nhận Badge xác thực + hiển thị ưu tiên",
    description:
      "Tin đăng của bạn có badge xanh và được ưu tiên hiển thị trên bản đồ",
    step: "03",
  },
];

const features = [
  {
    icon: Shield,
    title: "Badge xanh trên bản đồ",
    description: 'Hiển thị rõ ràng "✓ Đã xác thực" trên mọi tin đăng',
  },
  {
    icon: Search,
    title: "Ưu tiên hiển thị tìm kiếm",
    description: "Tin của bạn xuất hiện đầu tiên trong kết quả tìm kiếm",
  },
  {
    icon: FileCheck,
    title: "Báo cáo kiểm tra chi tiết",
    description: "Nhận báo cáo đầy đủ về tình trạng phòng trọ",
  },
  {
    icon: Calendar,
    title: "Hiệu lực 6 tháng",
    description: "Badge có giá trị trong 6 tháng kể từ ngày cấp",
  },
  {
    icon: Users,
    title: "Tăng độ tin cậy với người thuê",
    description: "Người thuê tin tưởng hơn khi thấy badge xác thực",
  },
  {
    icon: TrendingUp,
    title: "Hỗ trợ gia hạn với giá ưu đãi",
    description: `Gia hạn chỉ ${RENEWAL_FEE.toLocaleString("vi-VN")}đ cho lần tiếp theo`,
  },
];

const testimonials = [
  {
    name: "Anh Minh",
    role: "Chủ trọ tại Cầu Giấy",
    avatar: "M",
    rating: 5,
    content:
      "Sau khi có badge xác thực, số lượng người liên hệ tăng gấp 3 lần. Người thuê cảm thấy yên tâm hơn nhiều!",
  },
  {
    name: "Chị Hương",
    role: "Chủ trọ tại Đống Đa",
    avatar: "H",
    rating: 5,
    content:
      "Dịch vụ kiểm tra rất chuyên nghiệp. Đội ngũ đến đúng hẹn và báo cáo chi tiết. Đáng đồng tiền!",
  },
  {
    name: "Anh Tuấn",
    role: "Chủ trọ tại Thanh Xuân",
    avatar: "T",
    rating: 5,
    content:
      "Badge xanh giúp phòng của tôi nổi bật hơn hẳn. Thuê nhanh hơn và giảm được thời gian trống phòng.",
  },
];

const stats = [
  { value: "1,200+", label: "Phòng đã xác thực" },
  { value: "4.8/5", label: "Đánh giá chủ trọ" },
  { value: "68%", label: "Tăng lượt liên hệ" },
];

export function VerificationServicePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const handleRegister = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Navigate to checkout for verification service
    navigate("/checkout", {
      state: {
        selectedTier: "verification",
        billingCycle: "once",
        isVerificationService: true,
      },
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              {/* Badge Preview */}
              <div className="inline-block">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 transform hover:scale-105 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="size-6" strokeWidth={4} />
                  </div>
                  <div>
                    <p className="text-sm font-medium opacity-90">
                      Đã xác thực bởi
                    </p>
                    <p className="font-black text-xl">MapHome</p>
                  </div>
                </div>
              </div>

              {/* Heading */}
              <div>
                <h1 className="text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                  Tăng 3x lượt liên hệ với Badge Xác Thực
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Người thuê tin tưởng hơn khi thấy phòng trọ của bạn đã được
                  đội ngũ MapHome{" "}
                  <span className="font-semibold text-blue-600">
                    kiểm tra thực tế
                  </span>
                </p>
              </div>

              {/* Price Highlight */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-amber-100 border-2 border-amber-300 rounded-xl px-6 py-3">
                  <p className="text-sm text-amber-800 font-medium mb-1">Chỉ</p>
                  <p className="text-3xl font-black text-amber-900">
                    {VERIFICATION_FEE.toLocaleString("vi-VN")}đ
                  </p>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="size-5" />
                  <span className="font-semibold">Hiệu lực 6 tháng</span>
                </div>
              </div>

              {/* CTA */}
              <div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-xl h-16 text-lg px-8"
                  onClick={handleRegister}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <Shield className="size-6 mr-3" />
                  Đăng ký kiểm tra ngay
                  <ChevronRight
                    className={`size-6 ml-2 transition-transform ${isHovered ? "translate-x-1" : ""}`}
                  />
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  ✓ Không cần cam kết dài hạn · ✓ Hoàn 50% nếu không đạt tiêu
                  chuẩn
                </p>
              </div>
            </div>

            {/* Right: Illustration */}
            <div className="relative">
              <div className="relative">
                {/* Main Illustration - Verified Map Pin */}
                <div className="relative mx-auto w-96 h-96">
                  {/* Background glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-green-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>

                  {/* Main pin */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Map pin */}
                      <div className="w-48 h-48 bg-gradient-to-br from-green-500 to-blue-600 rounded-full rounded-br-none transform rotate-45 shadow-2xl flex items-center justify-center">
                        <div className="transform -rotate-45">
                          <Home
                            className="size-20 text-white"
                            strokeWidth={2.5}
                          />
                        </div>
                      </div>

                      {/* Checkmark badge */}
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-2xl flex items-center justify-center border-8 border-white animate-bounce">
                        <Check className="size-14 text-white" strokeWidth={5} />
                      </div>
                    </div>
                  </div>

                  {/* Trust signals floating around */}
                  <div className="absolute top-8 left-8 bg-white rounded-xl shadow-lg p-3 animate-float">
                    <div className="flex items-center gap-2">
                      <Shield className="size-5 text-green-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        Đã kiểm tra
                      </span>
                    </div>
                  </div>

                  <div className="absolute bottom-12 left-4 bg-white rounded-xl shadow-lg p-3 animate-float-delay-1">
                    <div className="flex items-center gap-2">
                      <Star className="size-5 text-yellow-500" />
                      <span className="text-sm font-semibold text-gray-900">
                        Ưu tiên hiển thị
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-16 right-8 bg-white rounded-xl shadow-lg p-3 animate-float-delay-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-5 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        +68% liên hệ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-700 border border-blue-300 px-4 py-2 text-sm font-semibold mb-4">
              Quy trình đơn giản
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Cách thức hoạt động
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Chỉ 3 bước để nhận badge xác thực và tăng độ tin cậy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative">
                  <Card className="h-full border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all">
                    <CardContent className="p-8 text-center">
                      {/* Step number */}
                      <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-black text-lg">
                          {step.step}
                        </span>
                      </div>

                      {/* Icon */}
                      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl flex items-center justify-center">
                        <Icon className="size-10 text-blue-600" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {step.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Arrow between steps */}
                  {idx < howItWorksSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ChevronRight
                        className="size-8 text-blue-300"
                        strokeWidth={3}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What Landlords Get Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-700 border border-green-300 px-4 py-2 text-sm font-semibold mb-4">
              Lợi ích vượt trội
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Chủ trọ nhận được gì?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Đầu tư {VERIFICATION_FEE.toLocaleString("vi-VN")}đ một lần, nhận
              lại nhiều hơn gấp bội
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className="border-2 border-gray-200 hover:border-green-300 hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="size-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-700 border border-purple-300 px-4 py-2 text-sm font-semibold mb-4">
              Chủ trọ yêu thích
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Đánh giá từ chủ trọ
            </h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 mb-2">
                    {stat.value}
                  </p>
                  <p className="text-gray-600 font-semibold">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-2 border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="size-5 text-yellow-500 fill-yellow-500"
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Box Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-4 border-blue-300 shadow-2xl bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-12">
              <div className="text-center mb-8">
                <div className="inline-block bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-full text-sm font-bold mb-6">
                  ⚡ Ưu đãi đặc biệt
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-4">
                  Gói Xác Thực Phòng Trọ
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Một lần thanh toán, sử dụng 6 tháng
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <div className="inline-block">
                  <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 mb-2">
                    {VERIFICATION_FEE.toLocaleString("vi-VN")}đ
                  </p>
                  <p className="text-gray-600 font-semibold">
                    Hiệu lực 6 tháng
                  </p>
                </div>
              </div>

              {/* Features checklist */}
              <div className="max-w-md mx-auto mb-8 space-y-3">
                {[
                  'Badge "✓ Đã xác thực" trên tin đăng',
                  "Kiểm tra thực tế tại địa chỉ",
                  "Báo cáo chi tiết tình trạng phòng",
                  "Ưu tiên hiển thị trong tìm kiếm",
                  "Hỗ trợ gia hạn giá ưu đãi",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <Check
                        className="size-4 text-green-600"
                        strokeWidth={3}
                      />
                    </div>
                    <p className="text-gray-700 font-medium">{item}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center mb-6">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold shadow-xl h-16 text-lg px-12"
                  onClick={handleRegister}
                >
                  <Sparkles className="size-6 mr-3" />
                  Đăng ký ngay
                  <ChevronRight className="size-6 ml-3" />
                </Button>
              </div>

              {/* Guarantee */}
              <div className="text-center bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <p className="text-green-900 font-bold flex items-center justify-center gap-2">
                  <Shield className="size-5" />
                  Hoàn 50% nếu không đạt tiêu chuẩn
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Chúng tôi tự tin về chất lượng dịch vụ
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delay-1 {
          animation: float 3s ease-in-out infinite;
          animation-delay: 1s;
        }

        .animate-float-delay-2 {
          animation: float 3s ease-in-out infinite;
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
