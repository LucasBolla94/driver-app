import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import { AppState } from 'react-native';

export interface JobOffer {
  id: string;
  job_id: string;
  driver_uid: string;
  status: 'waiting' | 'accepted' | 'reject' | 'pending' | 'expired';
  created_at: string;
  expires_at: string;
  // Job details (already included in job_offers_uk)
  collect_address: string;
  collect_latitude?: number;
  collect_longitude?: number;
  collect_date_after?: string;
  collect_time_after?: string;
  dropoff_address: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  dropoff_date_before?: string;
  dropoff_time_before?: string;
  price_driver: number;
  distance?: string;
}

export function useJobOffers() {
  const [currentOffer, setCurrentOffer] = useState<JobOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  // Vibrate phone with pattern
  const startVibration = () => {
    // Initial strong vibration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Continue vibrating every 2 seconds
    vibrationIntervalRef.current = setInterval(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, 2000);
  };

  const stopVibration = () => {
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
  };

  // Accept job offer
  const acceptOffer = async (offerId: string, jobId: string) => {
    try {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: offerData, error: offerError } = await supabase
        .from('job_offers_uk')
        .update({ status: 'accepted' })
        .eq('id', offerId)
        .eq('driver_uid', user.id)
        .select();

      if (offerError) {
        console.error('Error updating offer status:', offerError);
        throw offerError;
      }

      const { data: jobData, error: jobError } = await supabase
        .from('jobs_uk')
        .update({
          courierid: user.id,
          status: 'accepted',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .is('courierid', null)
        .select();

      if (jobError) {
        console.error('Error assigning job:', jobError);
        throw jobError;
      }

      try {
        stopVibration();
      } catch (e) {
        // Ignore
      }

      try {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } catch (e) {
        // Ignore
      }

      setCurrentOffer(null);

      console.log('✅ Job offer accepted successfully');
      return true;

    } catch (error: any) {
      console.error('❌ Error accepting offer:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reject job offer
  const rejectOffer = async (offerId: string) => {
    try {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: offerData, error: offerError } = await supabase
        .from('job_offers_uk')
        .update({ status: 'reject' })
        .eq('id', offerId)
        .eq('driver_uid', user.id)
        .select();

      if (offerError) {
        console.error('Error updating offer status:', offerError);
        throw offerError;
      }

      try {
        stopVibration();
      } catch (e) {
        // Ignore
      }

      try {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } catch (e) {
        // Ignore
      }

      setCurrentOffer(null);

      console.log('❌ Job offer rejected');
      return true;

    } catch (error: any) {
      console.error('❌ Error rejecting offer:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Auto-reject after 45 seconds
  const startAutoRejectTimer = (offerId: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      await rejectOffer(offerId);
    }, 45000); // 45 seconds
  };

  // Fetch job details for offer
  const fetchJobDetails = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('jobs_uk')
        .select('id, ref, collect_address, collect_postcode, collect_city, dropoff_address, dropoff_postcode, dropoff_city, amount, distance, weight, notes')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching job details:', error);
      return null;
    }
  };

  // Handle new job offer
  const handleNewOffer = async (offer: JobOffer) => {
    setCurrentOffer(offer);
    startVibration();
    startAutoRejectTimer(offer.id);
  };

  // Check for existing waiting offers
  const checkForExistingOffers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingOffers, error } = await supabase
        .from('job_offers_uk')
        .select('*')
        .eq('driver_uid', user.id)
        .eq('status', 'waiting')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking existing offers:', error);
        return;
      }

      if (existingOffers && existingOffers.length > 0) {
        const offer = existingOffers[0] as JobOffer;
        await handleNewOffer(offer);
      }
    } catch (error) {
      console.error('Error checking existing offers:', error);
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('No user found - cannot setup realtime');
        return;
      }

      // Check for existing offers on load
      await checkForExistingOffers();

      // Subscribe to job_offers_uk for this driver
      const channel = supabase
        .channel('job-offers-uk-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'job_offers_uk',
            filter: `driver_uid=eq.${user.id}`,
          },
          async (payload) => {
            const newOffer = payload.new as JobOffer;

            // Only process if status is waiting
            if (newOffer.status === 'waiting') {
              await handleNewOffer(newOffer);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'job_offers_uk',
            filter: `driver_uid=eq.${user.id}`,
          },
          (payload) => {
            const updatedOffer = payload.new as JobOffer;

            // If offer was expired by cron, clear it
            if (updatedOffer.status === 'expired' && currentOffer?.id === updatedOffer.id) {
              setCurrentOffer(null);
              stopVibration();
              if (timerRef.current) {
                clearTimeout(timerRef.current);
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to channel');
          } else if (status === 'TIMED_OUT') {
            console.error('Subscription timed out');
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();

    // Setup 30-second polling for new offers
    const pollingInterval = setInterval(() => {
      checkForExistingOffers();
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      stopVibration();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      clearInterval(pollingInterval);
    };
  }, [currentOffer]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Resume vibration if there's a current offer
        if (currentOffer && !vibrationIntervalRef.current) {
          startVibration();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [currentOffer]);

  return {
    currentOffer,
    loading,
    acceptOffer,
    rejectOffer,
  };
}
