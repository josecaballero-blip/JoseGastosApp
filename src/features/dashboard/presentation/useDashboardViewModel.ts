// ═══════════════════════════════════════════════
// DASHBOARD VIEWMODEL (Presentation Layer)
// Maneja el estado de la vista y llama a los UseCases
// ═══════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDI } from '../../../core/DIContainer';
import { useAppState } from '../../../core/AppState';
import { Expense } from '../../../core/models/types';
import { SyncService } from '../../../core/sync/SyncService';

const CACHE_KEY = 'dashboard_cache_v1';

export function useDashboardViewModel() {
  const { getDashboardStats, getMonthlyExpenses } = useDI();
  const { state } = useAppState();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  const userId = state.currentUser?.id;

  // Cargar desde caché al iniciar
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${userId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setBalance(parsed.balance || 0);
          setIncome(parsed.income || 0);
          setExpenses(parsed.expenses || 0);
          setRecentExpenses(parsed.recentExpenses || []);
          setIsLoading(false); // Quitar loading si hay caché
        }
      } catch (e) {
        console.log('Error loading cache');
      }
    };
    if (userId) loadCache();
  }, [userId]);

  const loadData = useCallback(async (refresh = false) => {
    if (!userId) return;
    if (refresh) setIsRefreshing(true);
    else if (!refresh && recentExpenses.length === 0) setIsLoading(true);

    try {
      const date = new Date();
      const stats = await getDashboardStats.execute(userId, date.getFullYear(), date.getMonth() + 1);
      const allExpenses = await getMonthlyExpenses.execute(userId, date.getFullYear(), date.getMonth() + 1);

      setIncome(stats.income);
      setExpenses(stats.expenses);
      setBalance(stats.balance);
      const recent = allExpenses.slice(0, 5);
      setRecentExpenses(recent);

      // Guardar en caché
      await AsyncStorage.setItem(`${CACHE_KEY}_${userId}`, JSON.stringify({
        balance: stats.balance,
        income: stats.income,
        expenses: stats.expenses,
        recentExpenses: recent
      }));

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, getDashboardStats, getMonthlyExpenses]);

  // Carga inicial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Escuchar cambios en tiempo real (SyncService)
  useEffect(() => {
    const unsubscribe = SyncService.shared().addListener((event) => {
      if (event.table === 'expenses') {
        loadData();
      }
    });

    return () => unsubscribe();
  }, [loadData]);

  return {
    user: state.currentUser,
    isLoading,
    isRefreshing,
    balance,
    income,
    expenses,
    recentExpenses,
    refreshData: () => loadData(true),
  };
}
