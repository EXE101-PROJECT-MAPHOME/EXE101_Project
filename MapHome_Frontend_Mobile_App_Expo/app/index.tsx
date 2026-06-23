import { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";

import Constants from "expo-constants";

// Helper function to compare semantic versions (e.g. "1.0.0" vs "1.1.0")
const isVersionLessThan = (current: string, minimum: string): boolean => {
  const partsCurr = current.split(".").map(Number);
  const partsMin = minimum.split(".").map(Number);
  
  for (let i = 0; i < Math.max(partsCurr.length, partsMin.length); i++) {
    const valCurr = partsCurr[i] || 0;
    const valMin = partsMin[i] || 0;
    if (valCurr < valMin) return true;
    if (valCurr > valMin) return false;
  }
  return false;
};

export default function IntroScreen() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(20);
  
  const { user, loading: authLoading } = useAuth();
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    // Start smooth animation
    opacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.back(1.5)) });
    translateY.value = withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) });

    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 2800);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (animationDone && !authLoading) {
      const checkStatusAndRoute = async () => {
        try {
          // Check maintenance mode and minimum version requirements
          const settingsRes = await api.get("/api/settings/public").catch(() => null);
          const settings = settingsRes?.data || {};
          
          // 1. Force Update check
          const appVersion = Constants.expoConfig?.version || "1.0.0";
          const minVersion = settings.minimumVersion;
          
          if (minVersion && isVersionLessThan(appVersion, minVersion)) {
            router.replace("/update" as any);
            return;
          }

          // 2. Maintenance mode check
          const isMaintenance = settings.maintenanceMode === true;
          
          if (isMaintenance && user && user.role !== "admin") {
            // Block ALREADY logged-in non-admins
            router.replace("/maintenance" as any);
            return;
          }

          // Check onboarding
          const hasViewed = await AsyncStorage.getItem("hasViewedOnboarding");
          
          // Skip onboarding if user is already logged in OR has viewed it before
          if (user || hasViewed === "true") {
            router.replace("/(tabs)");
          } else {
            router.replace("/onboarding" as any);
          }
        } catch (error) {
          console.error("Error routing:", error);
          router.replace("/onboarding" as any);
        }
      };

      checkStatusAndRoute();
    }
  }, [animationDone, authLoading, user]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
    };
  });

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Image
          source={require("../assets/images/MapHome_logo_2.png")}
          style={{ width: 250, height: 250, resizeMode: "contain" }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
