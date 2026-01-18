import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BeltAvatar, BeltProgress } from './BeltAvatar';

interface Belt {
  discipline: string;
  color: string;
  stripes?: number;
}

interface FighterCardProps {
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  role: 'coach' | 'fighter' | 'fan';
  belts: Belt[];
  onPress?: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  coach: '#F59E0B', // Amber/Gold
  fighter: '#8B5CF6', // Purple
  fan: '#6B7280', // Gray
};

export function FighterCard({
  firstName,
  lastName,
  imageUrl,
  role,
  belts,
  onPress,
}: FighterCardProps) {
  // Get highest belt for the ring color
  const beltOrder = ['white', 'blue', 'purple', 'brown', 'black'];
  const highestBelt = belts.reduce((highest, belt) => {
    const currentIndex = beltOrder.indexOf(belt.color);
    const highestIndex = beltOrder.indexOf(highest);
    return currentIndex > highestIndex ? belt.color : highest;
  }, 'white');

  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.fighter;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Role badge */}
      <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
        <Text style={styles.roleText}>{role.toUpperCase()}</Text>
      </View>

      {/* Avatar with belt ring */}
      <View style={styles.avatarContainer}>
        <BeltAvatar
          imageUrl={imageUrl}
          firstName={firstName}
          lastName={lastName}
          beltColor={highestBelt}
          size={90}
        />
      </View>

      {/* Name */}
      <Text style={styles.firstName}>{firstName}</Text>
      <Text style={styles.lastName}>{lastName}</Text>

      {/* Belt progress bars */}
      <View style={styles.beltsContainer}>
        {belts.map((belt) => (
          <BeltProgress
            key={belt.discipline}
            discipline={belt.discipline}
            beltColor={belt.color}
            stripes={belt.stripes}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    minWidth: 160,
    maxWidth: 200,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 15,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  roleText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  firstName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  lastName: {
    color: '#888',
    fontSize: 16,
    marginBottom: 15,
  },
  beltsContainer: {
    alignSelf: 'stretch',
    gap: 4,
  },
});
