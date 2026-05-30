import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "../utils/api";

export interface RentalProperty {
  id: string;
  _id?: string;
  name: string;
  address: string;
  price: number;
  area: number;
  image: string;
  images: string[];
  available: boolean;
  verificationLevel: "verified" | "none";
  verifiedAt?: string;
  locationAccuracy?: number | string;
  location: [number, number];
  amenities: {
    wifi: boolean;
    parking: boolean;
    ac: boolean;
    water: boolean;
    tv: boolean;
    furniture: boolean;
    washingMachine: boolean;
    kitchen: boolean;
    refrigerator: boolean;
  };
  description: string;
  landlordId: {
    fullName: string;
    username: string;
    avatar: string;
    phone: string;
    email: string;
  };
  reviews: {
    id: string;
    userName: string;
    userAvatar: string;
    rating: number;
    content: string;
    createdAt: string;
  }[];
  pinInfo?: {
    note: string;
    pinnedAt: string;
  };
}

interface PropertiesContextType {
  properties: RentalProperty[];
  loading: boolean;
  searchProperties: (filters: any) => Promise<void>;
  refreshProperties: () => Promise<void>;
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(
  undefined,
);

export const mapBackendProperty = (prop: any): RentalProperty => {
  return {
    id: prop._id || prop.id,
    _id: prop._id || prop.id,
    name: prop.name || "Phòng trọ cao cấp",
    address: prop.address || "Quận 1, TP. HCM",
    price: prop.price || 3000000,
    area: prop.area || 25,
    image:
      prop.image ||
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    images:
      prop.images && prop.images.length > 0
        ? prop.images
        : [
            prop.image ||
              "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
          ],
    available: prop.available !== undefined ? prop.available : true,
    verificationLevel:
      prop.verificationLevel ||
      (prop.badgeAwarded === "verified" ? "verified" : "none"),
    verifiedAt: prop.verifiedAt || prop.createdAt,
    locationAccuracy: prop.locationAccuracy || 5,
    location:
      prop.location && Array.isArray(prop.location)
        ? [prop.location[0], prop.location[1]]
        : [106.7009, 10.7769],
    amenities: {
      wifi: prop.amenities?.wifi || false,
      parking: prop.amenities?.parking || false,
      ac: prop.amenities?.ac || prop.amenities?.airConditioner || false,
      water: prop.amenities?.water || false,
      tv: prop.amenities?.tv || false,
      furniture: prop.amenities?.furniture || false,
      washingMachine: prop.amenities?.washingMachine || false,
      kitchen: prop.amenities?.kitchen || false,
      refrigerator: prop.amenities?.refrigerator || false,
    },
    description: prop.description || "Không có mô tả chi tiết.",
    landlordId: {
      fullName: prop.ownerName || "Chủ trọ MapHome",
      username: prop.landlordId?.username || "chutro",
      avatar:
        prop.landlordId?.avatar ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      phone: prop.phone || "0901234567",
      email: prop.landlordId?.email || "chutro@example.com",
    },
    reviews: (prop.reviews || []).map((r: any) => ({
      id: r._id || r.id,
      userName: r.userId?.fullName || "Người dùng ẩn danh",
      userAvatar:
        r.userId?.avatar ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      rating: r.rating || 5,
      content: r.comment || "",
      createdAt: r.createdAt || new Date().toISOString(),
    })),
    pinInfo:
      prop.pinInfo ||
      (prop.verificationLevel === "verified"
        ? {
            note: "Vị trí đã xác thực GPS trực tiếp",
            pinnedAt: prop.verifiedAt || prop.createdAt,
          }
        : undefined),
  };
};

export function PropertiesProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<RentalProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/properties");
      const results = Array.isArray(res.data)
        ? res.data
        : res.data.properties || [];
      setProperties(results.map(mapBackendProperty));
    } catch (e) {
      console.error("Failed to fetch properties from server", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const searchProperties = async (filters: any) => {
    try {
      setLoading(true);
      const res = await api.get("/api/properties/search", { params: filters });
      const results = Array.isArray(res.data)
        ? res.data
        : res.data.properties || [];
      setProperties(results.map(mapBackendProperty));
    } catch (e) {
      console.error("Failed to search properties", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PropertiesContext.Provider
      value={{
        properties,
        loading,
        searchProperties,
        refreshProperties: fetchProperties,
      }}
    >
      {children}
    </PropertiesContext.Provider>
  );
}

export function useProperties() {
  const context = useContext(PropertiesContext);
  if (!context) {
    throw new Error("useProperties must be used within PropertiesProvider");
  }
  return context;
}
