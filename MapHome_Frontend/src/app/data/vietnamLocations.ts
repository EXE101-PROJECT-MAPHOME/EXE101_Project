// Interfaces for Location Data
export interface Ward {
  code: number;
  name: string;
  district_code?: number;
}

export interface District {
  code: number;
  name: string;
  province_code?: number;
}

export interface Province {
  code: number;
  name: string;
}
