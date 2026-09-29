import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Platform
} from 'react-native';
import { Transaction } from '../types';

export const TransactionDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation
}) => {
  const { transaction }: { transaction: Transaction } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Transaction Details</Text>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.providerBadge}>
            {transaction.provider_display_name || transaction.provider}
          </Text>
          <Text style={styles.amountValue}>
            {transaction.amount ? `${Number(transaction.amount).toFixed(2)} ETB` : 'N/A'}
          </Text>
          <Text style={styles.refSub}>
            Ref: {transaction.reference_number || transaction.invoice_number || 'N/A'}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Payer Name:</Text>
            <Text style={styles.val}>{transaction.payer_name || 'Customer'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Payer Account:</Text>
            <Text style={styles.valMono}>{transaction.payer_account_masked || 'Hidden / Masked'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Receiver:</Text>
            <Text style={styles.val}>{transaction.receiver_name || transaction.restaurant_name || 'Restaurant'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Date & Time:</Text>
            <Text style={styles.val}>{transaction.payment_date} {transaction.payment_time}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>QR Status:</Text>
            <Text style={styles.valEmerald}>{transaction.qr_status}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Receipt Status:</Text>
            <Text style={styles.val}>{transaction.receipt_status}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Scanned By:</Text>
            <Text style={styles.val}>{transaction.scanned_by_user_name || 'Staff'}</Text>
          </View>
        </View>

        {/* Immutable Notice */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            🔒 Financial values are immutable after recording.
          </Text>
        </View>

        {/* Raw QR Payload */}
        <View style={styles.rawCard}>
          <Text style={styles.rawLabel}>Raw QR Payload:</Text>
          <Text style={styles.rawText}>{transaction.qr_payload}</Text>
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
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#064e3b',
    marginRight: 16,
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
  amountCard: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  providerBadge: {
    backgroundColor: '#022c22',
    color: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
  },
  refSub: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#047857',
  },
  label: {
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: '700',
  },
  val: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  valMono: {
    color: '#cbd5e1',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  valEmerald: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '800',
  },
  noticeBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  rawCard: {
    backgroundColor: '#022c22',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 20,
    padding: 16,
  },
  rawLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  rawText: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
