import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { DailyTransactionsPage } from './pages/DailyTransactionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { QRSimulatorPage } from './pages/QRSimulatorPage';
import { UsersPage } from './pages/UsersPage';
import { AuditPage } from './pages/AuditPage';
import { LoginPage } from './pages/LoginPage';
import { QRScannerModal } from './components/QRScannerModal';
import { ScanPreviewModal } from './components/ScanPreviewModal';
import { QRDecodeResult } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1
    }
  }
});

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<QRDecodeResult | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleDecoded = (result: QRDecodeResult) => {
    setScanResult(result);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar onOpenScanner={() => setIsScannerOpen(true)} />
      
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDecoded={handleDecoded}
      />

      {/* Global Scan Result Preview Modal */}
      {scanResult && (
        <ScanPreviewModal
          decodeResult={scanResult}
          onClose={() => setScanResult(null)}
          onSuccess={() => {
            queryClient.invalidateQueries();
          }}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <DashboardPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/daily"
              element={
                <ProtectedLayout>
                  <DailyTransactionsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/scanner-simulator"
              element={
                <ProtectedLayout>
                  <QRSimulatorPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedLayout>
                  <ReportsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedLayout>
                  <UsersPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedLayout>
                  <AuditPage />
                </ProtectedLayout>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
