import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, RefreshControl, ActivityIndicator
} from 'react-native';
import { mobileApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const res = await mobileApi.getDailyTransactions(); // or period report
      setReportData(res);
    } catch (e) {
      console.warn('Failed to load report', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [period]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadReport} tintColor="#10b981" />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Financial Reports</Text>
        </View>

        {/* Period Selector Tabs */}
        <View style={styles.periodTabs}>
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, period === p && styles.periodTabActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Revenue ({period.toUpperCase()})</Text>
          <Text style={styles.summaryValue}>
            {reportData ? `${Number(reportData.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB` : '0.00 ETB'}
          </Text>
          <Text style={styles.summaryCount}>
            {reportData?.total_count || 0} verified transactions
          </Text>
        </View>

        {/* Provider Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Breakdown by Payment Provider</Text>
          
          <View style={styles.providerCard}>
            <View style={styles.providerRow}>
              <Text style={styles.providerName}>Telebirr</Text>
              <Text style={styles.providerAmount}>Calculated from receipts</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.providerRow}>
              <Text style={styles.providerName}>Commercial Bank of Ethiopia (CBE)</Text>
              <Text style={styles.providerAmount}>Calculated from receipts</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#022c22',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#064e3b',
    marginRight: 12,
  },
  backBtnText: {
    color: '#34d399',
    fontWeight: '800',
    fontSize: 13,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#064e3b',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  periodTabActive: {
    backgroundColor: '#10b981',
  },
  periodTabText: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '700',
  },
  periodTabTextActive: {
    color: '#022c22',
    fontWeight: '900',
  },
  summaryCard: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4,
  },
  summaryCount: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  providerCard: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 20,
    padding: 16,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#047857',
  },
  providerName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  providerAmount: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
});
