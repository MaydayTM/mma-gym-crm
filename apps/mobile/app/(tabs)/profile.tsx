import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useMemberBelts } from '../../hooks/useMemberBelts';
import { BeltAvatar, BeltProgress } from '../../components/BeltAvatar';

const ROLE_COLORS: Record<string, string> = {
  admin: '#EF4444',
  medewerker: '#F59E0B',
  coordinator: '#F59E0B',
  coach: '#F59E0B',
  fighter: '#8B5CF6',
  fan: '#6B7280',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'ADMIN',
  medewerker: 'STAFF',
  coordinator: 'COORDINATOR',
  coach: 'COACH',
  fighter: 'FIGHTER',
  fan: 'FAN',
};

export default function ProfileScreen() {
  const { profile, isLoading, signOut, isCoach, isStaff } = useAuth();
  const { beltsForDisplay, highestBelt, isLoading: beltsLoading } = useMemberBelts(profile?.id);

  const handleLogout = async () => {
    Alert.alert(
      'Uitloggen',
      'Weet je zeker dat je wilt uitloggen?',
      [
        { text: 'Annuleer', style: 'cancel' },
        {
          text: 'Uitloggen',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Profiel niet gevonden</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleLogout}>
          <Text style={styles.retryText}>Opnieuw inloggen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roleColor = ROLE_COLORS[profile.role] || ROLE_COLORS.fighter;
  const roleLabel = ROLE_LABELS[profile.role] || 'MEMBER';

  return (
    <ScrollView style={styles.container}>
      {/* Profile header */}
      <View style={styles.header}>
        {/* Role badge */}
        <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>

        {/* Avatar with belt ring */}
        <View style={styles.avatarContainer}>
          <BeltAvatar
            imageUrl={profile.profile_picture_url}
            firstName={profile.first_name}
            lastName={profile.last_name}
            beltColor={highestBelt}
            size={120}
          />
        </View>

        <Text style={styles.name}>{profile.first_name}</Text>
        {profile.last_name && <Text style={styles.lastName}>{profile.last_name}</Text>}
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      {/* Belt Progress Section */}
      {beltsForDisplay.length > 0 && (
        <View style={styles.section}>
          <View style={styles.beltsCard}>
            {beltsForDisplay.map((belt, index) => (
              <BeltProgress
                key={index}
                discipline={belt.discipline}
                beltColor={belt.color}
                stripes={belt.stripes}
              />
            ))}
          </View>
        </View>
      )}

      {/* Staff-only section */}
      {isStaff && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Staff Tools</Text>
          <View style={styles.menuList}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="people-outline" size={22} color="#F59E0B" />
              <Text style={styles.menuText}>Leden beheren</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            {isCoach && (
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="clipboard-outline" size={22} color="#F59E0B" />
                <Text style={styles.menuText}>Aanwezigheid</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instellingen</Text>
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={22} color="#fff" />
            <Text style={styles.menuText}>Account bewerken</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="lock-closed-outline" size={22} color="#fff" />
            <Text style={styles.menuText}>Wachtwoord wijzigen</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="card-outline" size={22} color="#fff" />
            <Text style={styles.menuText}>Lidmaatschap</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <Text style={styles.menuText}>Notificaties</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#ff4444" />
            <Text style={[styles.menuText, styles.menuTextDanger]}>Uitloggen</Text>
            <Ionicons name="chevron-forward" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>FightFlow v1.0.0</Text>
        <Text style={styles.memberId}>ID: {profile.id.slice(0, 8)}...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#888',
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#000',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  roleText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  lastName: {
    fontSize: 18,
    color: '#888',
    marginTop: 2,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  beltsCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 15,
    gap: 8,
  },
  menuList: {
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemDanger: {
    marginTop: 10,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  menuTextDanger: {
    color: '#ff4444',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    color: '#444',
  },
  memberId: {
    fontSize: 10,
    color: '#333',
    marginTop: 4,
  },
});
