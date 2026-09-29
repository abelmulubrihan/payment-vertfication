import axios from 'axios';
import {
  UserProfile, Transaction, ReportData, DashboardMetrics,
  Branch, AuditLog, QRDecodeResult
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('payverify_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired
      localStorage.removeItem('payverify_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username_or_email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { username_or_email, password });
    return res.data;
  },
  getMe: async (): Promise<UserProfile> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

export const qrApi = {
  decode: async (qr_payload: string, branch_id?: string): Promise<QRDecodeResult> => {
    const res = await apiClient.post('/qr/decode', { qr_payload, branch_id });
    return res.data;
  },
  getSampleQrs: async () => {
    const res = await apiClient.get('/demo/sample-qrs');
    return res.data;
  },
  seedDemo: async () => {
    const res = await apiClient.post('/demo/seed');
    return res.data;
  }
};

export const transactionApi = {
  create: async (data: any): Promise<Transaction> => {
    const res = await apiClient.post('/transactions', data);
    return res.data;
  },
  getAll: async (params?: any): Promise<{ total_count: number; total_amount: number; items: Transaction[] }> => {
    const res = await apiClient.get('/transactions', { params });
    return res.data;
  },
  getDaily: async (targetDate?: string, branch_id?: string): Promise<{ total_count: number; total_amount: number; items: Transaction[] }> => {
    const res = await apiClient.get('/transactions/daily', { params: { target_date: targetDate, branch_id } });
    return res.data;
  },
  getById: async (id: string): Promise<Transaction> => {
    const res = await apiClient.get(`/transactions/${id}`);
    return res.data;
  },
  update: async (id: string, data: { receipt_status?: string; notes?: string }): Promise<Transaction> => {
    const res = await apiClient.patch(`/transactions/${id}`, data);
    return res.data;
  },
};

export const reportApi = {
  getDashboard: async (branch_id?: string): Promise<DashboardMetrics> => {
    const res = await apiClient.get('/reports/dashboard', { params: { branch_id } });
    return res.data;
  },
  getPeriodReport: async (periodType: string, params?: any): Promise<ReportData> => {
    const res = await apiClient.get(`/reports/${periodType}`, { params });
    return res.data;
  },
  exportFile: (format: 'csv' | 'excel' | 'pdf', params?: any) => {
    const token = localStorage.getItem('payverify_token');
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_BASE}/reports/export/${format}?${queryParams}`;
    
    // Trigger download with auth headers via fetch
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        const ext = format === 'excel' ? 'xlsx' : format;
        a.download = `PayVerify_Report_${new Date().toISOString().slice(0, 10)}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  }
};

export const userApi = {
  getAll: async (): Promise<UserProfile[]> => {
    const res = await apiClient.get('/users');
    return res.data;
  },
  create: async (data: any): Promise<UserProfile> => {
    const res = await apiClient.post('/users', data);
    return res.data;
  },
  update: async (id: string, data: any): Promise<UserProfile> => {
    const res = await apiClient.patch(`/users/${id}`, data);
    return res.data;
  }
};

export const branchApi = {
  getAll: async (): Promise<Branch[]> => {
    const res = await apiClient.get('/branches');
    return res.data;
  },
  create: async (data: any): Promise<Branch> => {
    const res = await apiClient.post('/branches', data);
    return res.data;
  }
};

export const auditApi = {
  getAll: async (params?: any): Promise<AuditLog[]> => {
    const res = await apiClient.get('/audit-logs', { params });
    return res.data;
  }
};
