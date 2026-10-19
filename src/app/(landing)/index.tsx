import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Dimensions,
  Platform 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const LandingPage: React.FC = () => {
  if (Platform.OS === 'web') {
    return (
      <WebView
        source={{ uri: 'http://localhost:8081' }}
        style={{ flex: 1 }}
        startInLoadingState={false}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Study Track</Text>
            <Text style={styles.heroSubtitle}>
              Plataforma Inteligente de Organização de Estudos
            </Text>
            <Text style={styles.heroDescription}>
              Transforme sua rotina de estudos com uma plataforma integrada que combina 
              cronogramas personalizados, análise de desempenho e recomendações inteligentes.
            </Text>
            <View style={styles.heroButtons}>
              <View style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Começar Agora</Text>
              </View>
              <View style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Saiba Mais</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroVisual}>
            <View style={styles.gradientCircle1} />
            <View style={styles.gradientCircle2} />
          </View>
        </View>