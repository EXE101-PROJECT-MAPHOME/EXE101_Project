import React from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";

export function HelloWave() {
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    // rotate between -15 and 15 degrees, repeat 4 times (back-and-forth)
    rotate.value = withRepeat(
      withTiming(15, { duration: 300, easing: Easing.inOut(Easing.ease) }),
      4,
      true,
    );
  }, [rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.Text
      style={[{ fontSize: 28, lineHeight: 32, marginTop: -6 }, animatedStyle]}
    >
      👋
    </Animated.Text>
  );
}
