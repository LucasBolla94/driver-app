import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';

const { width } = Dimensions.get('window');

interface JobNotificationProps {
  pickupAddress: string;
  pickupTime: string;
  deliveryAddress: string;
  deliveryTime: string;
  amount: string;
  multipleDrops?: boolean;
  distance: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function JobNotification({
  pickupAddress,
  pickupTime,
  deliveryAddress,
  deliveryTime,
  amount,
  multipleDrops = false,
  distance,
  onAccept,
  onReject,
}: JobNotificationProps) {
  const slideAnim = useRef(new Animated.Value(200)).current;
  const borderOpacity = useRef(new Animated.Value(0.5)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  // Using expo-audio player with online notification sound
  const player = useAudioPlayer('https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3');

  useEffect(() => {
    // Start vibration pattern - repeats every 1 second
    const vibrationPattern = [0, 250, 250, 250];
    Vibration.vibrate(vibrationPattern, true); // true = repeat

    // Play notification sound in loop
    try {
      player.loop = true;
      player.play();
    } catch (error) {
      console.log('Error playing sound:', error);
    }

    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Enhanced glow pulse animation
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(borderOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(borderOpacity, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowScale, {
            toValue: 1.02,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Cleanup
    return () => {
      try {
        player.pause();
      } catch (error) {
        // Ignore error if player is already released
      }
      Vibration.cancel();
    };
  }, []);

  const handleAccept = () => {
    try {
      // Stop sound and vibration
      try {
        if (player && typeof player.pause === 'function') {
          player.pause();
        }
      } catch (error) {
        // Ignore
      }

      try {
        Vibration.cancel();
      } catch (error) {
        // Ignore
      }

      // Animate out and close
      Animated.timing(slideAnim, {
        toValue: 200,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        try {
          onAccept();
        } catch (error) {
          console.error('Error calling onAccept:', error);
        }
      });
    } catch (error) {
      console.error('Error in handleAccept:', error);

      // Fallback - try to call onAccept anyway
      try {
        onAccept();
      } catch (e) {
        console.error('Error calling onAccept in fallback:', e);
      }
    }
  };

  const handleReject = () => {
    try {
      // Stop sound and vibration
      try {
        if (player && typeof player.pause === 'function') {
          player.pause();
        }
      } catch (error) {
        // Ignore
      }

      try {
        Vibration.cancel();
      } catch (error) {
        // Ignore
      }

      // Animate out and close
      Animated.timing(slideAnim, {
        toValue: 200,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        try {
          onReject();
        } catch (error) {
          console.error('Error calling onReject:', error);
        }
      });
    } catch (error) {
      console.error('Error in handleReject:', error);

      // Even if animation fails, still call onReject
      try {
        onReject();
      } catch (e) {
        console.error('Error calling onReject in fallback:', e);
      }
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: glowScale },
          ],
        },
      ]}
    >
      {/* Outer glow layers for more intense effect */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            opacity: borderOpacity,
          },
        ]}
      />

      <View style={styles.card}>
        {/* Animated Border */}
        <Animated.View
          style={[
            styles.borderGlow,
            {
              opacity: borderOpacity,
            },
          ]}
        />

        {/* Inner glow */}
        <Animated.View
          style={[
            styles.innerGlow,
            {
              opacity: borderOpacity,
            },
          ]}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Pickup */}
            <View style={styles.locationRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="location" size={20} color="#00C853" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.timeText}>After: {pickupTime}</Text>
                <Text style={styles.addressText} numberOfLines={1}>
                  {pickupAddress}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Delivery */}
            <View style={styles.locationRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="location" size={20} color="#FF5252" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.timeText}>Before: {deliveryTime}</Text>
                <Text style={styles.addressText} numberOfLines={1}>
                  {deliveryAddress}
                </Text>
              </View>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            <Text style={styles.amountText}>{amount}</Text>
            {multipleDrops && (
              <Text style={styles.dropsText}>Multiple drops</Text>
            )}
            <Text style={styles.distanceLabel}>Total Distance</Text>
            <Text style={styles.distanceValue}>{distance}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={handleReject}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={20} color="#FF5252" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 160, // Increased from 120 to 160 for more spacing
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    paddingHorizontal: width * 0.05,
  },
  outerGlow: {
    position: 'absolute',
    top: -8,
    left: width * 0.03,
    right: width * 0.03,
    bottom: -8,
    borderRadius: 24,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 12,
    position: 'relative',
  },
  borderGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 19,
    borderWidth: 4,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
    marginRight: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  locationInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 11,
    color: '#999999',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  divider: {
    height: 12,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  dropsText: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  distanceLabel: {
    fontSize: 10,
    color: '#999999',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  distanceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Poppins',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#FFE5E5',
    borderWidth: 1.5,
    borderColor: '#FF5252',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5252',
    fontFamily: 'Poppins',
  },
  acceptButton: {
    backgroundColor: '#00C853',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
});
