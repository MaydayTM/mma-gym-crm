import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface GymScreenSlide {
  id: string;
  image_url: string;
  title: string | null;
  caption: string | null;
  category: 'event' | 'training' | 'community' | 'achievement' | 'promo' | 'announcement';
  display_duration: number;
  sort_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SlideInsert = Partial<Omit<GymScreenSlide, 'id' | 'created_at' | 'updated_at'>> & {
  image_url: string;
};
export type SlideUpdate = Partial<Omit<GymScreenSlide, 'id' | 'created_at' | 'updated_at'>>;

// Fetch all slides
export const useSlides = (activeOnly = false) => {
  return useQuery({
    queryKey: ['gymscreen-slides', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('gymscreen_slides')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GymScreenSlide[];
    },
  });
};

// Create a new slide
export const useCreateSlide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slide: SlideInsert) => {
      const { data, error } = await supabase
        .from('gymscreen_slides')
        .insert(slide)
        .select()
        .single();

      if (error) throw error;
      return data as GymScreenSlide;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymscreen-slides'] });
    },
  });
};

// Update a slide
export const useUpdateSlide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: SlideUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('gymscreen_slides')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as GymScreenSlide;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymscreen-slides'] });
    },
  });
};

// Delete a slide
export const useDeleteSlide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gymscreen_slides')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymscreen-slides'] });
    },
  });
};

// Reorder slides (batch update)
export const useReorderSlides = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slides: { id: string; sort_order: number }[]) => {
      // Update each slide's sort_order
      const updates = slides.map(({ id, sort_order }) =>
        supabase
          .from('gymscreen_slides')
          .update({ sort_order })
          .eq('id', id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymscreen-slides'] });
    },
  });
};

// Toggle slide active status
export const useToggleSlideActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('gymscreen_slides')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as GymScreenSlide;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymscreen-slides'] });
    },
  });
};

// Upload slide image to storage
export const uploadSlideImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `slides/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('gymscreen')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('gymscreen')
    .getPublicUrl(filePath);

  return publicUrl;
};

// Delete slide image from storage
export const deleteSlideImage = async (imageUrl: string): Promise<void> => {
  // Extract file path from URL
  const urlParts = imageUrl.split('/gymscreen/');
  if (urlParts.length < 2) return;

  const filePath = urlParts[1];
  const { error } = await supabase.storage
    .from('gymscreen')
    .remove([filePath]);

  if (error) throw error;
};
