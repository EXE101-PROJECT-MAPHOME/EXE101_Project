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
import { HapticTab } from "@/components/haptic-tab";

export default function TabLayout() {
  const tint = useThemeColor({}, "tint");
  const icon = useThemeColor({}, "icon");
  const background = useThemeColor({}, "background");
  const insets = useSafeAreaInsets();
  
  const isLight = background === "#ffffff";
  const borderColor = isLight ? "#f1f5f9" : "#27272a";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: icon,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarAllowFontScaling: false,
        tabBarStyle: {
          backgroundColor: background,
          borderTopWidth: 1,
          borderTopColor: borderColor,
          // Handle dynamic heights and paddings for iOS notches and Android navigation bars
          height: Platform.OS === "ios"
            ? (insets.bottom > 0 ? 60 + insets.bottom : 68)
            : (insets.bottom > 0 ? 64 + insets.bottom : 68),
          paddingBottom: Platform.OS === "ios"
            ? (insets.bottom > 0 ? insets.bottom - 4 : 10)
            : (insets.bottom > 0 ? insets.bottom : 10),
          paddingTop: 8,
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isLight ? 0.04 : 0.15,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
          fontWeight: "700",
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size, focused }) => (
            <Home
              size={focused ? size + 1 : size}
              color={color}
              fill={focused ? color : "transparent"}
              strokeWidth={focused ? 2.2 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Bản đồ",
          tabBarIcon: ({ color, size, focused }) => (
            <MapIcon
              size={focused ? size + 1 : size}
              color={color}
              fill={focused ? `${color}25` : "transparent"}
              strokeWidth={focused ? 2.2 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Đã lưu",
          href: null,
          tabBarIcon: ({ color, size, focused }) => (
            <Heart
              size={focused ? size + 1 : size}
              color={color}
              fill={focused ? color : "transparent"}
              strokeWidth={focused ? 2.2 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="blog"
        options={{
          title: "Blog",
          href: null,
          tabBarIcon: ({ color, size, focused }) => (
            <MessageCircle
              size={focused ? size + 1 : size}
              color={color}
              fill={focused ? color : "transparent"}
              strokeWidth={focused ? 2.2 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="policy"
        options={{
          title: "Chính sách",
          href: null,
          tabBarIcon: ({ color, size, focused }) => (
            <FileText
              size={focused ? size + 1 : size}
              color={color}
              fill={focused ? color : "transparent"}
              strokeWidth={focused ? 2.2 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: "Liên hệ",
          href: null,
          tabBarIcon: ({ color, size, focused }) => (
            <Mail
              size={focused ? size + 1 : size}
              color={color}
              fill={focused ? color : "transparent"}
              strokeWidth={focused ? 2.2 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ color, size, focused }) => (
            <User
              size={focused ? size + 1 : size}
              color={color}
              fill={focused ? color : "transparent"}
              strokeWidth={focused ? 2.2 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="landlord-dashboard"
        options={{
          title: "Chủ trọ",
          href: null,
        }}
      />
      <Tabs.Screen
        name="user-dashboard"
        options={{
          title: "Cá nhân",
          href: null,
        }}
      />
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: "Quản trị",
          href: null,
        }}
      />
      <Tabs.Screen
        name="broker-dashboard"
        options={{
          title: "Môi giới",
          href: null,
        }}
      />
      <Tabs.Screen
        name="room/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="room/compare"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="pricing"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="verification-service"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="personal-info"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}