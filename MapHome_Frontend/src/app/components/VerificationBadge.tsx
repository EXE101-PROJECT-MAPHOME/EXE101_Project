import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { GreenBadgeLevel } from './types';

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
  showText = true 
}: VerificationBadgeProps) {
  const normalizedLevel = level === 'verified' ? 'verified' : 'none';

  const config = {
    'verified': {
      icon: ShieldCheck,
      text: 'Đã xác thực',
      shortText: 'Xác thực',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-600',
      description: 'Đã xác thực qua GPS tại địa điểm',
    },
    'none': {
      icon: ShieldAlert,
      text: 'Chưa xác thực',
      shortText: 'Chưa xác thực',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-400',
      description: 'Thông tin chưa được kiểm chứng',
    },
  }[normalizedLevel];

  const Icon = config.icon;

  const sizeClasses = {
    sm: { icon: 'size-3', text: 'text-xs', padding: 'px-1.5 py-0.5' },
    md: { icon: 'size-4', text: 'text-sm', padding: 'px-2 py-1' },
    lg: { icon: 'size-5', text: 'text-base', padding: 'px-3 py-1.5' },
  }[size];

  const formattedDate = verifiedAt 
    ? new Date(verifiedAt).toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
    : null;

  return (
    <div className="inline-flex flex-col gap-1">
      <div 
        className={`inline-flex items-center gap-1.5 rounded-full border ${config.bgColor} ${config.borderColor} ${sizeClasses.padding}`}
        title={config.description}
      >
        <Icon className={`${sizeClasses.icon} ${config.color}`} />
        {showText && (
          <span className={`${sizeClasses.text} ${config.color} font-medium`}>
            {size === 'sm' ? config.shortText : config.text}
          </span>
        )}
      </div>
      
      {level === 'verified' && locationAccuracy && size !== 'sm' && (
        <div className="text-xs text-gray-500 ml-1">
          Độ chính xác: {typeof locationAccuracy === 'number' ? `${locationAccuracy}m` : locationAccuracy}
        </div>
      )}
      
      {formattedDate && size === 'lg' && (
        <div className="text-xs text-gray-500 ml-1">
          Xác thực: {formattedDate}
        </div>
      )}
    </div>
  );
}

// Component for warning message on unverified properties
export function UnverifiedWarning() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
      <ShieldAlert className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-yellow-900 mb-1">
          ⚠️ Tin chưa được xác thực
        </h4>
        <p className="text-sm text-yellow-800">
          Thông tin này chưa được kiểm chứng. Vui lòng thận trọng và kiểm tra kỹ trước khi liên hệ.
          Ưu tiên các tin đã xác thực GPS để đảm bảo phòng trọ thật sự tồn tại tại địa chỉ công bố.
        </p>
      </div>
    </div>
  );
}

// Component for location verification info
export function LocationVerificationInfo({ locationAccuracy }: { locationAccuracy: number | string }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
      <ShieldCheck className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-green-900 mb-1">
          ✓ Đã xác thực vị trí GPS
        </h4>
        <p className="text-sm text-green-800">
          Chủ nhà đã chụp ảnh và xác thực vị trí trực tiếp tại phòng trọ với độ chính xác <strong>{typeof locationAccuracy === 'number' ? `${locationAccuracy}m` : locationAccuracy}</strong>.
          Đây là tin đăng đáng tin cậy đã được hệ thống kiểm chứng.
        </p>
      </div>
    </div>
  );
}
