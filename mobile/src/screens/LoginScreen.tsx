import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('abel');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please fill in both fields.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Invalid username or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Brand Icon & Title */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>PV</Text>
          </View>
          <Text style={styles.title}>PayVerify Ethiopia</Text>
          <Text style={styles.subtitle}>Restaurant Receipt QR Verification</Text>
        </View>

        {/* Login Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Staff Sign In</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email / Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. abel"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isSubmitting && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* 1-Click Fast Login for Abel (Waiter) */}
          <TouchableOpacity
            style={styles.quickLoginButton}
            onPress={() => {
              setUsername('abel');
              setPassword('password123');
            }}
          >
            <Text style={styles.quickLoginText}>⚡ Quick Fill: Waiter (Abel)</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#022c22', // Dark Emerald
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    color: '#022c22',
    fontSize: 28,
    fontWeight: '900',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#a7f3d0',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#064e3b',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#047857',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginBottom: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d1fae5',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#022c22',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 16,
    padding: 14,
    color: '#ffffff',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#10b981',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#022c22',
    fontSize: 16,
    fontWeight: '900',
  },
  quickLoginButton: {
    marginTop: 14,
    alignItems: 'center',
    padding: 8,
  },
  quickLoginText: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '700',
  },
});
