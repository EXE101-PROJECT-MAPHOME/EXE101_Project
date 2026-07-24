import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { MapPin, RotateCcw, Check, Navigation as NavIcon } from 'lucide-react-native';
import * as Location from 'expo-location';
import { reverseGeocode, GeocodeResult } from '../utils/goongApi';

interface LandlordPinMapProps {
  onPinLocation: (
    lat: number,
    lng: number,
    address?: string,
    geocodeResult?: GeocodeResult
  ) => void;
  initialLocation?: [number, number];
}

export function LandlordPinMap({
  onPinLocation,
  initialLocation,
}: LandlordPinMapProps) {
  const mapRef = useRef<MapView>(null);
  const [pinnedLocation, setPinnedLocation] = useState<[number, number] | null>(
    initialLocation || null
  );
  const [pinnedAddress, setPinnedAddress] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const defaultCenter: [number, number] = [10.7769, 106.7009];

  useEffect(() => {
    if (initialLocation && !pinnedAddress) {
      handleReverseGeocode(initialLocation[0], initialLocation[1]);
    }
  }, [initialLocation]);

  const handleReverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    const result = await reverseGeocode(lat, lng);
    const address = result?.formatted_address || null;
    setPinnedAddress(address);
    setIsGeocoding(false);
    onPinLocation(lat, lng, address || undefined, result || undefined);
  };

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    placePin(latitude, longitude);
  };

  const placePin = (lat: number, lng: number) => {
    setPinnedLocation([lat, lng]);
    handleReverseGeocode(lat, lng);
    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleUseMyLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền vị trí để ghim.');
        setIsLocating(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      placePin(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại');
    } finally {
      setIsLocating(false);
    }
  };

  const handleReset = () => {
    setPinnedLocation(null);
    setPinnedAddress(null);
    mapRef.current?.animateToRegion({
      latitude: defaultCenter[0],
      longitude: defaultCenter[1],
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  return (
    <View style={styles.container}>
      {/* Intro Box */}
      <View style={styles.introBox}>
        <MapPin size={24} color="#ea580c" style={{ marginTop: 2, marginRight: 12 }} />
        <View style={styles.introTextContainer}>
          <Text style={styles.introTitle}>Ghim vị trí chính xác</Text>
          <Text style={styles.introDesc}>
            Sử dụng Vị trí GPS hoặc nhấn vào bản đồ để ghim. Tọa độ chính xác giúp
            khách hàng dễ dàng tìm đến phòng trọ của bạn hơn.
          </Text>
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: initialLocation ? initialLocation[0] : defaultCenter[0],
            longitude: initialLocation ? initialLocation[1] : defaultCenter[1],
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={handleMapPress}
          showsUserLocation
        >
          {pinnedLocation && (
            <Marker
              coordinate={{
                latitude: pinnedLocation[0],
                longitude: pinnedLocation[1],
              }}
              draggable
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                placePin(latitude, longitude);
              }}
            >
              <View style={styles.customPinWrapper}>
                <View style={styles.customPin}>
                  <MapPin size={18} color="white" />
                </View>
                <View style={styles.pinShadow} />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Buttons on Map */}
        <View style={styles.mapButtons}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleUseMyLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#4f46e5" />
            ) : (
              <NavIcon size={16} color="#4f46e5" />
            )}
            <Text style={styles.actionBtnText}>
              {isLocating ? 'Đang xác định...' : 'Vị trí GPS'}
            </Text>
          </TouchableOpacity>

          {pinnedLocation && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.resetBtn]}
              onPress={handleReset}
            >
              <RotateCcw size={16} color="#dc2626" />
              <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>
                Đặt lại
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {!pinnedLocation && (
          <View style={styles.mapOverlayHint} pointerEvents="none">
            <View style={styles.hintBadge}>
              <Text style={styles.hintBadgeText}>👆 Nhấn để ghim vị trí</Text>
            </View>
          </View>
        )}

        {isGeocoding && (
          <View style={styles.geocodingBadge}>
            <ActivityIndicator size="small" color="#4f46e5" />
            <Text style={styles.geocodingText}>Đang dịch tọa độ...</Text>
          </View>
        )}
      </View>

      {/* Result Box */}
      {pinnedLocation ? (
        <View style={styles.resultBox}>
          <View style={styles.resultIconWrapper}>
            <Check size={24} color="#16a34a" />
          </View>
          <View style={styles.resultTextContainer}>
            <Text style={styles.resultTitle}>Vị trí đã chọn</Text>
            {pinnedAddress && (
              <Text style={styles.resultAddress}>{pinnedAddress}</Text>
            )}
            <View style={styles.coordsRow}>
              <Text style={styles.coordText}>
                Lat: {pinnedLocation[0].toFixed(6)}
              </Text>
              <Text style={styles.coordText}>
                Lng: {pinnedLocation[1].toFixed(6)}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <MapPin size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>Bạn chưa ghim vị trí phòng trọ</Text>
          <Text style={styles.emptyDesc}>Vui lòng chọn một điểm trên bản đồ</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  introBox: {
    flexDirection: 'row',
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  introTextContainer: {
    flex: 1,
  },
  introTitle: {
    fontWeight: 'bold',
    color: '#7c2d12',
    marginBottom: 4,
    fontSize: 14,
  },
  introDesc: {
    color: '#9a3412',
    fontSize: 12,
    lineHeight: 18,
  },
  mapWrapper: {
    position: 'relative',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetBtn: {
    borderColor: '#fca5a5',
  },
  actionBtnText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 6,
  },
  mapOverlayHint: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  hintBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  hintBadgeText: {
    color: '#ea580c',
    fontWeight: 'bold',
  },
  geocodingBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  geocodingText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '500',
    marginLeft: 6,
  },
  customPinWrapper: {
    alignItems: 'center',
    width: 50,
    height: 50,
  },
  customPin: {
    backgroundColor: '#ef4444',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  pinShadow: {
    width: 12,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 6,
    marginTop: 2,
  },
  resultBox: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'flex-start',
  },
  resultIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  resultAddress: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 20,
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  coordText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#6b7280',
  },
  emptyBox: {
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  emptyDesc: {
    color: '#9ca3af',
    fontSize: 12,
  },
});
