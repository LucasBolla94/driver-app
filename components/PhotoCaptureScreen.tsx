import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

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

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission',
        'Camera permission is required to take photos'
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
  };

  const handleConfirm = () => {
    if (photoUri) {
      onPhotoTaken(photoUri);
    }
  };

  return (
    <View style={styles.container}>
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
      <View style={styles.content}>
        {!photoUri ? (
          <>
            {/* Instructions */}
            <View style={styles.instructionContainer}>
              <Ionicons name="camera-outline" size={64} color="#000000" />
              <Text style={styles.instructionTitle}>Take a Photo</Text>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>

            <View style={styles.spacer} />

            {/* Camera Button */}
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleTakePhoto}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={32} color="#FFFFFF" />
              <Text style={styles.cameraButtonText}>Open Camera</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
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
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionContainer: {
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginTop: 24,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  spacer: {
    flex: 1,
  },
  cameraButton: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  cameraButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    maxHeight: 500,
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
