import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface MemberBelt {
  id: string;
  member_id: string;
  discipline_id: string;
  belt_color: string;
  stripes: number | null;
  created_at: string | null;
  discipline?: {
    id: string;
    name: string;
    slug: string;
  };
}

export function useMemberBelts(memberId: string | undefined) {
  const [belts, setBelts] = useState<MemberBelt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBelts = async () => {
    if (!memberId) {
      setBelts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('member_belts')
        .select(`
          *,
          discipline:disciplines(id, name, slug)
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setBelts(data || []);
    } catch (err) {
      console.error('Error fetching belts:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBelts();
  }, [memberId]);

  // Get highest belt (for avatar ring color)
  const getHighestBelt = (): string => {
    if (belts.length === 0) return 'white';

    const beltOrder = ['white', 'blue', 'purple', 'brown', 'black'];
    let highest = 'white';

    for (const belt of belts) {
      const currentIndex = beltOrder.indexOf(belt.belt_color);
      const highestIndex = beltOrder.indexOf(highest);
      if (currentIndex > highestIndex) {
        highest = belt.belt_color;
      }
    }

    return highest;
  };

  // Format belts for display components
  const getBeltsForDisplay = () => {
    return belts.map(belt => ({
      discipline: belt.discipline?.slug?.toUpperCase() || belt.discipline?.name || 'Unknown',
      color: belt.belt_color,
      stripes: belt.stripes || 0,
    }));
  };

  return {
    belts,
    isLoading,
    error,
    refetch: fetchBelts,
    highestBelt: getHighestBelt(),
    beltsForDisplay: getBeltsForDisplay(),
  };
}
