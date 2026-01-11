import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

// Cache in-memory para URLs assinadas
const urlCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 horas (menos que 7 dias de expiração)

interface DriverAvatarProps {
  userId: string;
  profileUrl?: string | null;
  size?: number;
  editable?: boolean;
  borderColor?: string;
  borderWidth?: number;
  onPhotoUpdated?: () => void;
}

export default function DriverAvatar({
  userId,
  profileUrl,
  size = 100,
  editable = false,
  borderColor = '#000000',
  borderWidth = 3,
  onPhotoUpdated,
}: DriverAvatarProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhoto();
  }, [profileUrl]);

  const loadPhoto = async () => {
    setLoading(true);

    if (!profileUrl) {
      setPhotoUri(null);
      setLoading(false);
      return;
    }

    try {
      // Check cache first
      const cached = urlCache.get(profileUrl);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        // Use cached URL
        setPhotoUri(cached.url);
        setLoading(false);
        return;
      }

      // Get signed URL for private bucket
      const { data: urlData, error: urlError } = await supabase.storage
        .from('driver_profile')
        .createSignedUrl(profileUrl, 60 * 60 * 24 * 7); // 7 days expiry

      if (!urlError && urlData) {
        // Cache the URL
        urlCache.set(profileUrl, {
          url: urlData.signedUrl,
          timestamp: now,
        });
        setPhotoUri(urlData.signedUrl);
      } else {
        console.error('Error getting signed URL:', urlError);
        setPhotoUri(null);
      }
    } catch (error) {
      console.error('Error loading photo:', error);
      setPhotoUri(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!editable) return;

    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library permission to upload a profile photo.'
        );
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        return;
      }

      const image = result.assets[0];

      if (!image.base64) {
        Alert.alert('Error', 'Failed to process image');
        return;
      }

      setUploading(true);

      // Generate unique filename with user ID
      const fileExt = image.uri.split('.').pop();
      const fileName = `${userId}/profile.${fileExt}`;

      // Delete old photo if exists
      if (profileUrl) {
        await supabase.storage.from('driver_profile').remove([profileUrl]);
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('driver_profile')
        .upload(fileName, decode(image.base64), {
          contentType: image.mimeType || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Upload Failed', uploadError.message);
        setUploading(false);
        return;
      }

      // Update database with new profile_url
      const { error: updateError } = await supabase
        .from('drivers_uk')
        .update({ profile_url: fileName })
        .eq('uid', userId);

      if (updateError) {
        console.error('Database update error:', updateError);
        Alert.alert('Error', 'Failed to update profile');
        setUploading(false);
        return;
      }

      // Clear cache for this user
      urlCache.delete(fileName);

      // Reload photo
      await loadPhoto();

      setUploading(false);
      Alert.alert('Success', 'Profile photo updated successfully!');

      // Call callback if provided
      if (onPhotoUpdated) {
        onPhotoUpdated();
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', 'Failed to upload photo');
      setUploading(false);
    }
  };

  const containerSize = size;
  const iconSize = Math.floor(size * 0.48);
  const editButtonSize = Math.floor(size * 0.36);
  const editIconSize = Math.floor(size * 0.18);

  return (
    <View style={[styles.container, { width: containerSize, height: containerSize }]}>
      {loading ? (
        <View
          style={[
            styles.placeholder,
            {
              width: containerSize,
              height: containerSize,
              borderRadius: containerSize / 2,
              borderColor,
              borderWidth,
            },
          ]}
        >
          <ActivityIndicator size="small" color="#666666" />
        </View>
      ) : photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={[
            styles.photo,
            {
              width: containerSize,
              height: containerSize,
              borderRadius: containerSize / 2,
              borderColor,
              borderWidth,
            },
          ]}
          resizeMode="cover"
          defaultSource={require('../assets/images/icon.png')}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: containerSize,
              height: containerSize,
              borderRadius: containerSize / 2,
              borderColor,
              borderWidth,
            },
          ]}
        >
          <Ionicons name="person" size={iconSize} color="#666666" />
        </View>
      )}

      {editable && (
        <TouchableOpacity
          style={[
            styles.editButton,
            {
              width: editButtonSize,
              height: editButtonSize,
              borderRadius: editButtonSize / 2,
            },
          ]}
          onPress={handlePhotoUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="camera" size={editIconSize} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  photo: {
    // Dynamic styles applied inline
  },
  placeholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
