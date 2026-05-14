import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity, 
  Alert, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing, Radius, Shadows } from '../theme/tokens';
import { JGButton, JGTextField } from '../components/UI';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedEmail = await SecureStore.getItemAsync('jg_email');
        const savedPassword = await SecureStore.getItemAsync('jg_password');
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (e) {
        console.error('Error loading credentials', e);
      }
    };
    loadCredentials();
  }, []);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Campos requeridos', 'Por favor ingresa tus datos.');
    }
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (error) throw error;
        Alert.alert('¡Cuenta creada!', 'Verifica tu correo para continuar.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (rememberMe) {
          await SecureStore.setItemAsync('jg_email', email);
          await SecureStore.setItemAsync('jg_password', password);
        } else {
          await SecureStore.deleteItemAsync('jg_email');
          await SecureStore.deleteItemAsync('jg_password');
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onLogin();
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometric = async () => {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    if (!hardware) return;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Acceso a Jose Gastos',
      fallbackLabel: 'Usar contraseña'
    });

    if (result.success) {
      setIsLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          onLogin();
        } else {
          const savedEmail = await SecureStore.getItemAsync('jg_email');
          const savedPassword = await SecureStore.getItemAsync('jg_password');
          if (savedEmail && savedPassword) {
            const { error } = await supabase.auth.signInWithPassword({ email: savedEmail, password: savedPassword });
            if (error) throw error;
            onLogin();
          } else {
            Alert.alert('Face ID no disponible', 'Primero inicia sesión manualmente y marca "Recordar usuario".');
          }
        }
      } catch (err: any) {
        Alert.alert('Error', err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.logoContainer}>
          <LinearGradient colors={Colors.gradients.primary as any} style={styles.logoBg}>
            <Image source={require('../../assets/logo_jg.png')} style={styles.logo} resizeMode="contain" />
          </LinearGradient>
          <Text style={styles.appName}>JOSE GASTOS</Text>
          <Text style={styles.appTagline}>Finanzas Premium Inteligentes</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.formCard}>
          <Text style={styles.title}>{isSignUp ? 'Empezar ahora' : 'Bienvenido'}</Text>
          <Text style={styles.subtitle}>{isSignUp ? 'Crea una cuenta para tomar el control.' : 'Inicia sesión para ver tu balance.'}</Text>

          {isSignUp && (
            <JGTextField 
              placeholder="Nombre Completo" 
              value={name} 
              onChangeText={setName} 
              icon="account-outline" 
              style={styles.input} 
            />
          )}

          <JGTextField 
            placeholder="Correo Electrónico" 
            value={email} 
            onChangeText={setEmail} 
            icon="email-outline" 
            keyboardType="email-address"
            style={styles.input} 
          />

          <JGTextField 
            placeholder="Contraseña" 
            value={password} 
            onChangeText={setPassword} 
            icon="lock-outline" 
            secureTextEntry 
            style={styles.input} 
          />

          {!isSignUp && (
            <TouchableOpacity 
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={rememberMe ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} 
                size={22} 
                color={rememberMe ? Colors.mediumBlue : Colors.light.textSecondary} 
              />
              <Text style={styles.rememberText}>Recordar mis datos</Text>
            </TouchableOpacity>
          )}

          <JGButton 
            title={isSignUp ? 'Unirme ahora' : 'Entrar'} 
            onPress={handleEmailLogin} 
            isLoading={isLoading} 
            style={styles.mainBtn}
          />

          {!isSignUp && (
            <TouchableOpacity onPress={handleBiometric} style={styles.faceIdBtn}>
              <MaterialCommunityIcons name="face-recognition" size={28} color={Colors.mediumBlue} />
              <Text style={styles.faceIdText}>Ingresar con Biometría</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.footerBtn}>
           <Text style={styles.footerText}>
             {isSignUp ? '¿Ya tienes cuenta? ' : '¿Eres nuevo aquí? '}
             <Text style={styles.footerTextAction}>{isSignUp ? 'Inicia Sesión' : 'Regístrate'}</Text>
           </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: 80, paddingBottom: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoBg: { width: 84, height: 84, borderRadius: 24, alignItems: 'center', justifyContent: 'center', ...Shadows.coloredBlue as any },
  logo: { width: 50, height: 50 },
  appName: { fontSize: 24, fontWeight: '900', color: Colors.darkBlue, marginTop: 15, letterSpacing: 1 },
  appTagline: { fontSize: 13, color: Colors.light.textSecondary, fontWeight: '600', marginTop: 4 },
  formCard: { backgroundColor: '#FFF', borderRadius: Radius.xxl, padding: Spacing.xl, ...Shadows.strong as any },
  title: { fontSize: 28, fontWeight: '900', color: Colors.darkBlue, marginBottom: 5, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, marginBottom: 25, fontWeight: '500' },
  input: { marginBottom: 15 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginLeft: 5 },
  rememberText: { marginLeft: 10, fontSize: 14, color: Colors.light.textSecondary, fontWeight: '600' },
  mainBtn: { marginTop: 10 },
  faceIdBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 25 },
  faceIdText: { fontSize: 15, fontWeight: '700', color: Colors.mediumBlue },
  footerBtn: { marginTop: 30, alignItems: 'center' },
  footerText: { fontSize: 14, color: Colors.light.textSecondary, fontWeight: '500' },
  footerTextAction: { color: Colors.mediumBlue, fontWeight: '800' },
});
