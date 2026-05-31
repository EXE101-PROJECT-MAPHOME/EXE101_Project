import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Home,
  Map as MapIcon,
  Heart,
  User,
  MessageCircle,
  FileText,
  Mail,
} from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const bottomSpacing = isIOS ? Math.max(insets.bottom, 10) : 8;
  const tint = useThemeColor({}, "tint");
  const icon = useThemeColor({}, "icon");
  const background = useThemeColor({}, "background");
  const borderTopColor = "#f1f5f9";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: icon,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: background,
          borderTopWidth: 1,
          borderTopColor,
          height: 52 + bottomSpacing,
          paddingBottom: bottomSpacing,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Bản đồ",
          tabBarIcon: ({ color, size }) => (
            <MapIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="blog"
        options={{
          title: "Blog",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Đã lưu",
          href: null,
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="policy"
        options={{
          title: "Chính sách",
          tabBarIcon: ({ color, size }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: "Liên hệ",
          tabBarIcon: ({ color, size }) => <Mail size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}