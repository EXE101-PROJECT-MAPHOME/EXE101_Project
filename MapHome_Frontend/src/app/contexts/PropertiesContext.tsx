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

  const mapBackendProperty = (prop: any): RentalProperty => ({
    ...prop,
    id: prop._id,
  });

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/properties", { params: { all: true } });
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
        setProperties((prev) => [mapBackendProperty(res.data), ...prev]);
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
      const res = await api.get("/api/properties/search", { params: filters });
      const results = Array.isArray(res.data)
        ? res.data
        : res.data.properties || [];
      setProperties(results.map(mapBackendProperty));
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
