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

interface Job {
  id: string;
  pickupAddress: string;
  deliveryAddress: string;
  amount: string;
  distance: string;
  date: string;
  time: string;
  status: 'completed' | 'cancelled';
}

interface JobHistoryScreenProps {
  onBack?: () => void;
}

export default function JobHistoryScreen({ onBack }: JobHistoryScreenProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));

  // Get Monday of the week
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  // Get Sunday of the week
  function getWeekEnd(weekStart: Date): Date {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }

  // Format date as "Jan 15"
  function formatShortDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  // Check if week is current week
  function isCurrentWeek(weekStart: Date): boolean {
    const today = new Date();
    const currentWeek = getWeekStart(today);
    return weekStart.getTime() === currentWeek.getTime();
  }

  useEffect(() => {
    fetchJobs();
  }, [currentWeekStart]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekEnd = getWeekEnd(currentWeekStart);

      // TODO: Fetch from Supabase jobs table
      // For now, using mock data
      const mockJobs: Job[] = [
        {
          id: '1',
          pickupAddress: '221B Baker Street, NW1 6XE',
          deliveryAddress: '10 Downing Street, SW1A 2AA',
          amount: '£12.50',
          distance: '3.2 mi',
          date: 'Mon, Jan 1',
          time: '14:30',
          status: 'completed',
        },
        {
          id: '2',
          pickupAddress: 'Kings Cross Station, N1 9AP',
          deliveryAddress: 'Oxford Street, W1D 1BS',
          amount: '£18.75',
          distance: '5.1 mi',
          date: 'Mon, Jan 1',
          time: '16:45',
          status: 'completed',
        },
        {
          id: '3',
          pickupAddress: 'Covent Garden, WC2E 8RF',
          deliveryAddress: 'Tower Bridge, SE1 2UP',
          amount: '£22.00',
          distance: '4.8 mi',
          date: 'Tue, Jan 2',
          time: '10:15',
          status: 'completed',
        },
        {
          id: '4',
          pickupAddress: 'Camden Market, NW1 8AH',
          deliveryAddress: 'Liverpool Street, EC2M 7QN',
          amount: '£15.30',
          distance: '6.2 mi',
          date: 'Wed, Jan 3',
          time: '13:20',
          status: 'cancelled',
        },
        {
          id: '5',
          pickupAddress: 'Shoreditch High St, E1 6JE',
          deliveryAddress: 'Canary Wharf, E14 5AB',
          amount: '£25.50',
          distance: '3.9 mi',
          date: 'Thu, Jan 4',
          time: '09:30',
          status: 'completed',
        },
      ];

      setJobs(mockJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);

    // Don't go beyond current week
    if (!isCurrentWeek(newWeekStart) && newWeekStart > new Date()) {
      return;
    }

    setCurrentWeekStart(newWeekStart);
  };

  const toggleJobExpand = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const weekEnd = getWeekEnd(currentWeekStart);
  const totalEarnings = jobs
    .filter(job => job.status === 'completed')
    .reduce((sum, job) => sum + parseFloat(job.amount.replace('£', '')), 0);
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const cancelledJobs = jobs.filter(job => job.status === 'cancelled').length;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Job History</Text>
      </View>

      {/* Week Navigation */}
      <View style={styles.weekNavigation}>
        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={handlePreviousWeek}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>

        <View style={styles.weekInfo}>
          <Text style={styles.weekText}>
            {formatShortDate(currentWeekStart)} - {formatShortDate(weekEnd)}
          </Text>
          {isCurrentWeek(currentWeekStart) && (
            <View style={styles.currentWeekBadge}>
              <Text style={styles.currentWeekText}>Current Week</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.weekNavButton,
            isCurrentWeek(currentWeekStart) && styles.weekNavButtonDisabled,
          ]}
          onPress={handleNextWeek}
          disabled={isCurrentWeek(currentWeekStart)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={isCurrentWeek(currentWeekStart) ? '#CCCCCC' : '#000000'}
          />
        </TouchableOpacity>
      </View>

      {/* Week Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="cash-outline" size={32} color="#4CAF50" />
          <Text style={styles.summaryValue}>£{totalEarnings.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCard}>
          <Ionicons name="checkmark-circle-outline" size={32} color="#2196F3" />
          <Text style={styles.summaryValue}>{completedJobs}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCard}>
          <Ionicons name="close-circle-outline" size={32} color="#FF5252" />
          <Text style={styles.summaryValue}>{cancelledJobs}</Text>
          <Text style={styles.summaryLabel}>Cancelled</Text>
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
            <ActivityIndicator size="large" color="#000000" />
          </View>
        ) : jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No jobs this week</Text>
            <Text style={styles.emptySubtext}>Jobs will appear here when you complete them</Text>
          </View>
        ) : (
          <View style={styles.jobsList}>
            {jobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => toggleJobExpand(job.id)}
                activeOpacity={0.7}
              >
                {/* Job Header */}
                <View style={styles.jobHeader}>
                  <View style={styles.jobHeaderLeft}>
                    <View
                      style={[
                        styles.statusIndicator,
                        job.status === 'completed'
                          ? styles.statusCompleted
                          : styles.statusCancelled,
                      ]}
                    />
                    <View style={styles.jobHeaderInfo}>
                      <Text style={styles.jobDate}>{job.date}</Text>
                      <Text style={styles.jobTime}>{job.time}</Text>
                    </View>
                  </View>
                  <View style={styles.jobHeaderRight}>
                    <Text style={styles.jobAmount}>{job.amount}</Text>
                    <Ionicons
                      name={expandedJobId === job.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#666666"
                    />
                  </View>
                </View>

                {/* Job Details (Expanded) */}
                {expandedJobId === job.id && (
                  <View style={styles.jobDetails}>
                    <View style={styles.divider} />

                    {/* Pickup */}
                    <View style={styles.addressRow}>
                      <View style={styles.addressIconContainer}>
                        <Ionicons name="location" size={20} color="#2196F3" />
                      </View>
                      <View style={styles.addressInfo}>
                        <Text style={styles.addressLabel}>Pickup</Text>
                        <Text style={styles.addressText}>{job.pickupAddress}</Text>
                      </View>
                    </View>

                    {/* Delivery */}
                    <View style={styles.addressRow}>
                      <View style={styles.addressIconContainer}>
                        <Ionicons name="flag" size={20} color="#4CAF50" />
                      </View>
                      <View style={styles.addressInfo}>
                        <Text style={styles.addressLabel}>Delivery</Text>
                        <Text style={styles.addressText}>{job.deliveryAddress}</Text>
                      </View>
                    </View>

                    {/* Distance & Status */}
                    <View style={styles.jobFooter}>
                      <View style={styles.distanceContainer}>
                        <Ionicons name="navigate-outline" size={16} color="#666666" />
                        <Text style={styles.distanceText}>{job.distance}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          job.status === 'completed'
                            ? styles.statusBadgeCompleted
                            : styles.statusBadgeCancelled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            job.status === 'completed'
                              ? styles.statusBadgeTextCompleted
                              : styles.statusBadgeTextCancelled,
                          ]}
                        >
                          {job.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
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
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  weekNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekNavButtonDisabled: {
    opacity: 0.4,
  },
  weekInfo: {
    alignItems: 'center',
    gap: 6,
  },
  weekText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  currentWeekBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
  },
  currentWeekText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2196F3',
    fontFamily: 'Poppins',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Poppins',
    textAlign: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999999',
    fontFamily: 'Poppins',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Poppins',
    marginTop: 8,
    textAlign: 'center',
  },
  jobsList: {
    gap: 12,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusCancelled: {
    backgroundColor: '#FF5252',
  },
  jobHeaderInfo: {
    gap: 2,
  },
  jobDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  jobTime: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  jobHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  jobDetails: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  addressIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInfo: {
    flex: 1,
    gap: 4,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceText: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeCancelled: {
    backgroundColor: '#FFEBEE',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  statusBadgeTextCompleted: {
    color: '#4CAF50',
  },
  statusBadgeTextCancelled: {
    color: '#FF5252',
  },
});
