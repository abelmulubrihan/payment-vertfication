import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Staff Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.full_name?.split(' ').map(n => n[0]).join('') || 'AB'}
          </Text>
        </View>

        <Text style={styles.fullName}>{user?.full_name || 'Abel Tesfaye'}</Text>
        <Text style={styles.username}>@{user?.username || 'abel'}</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Role:</Text>
            <Text style={styles.valRole}>{user?.role || 'WAITER'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Restaurant:</Text>
            <Text style={styles.val}>{user?.restaurant_name || 'Habesha Cultural Restaurant'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Branch:</Text>
            <Text style={styles.val}>{user?.branch_name || 'Bole Branch'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Account Status:</Text>
            <Text style={styles.valActive}>Active (Verified)</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#064e3b',
    marginRight: 12,
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
  content: {
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#022c22',
    fontSize: 28,
    fontWeight: '900',
  },
  fullName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  username: {
    fontSize: 13,
    color: '#6ee7b7',
    marginTop: 2,
    marginBottom: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
  valRole: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '900',
  },
  valActive: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutButton: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fca5a5',
    fontSize: 15,
    fontWeight: '800',
  },
});
