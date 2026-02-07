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

  // Check if member's subscription covers a class's discipline
  const checkDisciplineAccess = async (classId: string): Promise<{ allowed: boolean; reason?: string }> => {
    if (!profile?.id) return { allowed: false, reason: 'Niet ingelogd' };

    // Get class discipline
    const { data: cls } = await supabase
      .from('classes')
      .select('discipline_id, disciplines:discipline_id (name)')
      .eq('id', classId)
      .single();

    if (!cls?.discipline_id) return { allowed: true };

    // Get member's active subscription
    const today = new Date().toISOString().split('T')[0];
    const { data: subscription } = await supabase
      .from('member_subscriptions')
      .select('plan_type_id, selected_discipline_id')
      .eq('member_id', profile.id)
      .eq('status', 'active')
      .gte('end_date', today)
      .order('end_date', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) return { allowed: false, reason: 'Geen actief abonnement' };

    // Direct discipline match (Basic plan)
    if (subscription.selected_discipline_id) {
      if (subscription.selected_discipline_id === cls.discipline_id) return { allowed: true };
      const name = (cls.disciplines as any)?.name || 'deze discipline';
      return { allowed: false, reason: `Je abonnement geeft geen toegang tot ${name}` };
    }

    // Check plan_type_disciplines
    if (subscription.plan_type_id) {
      const { data: link } = await supabase
        .from('plan_type_disciplines')
        .select('id')
        .eq('plan_type_id', subscription.plan_type_id)
        .eq('discipline_id', cls.discipline_id)
        .limit(1)
        .single();

      if (link) return { allowed: true };

      const { count } = await supabase
        .from('plan_type_disciplines')
        .select('id', { count: 'exact', head: true })
        .eq('plan_type_id', subscription.plan_type_id);

      if (count === 0) return { allowed: true };

      const name = (cls.disciplines as any)?.name || 'deze discipline';
      return { allowed: false, reason: `Je abonnement geeft geen toegang tot ${name}` };
    }

    return { allowed: true };
  };

  // Make a reservation
  const makeReservation = async (classId: string, reservationDate: Date): Promise<{ success: boolean; error?: string }> => {
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

      // Check discipline access
      const access = await checkDisciplineAccess(classId);
      if (!access.allowed) {
        return { success: false, error: access.reason || 'Geen toegang tot deze les' };
      }

      // Format date as YYYY-MM-DD for the database
      const dateString = reservationDate.toISOString().split('T')[0];

      const { error } = await supabase
        .from('reservations')
        .insert({
          class_id: classId,
          member_id: profile.id,
          status: 'reserved',
          reservation_date: dateString,
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
