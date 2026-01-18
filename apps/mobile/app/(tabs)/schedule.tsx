import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useClasses, formatClassTime } from '../../hooks/useClasses';
import { useReservations } from '../../hooks/useReservations';

const DAYS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

const disciplineIcons: Record<string, string> = {
  bjj: 'body',
  mma: 'hand-left',
  kickboxing: 'flash',
  wrestling: 'fitness',
  judo: 'body',
  luta_livre: 'body',
  default: 'barbell',
};

function getWeekDates(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // Start from Monday (day 1), unless today is Sunday (day 0)
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export default function ScheduleScreen() {
  const weekDates = getWeekDates();
  const today = new Date();
  const todayIndex = weekDates.findIndex(d =>
    d.toDateString() === today.toDateString()
  );

  const [selectedDay, setSelectedDay] = useState(todayIndex >= 0 ? todayIndex : 0);
  const [reservedClasses, setReservedClasses] = useState<Set<string>>(new Set());

  const selectedDate = weekDates[selectedDay];
  // Convert to day_of_week (0=Sunday, 1=Monday, etc.)
  const dayOfWeek = selectedDate.getDay();

  const { classes, isLoading, error, refetch } = useClasses({ dayOfWeek });
  const { makeReservation, cancelReservation, getMyReservation, isLoading: reservationLoading } = useReservations();

  // Check which classes user has reserved
  useEffect(() => {
    const checkReservations = async () => {
      const reserved = new Set<string>();
      for (const cls of classes) {
        const reservation = await getMyReservation(cls.id);
        if (reservation) {
          reserved.add(cls.id);
        }
      }
      setReservedClasses(reserved);
    };

    if (classes.length > 0) {
      checkReservations();
    }
  }, [classes]);

  const handleReservation = async (classId: string) => {
    const isReserved = reservedClasses.has(classId);

    if (isReserved) {
      Alert.alert(
        'Annuleren',
        'Wil je je reservering annuleren?',
        [
          { text: 'Nee', style: 'cancel' },
          {
            text: 'Ja, annuleer',
            style: 'destructive',
            onPress: async () => {
              const result = await cancelReservation(classId);
              if (result.success) {
                setReservedClasses(prev => {
                  const next = new Set(prev);
                  next.delete(classId);
                  return next;
                });
              } else {
                Alert.alert('Fout', result.error || 'Kon niet annuleren');
              }
            },
          },
        ]
      );
    } else {
      const result = await makeReservation(classId, selectedDate);
      if (result.success) {
        setReservedClasses(prev => new Set(prev).add(classId));
        Alert.alert('Gelukt!', 'Je bent ingeschreven voor deze les');
      } else {
        Alert.alert('Fout', result.error || 'Kon niet reserveren');
      }
    }
  };

  const getIconName = (disciplineSlug?: string): string => {
    if (!disciplineSlug) return disciplineIcons.default;
    const key = disciplineSlug.toLowerCase().replace(/[^a-z_]/g, '');
    return disciplineIcons[key] || disciplineIcons.default;
  };

  // Get day label for display (Ma, Di, etc.) - weekDates starts from Monday
  const getDayLabel = (index: number): string => {
    // weekDates[0] = Monday, weekDates[6] = Sunday
    const dayMapping = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
    return dayMapping[index];
  };

  return (
    <View style={styles.container}>
      {/* Day selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {weekDates.map((date, index) => {
          const isToday = date.toDateString() === today.toDateString();
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                selectedDay === index && styles.dayButtonActive,
                isToday && selectedDay !== index && styles.dayButtonToday,
              ]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[
                styles.dayText,
                selectedDay === index && styles.dayTextActive,
              ]}>
                {getDayLabel(index)}
              </Text>
              <Text style={[
                styles.dayNumber,
                selectedDay === index && styles.dayNumberActive,
              ]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Classes list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Kon lessen niet laden</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Opnieuw proberen</Text>
          </TouchableOpacity>
        </View>
      ) : classes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={60} color="#333" />
          <Text style={styles.emptyText}>Geen lessen op deze dag</Text>
        </View>
      ) : (
        <ScrollView style={styles.classList}>
          {classes.map((cls) => {
            const isReserved = reservedClasses.has(cls.id);
            return (
              <View key={cls.id} style={styles.classCard}>
                <View style={styles.classIcon}>
                  <Ionicons
                    name={getIconName(cls.discipline?.slug) as any}
                    size={24}
                    color="#D4AF37"
                  />
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classTime}>
                    {formatClassTime(cls.start_time)} - {formatClassTime(cls.end_time)}
                  </Text>
                  {cls.coach && (
                    <Text style={styles.classCoach}>
                      Coach: {cls.coach.first_name} {cls.coach.last_name}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.reserveButton,
                    isReserved && styles.reserveButtonActive,
                  ]}
                  onPress={() => handleReservation(cls.id)}
                  disabled={reservationLoading}
                >
                  {isReserved ? (
                    <>
                      <Ionicons name="checkmark" size={16} color="#000" />
                      <Text style={styles.reserveTextActive}>Gereserveerd</Text>
                    </>
                  ) : (
                    <Text style={styles.reserveText}>Reserveer</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  daySelector: {
    maxHeight: 90,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  daySelectorContent: {
    paddingHorizontal: 10,
    paddingVertical: 15,
    gap: 8,
  },
  dayButton: {
    width: 50,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  dayButtonActive: {
    backgroundColor: '#D4AF37',
  },
  dayButtonToday: {
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  dayText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#000',
  },
  dayNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  dayNumberActive: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 15,
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
  },
  classList: {
    flex: 1,
    padding: 15,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  classIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  classTime: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  classCoach: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  reserveButtonActive: {
    backgroundColor: '#D4AF37',
  },
  reserveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  reserveTextActive: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
});
