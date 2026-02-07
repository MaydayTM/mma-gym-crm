import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface Subscription {
  id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  final_price: number | null;
  created_at: string;
  plan_types: { name: string } | { name: string }[] | null;
  age_groups: { name: string } | { name: string }[] | null;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  active: { color: '#22C55E', label: 'Actief', icon: 'checkmark-circle' },
  frozen: { color: '#3B82F6', label: 'Gepauzeerd', icon: 'pause-circle' },
  cancelled: { color: '#EF4444', label: 'Opgezegd', icon: 'close-circle' },
  expired: { color: '#6B7280', label: 'Verlopen', icon: 'time' },
};

export default function MembershipScreen() {
  const { profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('member_subscriptions')
        .select('id, status, start_date, end_date, final_price, created_at, plan_types(name), age_groups(name)')
        .eq('member_id', profile.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Fetch subscriptions error:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  }, [fetchSubscriptions]);

  const activeSubscription = subscriptions.find(s => s.status === 'active');
  const pastSubscriptions = subscriptions.filter(s => s.status !== 'active');

  const getPlanDisplayName = (sub: Subscription): string => {
    const parts: string[] = [];
    const planType = Array.isArray(sub.plan_types) ? sub.plan_types[0] : sub.plan_types;
    const ageGroup = Array.isArray(sub.age_groups) ? sub.age_groups[0] : sub.age_groups;
    if (planType?.name) parts.push(planType.name);
    if (ageGroup?.name) parts.push(ageGroup.name);
    return parts.length > 0 ? parts.join(' - ') : 'Abonnement';
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('nl-BE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string | null): number | null => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
      }
    >
      {/* Active Subscription */}
      {activeSubscription ? (
        <View style={styles.activeCard}>
          <View style={styles.activeHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
            <Text style={styles.activeLabel}>Actief Abonnement</Text>
          </View>

          <Text style={styles.planName}>
            {getPlanDisplayName(activeSubscription)}
          </Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Startdatum</Text>
              <Text style={styles.detailValue}>
                {formatDate(activeSubscription.start_date)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Einddatum</Text>
              <Text style={styles.detailValue}>
                {formatDate(activeSubscription.end_date)}
              </Text>
            </View>
          </View>

          {activeSubscription.end_date && (() => {
            const days = getDaysRemaining(activeSubscription.end_date);
            if (days === null) return null;
            return (
              <View style={[
                styles.daysRemainingBadge,
                days <= 7 && styles.daysRemainingWarning,
                days <= 0 && styles.daysRemainingExpired,
              ]}>
                <Ionicons
                  name={days <= 7 ? 'warning' : 'calendar'}
                  size={16}
                  color={days <= 0 ? '#EF4444' : days <= 7 ? '#F59E0B' : '#D4AF37'}
                />
                <Text style={[
                  styles.daysRemainingText,
                  days <= 7 && styles.daysRemainingTextWarning,
                  days <= 0 && styles.daysRemainingTextExpired,
                ]}>
                  {days <= 0
                    ? 'Abonnement verlopen'
                    : days === 1
                    ? 'Nog 1 dag'
                    : `Nog ${days} dagen`}
                </Text>
              </View>
            );
          })()}
        </View>
      ) : (
        <View style={styles.noActiveCard}>
          <Ionicons name="card-outline" size={48} color="#444" />
          <Text style={styles.noActiveTitle}>Geen actief abonnement</Text>
          <Text style={styles.noActiveSubtext}>
            Neem contact op met de balie voor een nieuw abonnement
          </Text>
        </View>
      )}

      {/* Door Access Status */}
      <View style={styles.accessCard}>
        <View style={styles.accessRow}>
          <View style={styles.accessInfo}>
            <Ionicons name="key-outline" size={20} color="#D4AF37" />
            <Text style={styles.accessLabel}>Deur Toegang</Text>
          </View>
          <View style={[
            styles.accessBadge,
            activeSubscription ? styles.accessBadgeActive : styles.accessBadgeInactive,
          ]}>
            <Text style={[
              styles.accessBadgeText,
              activeSubscription ? styles.accessBadgeTextActive : styles.accessBadgeTextInactive,
            ]}>
              {activeSubscription ? 'Actief' : 'Inactief'}
            </Text>
          </View>
        </View>
        <Text style={styles.accessHint}>
          {activeSubscription
            ? 'Gebruik je QR code op het startscherm om de deur te openen'
            : 'Activeer een abonnement om deur toegang te krijgen'}
        </Text>
      </View>

      {/* Past Subscriptions */}
      {pastSubscriptions.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Eerdere abonnementen</Text>
          {pastSubscriptions.map((sub) => {
            const config = STATUS_CONFIG[sub.status] || STATUS_CONFIG.expired;
            return (
              <View key={sub.id} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Ionicons name={config.icon as any} size={18} color={config.color} />
                  <Text style={styles.historyPlan}>
                    {getPlanDisplayName(sub)}
                  </Text>
                  <View style={[styles.historyBadge, { backgroundColor: config.color + '20' }]}>
                    <Text style={[styles.historyBadgeText, { color: config.color }]}>
                      {config.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historyDates}>
                  {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={16} color="#444" />
        <Text style={styles.footerText}>
          Neem contact op met de balie voor wijzigingen aan je abonnement
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#22C55E30',
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  activeLabel: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    color: '#666',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    color: '#ccc',
    fontSize: 14,
  },
  daysRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D4AF3715',
    borderRadius: 8,
    padding: 10,
    marginTop: 16,
  },
  daysRemainingWarning: {
    backgroundColor: '#F59E0B15',
  },
  daysRemainingExpired: {
    backgroundColor: '#EF444415',
  },
  daysRemainingText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '600',
  },
  daysRemainingTextWarning: {
    color: '#F59E0B',
  },
  daysRemainingTextExpired: {
    color: '#EF4444',
  },
  noActiveCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  noActiveTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  noActiveSubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  accessCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  accessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accessLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  accessBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  accessBadgeActive: {
    backgroundColor: '#22C55E20',
  },
  accessBadgeInactive: {
    backgroundColor: '#EF444420',
  },
  accessBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  accessBadgeTextActive: {
    color: '#22C55E',
  },
  accessBadgeTextInactive: {
    color: '#EF4444',
  },
  accessHint: {
    color: '#555',
    fontSize: 13,
    marginTop: 10,
  },
  historySection: {
    marginTop: 30,
  },
  historyTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  historyItem: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyPlan: {
    flex: 1,
    color: '#ccc',
    fontSize: 15,
    fontWeight: '600',
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  historyDates: {
    color: '#555',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 26,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 30,
    paddingHorizontal: 4,
  },
  footerText: {
    flex: 1,
    color: '#444',
    fontSize: 12,
  },
});
