import { useNavigate } from "react-router";
import { Button } from "@/app/components/ui/button";
import { MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/app/utils/api";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/app/components/ui/carousel";

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

export function HeroCarousel() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<any[]>(defaultSlides);
  const [apiRef, setApiRef] = useState<CarouselApi>();

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

  useEffect(() => {
    if (!apiRef) return;
    
    const intervalId = setInterval(() => {
      if (apiRef.canScrollNext()) {
        apiRef.scrollNext();
      } else {
        apiRef.scrollTo(0);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [apiRef]);

  return (
    <div className="hero-carousel-wrapper relative -mt-4 md:-mt-6">
      <Carousel setApi={setApiRef} opts={{ loop: true }} className="w-full">
        <CarouselContent className="-ml-0">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="pl-0 h-[350px] sm:h-[450px] md:h-[600px] lg:h-[700px] relative overflow-hidden bg-slate-800">
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
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
