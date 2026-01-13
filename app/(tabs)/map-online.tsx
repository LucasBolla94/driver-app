import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import JobNotification from '../../components/JobNotification';
import JobsScreen from '../../components/JobsScreen';
import BoardScreen from '../../components/BoardScreen';
import ProfileScreen from '../../components/ProfileScreen';
import BottomNavigation from '../../components/BottomNavigation';
import { supabase } from '../../lib/supabase';
import { useJobOffers } from '../../hooks/useJobOffers';
import { GOOGLE_MAPS_API_KEY } from '../../config/maps';

interface MapOnlineScreenProps {
  onGoOffline: () => void;
}

type TabType = 'map' | 'jobs' | 'board' | 'profile';

export default function MapOnlineScreen({ onGoOffline }: MapOnlineScreenProps) {
  const [location, setLocation] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const mapRef = useRef<any>(null);

  // Use job offers hook
  const { currentOffer, loading: offerLoading, acceptOffer, rejectOffer } = useJobOffers();

  useEffect(() => {
    // When offer arrives, switch to map tab and calculate route
    if (currentOffer) {
      setCurrentTab('map');
      calculateRoute();
      fitMarkersToMap();
    } else {
      setRouteCoordinates([]);
    }
  }, [currentOffer]);

  // Calculate route using Google Directions API
  const calculateRoute = async () => {
    if (!currentOffer) return;

    try {
      const origin = `${currentOffer.collect_latitude},${currentOffer.collect_longitude}`;
      const destination = `${currentOffer.dropoff_latitude},${currentOffer.dropoff_longitude}`;

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoordinates(points);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  // Decode Google polyline
  const decodePolyline = (encoded: string) => {
    const points: any[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  // Fit map to show collect and dropoff markers
  const fitMarkersToMap = () => {
    if (!mapRef.current || !currentOffer) return;

    setTimeout(() => {
      mapRef.current.fitToCoordinates(
        [
          {
            latitude: currentOffer.collect_latitude!,
            longitude: currentOffer.collect_longitude!,
          },
          {
            latitude: currentOffer.dropoff_latitude!,
            longitude: currentOffer.dropoff_longitude!,
          },
        ],
        {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        }
      );
    }, 500);
  };

  const centerMapOnUser = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  };

  // Function to update driver location in Supabase
  const updateDriverLocation = async (latitude: number, longitude: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update location in drivers_uk table
      const { error } = await supabase
        .from('drivers_uk')
        .update({
          online_status: 'online',
          online_latitude: latitude,
          online_longitude: longitude,
          last_location_update: new Date().toISOString(),
        })
        .eq('uid', user.id);

      if (error) {
        console.error('Error updating location:', error);
      }
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  };

  // Function to set driver offline in database
  const setDriverOfflineInDB = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('drivers_uk')
        .update({
          online_status: 'offline',
          online_latitude: null,
          online_longitude: null,
          last_location_update: new Date().toISOString(),
        })
        .eq('uid', user.id);

      if (error) {
        console.error('Error setting driver offline in DB:', error);
      }
    } catch (error) {
      console.error('Error setting driver offline:', error);
    }
  };

  const handleToggleOffline = async () => {
    await setDriverOfflineInDB();
    setIsOnline(false);
    setTimeout(() => {
      onGoOffline();
    }, 300);
  };

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
  };

  // Check if driver is still online in database
  useEffect(() => {
    const checkOnlineStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          onGoOffline();
          return;
        }

        const { data: driverData, error } = await supabase
          .from('drivers_uk')
          .select('online_status')
          .eq('uid', user.id)
          .single();

        if (driverData && !error) {
          const isCurrentlyOnline = driverData.online_status === 'online';

          if (!isCurrentlyOnline) {
            onGoOffline();
          }
        } else {
          onGoOffline();
        }
      } catch (error) {
        console.error('Error checking online status:', error);
      }
    };

    checkOnlineStatus();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocation({
            latitude: 40.7128,
            longitude: -74.0060,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });

        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }
        );
      } catch (error) {
        setLocation({
          latitude: 40.7128,
          longitude: -74.0060,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    })();
  }, []);

  // Effect to update location in database when online
  useEffect(() => {
    if (!location) return;

    // Initial location update
    updateDriverLocation(location.latitude, location.longitude);

    // Set up interval to update location every 10 seconds
    const locationUpdateInterval = setInterval(() => {
      if (location) {
        updateDriverLocation(location.latitude, location.longitude);
      }
    }, 10000); // Update every 10 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(locationUpdateInterval);
    };
  }, [location]);

  const handleAcceptJob = async () => {
    if (!currentOffer) return;

    try {
      await acceptOffer(currentOffer.id, currentOffer.job_id);
      // TODO: Navigate to job details screen
    } catch (error) {
      console.error('Error in handleAcceptJob:', error);
    }
  };

  const handleRejectJob = async () => {
    if (!currentOffer) return;

    try {
      await rejectOffer(currentOffer.id);
    } catch (error) {
      console.error('Error in handleRejectJob:', error);
    }
  };

  const customMapStyle = [
    {
      elementType: 'geometry',
      stylers: [{ color: '#242f3e' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#242f3e' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f2835' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3d19c' }],
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#2f3948' }],
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#515c6d' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#17263c' }],
    },
  ];


  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Render different content based on tab */}
      {currentTab === 'jobs' && <JobsScreen />}

      {currentTab === 'map' && (
        <>
          {/* Top Status Bar */}
          <View style={styles.topBar}>
            <View style={styles.onlineBadge}>
              <Text style={styles.onlineBadgeText}>ONLINE</Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOffline}
              trackColor={{ false: '#4A4A4A', true: '#00C853' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#4A4A4A"
              style={styles.switch}
            />
          </View>

          {/* Center Button */}
          <TouchableOpacity style={styles.centerButton} onPress={centerMapOnUser}>
            <Ionicons name="locate" size={24} color="#000000" />
          </TouchableOpacity>

          {/* Full Screen Map */}
          <View style={styles.mapContainer}>
            {location ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={Platform.select({
                  android: PROVIDER_GOOGLE,
                  ios: PROVIDER_DEFAULT,
                  default: PROVIDER_DEFAULT,
                })}
                initialRegion={location}
                customMapStyle={Platform.OS === 'android' ? customMapStyle : undefined}
                scrollEnabled={true}
                zoomEnabled={true}
                pitchEnabled={true}
                rotateEnabled={true}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={false}
                showsScale={false}
                showsBuildings={true}
                showsTraffic={false}
                showsIndoors={false}
                loadingEnabled={true}
                mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
              >
                {/* Driver Location Marker */}
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={styles.driverMarker}>
                    <View style={styles.markerInner} />
                  </View>
                </Marker>

                {/* Collect Marker */}
                {currentOffer && currentOffer.collect_latitude && currentOffer.collect_longitude && (
                  <Marker
                    coordinate={{
                      latitude: currentOffer.collect_latitude,
                      longitude: currentOffer.collect_longitude,
                    }}
                    title="Collect"
                    description={currentOffer.collect_address}
                    pinColor="#4CAF50"
                  >
                    <View style={styles.collectMarker}>
                      <Ionicons name="arrow-up-circle" size={36} color="#4CAF50" />
                    </View>
                  </Marker>
                )}

                {/* Dropoff Marker */}
                {currentOffer && currentOffer.dropoff_latitude && currentOffer.dropoff_longitude && (
                  <Marker
                    coordinate={{
                      latitude: currentOffer.dropoff_latitude,
                      longitude: currentOffer.dropoff_longitude,
                    }}
                    title="Drop Off"
                    description={currentOffer.dropoff_address}
                    pinColor="#FF5252"
                  >
                    <View style={styles.dropoffMarker}>
                      <Ionicons name="arrow-down-circle" size={36} color="#FF5252" />
                    </View>
                  </Marker>
                )}

                {/* Route Polyline */}
                {routeCoordinates.length > 0 && (
                  <Polyline
                    coordinates={routeCoordinates}
                    strokeWidth={4}
                    strokeColor="#2196F3"
                  />
                )}
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          </View>

          {/* Job Notification */}
          {currentOffer && (
            <JobNotification
              pickupAddress={currentOffer.collect_address}
              pickupTime={currentOffer.collect_time_after || 'ASAP'}
              deliveryAddress={currentOffer.dropoff_address}
              deliveryTime={currentOffer.dropoff_time_before || 'TBD'}
              amount={currentOffer.price_driver.toFixed(2)}
              distance={currentOffer.distance || 'N/A'}
              multipleDrops={false}
              onAccept={handleAcceptJob}
              onReject={handleRejectJob}
            />
          )}
        </>
      )}

      {currentTab === 'board' && <BoardScreen />}

      {currentTab === 'profile' && <ProfileScreen />}

      {/* Bottom Navigation - Always visible */}
      <BottomNavigation currentTab={currentTab} onTabChange={handleTabChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#242f3e',
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  onlineBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#00C853',
  },
  onlineBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C853',
    fontFamily: 'Poppins',
    letterSpacing: 1.2,
  },
  switch: {
    transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }],
  },
  centerButton: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFD700',
  },
  collectMarker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dropoffMarker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Poppins',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999999',
    fontFamily: 'Poppins',
    marginTop: 8,
  },
});
