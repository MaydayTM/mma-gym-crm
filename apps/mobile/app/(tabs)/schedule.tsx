import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Image, Dimensions } from 'react-native';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useClasses, formatClassTime, ClassCategory } from '../../hooks/useClasses';
import { useReservations } from '../../hooks/useReservations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_BUTTON_WIDTH = 48;
const DAY_BUTTON_MARGIN = 4;
const DAY_TOTAL_WIDTH = DAY_BUTTON_WIDTH + DAY_BUTTON_MARGIN * 2;

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
];

const DAY_LABELS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

const CATEGORY_TABS: { key: ClassCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'group_session', label: 'Groepslessen' },
  { key: 'personal_session', label: 'Personal Training' },
  { key: 'course', label: 'Cursussen' },
];

const disciplineIcons: Record<string, string> = {
  bjj: 'body',
  mma: 'hand-left',
  kickboxing: 'flash',
  wrestling: 'fitness',
  judo: 'body',
  'luta-livre': 'body',
  'kids-bjj': 'happy',
  'muay-thai': 'flash',
  boksen: 'hand-left',
  default: 'barbell',
};

function getDates(weekOffset: number): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // Monday of current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  // Shift by weekOffset * 7
  monday.setDate(monday.getDate() + weekOffset * 7);

  const dates: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export default function ScheduleScreen() {
  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<ClassCategory | 'all'>('all');
  const [reservedClasses, setReservedClasses] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const dayScrollRef = useRef<ScrollView>(null);

  const dates = useMemo(() => getDates(weekOffset), [weekOffset]);

  // Find today's index in the dates array
  const todayIndex = dates.findIndex(d => d.toDateString() === today.toDateString());
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex >= 0 ? todayIndex : 0);

  // Reset to first day when week changes (unless today is visible)
  useEffect(() => {
    const idx = dates.findIndex(d => d.toDateString() === today.toDateString());
    setSelectedDayIndex(idx >= 0 ? idx : 0);
  }, [weekOffset]);

  // Auto-scroll to selected day
  useEffect(() => {
    if (dayScrollRef.current && selectedDayIndex > 0) {
      const scrollX = Math.max(0, selectedDayIndex * DAY_TOTAL_WIDTH - (SCREEN_WIDTH - DAY_TOTAL_WIDTH) / 2);
      dayScrollRef.current.scrollTo({ x: scrollX, animated: true });
    }
  }, [selectedDayIndex, weekOffset]);

  const selectedDate = dates[selectedDayIndex];
  const dayOfWeek = selectedDate.getDay();

  // Determine the month/year header from selected date
  const headerMonth = MONTH_NAMES[selectedDate.getMonth()];
  const headerYear = selectedDate.getFullYear();

  const categoryFilter = selectedCategory === 'all' ? undefined : selectedCategory;
  const { classes, isLoading, error, refetch } = useClasses({ dayOfWeek, category: categoryFilter });
  const { makeReservation, cancelReservation, getMyReservation, isLoading: reservationLoading } = useReservations();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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
    } else {
      setReservedClasses(new Set());
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
    return disciplineIcons[disciplineSlug] || disciplineIcons.default;
  };

  const navigateWeek = (direction: -1 | 1) => {
    setWeekOffset(prev => prev + direction);
  };

  const goToToday = () => {
    setWeekOffset(0);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Month header with navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity style={styles.navArrow} onPress={() => navigateWeek(-1)}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday}>
          <Text style={styles.monthTitle}>{headerMonth} {headerYear}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navArrow} onPress={() => navigateWeek(1)}>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 14-day selector */}
      <ScrollView
        ref={dayScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {dates.map((date, index) => {
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = selectedDayIndex === index;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                isSelected && styles.dayButtonActive,
                isToday && !isSelected && styles.dayButtonToday,
              ]}
              onPress={() => setSelectedDayIndex(index)}
            >
              <Text style={[
                styles.dayText,
                isSelected && styles.dayTextActive,
                isWeekend && !isSelected && styles.dayTextWeekend,
              ]}>
                {DAY_LABELS[date.getDay()]}
              </Text>
              <Text style={[
                styles.dayNumber,
                isSelected && styles.dayNumberActive,
              ]}>
                {date.getDate()}
              </Text>
              {isToday && !isSelected && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryBar}
        contentContainerStyle={styles.categoryBarContent}
      >
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.categoryTab, isActive && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(tab.key)}
            >
              <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                {tab.label}
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
          {selectedCategory !== 'all' && (
            <TouchableOpacity style={styles.retryButton} onPress={() => setSelectedCategory('all')}>
              <Text style={styles.retryText}>Toon alle categorieën</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.classList}
          contentContainerStyle={styles.classListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
          }
        >
          {classes.map((cls) => {
            const isReserved = reservedClasses.has(cls.id);
            const hasImage = !!cls.discipline?.image_url;
            return (
              <View key={cls.id} style={styles.classCard}>
                {/* Discipline image or icon fallback */}
                <View style={styles.classImageContainer}>
                  {hasImage ? (
                    <Image
                      source={{ uri: cls.discipline!.image_url! }}
                      style={styles.classImage}
                    />
                  ) : (
                    <View style={styles.classIconFallback}>
                      <Ionicons
                        name={getIconName(cls.discipline?.slug) as any}
                        size={28}
                        color="#D4AF37"
                      />
                    </View>
                  )}
                </View>

                {/* Class info */}
                <View style={styles.classInfo}>
                  <Text style={styles.className} numberOfLines={1}>{cls.name}</Text>
                  <Text style={styles.classTime}>
                    <Ionicons name="time-outline" size={13} color="#D4AF37" />
                    {'  '}{formatClassTime(cls.start_time)} - {formatClassTime(cls.end_time)}
                  </Text>
                  {cls.coach && (
                    <View style={styles.coachRow}>
                      {cls.coach.profile_picture_url ? (
                        <Image
                          source={{ uri: cls.coach.profile_picture_url }}
                          style={styles.coachAvatar}
                        />
                      ) : (
                        <View style={styles.coachAvatarFallback}>
                          <Text style={styles.coachInitial}>
                            {cls.coach.first_name?.[0] || '?'}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.classCoach}>
                        {cls.coach.first_name} {cls.coach.last_name}
                      </Text>
                    </View>
                  )}
                  {cls.max_capacity && (
                    <Text style={styles.spotsText}>
                      <Ionicons name="people-outline" size={12} color="#666" />
                      {'  '}Max {cls.max_capacity} plaatsen
                    </Text>
                  )}
                </View>

                {/* Reserve button */}
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
                      <Ionicons name="checkmark-circle" size={18} color="#000" />
                    </>
                  ) : (
                    <Text style={styles.reserveText}>Reserveer</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
          {/* Bottom spacing */}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Month header
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  // Day selector
  daySelector: {
    maxHeight: 85,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  daySelectorContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 0,
  },
  dayButton: {
    width: DAY_BUTTON_WIDTH,
    height: 66,
    borderRadius: 14,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: DAY_BUTTON_MARGIN,
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
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayTextActive: {
    color: '#000',
  },
  dayTextWeekend: {
    color: '#555',
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
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D4AF37',
    marginTop: 3,
  },

  // Category tabs
  categoryBar: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  categoryBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  categoryTabActive: {
    backgroundColor: '#D4AF37',
  },
  categoryTabText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#000',
    fontWeight: '700',
  },

  // Loading / empty states
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
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
  },

  // Class list
  classList: {
    flex: 1,
  },
  classListContent: {
    padding: 15,
  },

  // Class card
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  classImageContainer: {
    marginRight: 14,
  },
  classImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#222',
  },
  classIconFallback: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  classInfo: {
    flex: 1,
    gap: 3,
  },
  className: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  classTime: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  coachAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#333',
  },
  coachAvatarFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachInitial: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: '700',
  },
  classCoach: {
    color: '#888',
    fontSize: 13,
  },
  spotsText: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },

  // Reserve button
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginLeft: 8,
  },
  reserveButtonActive: {
    backgroundColor: '#D4AF37',
    width: 38,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  reserveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
