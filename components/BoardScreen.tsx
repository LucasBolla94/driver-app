import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface AvailableJob {
  id: string;
  ref: string;
  collect_address: string;
  collect_postcode: string;
  collect_city: string;
  collect_latitude: number;
  collect_longitude: number;
  dropoff_address: string;
  dropoff_postcode: string;
  dropoff_city: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  amount: string;
  status: string;
  created_at: string;
  distance?: string;
  weight?: string;
  packageType?: string;
  notes?: string;
}

const AVAILABLE_JOBS: AvailableJob[] = [
  {
    id: '1',
    ref: 'AVL-2024-101',
    pickupAddress: 'Westfield Shopping Centre',
    pickupPostcode: 'W12 7GF',
    pickupTime: '16:00',
    deliveryAddress: 'Canary Wharf Station',
    deliveryPostcode: 'E14 5AB',
    deliveryTime: '17:30',
    amount: '£22.50',
    distance: '8.5 mi',
    weight: '5 kg',
    packageType: 'Documents',
    customerName: 'John Smith',
    customerPhone: '+44 7700 900123',
    notes: 'Call on arrival',
    postedAt: '2 min ago',
  },
  {
    id: '2',
    ref: 'AVL-2024-102',
    pickupAddress: 'Heathrow Terminal 5',
    pickupPostcode: 'TW6 2GA',
    pickupTime: '14:00',
    deliveryAddress: 'St Pancras International',
    deliveryPostcode: 'N1C 4QP',
    deliveryTime: '15:45',
    amount: '£35.00',
    distance: '19.2 mi',
    weight: '12 kg',
    packageType: 'Luggage',
    customerName: 'Sarah Johnson',
    customerPhone: '+44 7700 900456',
    postedAt: '5 min ago',
  },
  {
    id: '3',
    ref: 'AVL-2024-103',
    pickupAddress: 'Harrods Department Store',
    pickupPostcode: 'SW1X 7XL',
    pickupTime: '12:30',
    deliveryAddress: 'Selfridges Oxford Street',
    deliveryPostcode: 'W1A 1AB',
    deliveryTime: '13:15',
    amount: '£18.75',
    distance: '2.8 mi',
    weight: '3 kg',
    packageType: 'Retail',
    customerName: 'Emma Wilson',
    customerPhone: '+44 7700 900789',
    notes: 'Fragile items - handle with care',
    postedAt: '12 min ago',
  },
  {
    id: '4',
    ref: 'AVL-2024-104',
    pickupAddress: 'Borough Market',
    pickupPostcode: 'SE1 9AL',
    pickupTime: '10:00',
    deliveryAddress: 'Shoreditch High Street',
    deliveryPostcode: 'E1 6JE',
    deliveryTime: '11:00',
    amount: '£15.50',
    distance: '3.5 mi',
    weight: '8 kg',
    packageType: 'Food Delivery',
    customerName: 'Michael Brown',
    customerPhone: '+44 7700 900321',
    postedAt: '18 min ago',
  },
  {
    id: '5',
    ref: 'AVL-2024-105',
    pickupAddress: 'Emirates Stadium',
    pickupPostcode: 'N7 7AJ',
    pickupTime: '18:00',
    deliveryAddress: 'Stamford Bridge',
    deliveryPostcode: 'SW6 1HS',
    deliveryTime: '19:30',
    amount: '£28.00',
    distance: '12.1 mi',
    weight: '6 kg',
    packageType: 'Equipment',
    customerName: 'David Taylor',
    customerPhone: '+44 7700 900654',
    postedAt: '25 min ago',
  },
];

export default function BoardScreen() {
  const [selectedJob, setSelectedJob] = useState<AvailableJob | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = (job: AvailableJob) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
  };

  const handleAcceptJob = () => {
    if (selectedJob) {
      console.log('Accepting job:', selectedJob.ref);
      // Here you would add logic to accept the job
      setShowDetailsModal(false);
      setSelectedJob(null);
      // Show success message or navigate
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Jobs</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{AVAILABLE_JOBS.length} Jobs</Text>
        </View>
      </View>

      {/* Jobs List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {AVAILABLE_JOBS.map((job) => (
          <View
            key={job.id}
            style={styles.jobCard}
          >
            {/* Job Header */}
            <View style={styles.jobHeader}>
              <View style={styles.jobHeaderLeft}>
                <View style={styles.jobIconContainer}>
                  <Ionicons name="cube-outline" size={22} color="#2196F3" />
                </View>
                <View>
                  <Text style={styles.jobRef}>{job.ref}</Text>
                  <Text style={styles.jobPosted}>{job.postedAt}</Text>
                </View>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.amountText}>{job.amount}</Text>
                <View style={styles.pointsBadge}>
                  <Ionicons name="star" size={12} color="#FFB800" />
                  <Text style={styles.pointsText}>
                    {Math.round(parseFloat(job.amount.replace('£', '')) * 1)} pts
                  </Text>
                </View>
              </View>
            </View>

            {/* Route Info */}
            <View style={styles.routeContainer}>
              <View style={styles.routeLeft}>
                {/* Pickup */}
                <View style={styles.locationRow}>
                  <View style={styles.pickupDot} />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationLabel}>PICKUP • {job.pickupTime}</Text>
                    <Text style={styles.locationAddress}>{job.pickupAddress}</Text>
                    <Text style={styles.locationPostcode}>{job.pickupPostcode}</Text>
                  </View>
                </View>

                {/* Connecting Line */}
                <View style={styles.connectingLine} />

                {/* Delivery */}
                <View style={styles.locationRow}>
                  <View style={styles.deliveryDot} />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationLabel}>DELIVERY • {job.deliveryTime}</Text>
                    <Text style={styles.locationAddress}>{job.deliveryAddress}</Text>
                    <Text style={styles.locationPostcode}>{job.deliveryPostcode}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Job Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="navigate-outline" size={16} color="#666666" />
                <Text style={styles.detailText}>{job.distance}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="scale-outline" size={16} color="#666666" />
                <Text style={styles.detailText}>{job.weight}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="cube-outline" size={16} color="#666666" />
                <Text style={styles.detailText}>{job.packageType}</Text>
              </View>
            </View>

            {/* Accept Job Button */}
            <TouchableOpacity
              style={styles.acceptJobButton}
              onPress={() => {
                setSelectedJob(job);
                handleAcceptJob();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.acceptJobText}>Accept Job</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Empty state */}
        {AVAILABLE_JOBS.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="grid-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No jobs available</Text>
            <Text style={styles.emptySubtext}>Check back later for new opportunities</Text>
          </View>
        )}
      </ScrollView>

      {/* Job Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedJob && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Job Details</Text>
                  <TouchableOpacity
                    onPress={() => setShowDetailsModal(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={28} color="#000000" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  {/* Job Reference */}
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Reference</Text>
                    <Text style={styles.refText}>{selectedJob.ref}</Text>
                  </View>

                  {/* Route Details */}
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Route</Text>

                    <View style={styles.modalLocationCard}>
                      <View style={styles.modalLocationHeader}>
                        <Ionicons name="location" size={20} color="#4CAF50" />
                        <Text style={styles.modalLocationLabel}>Pickup Location</Text>
                      </View>
                      <Text style={styles.modalLocationAddress}>{selectedJob.pickupAddress}</Text>
                      <Text style={styles.modalLocationPostcode}>{selectedJob.pickupPostcode}</Text>
                      <Text style={styles.modalLocationTime}>Pickup time: {selectedJob.pickupTime}</Text>
                    </View>

                    <View style={styles.modalLocationCard}>
                      <View style={styles.modalLocationHeader}>
                        <Ionicons name="location" size={20} color="#FF5252" />
                        <Text style={styles.modalLocationLabel}>Delivery Location</Text>
                      </View>
                      <Text style={styles.modalLocationAddress}>{selectedJob.deliveryAddress}</Text>
                      <Text style={styles.modalLocationPostcode}>{selectedJob.deliveryPostcode}</Text>
                      <Text style={styles.modalLocationTime}>Delivery by: {selectedJob.deliveryTime}</Text>
                    </View>
                  </View>

                  {/* Job Info */}
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Job Information</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Distance:</Text>
                      <Text style={styles.infoValue}>{selectedJob.distance}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Weight:</Text>
                      <Text style={styles.infoValue}>{selectedJob.weight}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Package Type:</Text>
                      <Text style={styles.infoValue}>{selectedJob.packageType}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Earnings:</Text>
                      <Text style={styles.infoValueHighlight}>{selectedJob.amount}</Text>
                    </View>
                  </View>

                  {/* Customer Info */}
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Customer</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Name:</Text>
                      <Text style={styles.infoValue}>{selectedJob.customerName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Phone:</Text>
                      <Text style={styles.infoValue}>{selectedJob.customerPhone}</Text>
                    </View>
                  </View>

                  {/* Notes */}
                  {selectedJob.notes && (
                    <View style={styles.modalSection}>
                      <Text style={styles.sectionTitle}>Special Instructions</Text>
                      <View style={styles.notesCard}>
                        <Ionicons name="information-circle-outline" size={20} color="#FF9800" />
                        <Text style={styles.notesText}>{selectedJob.notes}</Text>
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Accept Button */}
                <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptJob}>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.acceptButtonText}>Accept Job - {selectedJob.amount}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#2196F3',
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
    padding: 16,
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
    marginBottom: 16,
  },
  jobHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jobIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobRef: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  jobPosted: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    fontFamily: 'Poppins',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFB800',
    fontFamily: 'Poppins',
  },
  routeContainer: {
    marginBottom: 16,
  },
  routeLeft: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginTop: 4,
    marginRight: 12,
  },
  deliveryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF5252',
    marginTop: 4,
    marginRight: 12,
  },
  connectingLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginLeft: 5,
    marginVertical: 4,
  },
  locationDetails: {
    flex: 1,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  locationPostcode: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  acceptJobButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  acceptJobText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 12,
  },
  refText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2196F3',
    fontFamily: 'Poppins',
  },
  modalLocationCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalLocationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
    fontFamily: 'Poppins',
    letterSpacing: 1,
  },
  modalLocationAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  modalLocationPostcode: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  modalLocationTime: {
    fontSize: 13,
    color: '#2196F3',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  infoValueHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    fontFamily: 'Poppins',
  },
  notesCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
});
