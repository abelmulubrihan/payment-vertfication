import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, RefreshControl, StatusBar
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { mobileApi } from '../services/api';
import { offlineQueue } from '../storage/offlineQueue';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [todayCount, setTodayCount] = useState<number>(0);
  const [todayTotal, setTodayTotal] = useState<number>(0);
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const daily = await mobileApi.getDailyTransactions();
      setTodayCount(daily.total_count);
      setTodayTotal(daily.total_amount);
      const queueCount = await offlineQueue.count();
      setOfflineCount(queueCount);
    } catch (err) {
      console.warn('Network load error', err);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    // Try syncing offline batch if any
    if (offlineCount > 0) {
      setSyncStatus('Synchronizing offline queue...');
      const res = await mobileApi.syncOfflineBatch();
      setSyncStatus(`Synced ${res.synced} receipts!`);
      setTimeout(() => setSyncStatus(null), 2500);
      await loadData();
    }
    setIsRefreshing(false);
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Abel';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#022c22" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {/* Top Greeting Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning, {firstName}</Text>
            <Text style={styles.restaurantName}>
              {user?.restaurant_name || 'Habesha Cultural Restaurant'} • {user?.branch_name || 'Bole'}
            </Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user?.role || 'WAITER'}</Text>
          </View>
        </View>

        {/* Offline Sync Banner if pending */}
        {offlineCount > 0 && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerTitle}>
              ⚡ {offlineCount} Scans Saved Locally (Offline)
            </Text>
            <Text style={styles.offlineBannerSubtitle}>
              Pull down to synchronize with server.
            </Text>
          </View>
        )}

        {syncStatus && (
          <View style={styles.syncToast}>
            <Text style={styles.syncToastText}>{syncStatus}</Text>
          </View>
        )}

        {/* Summary Metric Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.metricCardPrimary}>
            <Text style={styles.metricLabelPrimary}>Today's Total</Text>
            <Text style={styles.metricValuePrimary}>
              {todayTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB
            </Text>
            <Text style={styles.metricSubtitlePrimary}>Calculated from receipt records</Text>
          </View>

          <View style={styles.metricCardSecondary}>
            <Text style={styles.metricLabelSecondary}>Today's Transactions</Text>
            <Text style={styles.metricValueSecondary}>{todayCount}</Text>
            <Text style={styles.metricSubtitleSecondary}>Scanned & recorded</Text>
          </View>
        </View>

        {/* Primary Scan Button (Section 5 & 24) */}
        <TouchableOpacity
          style={styles.primaryScanButton}
          onPress={() => navigation.navigate('Scanner')}
          activeOpacity={0.85}
        >
          <View style={styles.scanIconWrapper}>
            <Text style={styles.scanIconText}>⛶</Text>
          </View>
          <Text style={styles.primaryScanText}>Scan Payment QR</Text>
        </TouchableOpacity>

        {/* Secondary Navigation Action Buttons */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('DailyTransactions')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionButtonText}>Today's Transactions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('MyTransactions')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionButtonText}>My Transactions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Reports')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionButtonText}>Financial Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Presets')}
          >
            <Text style={styles.actionIcon}>✨</Text>
            <Text style={styles.actionButtonText}>Ethiopian Presets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionButtonText}>Profile & Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#022c22', // Dark Emerald
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  restaurantName: {
    fontSize: 12,
    color: '#6ee7b7',
    fontWeight: '600',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
  },
  offlineBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  offlineBannerTitle: {
    color: '#fde68a',
    fontSize: 13,
    fontWeight: '800',
  },
  offlineBannerSubtitle: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  syncToast: {
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  syncToastText: {
    color: '#022c22',
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 12,
  },
  summaryContainer: {
    gap: 12,
    marginBottom: 20,
  },
  metricCardPrimary: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#10b981',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  metricLabelPrimary: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValuePrimary: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    marginVertical: 4,
  },
  metricSubtitlePrimary: {
    color: '#6ee7b7',
    fontSize: 11,
  },
  metricCardSecondary: {
    backgroundColor: '#022c22',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabelSecondary: {
    color: '#d1fae5',
    fontSize: 13,
    fontWeight: '700',
  },
  metricValueSecondary: {
    color: '#34d399',
    fontSize: 22,
    fontWeight: '900',
  },
  metricSubtitleSecondary: {
    color: '#64748b',
    fontSize: 11,
  },
  primaryScanButton: {
    backgroundColor: '#10b981',
    borderRadius: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  scanIconWrapper: {
    marginRight: 10,
  },
  scanIconText: {
    fontSize: 22,
    color: '#022c22',
    fontWeight: '900',
  },
  primaryScanText: {
    color: '#022c22',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 20,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
