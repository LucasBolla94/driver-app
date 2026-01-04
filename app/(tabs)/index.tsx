import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  PanResponder,
  Animated,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import MapOnlineScreen from './map-online';
import BottomNavigation from '../../components/BottomNavigation';
import JobsScreen from '../../components/JobsScreen';
import BoardScreen from '../../components/BoardScreen';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');
const SWIPE_BUTTON_SIZE = 56;
const SWIPE_PILL_PADDING = 7;
// Swipe width será 80% da largura da tela
const SWIPE_WIDTH = width * 0.85;
// O threshold correto: largura do container menos o botão e os paddings
// Precisa ser a distância que o botão pode percorrer
const SWIPE_THRESHOLD = SWIPE_WIDTH - SWIPE_BUTTON_SIZE - (SWIPE_PILL_PADDING * 2);

type TabType = 'map' | 'jobs' | 'board' | 'profile';

export default function HomeScreen() {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const [driverName, setDriverName] = useState('Loading...');
  const [driverPoints, setDriverPoints] = useState(0);
  const mapRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setLocation({
            latitude: 40.7128,
            longitude: -74.0060,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
          Alert.alert(
            'Location Permission Required',
            'This app needs location access to show nearby jobs and track deliveries. Using default location.'
          );
          return;
        }

        // Request background location permission for "always"
        // Note: This may fail on iOS simulator or if permissions not properly configured
        try {
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus !== 'granted') {
            // Background permission not granted, app will work with foreground only
          }
        } catch (error) {
          // Silently fail - background permission is optional for basic functionality
        }

        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
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
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            });
          }
        );
      } catch (error) {
        console.error('Location error:', error);
        setErrorMsg('Error getting location');
        setLocation({
          latitude: 40.7128,
          longitude: -74.0060,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });
      }
    })();
  }, []);

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Fetch driver data from drivers table
          const { data: driverData, error } = await supabase
            .from('drivers')
            .select('firstName, lastName, points')
            .eq('userId', user.id)
            .single();

          if (driverData && !error) {
            setDriverName(`${driverData.firstName} ${driverData.lastName}`);
            setDriverPoints(driverData.points || 0);
          } else {
            setDriverName('Driver');
          }

          // Check if driver is already online in drivers_online table
          const { data: onlineData, error: onlineError } = await supabase
            .from('drivers_online')
            .select('status')
            .eq('userId', user.id)
            .single();

          if (onlineData && !onlineError && onlineData.status === true) {
            console.log('Driver is already online, setting isOnline to true');
            setIsOnline(true);
          } else {
            // Ensure status is set to false if driver is offline
            console.log('Driver is offline, ensuring status is false in database');
            await setDriverOfflineInDB();
          }
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
        setDriverName('Driver');
      }
    };

    fetchDriverData();
  }, []);

  // Function to set driver offline in database
  const setDriverOfflineInDB = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('drivers_online')
        .update({ status: false })
        .eq('userId', user.id);
    } catch (error) {
      console.error('Error setting driver offline:', error);
    }
  };

  // Effect to update location when online and set offline status when offline
  useEffect(() => {
    // Only run location updates when OFFLINE screen is visible
    // When online, MapOnlineScreen handles location updates
    if (!isOnline) {
      // When going offline, update status in database
      setDriverOfflineInDB();
    }
  }, [isOnline]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Allow dragging only to the right and within the threshold
        const newValue = Math.max(0, Math.min(gestureState.dx, SWIPE_THRESHOLD));
        slideAnim.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const dragDistance = Math.max(0, Math.min(gestureState.dx, SWIPE_THRESHOLD));

        // If swiped more than 75%, complete the swipe and go ONLINE
        if (dragDistance >= SWIPE_THRESHOLD * 0.75) {
          Animated.timing(slideAnim, {
            toValue: SWIPE_THRESHOLD,
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            setIsOnline(true);
            setTimeout(() => {
              slideAnim.setValue(0);
            }, 200);
          });
        } else {
          // If released before 75%, snap back to start (stay OFFLINE)
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleToggleOffline = async () => {
    await setDriverOfflineInDB();
    setIsOnline(false);
  };

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
  };

  const handleLogout = async () => {
    try {
      await setDriverOfflineInDB();
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('keepLoggedIn');
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  // If online, show the map online screen
  if (isOnline) {
    return <MapOnlineScreen onGoOffline={handleToggleOffline} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Render different content based on tab */}
      {currentTab === 'jobs' && <JobsScreen />}

      {currentTab === 'map' && (
        <View style={styles.contentWrapper}>
          {/* Header Profile */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={44} color="#000000" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{driverName}</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons key={star} name="star" size={14} color="#FFD700" />
                ))}
              </View>
              <Text style={styles.pointsText}>{driverPoints} points / jobs</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View style={styles.statusBadgeContainer}>
            <View style={[styles.statusBadge, isOnline && styles.statusBadgeOnline]}>
              <Text style={[styles.statusText, isOnline && styles.statusTextOnline]}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
          </View>

          {/* Map Card */}
          <View style={styles.mapCard}>
            {location ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={location}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={false}
                showsScale={false}
                loadingEnabled={true}
              />

            ) : (
              <View style={styles.mapPlaceholder}>
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          </View>

          {/* Swipe to Online Control */}
          <View style={styles.swipeContainer}>
            {!isOnline ? (
              <View style={styles.swipePill} {...panResponder.panHandlers}>
                {/* Background Text */}
                <View style={styles.swipeTextContainer}>
                  <Animated.Text
                    style={[
                      styles.swipeTextOffline,
                      {
                        opacity: slideAnim.interpolate({
                          inputRange: [0, SWIPE_THRESHOLD * 0.5],
                          outputRange: [1, 0],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  >
                    OFFLINE
                  </Animated.Text>
                  <Animated.Text
                    style={[
                      styles.swipeTextOnline,
                      {
                        opacity: slideAnim.interpolate({
                          inputRange: [SWIPE_THRESHOLD * 0.3, SWIPE_THRESHOLD],
                          outputRange: [0, 1],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  >
                    ONLINE
                  </Animated.Text>
                </View>

                {/* Swipe Button */}
                <Animated.View
                  style={[
                    styles.swipeButton,
                    {
                      transform: [{ translateX: slideAnim }],
                    },
                  ]}
                >
                  <MaterialIcons name="keyboard-double-arrow-right" size={28} color="#FFFFFF" />
                </Animated.View>

                {/* Progress Background */}
                <Animated.View
                  style={[
                    styles.swipeProgress,
                    {
                      width: slideAnim.interpolate({
                        inputRange: [0, SWIPE_THRESHOLD],
                        outputRange: [SWIPE_BUTTON_SIZE, SWIPE_WIDTH],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              </View>
            ) : (
              <TouchableOpacity style={styles.onlineButton} onPress={handleToggleOffline}>
                <Ionicons name="checkmark-circle" size={24} color="#00C853" style={styles.onlineIcon} />
                <Text style={styles.onlineButtonText}>YOU'RE ONLINE</Text>
                <Text style={styles.offlineSubtext}>Tap to go offline</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {currentTab === 'board' && <BoardScreen />}

      {currentTab === 'profile' && (
        <View style={styles.profileScreen}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatarLarge}>
              <Ionicons name="person" size={64} color="#000000" />
            </View>
            <Text style={styles.profileNameLarge}>{driverName}</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name="star" size={18} color="#FFD700" />
              ))}
            </View>
            <Text style={styles.profilePoints}>{driverPoints} points</Text>
          </View>

          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#FFFFFF',
  },
  contentWrapper: {
    flex: 1,
    paddingBottom: 100, // Espaço para o bottom navigation
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 6,
    lineHeight: 22,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 2,
  },
  pointsText: {
    fontSize: 11,
    color: '#999999',
    fontFamily: 'Poppins',
    lineHeight: 16,
  },
  statusBadgeContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  statusBadge: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  statusBadgeOnline: {
    borderColor: '#00C853',
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
    letterSpacing: 1,
  },
  statusTextOnline: {
    color: '#00C853',
  },
  mapCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    height: height * 0.38,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
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
  swipeContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  swipePill: {
    width: SWIPE_WIDTH,
    backgroundColor: '#F0F0F0',
    borderRadius: 35,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: SWIPE_PILL_PADDING,
    paddingRight: SWIPE_PILL_PADDING,
    position: 'relative',
    overflow: 'hidden',
  },
  swipeTextContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeTextOffline: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    fontFamily: 'Poppins',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  swipeTextOnline: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: '700',
    color: '#00C853',
    fontFamily: 'Poppins',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  swipeProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#E8F5E9',
    borderRadius: 35,
    zIndex: 0,
  },
  swipeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  onlineButton: {
    width: SWIPE_WIDTH,
    backgroundColor: '#E8F5E9',
    borderRadius: 35,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00C853',
    paddingHorizontal: 24,
  },
  onlineIcon: {
    marginRight: 12,
  },
  onlineButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00C853',
    fontFamily: 'Poppins',
    letterSpacing: 1,
  },
  offlineSubtext: {
    fontSize: 11,
    color: '#00C853',
    fontFamily: 'Poppins',
    marginLeft: 10,
    opacity: 0.75,
  },
  emptyScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  profileScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  profileAvatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileNameLarge: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 12,
  },
  profilePoints: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Poppins',
    marginTop: 8,
  },
  profileActions: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
});
