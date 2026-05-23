import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '@/app/utils/api';
import { VerificationRequest, GreenBadgeLevel } from '@/app/components/types';
import { useAuth } from './AuthContext';

interface VerificationContextType {
  requests: VerificationRequest[];
  loading: boolean;
  addRequest: (request: Omit<VerificationRequest, 'id' | 'requestedAt' | 'status'>) => Promise<boolean>;
  updateRequestStatus: (requestId: string, status: VerificationRequest['status']) => Promise<boolean>;
  completeInspection: (requestId: string, badgeLevel: GreenBadgeLevel, notes?: string) => Promise<boolean>;
  getRequestsByLandlord: (landlordId: string) => VerificationRequest[];
  getRequestsByProperty: (propertyId: string) => VerificationRequest[];
  getRequestsByUser: (userId: string) => VerificationRequest[];
  notifyUserAboutPhotos: (requestId: string) => Promise<boolean>;
  submitUserPhotos: (requestId: string, photos: string[]) => Promise<boolean>;
  refreshRequests: () => Promise<void>;
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);


export function VerificationProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const mapBackendRequest = (req: any): VerificationRequest => ({
    ...req,
    id: req._id,
  });

  const fetchRequests = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const res = await api.get("/api/verifications");
      if (res.status === 200) {
        setRequests(res.data.map(mapBackendRequest));
      }
    } catch (err) {
      console.error("Failed to fetch verification requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'landlord')) {
      fetchRequests();
    }
  }, [user]);

  const addRequest = async (newRequest: Omit<VerificationRequest, 'id' | 'requestedAt' | 'status'>) => {
    try {
      const res = await api.post("/api/verifications", newRequest);
      if (res.status === 200 || res.status === 201) {
        setRequests((prev) => [mapBackendRequest(res.data), ...prev]);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to add verification request:", err);
      return false;
    }
  };

  const updateRequestStatus = async (requestId: string, status: VerificationRequest['status']) => {
    try {
      const res = await api.put(`/api/verifications/${requestId}`, { status });
      if (res.status === 200) {
        setRequests((prev) =>
          prev.map((req) => (req.id === requestId ? mapBackendRequest(res.data) : req))
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update verification request status:", err);
      return false;
    }
  };

  const completeInspection = async (requestId: string, badgeLevel: GreenBadgeLevel, notes?: string) => {
    try {
      const res = await api.post(`/api/verifications/${requestId}/complete`, { badgeAwarded: badgeLevel, inspectorNotes: notes });
      if (res.status === 200 || res.status === 201) {
        setRequests((prev) =>
          prev.map((req) => (req.id === requestId ? mapBackendRequest(res.data) : req))
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to complete inspection:", err);
      return false;
    }
  };

  const getRequestsByLandlord = (landlordId: string) => {
    return requests.filter((req) => req.landlordId === landlordId);
  };

  const getRequestsByProperty = (propertyId: string) => {
    return requests.filter((req) => req.propertyId === propertyId);
  };

  const getRequestsByUser = (userId: string) => {
    return requests.filter((req) => req.requesterType === 'user' && req.requesterId === userId);
  };

  const notifyUserAboutPhotos = async (requestId: string) => {
    try {
      const res = await api.post(`/api/verifications/${requestId}/notify`);
      if (res.status === 200 || res.status === 201) {
        setRequests((prev) =>
          prev.map((req) => (req.id === requestId ? mapBackendRequest(res.data) : req))
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to notify user about photos:", err);
      return false;
    }
  };

  const submitUserPhotos = async (requestId: string, photos: string[]) => {
    try {
      const res = await api.post(`/api/verifications/${requestId}/photos`, { photos });
      if (res.status === 200 || res.status === 201) {
        setRequests((prev) =>
          prev.map((req) => (req.id === requestId ? mapBackendRequest(res.data) : req))
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to submit photos:", err);
      return false;
    }
  };

  return (
    <VerificationContext.Provider
      value={{
        requests,
        loading,
        addRequest,
        updateRequestStatus,
        completeInspection,
        getRequestsByLandlord,
        getRequestsByProperty,
        getRequestsByUser,
        notifyUserAboutPhotos,
        submitUserPhotos,
        refreshRequests: fetchRequests,
      }}
    >
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerification() {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
}