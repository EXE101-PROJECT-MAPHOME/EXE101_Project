import React, { useEffect, useRef } from "react";
import { Modal, View, Text, TouchableOpacity, Animated } from "react-native";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react-native";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "info";
  onConfirm: () => void;
  confirmText?: string;
  onCancel?: () => void;
  cancelText?: string;
  hideButtons?: boolean;
}

export default function CustomAlert({
  visible,
  title,
  message,
  type = "success",
  onConfirm,
  confirmText = "OK",
  onCancel,
  cancelText = "Hủy",
  hideButtons = false,
}: CustomAlertProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 40,
          friction: 6,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleValue, opacityValue]);

  if (!visible) return null;

  const Icon =
    type === "success"
      ? CheckCircle2
      : type === "error"
        ? AlertTriangle
        : Info;

  const iconColor =
    type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#3b82f6";
  const bgColor =
    type === "success" ? "bg-emerald-50" : type === "error" ? "bg-red-50" : "bg-blue-50";

  return (
    <Modal transparent visible={visible} animationType="none">
      <View className="flex-1 justify-center items-center bg-black/40 px-6">
        <Animated.View
          style={{
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
          }}
          className="bg-white w-full max-w-sm rounded-[32px] p-6 items-center shadow-2xl border border-slate-100"
        >
          {/* Icon Header */}
          <View className={`w-20 h-20 ${bgColor} rounded-full items-center justify-center mb-5 border-[6px] border-white shadow-sm`}>
            <Icon size={40} color={iconColor} strokeWidth={2.5} />
          </View>

          {/* Texts */}
          <Text className="text-xl font-bold text-slate-800 text-center mb-2">
            {title}
          </Text>
          <Text className="text-sm font-medium text-slate-500 text-center mb-8 px-2 leading-relaxed">
            {message}
          </Text>

          {/* Buttons */}
          {!hideButtons && (
            <View className="w-full flex-row space-x-3">
              {onCancel && (
                <TouchableOpacity
                  onPress={onCancel}
                  className="flex-1 h-14 bg-slate-100 rounded-2xl items-center justify-center"
                >
                  <Text className="text-slate-600 font-bold text-base">
                    {cancelText}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onConfirm}
                style={{ backgroundColor: iconColor }}
                className="flex-1 h-14 rounded-2xl items-center justify-center shadow-md"
              >
                <Text className="text-white font-bold text-base">
                  {confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
