import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { MapPin, Info, Clock, X } from 'lucide-react-native';

export interface SearchLocation {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
}

interface RentalMapViewProps {
  properties: any[];
  selectedProperty: any | null;
  onPropertySelect: (property: any | null) => void;
  searchLocations?: SearchLocation[];
  searchRadius?: number; // in km
  searchCenter?: [number, number];
  recenterLocation?: [number, number];
  recenterKey?: number;
}

const { width, height } = Dimensions.get('window');

export function RentalMapView({
  properties,
  selectedProperty,
  onPropertySelect,
  searchLocations,
  searchRadius = 1,
  searchCenter,
  recenterLocation,
  recenterKey,
}: RentalMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const [showLegend, setShowLegend] = useState(false);

  const defaultCenter: [number, number] = [10.7769, 106.7009]; // HCM center [lat, lng]
  const effectiveCenter = searchCenter || defaultCenter;

  // Fly to search center when it changes
  useEffect(() => {
    if (mapRef.current && searchCenter) {
      mapRef.current.animateToRegion({
        latitude: searchCenter[0],
        longitude: searchCenter[1],
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  }, [searchCenter]);

  // Force recenter
  useEffect(() => {
    if (mapRef.current && recenterLocation) {
      mapRef.current.animateToRegion({
        latitude: recenterLocation[0],
        longitude: recenterLocation[1],
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [recenterKey, recenterLocation]);

  // Fly to selected property
  useEffect(() => {
    if (mapRef.current && selectedProperty) {
      mapRef.current.animateToRegion({
        latitude: selectedProperty.location[0],
        longitude: selectedProperty.location[1],
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [selectedProperty]);

  const pinnedCount = properties.filter((p) => p.pinInfo).length;
  const regularCount = properties.length - pinnedCount;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: effectiveCenter[0],
          longitude: effectiveCenter[1],
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={() => onPropertySelect(null)}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Render Search Locations */}
        {searchLocations?.map((loc, idx) => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.coordinates[0], longitude: loc.coordinates[1] }}
            pinColor="#f59e0b"
          >
            <View style={styles.searchMarker}>
              <Text style={styles.searchMarkerText}>{idx + 1}</Text>
            </View>
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                  Địa điểm {idx + 1}
                </Text>
                <Text style={{ fontSize: 12 }}>{loc.name}</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Render Properties */}
        {properties.map((property, idx) => {
          const isPinned = !!property.pinInfo;
          const isAvailable = property.available !== false;

          let markerColor = '#9ca3af'; // Default disabled
          if (isAvailable) {
            markerColor = isPinned ? '#f59e0b' : '#059669';
          }

          return (
            <Marker
              key={property.id || property._id || `prop-${idx}`}
              coordinate={{
                latitude: property.location[0],
                longitude: property.location[1],
              }}
              pinColor={markerColor}
              onPress={(e) => {
                e.stopPropagation();
                onPropertySelect(property);
              }}
            >
              {isPinned && (
                <View style={styles.pinnedGlow}>
                  <View style={[styles.customPin, { backgroundColor: markerColor }]}>
                    <MapPin size={16} color="white" />
                  </View>
                </View>
              )}
            </Marker>
          );
        })}
      </MapView>

      {/* Legend Button */}
      {!showLegend && (
        <TouchableOpacity
          style={styles.legendBtn}
          onPress={() => setShowLegend(true)}
        >
          <Info size={24} color="#34d399" />
        </TouchableOpacity>
      )}

      {/* Legend Box */}
      {showLegend && (
        <View style={styles.legendBox}>
          <View style={styles.legendHeader}>
            <Text style={styles.legendTitle}>CHÚ THÍCH</Text>
            <TouchableOpacity onPress={() => setShowLegend(false)}>
              <X size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendIcon, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Đã ghim vị trí ({pinnedCount})</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendIcon, { backgroundColor: '#059669' }]} />
            <Text style={styles.legendText}>Chưa ghim vị trí ({regularCount})</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  searchMarker: {
    backgroundColor: '#f59e0b',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchMarkerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  calloutContainer: {
    padding: 5,
    minWidth: 100,
  },
  customPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedGlow: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  legendBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(2, 44, 34, 0.9)',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.5)',
  },
  legendBox: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(2, 44, 34, 0.95)',
    width: 200,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.5)',
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 78, 59, 0.5)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  legendTitle: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
