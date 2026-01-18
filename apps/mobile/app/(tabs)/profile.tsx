import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { BeltAvatar, BeltProgress } from '../../components/BeltAvatar';

// Mock user data - will be replaced with real Supabase data
const MOCK_USER = {
  firstName: 'Mehdi',
  lastName: 'Michiels',
  imageUrl: null, // Will show initials
  role: 'coach' as const,
  gym: 'Reconnect Academy',
  stats: {
    trainings: 156,
    streak: 12,
    ranking: 'Top 5%',
  },
  belts: [
    { discipline: 'BJJ', color: 'black', stripes: 2 },
    { discipline: 'LL', color: 'brown', stripes: 1 },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  coach: '#F59E0B',
  fighter: '#8B5CF6',
  fan: '#6B7280',
};

export default function ProfileScreen() {
  const user = MOCK_USER;

  // Get highest belt for avatar ring
  const beltOrder = ['white', 'blue', 'purple', 'brown', 'black'];
  const highestBelt = user.belts.reduce((highest, belt) => {
    const currentIndex = beltOrder.indexOf(belt.color);
    const highestIndex = beltOrder.indexOf(highest);
    return currentIndex > highestIndex ? belt.color : highest;
  }, 'white');

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
            await supabase.auth.signOut();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile header */}
      <View style={styles.header}>
        {/* Role badge */}
        <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[user.role] }]}>
          <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
        </View>

        {/* Avatar with belt ring */}
        <View style={styles.avatarContainer}>
          <BeltAvatar
            imageUrl={user.imageUrl}
            firstName={user.firstName}
            lastName={user.lastName}
            beltColor={highestBelt}
            size={120}
          />
        </View>

        <Text style={styles.name}>{user.firstName}</Text>
        <Text style={styles.lastName}>{user.lastName}</Text>
        <Text style={styles.gym}>{user.gym}</Text>
      </View>

      {/* Belt Progress Section */}
      <View style={styles.section}>
        <View style={styles.beltsCard}>
          {user.belts.map((belt) => (
            <BeltProgress
              key={belt.discipline}
              discipline={belt.discipline}
              beltColor={belt.color}
              stripes={belt.stripes}
            />
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistieken</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.trainings}</Text>
            <Text style={styles.statLabel}>Trainingen</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.streak}</Text>
            <Text style={styles.statLabel}>Maanden streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.ranking}</Text>
            <Text style={styles.statLabel}>Aanwezigheid</Text>
          </View>
        </View>
      </View>

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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  gym: {
    fontSize: 14,
    color: '#F59E0B',
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
});
