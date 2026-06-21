import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useNavigate } from "react-router";
import { Button } from "@/app/components/ui/button";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import api from "@/app/utils/api";

const defaultSlides = [
  {
    id: 1,
    title: "Tìm Phòng Trọ Hoàn Hảo",
    subtitle: "Hàng ngàn phòng trọ chất lượng đang chờ bạn khám phá",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&h=800&fit=crop&q=80",
    link: "/map",
  },
  {
    id: 2,
    title: "Xác Thực 3 Cấp Độ",
    subtitle: "Trust is King - An toàn tuyệt đối cho mọi giao dịch",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1920&h=800&fit=crop&q=80",
    link: "/map",
  },
  {
    id: 3,
    title: "Tìm Kiếm Thông Minh",
    subtitle: "Bản đồ tương tác với các tiện ích xung quanh",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&h=800&fit=crop&q=80",
    link: "/map",
  },
  {
    id: 4,
    title: "Giá Cả Hợp Lý",
    subtitle: "Tìm được nhà trọ phù hợp với túi tiền của bạn",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&h=800&fit=crop&q=80",
    link: "/map",
  },
];

// Custom Arrow Components
function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full p-2 md:p-3 transition-all duration-300 group"
      aria-label="Next slide"
    >
      <ChevronRight className="size-6 md:size-8 text-white group-hover:scale-110 transition-transform" />
    </button>
  );
}

function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full p-2 md:p-3 transition-all duration-300 group"
      aria-label="Previous slide"
    >
      <ChevronLeft className="size-6 md:size-8 text-white group-hover:scale-110 transition-transform" />
    </button>
  );
}

export function HeroCarousel() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<any[]>(defaultSlides);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await api.get("/api/settings/public");
        if (res.status === 200 && res.data.banners?.length > 0) {
          const activeBanners = res.data.banners
            .filter((b: any) => b.active)
            .map((b: any, idx: number) => ({
              id: `api-${idx}`,
              title: b.title || "MapHome",
              subtitle: b.title ? "Khám phá không gian sống lý tưởng" : "Nền tảng tìm kiếm trọ hàng đầu",
              image: b.imageUrl,
              link: b.link || "/map"
            }));
          if (activeBanners.length > 0) {
            setSlides(activeBanners);
          }
        }
      } catch (error) {
        console.error("Failed to fetch banners, using defaults.");
      }
    };
    fetchBanners();
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    arrows: false,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    swipeToSlide: true,
    beforeChange: (_current: number, next: number) => setCurrentSlide(next),
    appendDots: (dots: any) => (
      <div className="bottom-6 md:bottom-8">
        <ul className="flex justify-center gap-2"> {dots} </ul>
      </div>
    ),
    customPaging: () => (
      <button className="w-3 h-3 rounded-full bg-white/50 hover:bg-white transition-all duration-300" />
    ),
  };

  return (
    <div className="hero-carousel-wrapper relative -mt-4 md:-mt-6">
      <Slider {...settings}>
        {slides.map((slide) => (
          <div key={slide.id} className="relative">
            <div className="relative h-[350px] sm:h-[450px] md:h-[600px] lg:h-[700px] overflow-hidden bg-slate-800">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${slide.image})`,
                  backgroundPosition: "center center",
                }}
              >
                {/* Image Overlay for better text readability */}
                <div className="absolute inset-0 bg-black/30" />
              </div>

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center text-center px-4 text-white">
                <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                  <div className="space-y-4 md:space-y-6">
                    <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold drop-shadow-2xl leading-tight">
                      {slide.title}
                    </h1>
                    <p className="text-base md:text-xl lg:text-2xl drop-shadow-lg text-white/95 max-w-2xl mx-auto">
                      {slide.subtitle}
                    </p>
                    <div className="pt-4 md:pt-6">
                      <Button
                        size="lg"
                        onClick={() => navigate(slide.link || "/map")}
                        className="text-base md:text-lg px-8 md:px-12 py-5 md:py-7 h-auto bg-white text-gray-900 hover:bg-gray-100 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                      >
                        <MapPin className="size-5 md:size-6 mr-2" />
                        Khám phá ngay
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}
