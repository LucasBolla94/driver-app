import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

export interface DriverData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profile_url?: string | null;
  points: number;
}

export function useDriverData() {
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: driverInfo, error: fetchError } = await supabase
        .from('drivers')
        .select('*')
        .eq('userId', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching driver data:', fetchError);
        setError('Failed to load driver data');
        setLoading(false);
        return;
      }

      setDriverData({
        userId: user.id,
        firstName: driverInfo?.firstName || 'Driver',
        lastName: driverInfo?.lastName || '',
        email: user.email || '',
        phone: driverInfo?.phone || '',
        profile_url: driverInfo?.profile_url,
        points: driverInfo?.points || 0,
      });

      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  const refresh = () => {
    fetchDriverData();
  };

  return { driverData, loading, error, refresh };
}
