import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface SiteInformativoProps {
  visible: boolean;
  onClose: () => void;
}

const SiteInformativo: React.FC<SiteInformativoProps> = ({ visible, onClose }) => {
  if (!visible) return null;

  if (Platform.OS === 'web') {
    // Na web, abre em uma nova aba
    React.useEffect(() => {
      const timer = setTimeout(() => {
        window.open('/public/index.html', '_blank');
        onClose();
      }, 100);
      return () => clearTimeout(timer);
    }, []);
    
    return (
      <View style={styles.webContainer}>
        <Text style={styles.webText}>Abrindo site informativo em nova aba...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'file:///android_asset/public/index.html' }}
        style={{ flex: 1 }}
        startInLoadingState={false}
      />
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0a0a0f',
    zIndex: 9999,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
  },
  webText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(185, 139, 232, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default SiteInformativo;