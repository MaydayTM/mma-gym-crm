import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

const BELT_COLORS: Record<string, string> = {
  white: '#FFFFFF',
  blue: '#0066CC',
  purple: '#6B2D8B',
  brown: '#8B4513',
  black: '#1a1a1a',
};

export default function ProfileScreen() {
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
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { borderColor: BELT_COLORS.black }]}>
            <Ionicons name="person" size={50} color="#D4AF37" />
          </View>
        </View>
        <Text style={styles.name}>Mehdi Michiels</Text>
        <Text style={styles.handle}>@mehdi</Text>
        <Text style={styles.gym}>Reconnect Academy</Text>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistieken</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Trainingen</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Maanden streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Top 5%</Text>
            <Text style={styles.statLabel}>Aanwezigheid</Text>
          </View>
        </View>
      </View>

      {/* Belts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gordels</Text>
        <View style={styles.beltList}>
          <View style={styles.beltItem}>
            <View style={[styles.beltIndicator, { backgroundColor: BELT_COLORS.black }]} />
            <View style={styles.beltInfo}>
              <Text style={styles.beltDiscipline}>BJJ</Text>
              <Text style={styles.beltRank}>Zwart (2 stripes)</Text>
            </View>
          </View>
          <View style={styles.beltItem}>
            <View style={[styles.beltIndicator, { backgroundColor: BELT_COLORS.brown }]} />
            <View style={styles.beltInfo}>
              <Text style={styles.beltDiscipline}>Judo</Text>
              <Text style={styles.beltRank}>Bruin</Text>
            </View>
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
    paddingTop: 80,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#222',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  handle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  gym: {
    fontSize: 14,
    color: '#D4AF37',
    marginTop: 5,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  beltList: {
    gap: 12,
  },
  beltItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 15,
  },
  beltIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
    marginRight: 15,
  },
  beltInfo: {
    flex: 1,
  },
  beltDiscipline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  beltRank: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
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
