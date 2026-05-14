// ═══════════════════════════════════════════════
// JOSE GASTOS — APP STATE (Equivalente a @Observable AppState de SwiftUI)
// Maneja el estado global de la app con React Context
// ═══════════════════════════════════════════════

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorageInstance from '@react-native-async-storage/async-storage';

// ── TIPOS ──
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';
export type NetworkStatus = 'online' | 'offline';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  mainCurrency: string;
  timezone: string;
  plan: string;
}

export interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  syncStatus: SyncStatus;
  selectedCurrency: string;
  networkStatus: NetworkStatus;
  hasSeenOnboarding: boolean;
  isLoading: boolean;
}

// ── ACCIONES ──
type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_SYNC_STATUS'; payload: SyncStatus }
  | { type: 'SET_CURRENCY'; payload: string }
  | { type: 'SET_NETWORK'; payload: NetworkStatus }
  | { type: 'SET_ONBOARDING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGOUT' };

// ── ESTADO INICIAL ──
const initialState: AppState = {
  currentUser: null,
  isAuthenticated: false,
  syncStatus: 'idle',
  selectedCurrency: 'COP',
  networkStatus: 'online',
  hasSeenOnboarding: false,
  isLoading: true,
};

// ── REDUCER ──
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload, isAuthenticated: !!action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };
    case 'SET_CURRENCY':
      return { ...state, selectedCurrency: action.payload };
    case 'SET_NETWORK':
      return { ...state, networkStatus: action.payload };
    case 'SET_ONBOARDING':
      return { ...state, hasSeenOnboarding: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGOUT':
      return { ...initialState, isLoading: false, hasSeenOnboarding: true };
    default:
      return state;
  }
}

// ── CONTEXT ──
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ── PROVIDER ──
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Cargar estado inicial (Onboarding + Sesión)
    (async () => {
      try {
        const seen = await AsyncStorageInstance.getItem('hasSeenOnboarding');
        dispatch({ type: 'SET_ONBOARDING', payload: seen === 'true' });

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          dispatch({
            type: 'SET_USER',
            payload: {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || '',
              mainCurrency: 'COP',
              timezone: 'America/Bogota',
              plan: 'free',
            },
          });
        }
      } catch (e) {
        console.error('Error inicializando app:', e);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();

    // Escuchar cambios de red
    const unsubscribeNet = NetInfo.addEventListener((netState) => {
      dispatch({ type: 'SET_NETWORK', payload: netState.isConnected ? 'online' : 'offline' });
    });

    // Escuchar cambios de sesión de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ? {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || '',
        mainCurrency: 'COP',
        timezone: 'America/Bogota',
        plan: 'free',
      } : null;

      // Solo disparar si el usuario realmente cambió para evitar loops de renderizado
      if (JSON.stringify(state.currentUser) !== JSON.stringify(newUser)) {
        dispatch({ type: 'SET_USER', payload: newUser });
      }
    });

    return () => {
      unsubscribeNet();
      subscription.unsubscribe();
    };
  }, []);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

// ── HOOK ──
export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState debe usarse dentro de AppStateProvider');
  return ctx;
}
