import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck, ShieldAlert } from 'lucide-react-native';

export type GreenBadgeLevel = 'none' | 'verified';

interface VerificationBadgeProps {
  level: GreenBadgeLevel;
  verifiedAt?: string;
  locationAccuracy?: number | string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function VerificationBadge({
  level,
  verifiedAt,
  locationAccuracy,
  size = 'md',
  showText = true,
}: VerificationBadgeProps) {
  const normalizedLevel = level === 'verified' ? 'verified' : 'none';

  const config = {
    verified: {
      icon: ShieldCheck,
      text: 'Đã xác thực',
      shortText: 'Xác thực',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-600',
      iconColor: '#16a34a',
    },
    none: {
      icon: ShieldAlert,
      text: 'Chưa xác thực',
      shortText: 'Chưa xác thực',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-400',
      iconColor: '#4b5563',
    },
  }[normalizedLevel];

  const Icon = config.icon;

  const sizeClasses = {
    sm: { icon: 12, text: 'text-xs', padding: 'px-1.5 py-0.5' },
    md: { icon: 16, text: 'text-sm', padding: 'px-2 py-1' },
    lg: { icon: 20, text: 'text-base', padding: 'px-3 py-1.5' },
  }[size];

  const formattedDate = verifiedAt
    ? new Date(verifiedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  return (
    <View className="flex-col gap-1">
      <View
        className={`flex-row items-center self-start gap-1.5 rounded-full border ${config.bgColor} ${config.borderColor} ${sizeClasses.padding}`}
      >
        <Icon size={sizeClasses.icon} color={config.iconColor} />
        {showText && (
          <Text className={`${sizeClasses.text} ${config.color} font-medium`}>
            {size === 'sm' ? config.shortText : config.text}
          </Text>
        )}
      </View>

      {level === 'verified' && locationAccuracy && size !== 'sm' && (
        <Text className="text-xs text-gray-500 ml-1">
          Độ chính xác:{' '}
          {typeof locationAccuracy === 'number'
            ? `${locationAccuracy}m`
            : locationAccuracy}
        </Text>
      )}

      {formattedDate && size === 'lg' && (
        <Text className="text-xs text-gray-500 ml-1">
          Xác thực: {formattedDate}
        </Text>
      )}
    </View>
  );
}

export function UnverifiedWarning() {
  return (
    <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex-row items-start gap-3">
      <ShieldAlert size={20} color="#ca8a04" className="mt-0.5" />
      <View className="flex-1">
        <Text className="font-semibold text-yellow-900 mb-1 text-base">
          ⚠️ Tin chưa được xác thực
        </Text>
        <Text className="text-sm text-yellow-800 leading-5">
          Thông tin này chưa được kiểm chứng. Vui lòng thận trọng và kiểm tra kỹ
          trước khi liên hệ. Ưu tiên các tin đã xác thực GPS để đảm bảo phòng trọ
          thật sự tồn tại tại địa chỉ công bố.
        </Text>
      </View>
    </View>
  );
}

export function LocationVerificationInfo({
  locationAccuracy,
}: {
  locationAccuracy: number | string;
}) {
  return (
    <View className="bg-green-50 border border-green-200 rounded-lg p-4 flex-row items-start gap-3">
      <ShieldCheck size={20} color="#16a34a" className="mt-0.5" />
      <View className="flex-1">
        <Text className="font-semibold text-green-900 mb-1 text-base">
          ✓ Đã xác thực vị trí GPS
        </Text>
        <Text className="text-sm text-green-800 leading-5">
          Chủ nhà đã chụp ảnh và xác thực vị trí trực tiếp tại phòng trọ với độ
          chính xác{' '}
          <Text className="font-bold">
            {typeof locationAccuracy === 'number'
              ? `${locationAccuracy}m`
              : locationAccuracy}
          </Text>
          . Đây là tin đăng đáng tin cậy đã được hệ thống kiểm chứng.
        </Text>
      </View>
    </View>
  );
}
