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

export default function BoardScreen() {
  const [jobs, setJobs] = useState<AvailableJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<AvailableJob | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('id, ref, collect_address, collect_postcode, collect_city, collect_latitude, collect_longitude, dropoff_address, dropoff_postcode, dropoff_city, dropoff_latitude, dropoff_longitude, amount, status, created_at, distance, weight, notes')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        throw error;
      }

      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    // Set up polling to check for new jobs or status changes every 10 seconds
    const interval = setInterval(() => {
      fetchJobs();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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
          <Text style={styles.headerBadgeText}>{jobs.length} Jobs</Text>
        </View>
      </View>

      {/* Jobs List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Loading jobs...</Text>
          </View>
        ) : (
          <>
            {jobs.map((job) => (
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
                  <Text style={styles.jobPosted}>
                    {new Date(job.created_at).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
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
                {/* Collect */}
                <View style={styles.locationRow}>
                  <View style={styles.pickupDot} />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationLabel}>COLLECT</Text>
                    <Text style={styles.locationAddress}>{job.collect_address}</Text>
                    <Text style={styles.locationPostcode}>{job.collect_city} {job.collect_postcode}</Text>
                  </View>
                </View>

                {/* Connecting Line */}
                <View style={styles.connectingLine} />

                {/* Drop-off */}
                <View style={styles.locationRow}>
                  <View style={styles.deliveryDot} />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationLabel}>DROP-OFF</Text>
                    <Text style={styles.locationAddress}>{job.dropoff_address}</Text>
                    <Text style={styles.locationPostcode}>{job.dropoff_city} {job.dropoff_postcode}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Job Details Grid */}
            <View style={styles.detailsGrid}>
              {job.distance && (
                <View style={styles.detailItem}>
                  <Ionicons name="navigate-outline" size={16} color="#666666" />
                  <Text style={styles.detailText}>{job.distance}</Text>
                </View>
              )}
              {job.weight && (
                <View style={styles.detailItem}>
                  <Ionicons name="scale-outline" size={16} color="#666666" />
                  <Text style={styles.detailText}>{job.weight}</Text>
                </View>
              )}
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
            {jobs.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="grid-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyText}>No jobs available</Text>
                <Text style={styles.emptySubtext}>Check back later for new opportunities</Text>
              </View>
            )}
          </>
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
                        <Text style={styles.modalLocationLabel}>Collect Location</Text>
                      </View>
                      <Text style={styles.modalLocationAddress}>{selectedJob.collect_address}</Text>
                      <Text style={styles.modalLocationPostcode}>{selectedJob.collect_city} {selectedJob.collect_postcode}</Text>
                    </View>

                    <View style={styles.modalLocationCard}>
                      <View style={styles.modalLocationHeader}>
                        <Ionicons name="location" size={20} color="#FF5252" />
                        <Text style={styles.modalLocationLabel}>Drop-off Location</Text>
                      </View>
                      <Text style={styles.modalLocationAddress}>{selectedJob.dropoff_address}</Text>
                      <Text style={styles.modalLocationPostcode}>{selectedJob.dropoff_city} {selectedJob.dropoff_postcode}</Text>
                    </View>
                  </View>

                  {/* Job Info */}
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Job Information</Text>
                    {selectedJob.distance && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Distance:</Text>
                        <Text style={styles.infoValue}>{selectedJob.distance}</Text>
                      </View>
                    )}
                    {selectedJob.weight && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Weight:</Text>
                        <Text style={styles.infoValue}>{selectedJob.weight}</Text>
                      </View>
                    )}
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Earnings:</Text>
                      <Text style={styles.infoValueHighlight}>{selectedJob.amount}</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
    marginTop: 16,
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
