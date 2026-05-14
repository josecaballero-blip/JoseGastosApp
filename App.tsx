// ═══════════════════════════════════════════════
// JOSE GASTOS — APP PRINCIPAL (Premium UI Overhaul)
// ═══════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, View, StyleSheet, Text, Image, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeIn, 
  SlideInDown, 
  FadeInDown, 
  SlideInRight, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  interpolate 
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowSound: true,
    shouldShowBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import { Colors, Spacing, Shadows, Radius } from './src/theme/tokens';
import { supabase } from './src/lib/supabase';
import { AppStateProvider, useAppState } from './src/core/AppState';
import { DIProvider } from './src/core/DIContainer';
import { SyncService } from './src/core/sync/SyncService';

import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import SubscriptionsScreen from './src/screens/SubscriptionsScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import { GoalsScreen, ProfileScreen } from './src/screens/GoalsAndProfileScreen';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// ═══════════════════════════════════════════════
// CUSTOM TAB BAR (Premium Floating)
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// CUSTOM TAB BAR (Dark Liquid Glass)
// ═══════════════════════════════════════════════

import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { width: windowWidth } = useWindowDimensions();
  const barPadding = 40;
  const barWidth = windowWidth - barPadding;
  const tabWidth = barWidth / 4;
  
  const translateX = useSharedValue(state.index * tabWidth);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const context = useSharedValue({ x: 0 });

  useEffect(() => {
    translateX.value = withSpring(state.index * tabWidth, { damping: 20, stiffness: 150 });
  }, [state.index, tabWidth]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value };
      isDragging.value = true;
    })
    .onUpdate((event) => {
      translateX.value = context.value.x + event.translationX;
      const speed = Math.abs(event.velocityX);
      scaleX.value = interpolate(speed, [0, 2500], [1, 1.5], 'clamp');
      scaleY.value = interpolate(speed, [0, 2500], [1, 0.7], 'clamp');
    })
    .onEnd((event) => {
      isDragging.value = false;
      scaleX.value = withSpring(1);
      scaleY.value = withSpring(1);

      const finalX = translateX.value;
      const nearestTab = Math.round(finalX / tabWidth);

      if (nearestTab >= 0 && nearestTab < state.routes.length) {
        if (nearestTab !== state.index) {
          runOnJS(navigation.navigate)(state.routes[nearestTab].name);
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          translateX.value = withSpring(state.index * tabWidth, { damping: 20, stiffness: 150 });
        }
      } else {
        translateX.value = withSpring(state.index * tabWidth, { damping: 20, stiffness: 150 });
      }
    });

  const bubbleStyle = useAnimatedStyle(() => {
    const translateStyle = { translateX: translateX.value } as const;
    const scaleXStyle = { scaleX: scaleX.value } as const;
    const scaleYStyle = { scaleY: scaleY.value } as const;

    return {
      transform: [translateStyle, scaleXStyle, scaleYStyle],
      width: tabWidth - 16,
    };
  });

  return (
    <View style={styles.tabBarWrapper}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.tabBarContainer}>
          <BlurView intensity={40} tint="dark" style={styles.tabBarBlur}>
            {/* 1. Gota de fondo (Absolute) */}
            <Animated.View style={[styles.tabBubble, bubbleStyle]}>
              <LinearGradient 
                colors={['#00D2FF', '#3A7BD5']} 
                start={{x:0, y:0}} 
                end={{x:1, y:1}} 
                style={styles.bubbleGradient} 
              />
              <View style={styles.bubbleShine} />
            </Animated.View>

            {/* 2. Contenedor de iconos (Flex) */}
            <View style={styles.tabBarInner}>
              {state.routes.map((route: any, index: number) => {
                const isFocused = state.index === index;
                const iconName = route.name === 'Inicio' ? 'home' :
                                route.name === 'Facturas' ? 'file-document-outline' :
                                route.name === 'Metas' ? 'target' : 'account-outline';

                return (
                  <TouchableOpacity
                    key={route.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate(route.name);
                    }}
                    style={styles.tabItem}
                    activeOpacity={0.8}
                  >
                    <View style={styles.tabItemContent}>
                      <MaterialCommunityIcons
                        name={iconName as any}
                        size={24}
                        color={isFocused ? '#FFFFFF' : '#D0D0D0'}
                      />
                      <Text style={[
                        styles.tabLabel,
                        { color: isFocused ? '#FFFFFF' : '#D0D0D0', fontWeight: isFocused ? '700' : '500' }
                      ]}>
                        {route.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BlurView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function ProfileTab() {
  const { dispatch } = useAppState();
  const handleLogout = async () => {
    SyncService.shared().unsubscribe();
    await supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  };
  return <ProfileScreen onLogout={handleLogout} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Facturas" component={InvoicesScreen} />
      <Tab.Screen name="Metas" component={GoalsScreen} />
      <Tab.Screen name="Perfil" component={ProfileTab} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs" component={MainTabs} />
      <RootStack.Screen name="AddExpense" component={AddExpenseScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <RootStack.Screen name="Subscriptions" component={SubscriptionsScreen} />
      <RootStack.Screen name="Statistics" component={StatisticsScreen} />
      <RootStack.Screen name="Transactions" component={TransactionsScreen} />
    </RootStack.Navigator>
  );
}

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.mediumBlue,
    background: Colors.light.background,
    card: '#FFF',
    text: Colors.light.textPrimary,
    border: 'transparent',
    notification: Colors.red,
  },
};

function RootNavigator() {
  const { state, dispatch } = useAppState();
  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>('Inicio');

  useEffect(() => {
    if (state.isAuthenticated && state.currentUser) {
      SyncService.shared().subscribe(state.currentUser.id);
    }
  }, [state.isAuthenticated, state.currentUser?.id]);

  if (state.isLoading) {
    return (
      <View style={styles.splash}>
        <Animated.Image 
          entering={FadeIn.duration(1000)}
          source={require('./assets/logo_jg.png')} 
          style={styles.splashImage} 
          resizeMode="contain" 
        />
        <ActivityIndicator size="large" color={Colors.mediumBlue} style={{ marginTop: 30 }} />
        <Text style={styles.loadingText}>Preparando tu billetera premium...</Text>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <NavigationContainer 
      theme={MyTheme}
      onStateChange={(navState) => {
        const route = navState?.routes[navState.index];
        let name = route?.name;
        if (name === 'Tabs') {
          const tabState = route.state as any;
          if (tabState) name = tabState.routes[tabState.index].name;
          else name = 'Inicio';
        }
        if (name !== currentRouteName) setCurrentRouteName(name);
      }}
    >
      <StatusBar style="dark" />
      {!state.hasSeenOnboarding ? (
        <OnboardingScreen onComplete={() => dispatch({ type: 'SET_ONBOARDING', payload: true })} />
      ) : !state.isAuthenticated ? (
        <LoginScreen onLogin={() => {}} />
      ) : (
        <>
          <MainNavigator />
          <PremiumFAB currentRouteName={currentRouteName} />
        </>
      )}
    </NavigationContainer>
  );
}

// ═══════════════════════════════════════════════
// PREMIUM FAB COMPONENT
// ═══════════════════════════════════════════════
import { useNavigation } from '@react-navigation/native';

function PremiumFAB({ currentRouteName }: { currentRouteName: string | undefined }) {
  const navigation = useNavigation<any>();
  
  if (!(currentRouteName === 'Inicio' || currentRouteName === 'Metas')) {
    return null;
  }

  return (
    <Animated.View entering={SlideInDown} style={styles.fabContainer}>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          navigation.navigate('AddExpense');
        }}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#FFF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppStateProvider>
        <DIProvider>
          <RootNavigator />
        </DIProvider>
      </AppStateProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: Colors.light.background, alignItems: 'center', justifyContent: 'center' },
  splashImage: { width: 120, height: 120, borderRadius: 24 },
  loadingText: { marginTop: 15, fontSize: 13, color: Colors.light.textSecondary, fontWeight: '600', letterSpacing: 0.5 },
  tabBarWrapper: { position: 'absolute', bottom: 30, left: 20, right: 20, overflow: 'visible', ...Shadows.strong as any },
  tabBarContainer: {
    height: 78,
    borderRadius: 42,
    backgroundColor: 'rgba(18, 20, 30, 0.92)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabBarBlur: { flex: 1, borderRadius: 42, overflow: 'hidden' },
  tabBarInner: { flexDirection: 'row', height: '100%', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  tabBubble: {
    position: 'absolute',
    top: 6,
    left: 8,
    height: '84%',
    borderRadius: 30,
    shadowColor: '#0BF',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 12,
  },
  bubbleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  bubbleShine: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 12,
    opacity: 0.8,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' },
  tabItemContent: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 12, marginTop: 4, textAlign: 'center', letterSpacing: 0.28 },
  fabContainer: { position: 'absolute', bottom: 110, alignSelf: 'center', ...Shadows.coloredBlue as any },
  fab: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: '#0A2463',
    alignItems: 'center', justifyContent: 'center',
  } as any,
});
