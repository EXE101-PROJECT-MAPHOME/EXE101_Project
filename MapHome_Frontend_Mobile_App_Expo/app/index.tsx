import { useEffect } from "react";
import { View, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

export default function IntroScreen() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(20);

  useEffect(() => {
    // Start smooth animation
    opacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.back(1.5)) });
    translateY.value = withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) });

    // Redirect to main app after animation
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

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
