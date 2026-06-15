import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { router } from "expo-router";
import { Map, MessageCircle, Home, ArrowRight, Check } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Khám phá dễ dàng",
    description: "Tìm kiếm phòng trọ, căn hộ qua bản đồ trực quan với thông tin chính xác nhất.",
    icon: Map,
  },
  {
    id: "2",
    title: "Kết nối trực tiếp",
    description: "Liên hệ nhanh chóng với chủ nhà hoặc người thuê mà không qua trung gian.",
    icon: MessageCircle,
  },
  {
    id: "3",
    title: "Bắt đầu hành trình",
    description: "Tìm tổ ấm mơ ước của bạn ngay hôm nay cùng MapHome.",
    icon: Home,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem("hasViewedOnboarding", "true");
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      router.replace("/(tabs)");
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const PaginationDot = ({ index }: { index: number }) => {
    const animatedDotStyle = useAnimatedStyle(() => {
      const dotWidth = interpolate(
        scrollX.value,
        [(index - 1) * width, index * width, (index + 1) * width],
        [8, 24, 8],
        Extrapolation.CLAMP
      );
      const opacity = interpolate(
        scrollX.value,
        [(index - 1) * width, index * width, (index + 1) * width],
        [0.3, 1, 0.3],
        Extrapolation.CLAMP
      );

      return {
        width: dotWidth,
        opacity,
      };
    });

    return (
      <Animated.View
        style={[animatedDotStyle]}
        className="h-2 rounded-full bg-maphome-500 mx-1"
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Skip button */}
      <View className="flex-row justify-end px-6 pt-4">
        <TouchableOpacity onPress={completeOnboarding}>
          <Text className="text-maphome-600 font-medium text-base">Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      {/* FlatList for slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => {
          const IconComponent = item.icon;
          return (
            <View style={{ width }} className="items-center justify-center px-8">
              <View className="w-64 h-64 bg-maphome-50 rounded-full items-center justify-center mb-10">
                <IconComponent size={120} color="#22c55e" strokeWidth={1.5} />
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">
                {item.title}
              </Text>
              <Text className="text-base text-gray-500 text-center leading-relaxed">
                {item.description}
              </Text>
            </View>
          );
        }}
      />

      {/* Footer controls */}
      <View className="flex-row items-center justify-between px-8 pb-12 pt-4">
        {/* Pagination Dots */}
        <View className="flex-row">
          {SLIDES.map((_, index) => (
            <PaginationDot key={index} index={index} />
          ))}
        </View>

        {/* Next/Start Button */}
        <TouchableOpacity
          onPress={handleNext}
          className="bg-maphome-500 w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-maphome-200"
          activeOpacity={0.8}
        >
          {currentIndex === SLIDES.length - 1 ? (
            <Check size={24} color="#fff" />
          ) : (
            <ArrowRight size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
