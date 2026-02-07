import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type ClassCategory = 'group_session' | 'personal_session' | 'course';

interface ClassSession {
  id: string;
  name: string;
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  start_time: string; // HH:MM:SS format
  end_time: string;
  max_capacity: number | null;
  room: string | null;
  is_active: boolean | null;
  category: ClassCategory | null;
  // Joined data
  discipline?: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
  };
  coach?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture_url: string | null;
  };
}

interface UseClassesOptions {
  dayOfWeek?: number; // 0=Sunday, 1=Monday, etc.
  category?: ClassCategory;
}

export function useClasses(options: UseClassesOptions = {}) {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('classes')
        .select(`
          *,
          discipline:disciplines(id, name, slug, image_url),
          coach:members!classes_coach_id_fkey(id, first_name, last_name, profile_picture_url)
        `)
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      // Filter by day of week if specified
      if (options.dayOfWeek !== undefined) {
        query = query.eq('day_of_week', options.dayOfWeek);
      }

      // Filter by category if specified
      if (options.category) {
        query = query.eq('category', options.category);
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
  }, [options.dayOfWeek, options.category]);

  return {
    classes,
    isLoading,
    error,
    refetch: fetchClasses,
  };
}

// Get classes for a specific date (uses day_of_week)
export function useClassesForDay(date: Date) {
  // JavaScript: 0=Sunday, 1=Monday, etc. - same as database
  const dayOfWeek = date.getDay();
  return useClasses({ dayOfWeek });
}

// Format time string (HH:MM:SS) to display format (HH:MM)
export function formatClassTime(timeString: string): string {
  if (!timeString) return '';
  // timeString is in format "HH:MM:SS" or "HH:MM"
  const parts = timeString.split(':');
  return `${parts[0]}:${parts[1]}`;
}
