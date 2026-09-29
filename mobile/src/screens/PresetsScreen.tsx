import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert
} from 'react-native';
import { mobileApi } from '../services/api';

export const PresetsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [presets, setPresets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mobileApi.getPresets().then((data) => {
      setPresets(data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const handleSelectPreset = async (preset: any) => {
    setIsLoading(true);
    try {
      const result = await mobileApi.decodeQr(preset.qr_payload);
      navigation.replace('ScanResult', { decodeResult: result });
    } catch (err: any) {
      Alert.alert('Error', 'Could not decode preset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ethiopian Receipt Presets</Text>
      </View>

      <Text style={styles.subtitle}>
        Tap any realistic Telebirr or CBE receipt to simulate instant QR scanning.
      </Text>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={presets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSelectPreset(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.badge, item.provider === 'CBE' ? styles.badgeCbe : styles.badgeTelebirr]}>
                  <Text style={styles.badgeText}>{item.provider}</Text>
                </View>
                <Text style={styles.amountText}>{item.amount.toFixed(2)} ETB</Text>
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.refText}>Ref: {item.reference}</Text>

              <View style={styles.scanAction}>
                <Text style={styles.scanActionText}>Test Scan ➜</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#022c22',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#064e3b',
    marginRight: 12,
  },
  backButtonText: {
    color: '#34d399',
    fontWeight: '800',
    fontSize: 13,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  subtitle: {
    color: '#a7f3d0',
    fontSize: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTelebirr: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeCbe: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  amountText: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: '900',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  refText: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  scanAction: {
    alignSelf: 'flex-end',
    backgroundColor: '#10b981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  scanActionText: {
    color: '#022c22',
    fontWeight: '800',
    fontSize: 11,
  },
});
