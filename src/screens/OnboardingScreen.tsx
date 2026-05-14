import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  SlideInRight, 
  Layout, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from '../theme/tokens';
import { JGButton } from '../components/UI';

const { width } = Dimensions.get('window');

const pages = [
  { 
    icon: 'lightning-bolt' as const, 
    title: 'Registro Instantáneo', 
    desc: 'Escanea tus facturas con IA o registra tus gastos en segundos.', 
    color: Colors.mediumBlue,
    gradient: ['#0A2463', '#3E92CC']
  },
  { 
    icon: 'chart-box' as const, 
    title: 'Análisis Profundo', 
    desc: 'Visualiza a dónde va cada peso con gráficos interactivos premium.', 
    color: '#2ECC71',
    gradient: ['#059669', '#10B981']
  },
  { 
    icon: 'shield-check' as const, 
    title: 'Control Total', 
    desc: 'Define presupuestos, metas de ahorro y toma el control de tu futuro.', 
    color: '#FF9F43',
    gradient: ['#B45309', '#F59E0B']
  },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentPage, setCurrentPage] = useState(0);

  const handleNext = async () => {
    if (currentPage < 2) {
      setCurrentPage(currentPage + 1);
    } else {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      onComplete();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    onComplete();
  };

  const page = pages[currentPage];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />
      
      <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
        <Text style={styles.skipText}>Omitir</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Animated.View 
          key={`icon-${currentPage}`}
          entering={FadeInUp.springify()}
          style={styles.illustrationContainer}
        >
          <LinearGradient
            colors={page.gradient as any}
            style={styles.iconCircle}
          >
            <MaterialCommunityIcons name={page.icon} size={100} color="#FFF" />
          </LinearGradient>
        </Animated.View>

        <Animated.View 
          key={`text-${currentPage}`}
          entering={FadeInDown.springify()}
          style={styles.textContainer}
        >
          <Text style={styles.title}>{page.title}</Text>
          <Text style={styles.desc}>{page.desc}</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {pages.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                i === currentPage && styles.dotActive,
                i === currentPage && { backgroundColor: page.color }
              ]} 
            />
          ))}
        </View>
        <JGButton
          title={currentPage === 2 ? 'Comenzar Experiencia' : 'Siguiente Paso'}
          onPress={handleNext}
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  skipBtn: { alignSelf: 'flex-end', paddingTop: 60, paddingRight: Spacing.xl, minHeight: 44, justifyContent: 'center' },
  skipText: { fontSize: 16, color: Colors.light.textSecondary, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  illustrationContainer: { marginBottom: 40 },
  iconCircle: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center', ...Shadows.strong as any },
  textContainer: { alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '900', color: Colors.darkBlue, textAlign: 'center', marginBottom: 15, letterSpacing: -1 },
  desc: { fontSize: 17, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 26, fontWeight: '500' },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: 60 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.light.border },
  dotActive: { width: 32 },
  nextBtn: { ...Shadows.medium as any },
});
