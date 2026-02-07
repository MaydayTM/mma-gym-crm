import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ClassSession {
  id: string;
  name: string;
  category: string;
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  start_time: string; // HH:MM:SS format
  end_time: string;
  max_capacity: number | null;
  room: string | null;
  is_active: boolean | null;
  start_date: string | null;
  recurrence_end_date: string | null;
  is_recurring: boolean | null;
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
  selectedDate?: Date; // The actual selected date for start_date/recurrence_end_date filtering
}

// Check if a class is active on a given date (same logic as CRM Schedule page)
function isClassActiveOnDate(cls: ClassSession, date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];

  // Must have a start_date
  if (!cls.start_date) return false;

  // Must have started
  if (cls.start_date > dateStr) return false;

  // Check recurrence_end_date
  if (!cls.recurrence_end_date) {
    if (!cls.is_recurring) {
      // One-off class: only show on start_date
      return cls.start_date === dateStr;
    }
    // Recurring without end date = data issue, don't show
    return false;
  }

  // Must not have ended
  if (cls.recurrence_end_date < dateStr) return false;

  return true;
}

export function useClasses(options: UseClassesOptions = {}) {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClasses = async (cancelled?: () => boolean) => {
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

      const { data, error: fetchError } = await query;

      if (cancelled?.()) return;
      if (fetchError) throw fetchError;

      // Client-side date filtering (same as CRM) to check start_date/recurrence_end_date
      let filtered = data || [];
      if (options.selectedDate) {
        filtered = filtered.filter(cls => isClassActiveOnDate(cls, options.selectedDate!));
      }

      setClasses(filtered);
    } catch (err) {
      if (cancelled?.()) return;
      console.error('Error fetching classes:', err);
      setError(err as Error);
    } finally {
      if (!cancelled?.()) {
        setIsLoading(false);
      }
    }
  };

  // Serialize selectedDate to string for dependency comparison
  const dateStr = options.selectedDate?.toISOString().split('T')[0];

  useEffect(() => {
    let isCancelled = false;
    fetchClasses(() => isCancelled);
    return () => { isCancelled = true; };
  }, [options.dayOfWeek, dateStr]);

  return {
    classes,
    isLoading,
    error,
    refetch: () => fetchClasses(),
  };
}

// Get classes for a specific date (uses day_of_week + date filtering)
export function useClassesForDay(date: Date) {
  const dayOfWeek = date.getDay();
  return useClasses({ dayOfWeek, selectedDate: date });
}

// Format time string (HH:MM:SS) to display format (HH:MM)
export function formatClassTime(timeString: string): string {
  if (!timeString) return '';
  const parts = timeString.split(':');
  return `${parts[0]}:${parts[1]}`;
}
