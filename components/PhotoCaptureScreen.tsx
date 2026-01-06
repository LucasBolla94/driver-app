import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhotoCaptureScreenProps {
  title: string;
  instruction: string;
  onPhotoTaken: (photoUri: string) => void;
  onCancel: () => void;
}

export default function PhotoCaptureScreen({
  title,
  instruction,
  onPhotoTaken,
  onCancel,
}: PhotoCaptureScreenProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraLaunched, setCameraLaunched] = useState(false);

  const requestCameraPermission = async () => {
    try {
      // Check current permission status first
      const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();
      console.log('Current camera permission status:', existingStatus);

      let finalStatus = existingStatus;

      // If not granted, request permission
      if (existingStatus !== 'granted') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        finalStatus = status;
        console.log('Requested camera permission, new status:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to take photos.',
          [
            {
              text: 'Cancel',
              onPress: onCancel,
              style: 'cancel'
            }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Failed to request camera permission');
      return false;
    }
  };

  const handleTakePhoto = async () => {
    console.log('Attempting to open camera...');

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      console.log('Camera permission denied');
      return;
    }

    console.log('Camera permission granted, launching camera...');

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // No editing, direct camera only
        quality: 0.8,
        cameraType: ImagePicker.CameraType.back,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('Photo taken successfully:', result.assets[0].uri);
        setPhotoUri(result.assets[0].uri);
      } else {
        console.log('Camera was canceled or no photo taken');
        // If user cancels camera, go back
        onCancel();
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
      onCancel();
    }
  };

  const handleRetake = async () => {
    setPhotoUri(null);
    // Immediately open camera again
    await handleTakePhoto();
  };

  // Open camera automatically when component mounts
  useEffect(() => {
    if (!cameraLaunched) {
      setCameraLaunched(true);
      handleTakePhoto();
    }
  }, []);

  const handleConfirm = () => {
    if (photoUri) {
      onPhotoTaken(photoUri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {/* Content */}
      {!photoUri ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Opening camera...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Photo Preview */}
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetake}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={24} color="#000000" />
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Use This Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
  },
  previewContainer: {
    height: SCREEN_HEIGHT * 0.55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'contain',
  },
  actionsContainer: {
    gap: 12,
  },
  retakeButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#000000',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
});
