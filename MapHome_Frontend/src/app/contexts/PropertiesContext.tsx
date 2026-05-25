import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import api from "@/app/utils/api";
import { RentalProperty } from "@/app/components/types";

interface PropertiesContextType {
  properties: RentalProperty[];
  loading: boolean;
  searchSummary: {
    priceRange: { min: number; max: number };
  } | null;
  addProperty: (property: Omit<RentalProperty, "id">) => Promise<boolean>;
  updateProperty: (
    id: string,
    updates: Partial<RentalProperty>,
  ) => Promise<boolean>;
  searchProperties: (filters: any) => Promise<void>;
  refreshProperties: () => Promise<void>;
}

export const PropertiesContext = createContext<
  PropertiesContextType | undefined
>(undefined);

export function PropertiesProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<RentalProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchSummary, setSearchSummary] = useState<{
    priceRange: { min: number; max: number };
  } | null>(null);

  useEffect(() => {
    console.log(
      "PropertiesContext state changed - properties:",
      properties.length,
      properties,
    );
  }, [properties]);

  const mapBackendProperty = (prop: any): RentalProperty => {
    const result: RentalProperty = {
      ...prop,
      id: prop._id,
      verificationLevel: prop.verificationLevel || "none", // Ensure correct format
      greenBadge: prop.greenBadge || {
        level: prop.verificationLevel === "verified" ? "verified" : "none",
      },
    };
    console.log(
      "Mapped property:",
      result.id,
      result.name,
      "verificationLevel:",
      result.verificationLevel,
      "greenBadge:",
      result.greenBadge,
    );
    return result;
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/properties");
      setProperties(res.data.map(mapBackendProperty));
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const addProperty = async (newProperty: Omit<RentalProperty, "id">) => {
    try {
      const res = await api.post("/api/properties", newProperty);
      if (res.status === 201 || res.status === 200) {
        // Post is submitted as pending, don't show on map yet
        return true;
      }
      throw new Error("Invalid response status");
    } catch (err: any) {
      console.error("Failed to add property:", err);
      // Re-throw error to let caller handle it
      throw err;
    }
  };

  const updateProperty = async (
    id: string,
    updates: Partial<RentalProperty>,
  ) => {
    try {
      const res = await api.put(`/api/properties/${id}`, updates);
      if (res.status === 200) {
        setProperties((prev) =>
          prev.map((prop) =>
            prop.id === id ? mapBackendProperty(res.data) : prop,
          ),
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update property:", err);
      return false;
    }
  };

  const searchProperties = async (filters: any) => {
    try {
      setLoading(true);
      console.log("searchProperties called with filters:", filters);
      const res = await api.get("/api/properties/search", { params: filters });
      console.log("searchProperties API response:", res.data);
      const results = Array.isArray(res.data)
        ? res.data
        : res.data.properties || [];
      const responsePriceRange =
        res.data && !Array.isArray(res.data) && res.data.priceRange
          ? res.data.priceRange
          : null;
      console.log(
        "searchProperties results after parsing:",
        results.length,
        results,
      );
      const mapped = results.map(mapBackendProperty);
      console.log("searchProperties after map:", mapped.length, mapped);
      setProperties(mapped);
      setSearchSummary(
        responsePriceRange
          ? {
              priceRange: {
                min: Number(responsePriceRange.min) || 0,
                max: Number(responsePriceRange.max) || 0,
              },
            }
          : null,
      );
      console.log(
        "searchProperties setProperties called with:",
        mapped.length,
        "items",
      );
    } catch (err) {
      console.error("Failed to search properties:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PropertiesContext.Provider
      value={{
        properties,
        loading,
        searchSummary,
        addProperty,
        updateProperty,
        searchProperties,
        refreshProperties: fetchProperties,
      }}
    >
      {children}
    </PropertiesContext.Provider>
  );
}
