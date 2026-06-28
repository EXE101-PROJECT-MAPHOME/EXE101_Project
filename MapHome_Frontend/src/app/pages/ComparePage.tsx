import { useNavigate } from "react-router-dom";
import { useCompare } from "@/app/contexts/CompareContext";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { VerificationBadge } from "@/app/components/VerificationBadge";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Maximize2,
  Check,
  X,
  Phone,
  User,
  GitCompare,
  Trash2,
} from "lucide-react";

export function ComparePage() {
  const navigate = useNavigate();
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  // Nếu không có phòng nào để so sánh
  if (compareList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GitCompare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Chưa có phòng nào để so sánh
          </h2>
          <p className="text-gray-600 mb-6">
            Vui lòng chọn ít nhất 2 phòng trọ để bắt đầu so sánh
          </p>
          <Button onClick={() => navigate("/map")} className="gap-2">
            <MapPin className="w-4 h-4" />
            Tìm phòng trọ
          </Button>
        </div>
      </div>
    );
  }

  // Nếu chỉ có 1 phòng
  if (compareList.length === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GitCompare className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Cần thêm phòng để so sánh
          </h2>
          <p className="text-gray-600 mb-6">
            Bạn đã chọn 1 phòng. Hãy chọn thêm ít nhất 1 phòng nữa để so sánh.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/map")}
              className="gap-2"
            >
              <MapPin className="w-4 h-4" />
              Tìm thêm phòng
            </Button>
            <Button variant="outline" onClick={clearCompare} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Xóa phòng đã chọn
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const comparedProperties = compareList;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  So sánh phòng trọ
                </h1>
                <p className="text-sm text-gray-600">
                  {compareList.length} phòng đang so sánh
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={clearCompare} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Xóa tất cả
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                    Tiêu chí
                  </th>
                  {comparedProperties.map((property) => (
                    <th
                      key={property.id}
                      className="px-6 py-4 text-center text-sm font-semibold text-gray-900 min-w-[280px] relative"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <img
                            src={property.image}
                            alt={property.name}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeFromCompare(property.id)}
                            className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-left w-full">
                          <h3 className="font-semibold text-gray-900 text-base mb-1">
                            {property.name}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-start gap-1">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {property.address}
                          </p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {/* Giá thuê */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      Giá thuê
                    </div>
                  </td>
                  {comparedProperties.map((property) => (
                    <td key={property.id} className="px-6 py-4 text-center">
                      <span className="text-lg font-bold text-red-600">
                        {formatPrice(property.price)}
                      </span>
                      <span className="text-sm text-gray-600">/tháng</span>
                    </td>
                  ))}
                </tr>

                {/* Diện tích */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <Maximize2 className="w-4 h-4 text-blue-600" />
                      Diện tích
                    </div>
                  </td>
                  {comparedProperties.map((property) => (
                    <td key={property.id} className="px-6 py-4 text-center">
                      <span className="text-base font-semibold text-gray-900">
                        {property.area} m²
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Trạng thái */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    Trạng thái
                  </td>
                  {comparedProperties.map((property) => (
                    <td key={property.id} className="px-6 py-4 text-center">
                      <Badge
                        variant={property.available ? "default" : "secondary"}
                        className={
                          property.available
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      >
                        {property.available ? "Còn trống" : "Đã cho thuê"}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Xác thực */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    Mức xác thực
                  </td>
                  {comparedProperties.map((property) => (
                    <td key={property.id} className="px-6 py-4">
                      <div className="flex justify-center">
                        <VerificationBadge level={property.verificationLevel} />
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Chủ trọ */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-600" />
                      Chủ trọ
                    </div>
                  </td>
                  {comparedProperties.map((property) => (
                    <td key={property.id} className="px-6 py-4 text-center">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {property.ownerName}
                        </div>
                        <div className="text-gray-600 flex items-center justify-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {property.phone}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Section: Tiện nghi */}
                <tr className="bg-blue-50">
                  <td
                    colSpan={comparedProperties.length + 1}
                    className="px-6 py-3 text-sm font-bold text-blue-900 uppercase"
                  >
                    Tiện nghi phòng
                  </td>
                </tr>

                {/* WiFi */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    WiFi
                  </td>
                  {comparedProperties.map((property) => (
                    <td key={property.id} className="px-6 py-4 text-center">
                      {property.amenities.wifi ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Đầy đủ nội thất */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    Đầy đủ nội thất
                  </td>
                  {comparedProperties.map((property) => (
                    <td key={property.id} className="px-6 py-4 text-center">
                      {property.amenities.furniture ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* TV */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    TV
                  </td>
                  {comparedProperties.map((property) => (
                    <td key={property.id} className="px-6 py-4 text-center">
                      {property.amenities.tv ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Máy giặt */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    Máy giặt
                  </td>
                  {comparedProperties.map((property) => (
                    <td key={property.id} className="px-6 py-4 text-center">
                      {property.amenities.washingMachine ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Bếp */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    Bếp
                  </td>
                  {comparedProperties.map((property) => (
                    <td key={property.id} className="px-6 py-4 text-center">
                      {property.amenities.kitchen ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Tủ lạnh */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    Tủ lạnh
                  </td>
                  {comparedProperties.map((property) => (
                    <td key={property.id} className="px-6 py-4 text-center">
                      {property.amenities.refrigerator ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Điều hòa */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    Điều hòa
                  </td>
                  {comparedProperties.map((property) => (
                    <td key={property.id} className="px-6 py-4 text-center">
                      {property.amenities.airConditioner ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex justify-center gap-4">
          {comparedProperties.map((property) => (
            <Button
              key={property.id}
              onClick={() => navigate(`/room/${property.id}`)}
              variant="outline"
              className="gap-2"
            >
              Xem chi tiết {property.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
