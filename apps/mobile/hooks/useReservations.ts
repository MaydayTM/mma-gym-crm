import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface Reservation {
  id: string;
  class_id: string;
  member_id: string;
  status: 'reserved' | 'checked_in' | 'cancelled' | 'no_show';
  created_at: string;
  checked_in_at: string | null;
}

export function useReservations() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Get user's reservations for a class
  const getMyReservation = async (classId: string): Promise<Reservation | null> => {
    if (!profile?.id) return null;

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('class_id', classId)
      .eq('member_id', profile.id)
      .neq('status', 'cancelled')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching reservation:', error);
    }

    return data as Reservation | null;
  };

  // Make a reservation
  const makeReservation = async (classId: string): Promise<{ success: boolean; error?: string }> => {
    if (!profile?.id) {
      return { success: false, error: 'Je moet ingelogd zijn om te reserveren' };
    }

    setIsLoading(true);

    try {
      // Check if already reserved
      const existing = await getMyReservation(classId);
      if (existing) {
        return { success: false, error: 'Je hebt al een reservering voor deze les' };
      }

      const { error } = await supabase
        .from('reservations')
        .insert({
          class_id: classId,
          member_id: profile.id,
          status: 'reserved',
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error making reservation:', error);
      return { success: false, error: error.message || 'Kon niet reserveren' };
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a reservation
  const cancelReservation = async (classId: string): Promise<{ success: boolean; error?: string }> => {
    if (!profile?.id) {
      return { success: false, error: 'Je moet ingelogd zijn' };
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('class_id', classId)
        .eq('member_id', profile.id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling reservation:', error);
      return { success: false, error: error.message || 'Kon niet annuleren' };
    } finally {
      setIsLoading(false);
    }
  };

  // Get all user's upcoming reservations
  const getMyUpcomingReservations = async () => {
    if (!profile?.id) return [];

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        class:classes(
          id,
          name,
          start_time,
          end_time,
          discipline:disciplines(name, abbreviation),
          coach:members!classes_coach_id_fkey(first_name, last_name)
        )
      `)
      .eq('member_id', profile.id)
      .eq('status', 'reserved')
      .gte('class.start_time', new Date().toISOString())
      .order('class(start_time)', { ascending: true });

    if (error) {
      console.error('Error fetching reservations:', error);
      return [];
    }

    return data || [];
  };

  return {
    isLoading,
    makeReservation,
    cancelReservation,
    getMyReservation,
    getMyUpcomingReservations,
  };
}
