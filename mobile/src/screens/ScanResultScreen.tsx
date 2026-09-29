import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { QRDecodeResult } from '../types';
import { mobileApi } from '../services/api';
import { offlineQueue } from '../storage/offlineQueue';

export const ScanResultScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { decodeResult }: { decodeResult: QRDecodeResult } = route.params;
  const [isSaving, setIsSaving] = useState(false);

  const { draft, is_duplicate, duplicate_info } = decodeResult;

  const handleSave = async () => {
    setIsSaving(true);
    const txData = {
      provider: draft.provider,
      provider_display_name: draft.provider_display_name,
      reference_number: draft.reference_number,
      transaction_number: draft.transaction_number,
      invoice_number: draft.invoice_number,
      payer_name: draft.payer_name,
      payer_account_masked: draft.payer_account_masked,
      receiver_name: draft.receiver_name,
      receiver_account_masked: draft.receiver_account_masked,
      amount: draft.amount,
      service_charge: draft.service_charge || 0.0,
      vat: draft.vat || 0.0,
      total_debited: draft.total_debited || draft.amount,
      currency: draft.currency || 'ETB',
      payment_date: draft.payment_date,
      payment_time: draft.payment_time,
      qr_payload: draft.qr_payload,
      verification_url: draft.verification_url,
      qr_status: draft.qr_status,
      idempotency_key: `mobile_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      allow_duplicate: is_duplicate
    };

    try {
      // Try online first
      const savedTx = await mobileApi.createTransaction(txData);
      navigation.replace('TransactionSaved', { transaction: savedTx });
    } catch (err: any) {
      // If offline / network error, save to local offline queue!
      if (!err.response || err.message === 'Network Error' || err.code === 'ECONNABORTED') {
        await offlineQueue.addToQueue(txData);
        Alert.alert(
          'Offline Mode',
          'Internet is unavailable. Transaction has been saved locally — waiting for synchronization.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      } else {
        const errorDetail = err.response?.data?.detail;
        Alert.alert(
          'Could not record transaction',
          typeof errorDetail === 'string' ? errorDetail : 'Duplicate reference number already saved.'
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan Result</Text>
          <Text style={styles.headerSubtitle}>Receipt details extracted from QR payload</Text>
        </View>

        {/* Duplicate Warning Banner (Section 10) */}
        {is_duplicate && duplicate_info && (
          <View style={styles.duplicateAlert}>
            <Text style={styles.duplicateTitle}>⚠ Duplicate Transaction</Text>
            <Text style={styles.duplicateSubtitle}>
              This reference number has already been recorded.
            </Text>
            <View style={styles.duplicateDetails}>
              <Text style={styles.duplicateInfoRow}>
                Recorded: <Text style={styles.boldText}>{duplicate_info.recorded_at}</Text>
              </Text>
              <Text style={styles.duplicateInfoRow}>
                Scanned by: <Text style={styles.boldText}>{duplicate_info.scanned_by}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Missing Fields Indicator */}
        {draft.missing_fields_warning && !is_duplicate && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Some receipt information could not be extracted.
            </Text>
          </View>
        )}

        {/* Structured Transaction Fields Preview (Section 5) */}
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Payment Provider:</Text>
            <Text style={styles.fieldValueBold}>{draft.provider_display_name || draft.provider}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Reference No:</Text>
            <Text style={styles.fieldValueRef}>{draft.reference_number || draft.invoice_number || 'N/A'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Amount:</Text>
            <Text style={styles.fieldValueAmount}>
              {draft.amount !== null && draft.amount !== undefined ? `${Number(draft.amount).toFixed(2)} ETB` : 'N/A'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Payment Date:</Text>
            <Text style={styles.fieldValue}>{draft.payment_date || 'N/A'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Payment Time:</Text>
            <Text style={styles.fieldValue}>{draft.payment_time || 'N/A'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>QR Status:</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{draft.qr_status}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Verification URL:</Text>
            <Text style={styles.fieldValueUrl}>
              {draft.verification_url ? 'Available' : 'None'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#022c22" />
            ) : (
              <Text style={styles.saveButtonText}>Save Transaction</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6ee7b7',
    marginTop: 2,
  },
  duplicateAlert: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  duplicateTitle: {
    color: '#fde68a',
    fontSize: 15,
    fontWeight: '900',
  },
  duplicateSubtitle: {
    color: '#fef3c7',
    fontSize: 12,
    marginTop: 4,
  },
  duplicateDetails: {
    backgroundColor: '#022c22',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  duplicateInfoRow: {
    color: '#94a3b8',
    fontSize: 11,
    marginVertical: 2,
  },
  boldText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  warningBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#047857',
  },
  fieldLabel: {
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: '700',
  },
  fieldValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  fieldValueBold: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  fieldValueRef: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  fieldValueAmount: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  fieldValueUrl: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#022c22',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
  },
  actionContainer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#022c22',
    fontSize: 16,
    fontWeight: '900',
  },
  cancelButton: {
    backgroundColor: '#064e3b',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#d1fae5',
    fontSize: 14,
    fontWeight: '700',
  },
});
