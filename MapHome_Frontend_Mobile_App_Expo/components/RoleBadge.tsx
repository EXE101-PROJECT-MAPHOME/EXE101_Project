import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { User, ShieldCheck, Home } from 'lucide-react-native';

interface RoleBadgeProps {
  role: 'admin' | 'landlord' | 'user' | 'broker';
  className?: string;
  showIcon?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RoleBadge({ role, className = '', showIcon = true }: RoleBadgeProps) {
  const configs = {
    admin: {
      label: 'Quản trị viên',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      text: 'text-indigo-700',
      icon: ShieldCheck,
      iconColor: '#4338ca', // indigo-700
    },
    landlord: {
      label: 'Chủ trọ',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-700',
      icon: Home,
      iconColor: '#047857', // emerald-700
    },
    user: {
      label: 'Người thuê',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-700',
      icon: User,
      iconColor: '#1d4ed8', // blue-700
    },
    broker: {
      label: 'Môi giới',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-700',
      icon: User,
      iconColor: '#b45309', // amber-700
    },
  };

  const config = configs[role] || configs.user;
  const Icon = config.icon;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const onPressIn = () => {
    scale.value = withSpring(0.95);
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={animatedStyle}
      className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} self-start ${className}`}
    >
      {showIcon && (
        <View className="p-1 rounded-full bg-white shadow-sm flex items-center justify-center">
          <Icon size={12} color={config.iconColor} />
        </View>
      )}
      <Text
        className={`text-[10px] font-black uppercase tracking-[0.15em] ${config.text}`}
      >
        {config.label}
      </Text>
    </AnimatedPressable>
  );
}
