import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

const MOCK_CLASSES = [
  {
    id: '1',
    name: 'BJJ Fundamentals',
    time: '19:00 - 20:30',
    coach: 'Mehdi',
    discipline: 'bjj',
    reserved: false,
  },
  {
    id: '2',
    name: 'MMA',
    time: '20:30 - 22:00',
    coach: 'Kevin',
    discipline: 'mma',
    reserved: true,
  },
  {
    id: '3',
    name: 'No-Gi',
    time: '12:00 - 13:30',
    coach: 'Mehdi',
    discipline: 'bjj',
    reserved: false,
  },
];

const disciplineIcons: Record<string, string> = {
  bjj: 'body',
  mma: 'hand-left',
  kickboxing: 'flash',
};

export default function ScheduleScreen() {
  const [selectedDay, setSelectedDay] = useState(2); // Wednesday

  return (
    <View style={styles.container}>
      {/* Day selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {DAYS.map((day, index) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              selectedDay === index && styles.dayButtonActive,
            ]}
            onPress={() => setSelectedDay(index)}
          >
            <Text style={[
              styles.dayText,
              selectedDay === index && styles.dayTextActive,
            ]}>
              {day}
            </Text>
            <Text style={[
              styles.dayNumber,
              selectedDay === index && styles.dayNumberActive,
            ]}>
              {20 + index}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Classes list */}
      <ScrollView style={styles.classList}>
        {MOCK_CLASSES.map((cls) => (
          <View key={cls.id} style={styles.classCard}>
            <View style={styles.classIcon}>
              <Ionicons
                name={disciplineIcons[cls.discipline] as any || 'fitness'}
                size={24}
                color="#D4AF37"
              />
            </View>
            <View style={styles.classInfo}>
              <Text style={styles.className}>{cls.name}</Text>
              <Text style={styles.classTime}>{cls.time}</Text>
              <Text style={styles.classCoach}>Coach: {cls.coach}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.reserveButton,
                cls.reserved && styles.reserveButtonActive,
              ]}
            >
              {cls.reserved ? (
                <>
                  <Ionicons name="checkmark" size={16} color="#000" />
                  <Text style={styles.reserveTextActive}>Gereserveerd</Text>
                </>
              ) : (
                <Text style={styles.reserveText}>Reserveer</Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  daySelector: {
    maxHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  daySelectorContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
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
