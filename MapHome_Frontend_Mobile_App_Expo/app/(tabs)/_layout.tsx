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
  const isAndroid = Platform.OS === "android";
  const isWeb = Platform.OS === "web";
  
  // Platform-specific bottom spacing
  // iOS: Always respect safe area with minimum 10px
  // Android: Respect safe area, minimum 8px (gesture nav area)
  // Web: No safe area needed
  const bottomSpacing = isIOS 
    ? Math.max(insets.bottom, 10)
    : isAndroid
    ? Math.max(insets.bottom, 8)
    : 8;
  
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
          paddingLeft: insets.left,
          paddingRight: insets.right,
          ...(isAndroid && {
            elevation: 8,
          }),
          ...(isIOS && {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarItemStyle: {
          paddingVertical: 4,
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