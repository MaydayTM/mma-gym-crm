import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { BeltAvatar } from '../../components/BeltAvatar';
import { useMemberBelts } from '../../hooks/useMemberBelts';

// Generate a secure random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export default function QRCodeScreen() {
  const { profile, isLoading: authLoading } = useAuth();
  const { highestBelt } = useMemberBelts(profile?.id);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [accessStatus, setAccessStatus] = useState<'checking' | 'allowed' | 'denied'>('checking');
  const [denialReason, setDenialReason] = useState<string | null>(null);

  // Staff roles always have access (no subscription needed)
  const isStaffRole = profile?.role && ['admin', 'medewerker', 'coordinator', 'coach'].includes(profile.role);

  // Fetch or generate QR token
  const fetchOrGenerateToken = useCallback(async () => {
    if (!profile?.id) return;

    setIsRefreshing(true);
    try {
      // Staff always gets access - skip subscription check
      if (!isStaffRole) {
        // Only check subscription for regular members (fighter, fan)
        const { data: accessData } = await supabase
          .rpc('check_member_door_access', { p_member_id: profile.id });

        if (accessData && accessData.length > 0) {
          const access = accessData[0];
          if (!access.allowed) {
            setAccessStatus('denied');
            setDenialReason(access.denial_reason);
            return;
          }
        }
      }

      setAccessStatus('allowed');

      // Check if member already has a token
      const { data: memberData } = await supabase
        .from('members')
        .select('qr_token')
        .eq('id', profile.id)
        .single();

      if (memberData?.qr_token) {
        setQrToken(memberData.qr_token);
      } else {
        // Generate new token and save it
        const newToken = generateToken();
        const { error } = await supabase
          .from('members')
          .update({ qr_token: newToken })
          .eq('id', profile.id);

        if (!error) {
          setQrToken(newToken);
        }
      }
    } catch (error) {
      console.error('Error fetching QR token:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [profile?.id, isStaffRole]);

  useEffect(() => {
    fetchOrGenerateToken();
  }, [fetchOrGenerateToken]);

  const handleRefresh = async () => {
    if (!profile?.id || isRefreshing) return;

    setIsRefreshing(true);
    try {
      // Generate new token
      const newToken = generateToken();
      const { error } = await supabase
        .from('members')
        .update({ qr_token: newToken })
        .eq('id', profile.id);

      if (!error) {
        setQrToken(newToken);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    } finally {
      setIsRefreshing(false);
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
      default:
        return 'Geen toegang';
    }
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
              onPress={() => {/* TODO: Link naar lidmaatschap */}}
            >
              <Text style={styles.subscriptionButtonText}>Bekijk abonnementen</Text>
            </TouchableOpacity>
          </View>
        ) : qrToken ? (
          <View style={styles.qrCard}>
            <QRCode
              value={qrToken}
              size={220}
              backgroundColor="#fff"
              color="#000"
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
        <View style={styles.classInfo}>
          <Text style={styles.classLabel}>Volgende les</Text>
          <Text style={styles.className}>Bekijk het rooster</Text>
        </View>
        <TouchableOpacity
          style={styles.classLink}
          onPress={() => router.push('/(tabs)/schedule')}
        >
          <Text style={styles.classLinkText}>Bekijk rooster</Text>
          <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
        </TouchableOpacity>
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
  classLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classLinkText: {
    color: '#D4AF37',
    fontSize: 14,
  },
});
