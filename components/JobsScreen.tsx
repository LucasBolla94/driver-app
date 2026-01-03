import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Job {
  id: string;
  ref: string;
  pickupAddress: string;
  pickupPostcode: string;
  deliveryAddress: string;
  deliveryPostcode: string;
  amount: string;
  distance: string;
  status: 'accepted' | 'in_progress' | 'completed';
  acceptedAt: string;
}

const SAMPLE_JOBS: Job[] = [
  {
    id: '1',
    ref: 'JOB-2024-001',
    pickupAddress: '221B Baker Street',
    pickupPostcode: 'NW1 6XE',
    deliveryAddress: '10 Downing Street',
    deliveryPostcode: 'SW1A 2AA',
    amount: '£12.50',
    distance: '3.2 mi',
    status: 'accepted',
    acceptedAt: '10:30 AM',
  },
  {
    id: '2',
    ref: 'JOB-2024-002',
    pickupAddress: 'Buckingham Palace',
    pickupPostcode: 'SW1A 1AA',
    deliveryAddress: 'Tower of London',
    deliveryPostcode: 'EC3N 4AB',
    amount: '£18.75',
    distance: '5.8 mi',
    status: 'in_progress',
    acceptedAt: '09:15 AM',
  },
  {
    id: '3',
    ref: 'JOB-2024-003',
    pickupAddress: 'King\'s Cross Station',
    pickupPostcode: 'N1C 4AP',
    deliveryAddress: 'Piccadilly Circus',
    deliveryPostcode: 'W1J 9HS',
    amount: '£15.20',
    distance: '4.1 mi',
    status: 'accepted',
    acceptedAt: '11:45 AM',
  },
  {
    id: '4',
    ref: 'JOB-2024-004',
    pickupAddress: 'Oxford Street, 235',
    pickupPostcode: 'W1D 2LF',
    deliveryAddress: 'Camden Market',
    deliveryPostcode: 'NW1 8AH',
    amount: '£10.00',
    distance: '2.5 mi',
    status: 'completed',
    acceptedAt: '08:00 AM',
  },
];

export default function JobsScreen() {
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const toggleJob = (jobId: string) => {
    setExpandedJob(expandedJob === jobId ? null : jobId);
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'accepted':
        return '#4CAF50';
      case 'in_progress':
        return '#FF9800';
      case 'completed':
        return '#9E9E9E';
      default:
        return '#666666';
    }
  };

  const getStatusText = (status: Job['status']) => {
    switch (status) {
      case 'accepted':
        return 'ACCEPTED';
      case 'in_progress':
        return 'IN PROGRESS';
      case 'completed':
        return 'COMPLETED';
      default:
        return status.toUpperCase();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            {SAMPLE_JOBS.filter((j) => j.status !== 'completed').length} Active
          </Text>
        </View>
      </View>

      {/* Jobs List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SAMPLE_JOBS.map((job) => (
          <View key={job.id} style={styles.jobCard}>
            {/* Job Header - Clickable */}
            <TouchableOpacity
              style={styles.jobHeader}
              onPress={() => toggleJob(job.id)}
              activeOpacity={0.7}
            >
              <View style={styles.jobHeaderLeft}>
                <View style={styles.jobIconContainer}>
                  <Ionicons name="briefcase" size={20} color="#000000" />
                </View>
                <View style={styles.jobHeaderInfo}>
                  <Text style={styles.jobRef}>{job.ref}</Text>
                  <Text style={styles.jobTime}>{job.acceptedAt}</Text>
                </View>
              </View>

              <View style={styles.jobHeaderRight}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(job.status) },
                  ]}
                >
                  <Text style={styles.statusText}>{getStatusText(job.status)}</Text>
                </View>
                <Ionicons
                  name={expandedJob === job.id ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#666666"
                />
              </View>
            </TouchableOpacity>

            {/* Job Details - Expandable */}
            {expandedJob === job.id && (
              <View style={styles.jobDetails}>
                <View style={styles.divider} />

                {/* Pickup Location */}
                <View style={styles.locationSection}>
                  <View style={styles.locationIconWrapper}>
                    <View style={styles.pickupIcon}>
                      <Ionicons name="location" size={18} color="#4CAF50" />
                    </View>
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>PICKUP</Text>
                    <Text style={styles.locationAddress}>{job.pickupAddress}</Text>
                    <Text style={styles.locationPostcode}>{job.pickupPostcode}</Text>
                  </View>
                </View>

                {/* Route Line */}
                <View style={styles.routeLine} />

                {/* Delivery Location */}
                <View style={styles.locationSection}>
                  <View style={styles.locationIconWrapper}>
                    <View style={styles.deliveryIcon}>
                      <Ionicons name="location" size={18} color="#FF5252" />
                    </View>
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>DELIVERY</Text>
                    <Text style={styles.locationAddress}>{job.deliveryAddress}</Text>
                    <Text style={styles.locationPostcode}>{job.deliveryPostcode}</Text>
                  </View>
                </View>

                {/* Job Info Grid */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoCard}>
                    <Ionicons name="cash-outline" size={20} color="#FFD700" />
                    <Text style={styles.infoLabel}>Earnings</Text>
                    <Text style={styles.infoValue}>{job.amount}</Text>
                  </View>

                  <View style={styles.infoCard}>
                    <Ionicons name="navigate-outline" size={20} color="#2196F3" />
                    <Text style={styles.infoLabel}>Distance</Text>
                    <Text style={styles.infoValue}>{job.distance}</Text>
                  </View>
                </View>

                {/* Action Button */}
                {job.status === 'accepted' && (
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Arrived at Pickup</Text>
                  </TouchableOpacity>
                )}

                {job.status === 'in_progress' && (
                  <TouchableOpacity style={[styles.actionButton, styles.actionButtonProgress]}>
                    <Ionicons name="flag" size={24} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Complete Delivery</Text>
                  </TouchableOpacity>
                )}

                {job.status === 'completed' && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-done-circle" size={24} color="#4CAF50" />
                    <Text style={styles.completedText}>Job Completed</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}

        {/* Empty state if no jobs */}
        {SAMPLE_JOBS.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No jobs yet</Text>
            <Text style={styles.emptySubtext}>
              Accept jobs to see them here
            </Text>
          </View>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  headerBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  jobHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jobIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobHeaderInfo: {
    flex: 1,
  },
  jobRef: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  jobTime: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  jobHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    letterSpacing: 0.5,
  },
  jobDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationIconWrapper: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
  },
  pickupIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    paddingLeft: 12,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666666',
    fontFamily: 'Poppins',
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  locationPostcode: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 19,
    marginBottom: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'Poppins',
    marginTop: 6,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonProgress: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  completedBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    fontFamily: 'Poppins',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    fontFamily: 'Poppins',
    marginTop: 8,
  },
});
