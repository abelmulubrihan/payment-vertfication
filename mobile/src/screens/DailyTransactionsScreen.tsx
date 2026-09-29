import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, Platform
} from 'react-native';
import { mobileApi } from '../services/api';
import { Transaction } from '../types';
import { useAuth } from '../context/AuthContext';

export const DailyTransactionsScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route
}) => {
  const isMyTransactionsOnly = route.name === 'MyTransactions';
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let data;
      if (isMyTransactionsOnly && user) {
        data = await mobileApi.getMyTransactions(user.id);
      } else {
        data = await mobileApi.getDailyTransactions();
      }
      setTransactions(data.items);
      setTotalCount(data.total_count);
      setTotalAmount(data.total_amount);
    } catch (err) {
      console.warn('Failed to load transactions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>{item.payment_time || item.created_at.slice(11, 16)}</Text>
        </View>
        <View style={styles.itemMeta}>
          <Text style={styles.providerName}>{item.provider_display_name || item.provider}</Text>
          <Text style={styles.refText}>Ref: {item.reference_number || item.invoice_number || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.itemRight}>
        <Text style={styles.amountText}>
          {item.amount ? `${Number(item.amount).toFixed(2)} ETB` : 'N/A'}
        </Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{item.receipt_status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Summary (Section 11) */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {isMyTransactionsOnly ? 'My Transactions' : "Today's Transactions"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isMyTransactionsOnly ? 'Scanned by you' : 'All restaurant staff scans'}
          </Text>
        </View>

        <View style={styles.headerMetrics}>
          <View style={styles.metricBox}>
            <Text style={styles.metricBoxLabel}>Count</Text>
            <Text style={styles.metricBoxValue}>{totalCount}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricBoxLabel}>Total (ETB)</Text>
            <Text style={styles.metricBoxValueEmerald}>
              {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor="#10b981" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions recorded yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#022c22',
  },
  header: {
    padding: 20,
    backgroundColor: '#064e3b',
    borderBottomWidth: 1,
    borderBottomColor: '#047857',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#a7f3d0',
    marginTop: 2,
  },
  headerMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#022c22',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  metricBoxLabel: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricBoxValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  metricBoxValueEmerald: {
    color: '#34d399',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeBadge: {
    backgroundColor: '#022c22',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#047857',
  },
  timeText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  itemMeta: {
    gap: 2,
  },
  providerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  refText: {
    color: '#6ee7b7',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  statusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
});
