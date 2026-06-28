import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const defaultSlides = [
  {
    id: 1,
    title: "Tìm Phòng Trọ Hoàn Hảo",
    subtitle: "Hàng ngàn phòng trọ chất lượng đang chờ bạn khám phá",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1080&h=800&fit=crop&q=80",
    link: "/map",
  },
  {
    id: 2,
    title: "Xác Thực 3 Cấp Độ",
    subtitle: "Trust is King - An toàn tuyệt đối cho mọi giao dịch",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1080&h=800&fit=crop&q=80",
    link: "/map",
  },
  {
    id: 3,
    title: "Tìm Kiếm Thông Minh",
    subtitle: "Bản đồ tương tác với các tiện ích xung quanh",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1080&h=800&fit=crop&q=80",
    link: "/map",
  },
];

export function HeroCarousel() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % defaultSlides.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000); // Tự động cuộn sau mỗi 4 giây

    return () => clearInterval(interval);
  }, [isAutoPlay, width]);

  return (
    <View className="relative h-[400px]">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        snapToInterval={width}
        snapToAlignment="center"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        onScrollBeginDrag={() => setIsAutoPlay(false)}
        onScrollEndDrag={() => setIsAutoPlay(true)}
        onScroll={(e) => {
          const contentOffsetX = e.nativeEvent.contentOffset.x;
          const currentIndex = Math.round(contentOffsetX / width);
          if (currentIndex !== activeIndex && currentIndex >= 0 && currentIndex < defaultSlides.length) {
             setActiveIndex(currentIndex);
          }
        }}
        scrollEventThrottle={16}
      >
        {defaultSlides.map((slide) => (
          <ImageBackground
            key={slide.id}
            source={{ uri: slide.image }}
            className="h-full"
            style={{ width }}
          >
            <View className="absolute inset-0 bg-black/40" />
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-3xl md:text-5xl font-bold text-white text-center mb-4 leading-tight">
                {slide.title}
              </Text>
              <Text className="text-base text-white/95 text-center mb-8">
                {slide.subtitle}
              </Text>
              
              <TouchableOpacity 
                onPress={() => router.push(slide.link as any)}
                className="bg-white flex-row items-center px-8 py-4 rounded-full"
              >
                <MapPin size={20} color="#111827" />
                <Text className="text-gray-900 font-bold ml-2 text-base">
                  Khám phá ngay
                </Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        ))}
      </ScrollView>
      
      {/* Dots */}
      <View className="absolute bottom-6 flex-row justify-center w-full space-x-2">
        {defaultSlides.map((_, i) => (
          <View 
            key={i} 
            className={`h-2 rounded-full ${i === activeIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} 
          />
        ))}
      </View>
    </View>
  );
}
