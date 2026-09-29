import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, QRDecodeResult, Transaction } from '../types';
import { offlineQueue } from '../storage/offlineQueue';

// For local Android emulator 10.0.2.2, for physical device localhost or computer IP
export const API_BASE_URL = 'http://10.0.2.2:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@payverify_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const mobileApi = {
  login: async (username_or_email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { username_or_email, password });
    return res.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  decodeQr: async (qr_payload: string): Promise<QRDecodeResult> => {
    const res = await apiClient.post('/qr/decode', { qr_payload });
    return res.data;
  },

  createTransaction: async (data: any): Promise<Transaction> => {
    const res = await apiClient.post('/transactions', data);
    return res.data;
  },

  getDailyTransactions: async (): Promise<{ total_count: number; total_amount: number; items: Transaction[] }> => {
    const res = await apiClient.get('/transactions/daily');
    return res.data;
  },

  getMyTransactions: async (userId: string): Promise<{ total_count: number; total_amount: number; items: Transaction[] }> => {
    const res = await apiClient.get('/transactions', { params: { scanned_by_user_id: userId, limit: 100 } });
    return res.data;
  },

  getPresets: async () => {
    const res = await apiClient.get('/demo/sample-qrs');
    return res.data;
  },

  syncOfflineBatch: async (): Promise<{ synced: number; failed: number }> => {
    const queue = await offlineQueue.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    const transactions = queue.map(item => item.data);
    try {
      const res = await apiClient.post('/transactions/sync', { transactions });
      const { results } = res.data;

      // Remove succeeded or already existing duplicates from local queue
      for (const r of results) {
        if (r.status === 'success' || r.status === 'duplicate') {
          await offlineQueue.removeFromQueue(r.idempotency_key);
        }
      }
      return { synced: res.data.synced_count + res.data.duplicates_count, failed: res.data.failed_count };
    } catch (err) {
      console.warn('Sync failed - internet still unavailable', err);
      return { synced: 0, failed: queue.length };
    }
  }
};
