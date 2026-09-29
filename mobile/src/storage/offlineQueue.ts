import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_STORAGE_KEY = '@payverify_offline_queue';

export interface QueuedTransaction {
  idempotency_key: string;
  data: any;
  created_at: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
}

export const offlineQueue = {
  async getQueue(): Promise<QueuedTransaction[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to get offline queue', e);
      return [];
    }
  },

  async addToQueue(transactionData: any): Promise<QueuedTransaction> {
    const queue = await this.getQueue();
    const item: QueuedTransaction = {
      idempotency_key: transactionData.idempotency_key || `offline_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      data: {
        ...transactionData,
        idempotency_key: transactionData.idempotency_key || `offline_${Date.now()}_${Math.random().toString(36).substring(7)}`
      },
      created_at: new Date().toISOString(),
      status: 'PENDING'
    };
    queue.push(item);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    return item;
  },

  async removeFromQueue(idempotencyKey: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter(item => item.idempotency_key !== idempotencyKey);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
  },

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  },

  async count(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }
};
