import { RentalFilters } from '@/app/components/types';

export const defaultFilters: RentalFilters = {
  priceRange: [1000000, 10000000],
  areaRange: [10, 50],
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
  radius: 10,
};
