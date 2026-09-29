import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView
} from 'react-native';
import { Transaction } from '../types';

export const TransactionSavedScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation
}) => {
  const { transaction }: { transaction: Transaction } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon Badge */}
        <View style={styles.successBadge}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        <Text style={styles.title}>Transaction Recorded</Text>
        <Text style={styles.subtitle}>Payment receipt permanently recorded</Text>

        {/* Receipt Snapshot Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Provider:</Text>
            <Text style={styles.value}>{transaction.provider_display_name || transaction.provider}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Reference:</Text>
            <Text style={styles.refValue}>{transaction.reference_number || transaction.invoice_number || 'N/A'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={styles.amountValue}>
              {transaction.amount ? `${Number(transaction.amount).toFixed(2)} ETB` : 'N/A'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>{transaction.payment_time || 'Just now'}</Text>
          </View>
        </View>

        {/* Done Button */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#022c22',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  checkIcon: {
    fontSize: 40,
    color: '#022c22',
    fontWeight: '900',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6ee7b7',
    marginTop: 4,
    marginBottom: 30,
  },
  card: {
    width: '100%',
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#047857',
  },
  label: {
    color: '#a7f3d0',
    fontSize: 14,
    fontWeight: '700',
  },
  value: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  refValue: {
    color: '#34d399',
    fontSize: 15,
    fontWeight: '900',
  },
  amountValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  doneButton: {
    width: '100%',
    backgroundColor: '#10b981',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    color: '#022c22',
    fontSize: 17,
    fontWeight: '900',
  },
});
