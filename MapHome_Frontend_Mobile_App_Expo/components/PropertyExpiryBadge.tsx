import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AlertCircle, Clock, XCircle } from 'lucide-react-native';

interface PropertyExpiryBadgeProps {
  expiryDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'reported' | 'expired';
  size?: 'sm' | 'lg';
}

function formatDateVietnamese(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function PropertyExpiryBadge({
  expiryDate,
  status,
  size = 'sm',
}: PropertyExpiryBadgeProps) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateDaysRemaining = () => {
      if (!expiryDate) return;

      const now = new Date();
      const expiry = new Date(expiryDate);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (status === 'expired' || diffDays <= 0) {
        setIsExpired(true);
        setDaysRemaining(0);
      } else {
        setIsExpired(false);
        setDaysRemaining(diffDays);
      }
    };

    calculateDaysRemaining();
    const interval = setInterval(calculateDaysRemaining, 1000 * 60 * 60); // Update hourly

    return () => clearInterval(interval);
  }, [expiryDate, status]);

  // Only show badge for approved or already expired properties
  if (status !== 'approved' && status !== 'expired') {
    return null;
  }

  if (daysRemaining === null) return null;

  const isUrgent = daysRemaining <= 3;
  const isWarning = daysRemaining <= 7 && daysRemaining > 3;

  if (size === 'sm') {
    let bgColor = 'bg-emerald-100';
    let textColor = 'text-emerald-700';
    let borderColor = 'border-emerald-200';
    let iconColor = '#047857';

    if (isExpired) {
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      borderColor = 'border-red-200';
      iconColor = '#b91c1c';
    } else if (isUrgent) {
      bgColor = 'bg-rose-100';
      textColor = 'text-rose-700';
      borderColor = 'border-rose-200';
      iconColor = '#be123c';
    } else if (isWarning) {
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-700';
      borderColor = 'border-amber-200';
      iconColor = '#b45309';
    }

    return (
      <Animated.View
        entering={ZoomIn.duration(300)}
        className={`flex-row items-center self-start gap-1 px-2.5 py-1 rounded-full border ${bgColor} ${borderColor}`}
      >
        {isExpired ? (
          <>
            <XCircle size={10} color={iconColor} />
            <Text
              className={`text-[9px] font-black uppercase tracking-wider ${textColor}`}
            >
              Đã hết hạn
            </Text>
          </>
        ) : (
          <>
            <Clock size={10} color={iconColor} />
            <Text
              className={`text-[9px] font-black uppercase tracking-wider ${textColor}`}
            >
              Còn {daysRemaining} ngày
            </Text>
          </>
        )}
      </Animated.View>
    );
  }

  let bgColor = 'bg-emerald-50';
  let textColor = 'text-emerald-700';
  let borderColor = 'border-emerald-200';
  let iconColor = '#047857';

  if (isExpired) {
    bgColor = 'bg-red-50';
    textColor = 'text-red-700';
    borderColor = 'border-red-200';
    iconColor = '#b91c1c';
  } else if (isUrgent) {
    bgColor = 'bg-rose-50';
    textColor = 'text-rose-700';
    borderColor = 'border-rose-200';
    iconColor = '#be123c';
  } else if (isWarning) {
    bgColor = 'bg-amber-50';
    textColor = 'text-amber-700';
    borderColor = 'border-amber-200';
    iconColor = '#b45309';
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      className={`flex-row items-center gap-3 px-4 py-3 rounded-2xl border ${bgColor} ${borderColor}`}
    >
      <View className="p-2 rounded-lg bg-white/60">
        {isExpired ? (
          <XCircle size={20} color={iconColor} />
        ) : isUrgent ? (
          <AlertCircle size={20} color={iconColor} />
        ) : (
          <Clock size={20} color={iconColor} />
        )}
      </View>
      <View className="flex-1">
        <Text className={`text-xs font-bold uppercase tracking-widest ${textColor}`}>
          {isExpired ? 'Đã hết hạn' : 'Hạn công bố'}
        </Text>
        <Text className={`text-lg font-black ${textColor}`}>
          {isExpired ? 'Cần gia hạn ngay!' : `Còn ${daysRemaining} ngày`}
        </Text>
        <Text className={`text-xs opacity-75 mt-0.5 ${textColor}`}>
          Hết hạn: {formatDateVietnamese(expiryDate)}
        </Text>
      </View>
    </Animated.View>
  );
}
