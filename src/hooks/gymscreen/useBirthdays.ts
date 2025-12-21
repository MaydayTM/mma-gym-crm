import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface Birthday {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  age: number;
  birthday_display?: string;
  is_today?: boolean;
}

// Fetch today's birthdays
export const useTodaysBirthdays = () => {
  return useQuery({
    queryKey: ['gymscreen-birthdays-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gymscreen_birthdays_today')
        .select('*');

      if (error) throw error;
      return data as Birthday[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch upcoming birthdays (next 7 days)
export const useUpcomingBirthdays = (daysAhead = 7) => {
  return useQuery({
    queryKey: ['gymscreen-birthdays-upcoming', daysAhead],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gymscreen_birthdays_upcoming')
        .select('*')
        .lte('days_until_birthday', daysAhead);

      if (error) throw error;
      return data as (Birthday & { days_until_birthday: number })[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Use the database function for flexible birthday fetching
export const useBirthdays = (daysAhead = 0) => {
  return useQuery({
    queryKey: ['gymscreen-birthdays', daysAhead],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_gymscreen_birthdays', { p_days_ahead: daysAhead });

      if (error) throw error;
      return data as Birthday[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get birthday statistics
export const useBirthdayStats = () => {
  return useQuery({
    queryKey: ['gymscreen-birthday-stats'],
    queryFn: async () => {
      // Get counts for today and this week
      const [todayResult, weekResult] = await Promise.all([
        supabase.from('gymscreen_birthdays_today').select('id', { count: 'exact', head: true }),
        supabase.from('gymscreen_birthdays_upcoming').select('id', { count: 'exact', head: true }).lte('days_until_birthday', 7),
      ]);

      return {
        todayCount: todayResult.count || 0,
        weekCount: weekResult.count || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
