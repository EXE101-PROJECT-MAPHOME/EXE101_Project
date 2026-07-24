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

export const defaultFilters: RentalFilters = {
  priceRange: [500000, 50000000],
  areaRange: [10, 200],
  amenities: {
    wifi: false,
    furniture: false,
    tv: false,
    washingMachine: false,
    kitchen: false,
    refrigerator: false,
    airConditioner: false,
  },
  verificationLevel: 'all',
  availability: 'all',
  sortBy: 'distance',
  radius: 50,
};
