import api from './api';

export const GOONG_MAPTILES_KEY = (
  process.env.EXPO_PUBLIC_GOONG_MAPTILES_KEY || ''
).trim();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoongPrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GoongGeocodeResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

// ─── Map Tile URL ─────────────────────────────────────────────────────────────

export type GoongMapStyle = 'light' | 'dark' | 'gray' | 'satellite';

export const GOONG_MAP_STYLES: Record<
  GoongMapStyle,
  { label: string; emoji: string; assetName: string }
> = {
  light: { label: 'Tiêu chuẩn', emoji: '🗺️', assetName: 'goong_map_web' },
  dark: { label: 'Tối (Dark)', emoji: '🌙', assetName: 'goong_map_dark' },
  gray: { label: 'Xám', emoji: '⬜', assetName: 'goong_map_gray' },
  satellite: { label: 'Vệ tinh', emoji: '🛰️', assetName: 'goong_map' },
};

export const getGoongStyleUrl = (style: GoongMapStyle = 'light'): string => {
  const maptilesKey = (GOONG_MAPTILES_KEY || '').trim();

  if (!maptilesKey) {
    console.error(
      '[GoongAPI] EXPO_PUBLIC_GOONG_MAPTILES_KEY is missing in environment variables.'
    );
    return '';
  }

  const { assetName } = GOONG_MAP_STYLES[style];
  return `https://tiles.goong.io/assets/${assetName}.json?api_key=${maptilesKey}`;
};

export const getGoongAttribution = (): string =>
  '&copy; <a href="https://goong.io">Goong Maps</a>';

// ─── Places Autocomplete (Proxy through Backend) ─────────────────────────────

export const autocompletePlaces = async (
  input: string
): Promise<GoongPrediction[]> => {
  if (!input.trim()) return [];

  try {
    const res = await api.get(
      `/api/map/autocomplete?input=${encodeURIComponent(input)}`
    );
    return res.data || [];
  } catch (err) {
    console.error('[GoongAPI Proxy] Autocomplete error:', err);
    return [];
  }
};

// ─── Geocoding (Proxy through Backend) ───────────────────────────────────────

export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address?: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

const normalizeAddressComponents = (
  components: unknown
): GeocodeResult['address_components'] => {
  if (!Array.isArray(components)) return [];

  return components
    .filter(
      (component): component is GeocodeResult['address_components'][number] => {
        if (!component || typeof component !== 'object') return false;
        const candidate = component as Record<string, unknown>;
        return (
          typeof candidate.long_name === 'string' &&
          typeof candidate.short_name === 'string' &&
          Array.isArray(candidate.types)
        );
      }
    )
    .map((component) => ({
      long_name: component.long_name,
      short_name: component.short_name,
      types: component.types.filter(
        (type): type is string => typeof type === 'string'
      ),
    }));
};

export const geocodeByPlaceId = async (
  placeId: string
): Promise<GeocodeResult | null> => {
  if (!placeId) return null;

  try {
    const res = await api.get(`/api/map/place-detail?place_id=${placeId}`);
    const data = res.data;

    const location = data?.geometry?.location;
    if (location) {
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: data.formatted_address,
        address_components: normalizeAddressComponents(data.address_components),
      };
    }
    return null;
  } catch (err) {
    console.error('[GoongAPI Proxy] Place detail error:', err);
    return null;
  }
};

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<GeocodeResult | null> => {
  try {
    const res = await api.get(`/api/map/reverse-geocode?lat=${lat}&lng=${lng}`);
    const data = res.data;
    const location = data?.geometry?.location;

    if (data) {
      return {
        lat: location?.lat || lat,
        lng: location?.lng || lng,
        formatted_address: data.formatted_address,
        address_components: normalizeAddressComponents(data.address_components),
      };
    }
    return null;
  } catch (err) {
    console.error('[GoongAPI Proxy] Reverse geocode error:', err);
    return null;
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const isGoongConfigured = (): boolean => Boolean(GOONG_MAPTILES_KEY);
