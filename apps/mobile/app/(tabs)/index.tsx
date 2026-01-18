import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function QRCodeScreen() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      {/* Header with profile */}
      <View style={styles.header}>
        <Text style={styles.logo}>FightFlow</Text>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#D4AF37" />
        </View>
      </View>

      {/* QR Code placeholder */}
      <View style={styles.qrContainer}>
        <View style={styles.qrPlaceholder}>
          <Ionicons name="qr-code" size={150} color="#333" />
          <Text style={styles.qrText}>QR Code komt hier</Text>
          <Text style={styles.qrSubtext}>Token: {refreshKey}</Text>
        </View>
      </View>

      <Text style={styles.instruction}>Scan voor toegang</Text>

      {/* Refresh button */}
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.refreshText}>Vernieuw</Text>
      </TouchableOpacity>

      {/* Next class preview */}
      <View style={styles.nextClass}>
        <View style={styles.divider} />
        <View style={styles.classInfo}>
          <Text style={styles.classLabel}>Volgende les</Text>
          <Text style={styles.className}>BJJ Fundamentals - 19:00</Text>
        </View>
        <TouchableOpacity style={styles.classLink}>
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 280,
    height: 280,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  qrSubtext: {
    marginTop: 5,
    fontSize: 12,
    color: '#999',
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
