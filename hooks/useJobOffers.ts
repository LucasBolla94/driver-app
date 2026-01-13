import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import { AppState } from 'react-native';

export interface JobOffer {
  id: string;
  job_id: string;
  driver_uid: string;
  status: 'waiting' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  expires_at: string;
  // Job details
  job?: {
    id: string;
    ref: string;
    collect_address: string;
    collect_postcode: string;
    collect_city: string;
    dropoff_address: string;
    dropoff_postcode: string;
    dropoff_city: string;
    amount: string;
    distance?: string;
    weight?: string;
    notes?: string;
  };
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update offer status to accepted
      const { error: offerError } = await supabase
        .from('job_offers_uk')
        .update({ status: 'accepted' })
        .eq('id', offerId)
        .eq('driver_uid', user.id);

      if (offerError) throw offerError;

      // Assign job to driver (with optimistic locking)
      const { error: jobError } = await supabase
        .from('jobs_uk')
        .update({
          courierid: user.id,
          status: 'assigned',
        })
        .eq('id', jobId)
        .is('courierid', null); // Only update if not already assigned

      if (jobError) throw jobError;

      // Stop vibration
      stopVibration();

      // Clear timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Clear current offer
      setCurrentOffer(null);

      console.log('✅ Job offer accepted successfully');
      return true;
    } catch (error) {
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update offer status to rejected
      const { error } = await supabase
        .from('job_offers_uk')
        .update({ status: 'rejected' })
        .eq('id', offerId)
        .eq('driver_uid', user.id);

      if (error) throw error;

      // Stop vibration
      stopVibration();

      // Clear timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Clear current offer
      setCurrentOffer(null);

      console.log('❌ Job offer rejected');
      return true;
    } catch (error) {
      console.error('Error rejecting offer:', error);
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
      console.log('⏰ Auto-rejecting offer after 45 seconds');
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
    console.log('🔔 New job offer received:', offer.id);
    console.log('🔍 Offer job_id:', offer.job_id);

    // Fetch job details
    console.log('🔍 Fetching job details...');
    const jobDetails = await fetchJobDetails(offer.job_id);

    console.log('🔍 Job details:', jobDetails);

    if (jobDetails) {
      const offerWithJob = {
        ...offer,
        job: jobDetails,
      };

      console.log('✅ Setting current offer:', offerWithJob);
      setCurrentOffer(offerWithJob);

      console.log('🔔 Starting vibration...');
      // Start vibration
      startVibration();

      console.log('⏰ Starting 45-second timer...');
      // Start 45-second timer
      startAutoRejectTimer(offer.id);
    } else {
      console.error('❌ No job details found for job_id:', offer.job_id);
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      console.log('🔍 DEBUG - Starting realtime setup...');

      const { data: { user } } = await supabase.auth.getUser();

      console.log('🔍 DEBUG - User:', user);
      console.log('🔍 DEBUG - User ID:', user?.id);

      if (!user) {
        console.error('❌ No user found - cannot setup realtime');
        return;
      }

      console.log('📡 Setting up realtime subscription for job_offers_uk');
      console.log('🔍 Filter:', `driver_uid=eq.${user.id}`);
      console.log('⏰ Waiting for INSERT events on job_offers_uk...');

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
            console.log('');
            console.log('🚨🚨🚨 REALTIME EVENT DETECTED! 🚨🚨🚨');
            console.log('📨 Realtime INSERT received:', payload);
            console.log('🔍 Payload new:', payload.new);
            const newOffer = payload.new as JobOffer;

            console.log('🔍 Offer status:', newOffer.status);
            console.log('🔍 Offer driver_uid:', newOffer.driver_uid);
            console.log('🔍 Current user.id:', user.id);

            // Only process if status is waiting
            if (newOffer.status === 'waiting') {
              console.log('✅ Status is waiting, processing offer...');
              await handleNewOffer(newOffer);
            } else {
              console.log('⚠️ Status is not waiting:', newOffer.status);
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
            console.log('🔄 Realtime UPDATE received:', payload);
            const updatedOffer = payload.new as JobOffer;

            // If offer was expired by cron, clear it
            if (updatedOffer.status === 'expired' && currentOffer?.id === updatedOffer.id) {
              console.log('⏰ Offer expired by system');
              setCurrentOffer(null);
              stopVibration();
              if (timerRef.current) {
                clearTimeout(timerRef.current);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to job_offers_uk channel!');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Error subscribing to channel');
          } else if (status === 'TIMED_OUT') {
            console.error('⏱️ Subscription timed out');
          } else {
            console.log('📡 Subscription status:', status);
          }
        });

      return () => {
        console.log('🔌 Unsubscribing from job offers channel');
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();

    // Cleanup on unmount
    return () => {
      stopVibration();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentOffer]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App has come to the foreground');
        // Resume vibration if there's a current offer
        if (currentOffer && !vibrationIntervalRef.current) {
          startVibration();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('📱 App has gone to the background');
        // Keep vibration going even in background
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
