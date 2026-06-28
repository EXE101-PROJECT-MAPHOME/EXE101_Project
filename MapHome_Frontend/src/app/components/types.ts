// Green Badge System Types
export type GreenBadgeLevel = 'none' | 'verified';

export interface GreenBadge {
  level: GreenBadgeLevel;
  awardedAt: string; // ISO date string
  awardedBy: string; // Admin ID
  inspectionNotes?: string;
  inspectionMedia?: string[];
  inspectionChecklist?: {
    isAccurate: boolean;
    hasAmenities: boolean;
    isSecure: boolean;
    isLegal: boolean;
  };
}

export interface VerificationRequest {
  id: string;
  _id?: string;
  propertyId: string;
  propertyName: string;
  landlordId: string;
  landlordName: string;
  phone: string;
  address: string;
  scheduledDate: string; // ISO date string
  scheduledTime: string; // e.g., "14:00"
  notes?: string;
  status: 'pending' | 'approved' | 'awaiting_photos' | 'photos_submitted' | 'completed' | 'rejected';
  requestedAt: string;
  completedAt?: string;
  badgeAwarded?: GreenBadgeLevel;
  inspectorNotes?: string;
  requesterType: 'landlord' | 'user';
  requesterId: string;
  requesterName: string;
  requesterPhone?: string;
  userProvidedPhotos?: string[];
  notifiedAt?: string;
  photosSubmittedAt?: string;
}

export interface LandlordProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  totalListings: number;
  rating: number;
  responseRate: number;
  responseTime: string;
  joinedDate: string;
  verified: boolean;
  yearsJoined?: number; // Added for UI display
}

export interface PinInfo {
  pinnedAt: string;
  pinnedBy: string;
  note?: string;
  photoAtPin?: string;
}

export interface Review {
  id: string;
  propertyId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface RentalProperty {
  id: string;
  _id?: string;
  name: string;
  address: string;
  price: number;
  location: [number, number];
  amenities: {
    wifi: boolean;
    furniture: boolean;
    tv: boolean;
    washingMachine: boolean;
    kitchen: boolean;
    refrigerator: boolean;
    airConditioner: boolean;
    parking?: boolean;
    water?: boolean;
    ac?: boolean;
  };
  image: string;
  images?: string[];
  area: number;
  available: boolean;
  phone: string;
  ownerName: string;
  verificationLevel: GreenBadgeLevel;
  verifiedAt?: string;
  locationAccuracy?: number | string; // Can be string for display like "±5m"
  landlordId?: string | LandlordProfile;
  brokerId?: string;
  pinInfo?: PinInfo;
  greenBadge?: GreenBadge;
  views?: number;
  favorites?: number;
  description?: string;
  distance?: number; // Optional distance from search center
  status?: 'pending' | 'approved' | 'rejected' | 'reported' | 'expired';
  expiryDate?: string;
  createdAt?: string | Date;
  rating?: number;
  ratingCount?: number;
  nearbyLandmarks?: {
    name: string;
    distanceKm: number;
    distanceText: string;
  }[];
  distanceToCenter?: number;
}

export interface PropertyWithDistance extends RentalProperty {
  distance: number;
}

export interface RentalFilters {
  priceRange: [number, number];
  areaRange: [number, number];
  amenities: {
    wifi: boolean;
    furniture: boolean;
    tv: boolean;
    washingMachine: boolean;
    kitchen: boolean;
    refrigerator: boolean;
    airConditioner: boolean;
  };
  verificationLevel: 'all' | 'verified' | 'none';
  availability: 'all' | 'available' | 'unavailable';
  sortBy: 'price-asc' | 'price-desc' | 'distance' | 'rating' | 'area';
  radius: number;
}

export type FacilityType =
  | "hospital"
  | "school"
  | "supermarket"
  | "park"
  | "bus_stop";

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  lat: number;
  lng: number;
  address: string;
  description?: string;
}

export interface Landlord extends LandlordProfile {}