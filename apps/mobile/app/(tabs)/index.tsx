import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { BeltAvatar } from '../../components/BeltAvatar';
import { useMemberBelts } from '../../hooks/useMemberBelts';
import { useClassesForDay, formatClassTime } from '../../hooks/useClasses';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export default function QRCodeScreen() {
  const { profile, session, isLoading: authLoading } = useAuth();
  const { highestBelt } = useMemberBelts(profile?.id);
  const { classes: todayClasses } = useClassesForDay(new Date());
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [accessStatus, setAccessStatus] = useState<'checking' | 'allowed' | 'denied'>('checking');
  const [denialReason, setDenialReason] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch door access token from Edge Function
  const fetchToken = useCallback(async () => {
    if (!profile?.id || !session?.access_token) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/door-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ member_id: profile.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        setAccessStatus('denied');
        const err = data.error || '';
        console.log('[QR] Door token error:', err);
        if (err.includes('subscription')) {
          setDenialReason('no_active_subscription');
        } else if (err.includes('disabled')) {
          setDenialReason('access_disabled');
        } else if (err.includes('not active')) {
          setDenialReason('member_inactive');
        } else {
          setDenialReason(err || 'unknown_error');
        }
        return;
      }

      // Success - set token and expiry
      setQrToken(data.qr_token);
      setAccessStatus('allowed');

      // Calculate expiry time (token expires in `expires_in` seconds)
      const expiry = new Date(Date.now() + (data.expires_in * 1000));
      setExpiresAt(expiry);

      // Auto-refresh 1 minute before expiry
      const refreshIn = (data.expires_in - 60) * 1000;
      if (refreshIn > 0) {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => {
          fetchToken();
        }, refreshIn);
      }

    } catch (error) {
      console.error('Error fetching QR token:', error);
      setAccessStatus('denied');
      setDenialReason('network_error');
    } finally {
      setIsRefreshing(false);
    }
  }, [profile?.id, session?.access_token]);

  useEffect(() => {
    fetchToken();

    // Cleanup timer on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [fetchToken]);

  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchToken();
    }
  };

  const getDenialMessage = (reason: string | null): string => {
    switch (reason) {
      case 'no_active_subscription':
        return 'Je hebt geen actief abonnement';
      case 'access_disabled':
        return 'Toegang is uitgeschakeld voor dit account';
      case 'member_inactive':
        return 'Je account is niet actief';
      case 'network_error':
        return 'Geen internetverbinding';
      default:
        return reason || 'Geen toegang';
    }
  };

  // Format remaining time
  const getExpiryText = (): string => {
    if (!expiresAt) return '';
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return 'Verlopen - vernieuw';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Minder dan 1 min geldig';
    return `Geldig voor ${minutes} min`;
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>FightFlow</Text>
        </View>
        <View style={styles.qrContainer}>
          <View style={styles.deniedCard}>
            <Ionicons name="log-in-outline" size={60} color="#666" />
            <Text style={styles.deniedText}>Log in om je QR code te zien</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.replace('/auth/login')}
            >
              <Text style={styles.loginButtonText}>Inloggen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with profile */}
      <View style={styles.header}>
        <Text style={styles.logo}>FightFlow</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <BeltAvatar
            imageUrl={profile.profile_picture_url}
            firstName={profile.first_name}
            lastName={profile.last_name}
            beltColor={highestBelt}
            size={44}
          />
        </TouchableOpacity>
      </View>

      {/* QR Code */}
      <View style={styles.qrContainer}>
        {accessStatus === 'denied' ? (
          <View style={styles.deniedCard}>
            <Ionicons name="close-circle" size={60} color="#EF4444" />
            <Text style={styles.deniedText}>{getDenialMessage(denialReason)}</Text>
            <TouchableOpacity
              style={styles.subscriptionButton}
              onPress={() => router.push('/profile/membership')}
            >
              <Text style={styles.subscriptionButtonText}>Bekijk lidmaatschap</Text>
            </TouchableOpacity>
          </View>
        ) : qrToken ? (
          <View style={styles.qrCard}>
            <QRCode
              value={qrToken}
              size={220}
              backgroundColor="#fff"
              color="#000"
              ecl="H"
            />
            <Text style={styles.memberName}>
              {profile.first_name} {profile.last_name}
            </Text>
          </View>
        ) : (
          <View style={styles.qrPlaceholder}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loadingText}>QR code laden...</Text>
          </View>
        )}
      </View>

      {accessStatus === 'allowed' && qrToken && (
        <>
          <Text style={styles.instruction}>Scan voor toegang</Text>
          {expiresAt && (
            <Text style={styles.expiryText}>{getExpiryText()}</Text>
          )}

          {/* Refresh button */}
          <TouchableOpacity
            style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="refresh" size={20} color="#fff" />
            )}
            <Text style={styles.refreshText}>
              {isRefreshing ? 'Vernieuwen...' : 'Vernieuw'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Next class preview */}
      <View style={styles.nextClass}>
        <View style={styles.divider} />
        {(() => {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const nextClass = todayClasses.find(c => {
            const [h, m] = c.start_time.split(':').map(Number);
            return h * 60 + m > currentMinutes;
          });

          if (nextClass) {
            const disciplineName = Array.isArray(nextClass.discipline)
              ? nextClass.discipline[0]?.name
              : nextClass.discipline?.name;
            return (
              <>
                <View style={styles.classInfo}>
                  <Text style={styles.classLabel}>Volgende les vandaag</Text>
                  <Text style={styles.className}>
                    {nextClass.name || disciplineName || 'Les'}
                  </Text>
                  <Text style={styles.classTime}>
                    {formatClassTime(nextClass.start_time)} - {formatClassTime(nextClass.end_time)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.classLink}
                  onPress={() => router.push('/(tabs)/schedule')}
                >
                  <Text style={styles.classLinkText}>Bekijk rooster</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
                </TouchableOpacity>
              </>
            );
          }

          return (
            <>
              <View style={styles.classInfo}>
                <Text style={styles.classLabel}>Geen lessen meer vandaag</Text>
              </View>
              <TouchableOpacity
                style={styles.classLink}
                onPress={() => router.push('/(tabs)/schedule')}
              >
                <Text style={styles.classLinkText}>Bekijk rooster</Text>
                <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
              </TouchableOpacity>
            </>
          );
        })()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  qrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  memberName: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  qrPlaceholder: {
    width: 280,
    height: 280,
    backgroundColor: '#111',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
  },
  deniedCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: 280,
  },
  deniedText: {
    marginTop: 15,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  subscriptionButton: {
    marginTop: 20,
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  subscriptionButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  instruction: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
    fontStyle: 'italic',
  },
  expiryText: {
    textAlign: 'center',
    color: '#D4AF37',
    fontSize: 12,
    marginTop: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 20,
    gap: 8,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshText: {
    color: '#fff',
    fontSize: 16,
  },
  nextClass: {
    marginTop: 30,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginBottom: 15,
  },
  classInfo: {
    marginBottom: 10,
  },
  classLabel: {
    color: '#666',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  className: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  classTime: {
    color: '#D4AF37',
    fontSize: 14,
    marginTop: 4,
  },
  classLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classLinkText: {
    color: '#D4AF37',
    fontSize: 14,
  },
});
