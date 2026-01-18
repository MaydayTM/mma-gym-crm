import { View, Text, Image, StyleSheet } from 'react-native';

// Belt colors mapping - ring color based on highest belt
const BELT_RING_COLORS: Record<string, string> = {
  white: '#FFFFFF',
  blue: '#0066CC',
  purple: '#8B5CF6',
  brown: '#92400E',
  black: '#EF4444', // Red ring for black belt (like in your design)
};

// Belt background colors for progress bars
const BELT_BG_COLORS: Record<string, string> = {
  white: '#E5E5E5',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  brown: '#D97706',
  black: '#1F2937',
};

interface BeltAvatarProps {
  imageUrl?: string | null;
  firstName: string;
  lastName: string;
  beltColor: string; // highest belt color
  size?: number;
  showRing?: boolean;
}

export function BeltAvatar({
  imageUrl,
  firstName,
  lastName,
  beltColor,
  size = 100,
  showRing = true,
}: BeltAvatarProps) {
  const ringColor = BELT_RING_COLORS[beltColor] || BELT_RING_COLORS.white;
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const ringSize = size + 8;
  const innerSize = size;

  return (
    <View style={[styles.container, { width: ringSize, height: ringSize }]}>
      {/* Belt color ring */}
      {showRing && (
        <View
          style={[
            styles.ring,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderColor: ringColor,
              borderWidth: 4,
            },
          ]}
        />
      )}

      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: imageUrl ? 'transparent' : BELT_BG_COLORS[beltColor] || '#333',
          },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.image,
              {
                width: innerSize,
                height: innerSize,
                borderRadius: innerSize / 2,
              },
            ]}
          />
        ) : (
          <Text style={[styles.initials, { fontSize: innerSize * 0.4 }]}>
            {initials}
          </Text>
        )}
      </View>
    </View>
  );
}

interface BeltProgressProps {
  discipline: string;
  beltColor: string;
  stripes?: number;
}

export function BeltProgress({ discipline, beltColor, stripes = 0 }: BeltProgressProps) {
  const bgColor = BELT_BG_COLORS[beltColor] || '#333';
  const beltLabel = beltColor.toUpperCase();

  // Calculate progress (white=20%, blue=40%, purple=60%, brown=80%, black=100%)
  const beltProgress: Record<string, number> = {
    white: 0.2,
    blue: 0.4,
    purple: 0.6,
    brown: 0.8,
    black: 1.0,
  };
  const progress = beltProgress[beltColor] || 0.2;

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.disciplineLabel}>{discipline}</Text>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: bgColor,
              },
            ]}
          />
          {/* Stripes indicator */}
          {stripes > 0 && beltColor !== 'white' && (
            <View style={styles.stripesContainer}>
              {Array.from({ length: stripes }).map((_, i) => (
                <View key={i} style={styles.stripe} />
              ))}
            </View>
          )}
        </View>
      </View>
      <Text style={styles.beltLabel}>{beltLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Belt Progress styles
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  disciplineLabel: {
    color: '#888',
    fontSize: 12,
    width: 30,
    fontWeight: '600',
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBg: {
    height: 20,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  stripesContainer: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  stripe: {
    width: 3,
    height: 12,
    backgroundColor: '#EF4444',
    borderRadius: 1,
  },
  beltLabel: {
    color: '#666',
    fontSize: 12,
    width: 50,
    textAlign: 'right',
    fontWeight: '500',
  },
});
