import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Alert, Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { mobileApi } from '../services/api';

export const ScannerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isProcessing) return;
    setScanned(true);
    setIsProcessing(true);

    try {
      const result = await mobileApi.decodeQr(data);
      navigation.replace('ScanResult', { decodeResult: result });
    } catch (err: any) {
      Alert.alert(
        'Scan Error',
        err.response?.data?.detail || 'Could not parse this QR code.',
        [{ text: 'Try Again', onPress: () => { setScanned(false); setIsProcessing(false); } }]
      );
    }
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.permissionText}>Camera permission is required to scan receipt QR codes.</Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.grantButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.presetButton}
          onPress={() => navigation.navigate('Presets')}
        >
          <Text style={styles.presetButtonText}>Use Ethiopian Presets</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Camera Overlay */}
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Payment QR</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scan Frame */}
        <View style={styles.frameContainer}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          <Text style={styles.instructionText}>Place the QR code inside the frame.</Text>
        </View>

        {/* Bottom Presets Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.presetsShortcut}
            onPress={() => navigation.navigate('Presets')}
          >
            <Text style={styles.presetsShortcutText}>✨ Select Sample Receipt (Telebirr / CBE)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Decoding QR Payload...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#022c22',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 20,
  },
  grantButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginBottom: 12,
  },
  grantButtonText: {
    color: '#022c22',
    fontWeight: '800',
    fontSize: 14,
  },
  presetButton: {
    padding: 12,
  },
  presetButtonText: {
    color: '#6ee7b7',
    fontSize: 13,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  frameContainer: {
    alignItems: 'center',
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 24,
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#10b981',
  },
  tl: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  tr: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  bl: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  br: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
  instructionText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bottomBar: {
    padding: 24,
    alignItems: 'center',
  },
  presetsShortcut: {
    backgroundColor: 'rgba(6, 78, 59, 0.85)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  presetsShortcutText: {
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 44, 34, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },
});
