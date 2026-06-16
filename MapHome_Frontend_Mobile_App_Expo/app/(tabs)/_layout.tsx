import { Tabs } from "expo-router";
import React from "react";
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
  
  const isLight = background === "#ffffff";
  const borderColor = isLight ? "#f1f5f9" : "#3f3f46";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: icon,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: background,
          borderTopWidth: 1,
          borderTopColor: borderColor,
          // Let React Navigation handle height and bottom safe area padding automatically
          paddingTop: 8,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
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
        name="saved"
        options={{
          title: "Đã lưu",
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
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
        name="policy"
        options={{
          title: "Chính sách",
          href: null,
          tabBarIcon: ({ color, size }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: "Liên hệ",
          href: null,
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