import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import JobDetailScreen from './JobDetailScreen';

type ViewMode = 'all' | 'sequence';

interface Stop {
  id: string;
  type: 'collect' | 'drop';
  address: string;
  postcode: string;
  jobRef: string;
  itemDescription?: string;
  requiresAgeVerification?: boolean;
  collectStatus?: 'pending' | 'arrived' | 'completed';
  dropStatus?: 'pending' | 'arrived' | 'completed';
}

interface Job {
  id: string;
  ref: string;
  collectAddress: string;
  collectPostcode: string;
  dropAddress: string;
  dropPostcode: string;
  collectTime: string; // Expected collection time HH:MM
  amount: string;
  itemDescription: string;
  requiresAgeVerification: boolean;
  collectStatus: 'pending' | 'arrived' | 'completed';
  dropStatus: 'pending' | 'arrived' | 'completed';
}

export default function JobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchActiveJobs();

    // Update time every second for countdown
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchActiveJobs = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('📋 Fetching jobs accepted by driver:', user.id);

      // Fetch jobs where courierid matches the logged-in user and status is 'accepted'
      const { data: jobsData, error } = await supabase
        .from('jobs_uk')
        .select('*')
        .eq('courierid', user.id)
        .eq('status', 'accepted')
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        return;
      }

      console.log('📋 Jobs fetched:', jobsData?.length || 0);

      if (!jobsData || jobsData.length === 0) {
        setJobs([]);
        return;
      }

      // Map jobs_uk data to Job interface
      const mappedJobs: Job[] = jobsData.map((job) => ({
        id: job.id,
        ref: job.job_reference || 'N/A',
        collectAddress: job.collect_address,
        collectPostcode: job.collect_address.split(',').pop()?.trim() || '',
        dropAddress: job.dropoff_address,
        dropPostcode: job.dropoff_address.split(',').pop()?.trim() || '',
        collectTime: job.collect_time || 'ASAP',
        amount: `£${job.driver_price?.toFixed(2) || '0.00'}`,
        itemDescription: job.package_size || 'Package',
        requiresAgeVerification: job.age_restricted || false,
        collectStatus: job.collect_timestamp ? 'completed' : 'pending',
        dropStatus: job.dropoff_timestamp ? 'completed' : 'pending',
      }));

      setJobs(mappedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (collectTime: string): { minutes: number; isLate: boolean; display: string } => {
    const [hours, mins] = collectTime.split(':').map(Number);
    const targetTime = new Date();
    targetTime.setHours(hours, mins, 0, 0);

    const diffMs = targetTime.getTime() - currentTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) {
      const lateMinutes = Math.abs(diffMins);
      return {
        minutes: lateMinutes,
        isLate: true,
        display: `${lateMinutes}m LATE`,
      };
    } else {
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      return {
        minutes: diffMins,
        isLate: false,
        display: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      };
    }
  };

  const getJobProgress = (job: Job): string => {
    if (job.collectStatus === 'completed' && job.dropStatus === 'completed') {
      return 'Completed';
    } else if (job.collectStatus === 'completed') {
      return 'Collection Done - Awaiting Delivery';
    } else if (job.collectStatus === 'arrived') {
      return 'At Collection Point';
    } else if (job.dropStatus === 'arrived') {
      return 'At Drop-off Point';
    } else {
      return 'Ready to Start';
    }
  };

  const handleJobPress = (job: Job) => {
    setSelectedJob(job);
  };

  const handleStopPress = (stop: Stop) => {
    setSelectedStop(stop);
  };

  const handleCloseDetail = () => {
    setSelectedStop(null);
    setSelectedJob(null);
    fetchActiveJobs();
  };

  const getStopsInSequence = (): Stop[] => {
    const stops: Stop[] = [];

    jobs.forEach((job) => {
      stops.push({
        id: `${job.id}-collect`,
        type: 'collect',
        address: job.collectAddress,
        postcode: job.collectPostcode,
        jobRef: job.ref,
        itemDescription: job.itemDescription,
        collectStatus: job.collectStatus,
      });

      stops.push({
        id: `${job.id}-drop`,
        type: 'drop',
        address: job.dropAddress,
        postcode: job.dropPostcode,
        jobRef: job.ref,
        itemDescription: job.itemDescription,
        requiresAgeVerification: job.requiresAgeVerification,
        dropStatus: job.dropStatus,
      });
    });

    return stops;
  };

  const isStopCompleted = (stop: Stop): boolean => {
    if (stop.type === 'collect') {
      return stop.collectStatus === 'completed';
    } else {
      return stop.dropStatus === 'completed';
    }
  };

  const isStopActive = (stop: Stop): boolean => {
    if (stop.type === 'collect') {
      return stop.collectStatus === 'arrived';
    } else {
      return stop.dropStatus === 'arrived';
    }
  };

  const canStartStop = (index: number): boolean => {
    if (index === 0) return true;
    const stops = getStopsInSequence();
    const previousStop = stops[index - 1];
    return isStopCompleted(previousStop);
  };

  if (selectedStop) {
    return <JobDetailScreen stop={selectedStop} onBack={handleCloseDetail} />;
  }

  if (selectedJob) {
    // Find the current step for this job
    const currentStop: Stop = selectedJob.collectStatus === 'completed'
      ? {
          id: `${selectedJob.id}-drop`,
          type: 'drop',
          address: selectedJob.dropAddress,
          postcode: selectedJob.dropPostcode,
          jobRef: selectedJob.ref,
          itemDescription: selectedJob.itemDescription,
          requiresAgeVerification: selectedJob.requiresAgeVerification,
          dropStatus: selectedJob.dropStatus,
        }
      : {
          id: `${selectedJob.id}-collect`,
          type: 'collect',
          address: selectedJob.collectAddress,
          postcode: selectedJob.collectPostcode,
          jobRef: selectedJob.ref,
          itemDescription: selectedJob.itemDescription,
          collectStatus: selectedJob.collectStatus,
        };

    return <JobDetailScreen stop={currentStop} onBack={handleCloseDetail} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            {jobs.length} Active
          </Text>
        </View>
      </View>

      {/* View Mode Selector */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'all' && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode('all')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="grid-outline"
            size={20}
            color={viewMode === 'all' ? '#FFFFFF' : '#666666'}
          />
          <Text
            style={[
              styles.viewModeText,
              viewMode === 'all' && styles.viewModeTextActive,
            ]}
          >
            All Jobs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'sequence' && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode('sequence')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="list-outline"
            size={20}
            color={viewMode === 'sequence' ? '#FFFFFF' : '#666666'}
          />
          <Text
            style={[
              styles.viewModeText,
              viewMode === 'sequence' && styles.viewModeTextActive,
            ]}
          >
            Sequence
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        ) : jobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No active jobs</Text>
            <Text style={styles.emptySubtext}>
              Accept jobs to see them here
            </Text>
          </View>
        ) : viewMode === 'all' ? (
          // ALL JOBS VIEW
          jobs.map((job) => {
            const timeInfo = calculateTimeRemaining(job.collectTime);
            const progress = getJobProgress(job);

            return (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => handleJobPress(job)}
                activeOpacity={0.7}
              >
                {/* Job Header */}
                <View style={styles.jobHeader}>
                  <View style={styles.jobRefContainer}>
                    <Ionicons name="briefcase" size={20} color="#000000" />
                    <Text style={styles.jobRef}>{job.ref}</Text>
                  </View>
                  <Text style={styles.jobAmount}>{job.amount}</Text>
                </View>

                {/* Collect Info */}
                <View style={styles.locationRow}>
                  <View style={styles.locationIcon}>
                    <Ionicons name="arrow-up-circle" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationLabel}>COLLECT</Text>
                    <Text style={styles.locationAddress}>{job.collectAddress}</Text>
                    <Text style={styles.locationPostcode}>{job.collectPostcode}</Text>
                  </View>
                </View>

                {/* Separator */}
                <View style={styles.locationDivider} />

                {/* Drop Info */}
                <View style={styles.locationRow}>
                  <View style={styles.locationIcon}>
                    <Ionicons name="arrow-down-circle" size={20} color="#FF5252" />
                  </View>
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationLabel}>DROP OFF</Text>
                    <Text style={styles.locationAddress}>{job.dropAddress}</Text>
                    <Text style={styles.locationPostcode}>{job.dropPostcode}</Text>
                  </View>
                </View>

                {/* Time Info */}
                <View style={styles.timeContainer}>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={18} color="#666666" />
                    <Text style={styles.timeLabel}>Collect at {job.collectTime}</Text>
                  </View>
                  <View
                    style={[
                      styles.countdownBadge,
                      timeInfo.isLate && styles.countdownBadgeLate,
                    ]}
                  >
                    <Ionicons
                      name={timeInfo.isLate ? 'warning' : 'timer-outline'}
                      size={16}
                      color={timeInfo.isLate ? '#FFFFFF' : '#FF9800'}
                    />
                    <Text
                      style={[
                        styles.countdownText,
                        timeInfo.isLate && styles.countdownTextLate,
                      ]}
                    >
                      {timeInfo.display}
                    </Text>
                  </View>
                </View>

                {/* Progress Badge */}
                <View style={styles.progressBadge}>
                  <Ionicons
                    name={
                      job.collectStatus === 'completed' && job.dropStatus === 'completed'
                        ? 'checkmark-circle'
                        : 'radio-button-on'
                    }
                    size={16}
                    color={
                      job.collectStatus === 'completed' && job.dropStatus === 'completed'
                        ? '#4CAF50'
                        : '#FF9800'
                    }
                  />
                  <Text style={styles.progressText}>{progress}</Text>
                </View>

                {/* Age Verification Badge */}
                {job.requiresAgeVerification && (
                  <View style={styles.ageWarning}>
                    <Ionicons name="shield-checkmark" size={14} color="#FF9800" />
                    <Text style={styles.ageWarningText}>Age Verification Required</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          // SEQUENCE VIEW
          getStopsInSequence().map((stop, index) => {
            const isCompleted = isStopCompleted(stop);
            const isActive = isStopActive(stop);
            const canStart = canStartStop(index);
            const isDisabled = !canStart && !isCompleted && !isActive;

            return (
              <TouchableOpacity
                key={stop.id}
                style={[
                  styles.stopCard,
                  isCompleted && styles.stopCardCompleted,
                  isActive && styles.stopCardActive,
                  isDisabled && styles.stopCardDisabled,
                ]}
                onPress={() => !isDisabled && handleStopPress(stop)}
                activeOpacity={isDisabled ? 1 : 0.7}
                disabled={isDisabled}
              >
                <View style={styles.stopNumberContainer}>
                  <View
                    style={[
                      styles.stopNumber,
                      isCompleted && styles.stopNumberCompleted,
                      isActive && styles.stopNumberActive,
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.stopNumberText,
                          isActive && styles.stopNumberTextActive,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  {index < getStopsInSequence().length - 1 && (
                    <View style={styles.stopConnector} />
                  )}
                </View>

                <View style={styles.stopInfo}>
                  <View style={styles.stopHeader}>
                    <View
                      style={[
                        styles.stopTypeBadge,
                        stop.type === 'collect'
                          ? styles.stopTypeBadgeCollect
                          : styles.stopTypeBadgeDrop,
                      ]}
                    >
                      <Ionicons
                        name={stop.type === 'collect' ? 'arrow-up' : 'arrow-down'}
                        size={14}
                        color="#FFFFFF"
                      />
                      <Text style={styles.stopTypeBadgeText}>
                        {stop.type === 'collect' ? 'COLLECT' : 'DROP OFF'}
                      </Text>
                    </View>
                    <Text style={styles.stopJobRef}>{stop.jobRef}</Text>
                  </View>

                  <Text style={styles.stopAddress}>{stop.address}</Text>
                  <Text style={styles.stopPostcode}>{stop.postcode}</Text>

                  {stop.itemDescription && (
                    <View style={styles.stopItemInfo}>
                      <Ionicons name="cube-outline" size={14} color="#666666" />
                      <Text style={styles.stopItemText}>{stop.itemDescription}</Text>
                    </View>
                  )}

                  {stop.requiresAgeVerification && (
                    <View style={styles.ageVerificationBadge}>
                      <Ionicons name="shield-checkmark" size={14} color="#FF9800" />
                      <Text style={styles.ageVerificationText}>
                        Age Verification Required
                      </Text>
                    </View>
                  )}

                  {isCompleted && (
                    <View style={styles.statusCompleted}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.statusCompletedText}>Completed</Text>
                    </View>
                  )}

                  {isActive && (
                    <View style={styles.statusActive}>
                      <Ionicons name="radio-button-on" size={16} color="#FF9800" />
                      <Text style={styles.statusActiveText}>In Progress</Text>
                    </View>
                  )}

                  {isDisabled && (
                    <View style={styles.statusLocked}>
                      <Ionicons name="lock-closed" size={14} color="#999999" />
                      <Text style={styles.statusLockedText}>
                        Complete previous stop first
                      </Text>
                    </View>
                  )}
                </View>

                {!isDisabled && (
                  <Ionicons name="chevron-forward" size={24} color="#999999" />
                )}
              </TouchableOpacity>
            );
          })
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
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  viewModeButtonActive: {
    backgroundColor: '#000000',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
  },
  viewModeTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120, // Extra padding for bottom navigation
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
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
  // ALL JOBS VIEW STYLES
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  jobRefContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobRef: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  jobAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    fontFamily: 'Poppins',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  locationIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
  locationDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  countdownBadgeLate: {
    backgroundColor: '#FF5252',
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF9800',
    fontFamily: 'Poppins',
  },
  countdownTextLate: {
    color: '#FFFFFF',
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
  },
  ageWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  ageWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
    fontFamily: 'Poppins',
  },
  // SEQUENCE VIEW STYLES
  stopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 16,
    gap: 16,
  },
  stopCardCompleted: {
    opacity: 0.7,
  },
  stopCardActive: {
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  stopCardDisabled: {
    opacity: 0.5,
  },
  stopNumberContainer: {
    alignItems: 'center',
  },
  stopNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopNumberCompleted: {
    backgroundColor: '#4CAF50',
  },
  stopNumberActive: {
    backgroundColor: '#FF9800',
  },
  stopNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666666',
    fontFamily: 'Poppins',
  },
  stopNumberTextActive: {
    color: '#FFFFFF',
  },
  stopConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 8,
    minHeight: 20,
  },
  stopInfo: {
    flex: 1,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stopTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  stopTypeBadgeCollect: {
    backgroundColor: '#4CAF50',
  },
  stopTypeBadgeDrop: {
    backgroundColor: '#FF5252',
  },
  stopTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    letterSpacing: 0.5,
  },
  stopJobRef: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
  },
  stopAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  stopPostcode: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  stopItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  stopItemText: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  ageVerificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  ageVerificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
    fontFamily: 'Poppins',
  },
  statusCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  statusCompletedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
    fontFamily: 'Poppins',
  },
  statusActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  statusActiveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9800',
    fontFamily: 'Poppins',
  },
  statusLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  statusLockedText: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
});
