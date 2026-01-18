import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ClassSession {
  id: string;
  name: string;
  description: string | null;
  discipline_id: string | null;
  coach_id: string | null;
  start_time: string;
  end_time: string;
  max_participants: number | null;
  location: string | null;
  is_recurring: boolean;
  // Joined data
  discipline?: {
    id: string;
    name: string;
    slug: string;
  };
  coach?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture_url: string | null;
  };
  reservation_count?: number;
}

interface UseClassesOptions {
  startDate?: Date;
  endDate?: Date;
  disciplineId?: string;
}

export function useClasses(options: UseClassesOptions = {}) {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Default to current week
      const start = options.startDate || getStartOfWeek(new Date());
      const end = options.endDate || getEndOfWeek(new Date());

      let query = supabase
        .from('classes')
        .select(`
          *,
          discipline:disciplines(id, name, slug),
          coach:members!classes_coach_id_fkey(id, first_name, last_name, profile_picture_url)
        `)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true });

      if (options.disciplineId) {
        query = query.eq('discipline_id', options.disciplineId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setClasses(data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [options.startDate?.toISOString(), options.endDate?.toISOString(), options.disciplineId]);

  return {
    classes,
    isLoading,
    error,
    refetch: fetchClasses,
  };
}

// Get classes for a specific day
export function useClassesForDay(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return useClasses({ startDate: startOfDay, endDate: endOfDay });
}

// Helper functions
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(date: Date): Date {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}
