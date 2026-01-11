import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DriverAvatar from './DriverAvatar';
import { useDriverData } from '../hooks/useDriverData';
import JobHistoryScreen from './JobHistoryScreen';
import EarningsScreen from './EarningsScreen';
import SupportScreen from './SupportScreen';

export default function ProfileScreen() {
  const { driverData, loading, refresh } = useDriverData();
  const [showJobHistory, setShowJobHistory] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              await AsyncStorage.removeItem('keepLoggedIn');
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleJobHistory = () => {
    setShowJobHistory(true);
  };

  const handleEarnings = () => {
    setShowEarnings(true);
  };

  const handleSupport = () => {
    setShowSupport(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (!driverData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  if (showJobHistory) {
    return <JobHistoryScreen onBack={() => setShowJobHistory(false)} />;
  }

  if (showEarnings) {
    return <EarningsScreen onBack={() => setShowEarnings(false)} />;
  }

  if (showSupport) {
    return <SupportScreen onBack={() => setShowSupport(false)} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Profile Photo */}
          <DriverAvatar
            userId={driverData.uid}
            profileUrl={driverData.profile_url}
            size={150}
            editable={true}
            borderColor="#000000"
            borderWidth={4}
            onPhotoUpdated={refresh}
          />

          {/* User Info */}
          <Text style={styles.userName}>
            {driverData.firstName} {driverData.lastName}
          </Text>
          <Text style={styles.userEmail}>{driverData.email}</Text>
          <Text style={styles.userPhone}>{driverData.phone}</Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.ratingText}>4.8</Text>
            <Text style={styles.ratingLabel}>Rating</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
              <Text style={styles.statValue}>247</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons name="cash" size={28} color="#2196F3" />
              <Text style={styles.statValue}>£5420.50</Text>
              <Text style={styles.statLabel}>Weekly Earned</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {/* Job History */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleJobHistory}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="briefcase-outline" size={24} color="#2196F3" />
              </View>
              <Text style={styles.menuItemText}>Job History</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999999" />
          </TouchableOpacity>

          {/* Earnings */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleEarnings}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="wallet-outline" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.menuItemText}>Earnings</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999999" />
          </TouchableOpacity>

          {/* Support */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSupport}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="help-circle-outline" size={24} color="#FF9800" />
              </View>
              <Text style={styles.menuItemText}>Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999999" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="log-out-outline" size={24} color="#FF5252" />
              </View>
              <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FF5252" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 6,
    marginTop: 20,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Poppins',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    gap: 6,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  logoutText: {
    color: '#FF5252',
  },
});
