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

type PeriodType = 'day' | 'week' | 'month' | 'year';

interface EarningsScreenProps {
  onBack?: () => void;
}

interface EarningsData {
  day: number;
  week: number;
  month: number;
  year: number;
}

export default function EarningsScreen({ onBack }: EarningsScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('week');
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData>({
    day: 0,
    week: 0,
    month: 0,
    year: 0,
  });

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // TODO: Fetch from Supabase earnings table
      // For now, using mock data
      setEarnings({
        day: 145.50,
        week: 892.75,
        month: 3650.25,
        year: 42580.00,
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (period: PeriodType): string => {
    switch (period) {
      case 'day':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
    }
  };

  const getPeriodAmount = (period: PeriodType): number => {
    return earnings[period];
  };

  const formatCurrency = (amount: number): string => {
    return `£${amount.toFixed(2)}`;
  };

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
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        ) : (
          <>
            {/* Period Selector */}
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'day' && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod('day')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === 'day' && styles.periodButtonTextActive,
                  ]}
                >
                  Day
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'week' && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod('week')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === 'week' && styles.periodButtonTextActive,
                  ]}
                >
                  Week
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'month' && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod('month')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === 'month' && styles.periodButtonTextActive,
                  ]}
                >
                  Month
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'year' && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod('year')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === 'year' && styles.periodButtonTextActive,
                  ]}
                >
                  Year
                </Text>
              </TouchableOpacity>
            </View>

            {/* Main Earnings Display */}
            <View style={styles.earningsCard}>
              <Text style={styles.periodLabel}>{getPeriodLabel(selectedPeriod)}</Text>
              <Text style={styles.earningsAmount}>
                {formatCurrency(getPeriodAmount(selectedPeriod))}
              </Text>
              <View style={styles.earningsIconContainer}>
                <Ionicons name="trending-up" size={48} color="#4CAF50" />
              </View>
            </View>

            {/* Earnings Breakdown */}
            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownTitle}>All Time Earnings</Text>

              <View style={styles.breakdownCard}>
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownItemLeft}>
                    <View style={[styles.breakdownIcon, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="calendar-outline" size={20} color="#2196F3" />
                    </View>
                    <Text style={styles.breakdownItemLabel}>Today</Text>
                  </View>
                  <Text style={styles.breakdownItemValue}>
                    {formatCurrency(earnings.day)}
                  </Text>
                </View>

                <View style={styles.breakdownDivider} />

                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownItemLeft}>
                    <View style={[styles.breakdownIcon, { backgroundColor: '#F3E5F5' }]}>
                      <Ionicons name="calendar-outline" size={20} color="#9C27B0" />
                    </View>
                    <Text style={styles.breakdownItemLabel}>This Week</Text>
                  </View>
                  <Text style={styles.breakdownItemValue}>
                    {formatCurrency(earnings.week)}
                  </Text>
                </View>

                <View style={styles.breakdownDivider} />

                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownItemLeft}>
                    <View style={[styles.breakdownIcon, { backgroundColor: '#FFF3E0' }]}>
                      <Ionicons name="calendar-outline" size={20} color="#FF9800" />
                    </View>
                    <Text style={styles.breakdownItemLabel}>This Month</Text>
                  </View>
                  <Text style={styles.breakdownItemValue}>
                    {formatCurrency(earnings.month)}
                  </Text>
                </View>

                <View style={styles.breakdownDivider} />

                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownItemLeft}>
                    <View style={[styles.breakdownIcon, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
                    </View>
                    <Text style={styles.breakdownItemLabel}>This Year</Text>
                  </View>
                  <Text style={styles.breakdownItemValue}>
                    {formatCurrency(earnings.year)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Download Invoice Button (Disabled) */}
            <TouchableOpacity
              style={[styles.downloadButton, styles.downloadButtonDisabled]}
              disabled={true}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={24} color="#999999" />
              <Text style={styles.downloadButtonText}>Download Invoice (Coming Soon)</Text>
            </TouchableOpacity>
          </>
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#000000',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  earningsCard: {
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
    position: 'relative',
    overflow: 'hidden',
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 16,
  },
  earningsIconContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.1,
  },
  breakdownContainer: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  breakdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  breakdownItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 0,
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999999',
    fontFamily: 'Poppins',
  },
});
