import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

const TENANT_ID = 'reconnect';

export interface GymScreenSettings {
  id: string;
  tenant_id: string;
  show_belt_wall: boolean;
  show_slideshow: boolean;
  show_birthdays: boolean;
  show_shop_banners: boolean;
  show_announcements: boolean;
  slideshow_interval: number;
  section_rotation_interval: number;
  birthday_display_days: number;
  section_order: string[];
  theme: 'dark' | 'light' | 'brand';
  show_clock: boolean;
  show_logo: boolean;
  logo_url: string | null;
  api_key: string | null;
  created_at: string;
  updated_at: string;
}

export type SettingsUpdate = Partial<Omit<GymScreenSettings, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'api_key'>>;

// Fetch settings
export const useGymScreenSettings = () => {
  return useQuery({
    queryKey: ['gymscreen-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gymscreen_settings')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .single();

      if (error) {
        // If no settings exist yet, return defaults
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data as GymScreenSettings;
    },
  });
};

// Update settings
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: SettingsUpdate) => {
      const { data, error } = await supabase
        .from('gymscreen_settings')
        .update(updates)
        .eq('tenant_id', TENANT_ID)
        .select()
        .single();

      if (error) throw error;
      return data as GymScreenSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymscreen-settings'] });
    },
  });
};

// Regenerate API key
export const useRegenerateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Generate a new UUID as API key
      const newApiKey = crypto.randomUUID();

      const { data, error } = await supabase
        .from('gymscreen_settings')
        .update({ api_key: newApiKey })
        .eq('tenant_id', TENANT_ID)
        .select()
        .single();

      if (error) throw error;
      return data as GymScreenSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymscreen-settings'] });
    },
  });
};

// Get display data for GymScreen (all-in-one for the display app)
export const useGymScreenDisplayData = () => {
  return useQuery({
    queryKey: ['gymscreen-display-data'],
    queryFn: async () => {
      // Fetch all data needed for the display
      const [settingsRes, slidesRes, birthdaysRes] = await Promise.all([
        supabase.from('gymscreen_settings').select('*').eq('tenant_id', TENANT_ID).single(),
        supabase.rpc('get_active_slides'),
        supabase.rpc('get_gymscreen_birthdays', { p_days_ahead: 0 }),
      ]);

      return {
        settings: settingsRes.data as GymScreenSettings | null,
        slides: slidesRes.data || [],
        birthdays: birthdaysRes.data || [],
      };
    },
    staleTime: 30 * 1000, // 30 seconds for display refresh
  });
};
