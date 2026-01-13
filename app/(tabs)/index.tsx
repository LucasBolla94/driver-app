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
import MapView, { PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import MapOnlineScreen from './map-online';
import BottomNavigation from '../../components/BottomNavigation';
import JobsScreen from '../../components/JobsScreen';
import BoardScreen from '../../components/BoardScreen';
import ProfileScreen from '../../components/ProfileScreen';
import DriverAvatar from '../../components/DriverAvatar';
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

interface LocationState {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export default function HomeScreen() {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<LocationState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const [driverName, setDriverName] = useState('Loading...');
  const [driverPoints, setDriverPoints] = useState(0);
  const [driverUserId, setDriverUserId] = useState<string>('');
  const [driverProfileUrl, setDriverProfileUrl] = useState<string | null>(null);
  const mapRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        // Request foreground permission
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) return;

        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setLocation({
            latitude: 40.7128,
            longitude: -74.0060,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });

          // Only show alert if mounted
          if (isMounted) {
            Alert.alert(
              'Location Permission Required',
              'This app needs location access to show nearby jobs and track deliveries. Using default location.'
            );
          }
          return;
        }

        // Get current location with timeout
        const currentLocation = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, // Use Balanced instead of High for better compatibility
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Location timeout')), 10000)
          )
        ]).catch((error) => {
          console.log('Location fetch error:', error);
          return null;
        });

        if (!isMounted) return;

        if (currentLocation && 'coords' in currentLocation) {
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });

          // Watch position updates
          Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 5000,
              distanceInterval: 10,
            },
            (newLocation) => {
              if (isMounted) {
                setLocation({
                  latitude: newLocation.coords.latitude,
                  longitude: newLocation.coords.longitude,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                });
              }
            }
          ).catch((error) => {
            console.log('Watch position error:', error);
          });
        } else {
          // Fallback to default location
          setLocation({
            latitude: 40.7128,
            longitude: -74.0060,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        }
      } catch (error) {
        console.error('Location error:', error);
        if (isMounted) {
          setErrorMsg('Error getting location');
          setLocation({
            latitude: 40.7128,
            longitude: -74.0060,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Fetch driver data from drivers_uk table
          const { data: driverData, error } = await supabase
            .from('drivers_uk')
            .select('first_name, last_name, points, profile_url, online_status')
            .eq('uid', user.id)
            .single();

          console.log('=== DRIVER DATA FETCH DEBUG ===');
          console.log('User ID:', user.id);
          console.log('Driver data response:', JSON.stringify(driverData, null, 2));
          console.log('Error:', JSON.stringify(error, null, 2));
          console.log('Has error:', !!error);
          console.log('Has data:', !!driverData);

          if (error) {
            console.error('❌ Error fetching driver data:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error details:', error.details);
            setDriverName('Driver');
            setDriverUserId(user.id);
          } else if (driverData) {
            console.log('✅ Data received successfully');
            console.log('first_name:', driverData.first_name);
            console.log('last_name:', driverData.last_name);
            const fullName = `${driverData.first_name || ''} ${driverData.last_name || ''}`.trim();
            console.log('Setting driver name to:', fullName);
            setDriverName(fullName || 'Driver');
            setDriverPoints(driverData.points || 0);
            setDriverUserId(user.id);
            setDriverProfileUrl(driverData.profile_url || null);

            // Set online status from drivers_uk table
            const isCurrentlyOnline = driverData.online_status === 'online';
            console.log('Driver online status from DB:', isCurrentlyOnline);
            setIsOnline(isCurrentlyOnline);
          } else {
            console.warn('⚠️ No error but also no data - user might not exist in drivers_uk table');
            setDriverName('Driver');
            setDriverUserId(user.id);
            setIsOnline(false);
          }
          console.log('=== END DEBUG ===');
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
        setDriverName('Driver');
      }
    };

    fetchDriverData();
  }, []);

  // Check online status periodically when on offline screen
  useEffect(() => {
    if (isOnline) return; // Don't check if already online

    const checkOnlineStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: driverData, error } = await supabase
          .from('drivers_uk')
          .select('online_status')
          .eq('uid', user.id)
          .single();

        if (driverData && !error) {
          const isCurrentlyOnline = driverData.online_status === 'online';
          if (isCurrentlyOnline) {
            console.log('Status is online in DB, redirecting to online screen');
            setIsOnline(true);
          }
        }
      } catch (error) {
        console.error('Error checking online status:', error);
      }
    };

    // Check immediately
    checkOnlineStatus();

    // Check every 3 seconds
    const interval = setInterval(checkOnlineStatus, 3000);

    return () => clearInterval(interval);
  }, [isOnline]);

  // Function to set driver offline in database
  const setDriverOfflineInDB = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('drivers_uk')
        .update({
          online_status: 'offline',
          online_latitude: null,
          online_longitude: null,
        })
        .eq('uid', user.id);

      console.log('Driver set to offline in drivers_uk table');
    } catch (error) {
      console.error('Error setting driver offline:', error);
    }
  };

  const setDriverOnlineInDB = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found when trying to go online');
        return false;
      }

      console.log('Setting driver online for user:', user.id);

      // Use location if available, otherwise use default location
      const lat = location?.latitude || 0;
      const lng = location?.longitude || 0;

      console.log('Using location:', { latitude: lat, longitude: lng });

      // Update drivers_uk table with online status and location
      const { error } = await supabase
        .from('drivers_uk')
        .update({
          online_status: 'online',
          online_latitude: lat,
          online_longitude: lng,
        })
        .eq('uid', user.id);

      if (error) {
        console.error('Error setting driver online in DB:', error);
        Alert.alert('Error', 'Failed to go online. Please try again.');
        return false;
      } else {
        console.log('Successfully set driver online in drivers_uk table');
        return true;
      }
    } catch (error) {
      console.error('Error setting driver online:', error);
      Alert.alert('Error', 'Failed to go online. Please try again.');
      return false;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Allow dragging only to the right and within the threshold
        const newValue = Math.max(0, Math.min(gestureState.dx, SWIPE_THRESHOLD));
        slideAnim.setValue(newValue);
      },
      onPanResponderRelease: async (_, gestureState) => {
        const dragDistance = Math.max(0, Math.min(gestureState.dx, SWIPE_THRESHOLD));

        // If swiped more than 75%, complete the swipe and go ONLINE
        if (dragDistance >= SWIPE_THRESHOLD * 0.75) {
          console.log('Swipe completed, attempting to go online...');
          console.log('Location at swipe time:', location);

          Animated.timing(slideAnim, {
            toValue: SWIPE_THRESHOLD,
            duration: 200,
            useNativeDriver: false,
          }).start(async () => {
            // Save to database first
            const success = await setDriverOnlineInDB();

            if (success) {
              console.log('Successfully went online, updating UI');
              setIsOnline(true);
            } else {
              console.log('Failed to go online');
            }

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
            <DriverAvatar
              userId={driverUserId}
              profileUrl={driverProfileUrl}
              size={120}
              editable={false}
              borderColor="#000000"
              borderWidth={3}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{driverName}</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons key={star} name="star" size={16} color="#FFD700" />
                ))}
              </View>
              <Text style={styles.pointsText}>{driverPoints} Nex Points</Text>
            </View>
          </View>

          {/* Divider Line */}
          <View style={styles.dividerLine} />

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
                provider={Platform.select({
                  android: PROVIDER_GOOGLE,
                  ios: PROVIDER_DEFAULT,
                  default: PROVIDER_DEFAULT,
                })}
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
                mapType={Platform.OS === 'ios' ? 'standard' : 'standard'}
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

      {currentTab === 'profile' && <ProfileScreen />}

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
    paddingBottom: 20,
    gap: 20,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 8,
    lineHeight: 28,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 3,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
    lineHeight: 20,
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
    marginBottom: 50,
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
