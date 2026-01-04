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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import JobNotification from '../../components/JobNotification';
import JobsScreen from '../../components/JobsScreen';
import BoardScreen from '../../components/BoardScreen';
import BottomNavigation from '../../components/BottomNavigation';
import { supabase } from '../../lib/supabase';

interface MapOnlineScreenProps {
  onGoOffline: () => void;
}

type TabType = 'map' | 'jobs' | 'board' | 'profile';

export default function MapOnlineScreen({ onGoOffline }: MapOnlineScreenProps) {
  const [location, setLocation] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showJobNotification, setShowJobNotification] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const mapRef = useRef<any>(null);

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

      console.log('Updating location:', { latitude, longitude, userId: user.id });

      // Use upsert to insert or update in one operation
      const { data, error } = await supabase
        .from('drivers_online')
        .upsert({
          userId: user.id,
          latitude,
          longitude,
          status: true,
          lastUpdated: new Date().toISOString(),
        }, {
          onConflict: 'userId'
        });

      if (error) {
        console.error('Error upserting location:', error);
      } else {
        console.log('Location updated successfully');
      }
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  };

  // Function to set driver offline in database
  const setDriverOfflineInDB = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found when trying to go offline');
        return;
      }

      console.log('Setting driver offline for user:', user.id);
      const { data, error } = await supabase
        .from('drivers_online')
        .update({ status: false })
        .eq('userId', user.id);

      if (error) {
        console.error('Error setting driver offline in DB:', error);
      } else {
        console.log('Successfully set driver offline in DB:', data);
      }
    } catch (error) {
      console.error('Error setting driver offline:', error);
    }
  };

  const handleToggleOffline = async () => {
    console.log('Toggle switch pressed - going offline');
    await setDriverOfflineInDB();
    console.log('Status set to false in database');
    setIsOnline(false);
    setTimeout(() => {
      onGoOffline();
    }, 300);
  };

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
  };

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

  const handleAcceptJob = () => {
    setShowJobNotification(false);
    console.log('Job aceito!');
  };

  const handleRejectJob = () => {
    setShowJobNotification(false);
    console.log('Job rejeitado!');
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
                provider={PROVIDER_GOOGLE}
                initialRegion={location}
                customMapStyle={customMapStyle}
                scrollEnabled={true}
                zoomEnabled={true}
                pitchEnabled={false}
                rotateEnabled={true}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={false}
                showsScale={false}
                showsBuildings={true}
                showsTraffic={false}
                showsIndoors={false}
                loadingEnabled={true}
              >
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
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          </View>

          {/* Job Notification */}
          {showJobNotification && (
            <JobNotification
              pickupAddress="221B Baker Street, NW1 6XE"
              pickupTime="14:30"
              deliveryAddress="10 Downing Street, SW1A 2AA"
              deliveryTime="15:15"
              amount="£12.50"
              distance="3.2 mi"
              multipleDrops={false}
              onAccept={handleAcceptJob}
              onReject={handleRejectJob}
            />
          )}
        </>
      )}

      {currentTab === 'board' && <BoardScreen />}

      {currentTab === 'profile' && (
        <View style={styles.emptyScreen}>
          <Ionicons name="person-outline" size={64} color="#666666" />
          <Text style={styles.emptyText}>Profile Screen</Text>
          <Text style={styles.emptySubtext}>Coming soon</Text>
        </View>
      )}

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
