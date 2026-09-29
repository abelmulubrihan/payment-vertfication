import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { ScanResultScreen } from './src/screens/ScanResultScreen';
import { TransactionSavedScreen } from './src/screens/TransactionSavedScreen';
import { DailyTransactionsScreen } from './src/screens/DailyTransactionsScreen';
import { TransactionDetailScreen } from './src/screens/TransactionDetailScreen';
import { PresetsScreen } from './src/screens/PresetsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

const RootNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#022c22' },
        animation: 'slide_from_right',
      }}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Scanner" component={ScannerScreen} />
          <Stack.Screen name="ScanResult" component={ScanResultScreen} />
          <Stack.Screen name="TransactionSaved" component={TransactionSavedScreen} />
          <Stack.Screen name="DailyTransactions" component={DailyTransactionsScreen} />
          <Stack.Screen name="MyTransactions" component={DailyTransactionsScreen} />
          <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Presets" component={PresetsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}
