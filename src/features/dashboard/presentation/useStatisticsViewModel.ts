import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDI } from '../../../core/DIContainer';
import { useAppState } from '../../../core/AppState';
import { Expense } from '../../../core/models/types';
import { SyncService } from '../../../core/sync/SyncService';

export type TimeFilter = 'dia' | 'semana' | 'mes' | 'año';

export function formatCurrencyShort(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
}

export function useStatisticsViewModel() {
  const { expenseRepo } = useDI();
  const { state } = useAppState();

  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<TimeFilter>('mes');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  
  const loadData = useCallback(async () => {
    if (!state.currentUser) return;
    try {
      setIsLoading(true);
      const allExpenses = await expenseRepo.getAll(state.currentUser.id);
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [state.currentUser, expenseRepo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = SyncService.shared().addListener((event) => {
      if (event.table === 'expenses') loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  const handleSetFilter = (f: TimeFilter) => {
    setFilter(f);
    setReferenceDate(new Date()); // Volver al presente al cambiar filtro
  };

  const navigatePrevious = () => {
    const newDate = new Date(referenceDate);
    if (filter === 'dia') newDate.setDate(newDate.getDate() - 1);
    if (filter === 'semana') newDate.setDate(newDate.getDate() - 7);
    if (filter === 'mes') newDate.setMonth(newDate.getMonth() - 1);
    if (filter === 'año') newDate.setFullYear(newDate.getFullYear() - 1);
    setReferenceDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(referenceDate);
    if (filter === 'dia') newDate.setDate(newDate.getDate() + 1);
    if (filter === 'semana') newDate.setDate(newDate.getDate() + 7);
    if (filter === 'mes') newDate.setMonth(newDate.getMonth() + 1);
    if (filter === 'año') newDate.setFullYear(newDate.getFullYear() + 1);
    if (newDate > new Date()) return; // No ir al futuro
    setReferenceDate(newDate);
  };

  const periodLabel = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    if (filter === 'dia') {
      if (referenceDate.toDateString() === new Date().toDateString()) return 'Hoy';
      return `${referenceDate.getDate()} ${months[referenceDate.getMonth()]}`;
    }
    if (filter === 'semana') {
      const start = new Date(referenceDate);
      start.setDate(referenceDate.getDate() - referenceDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]}`;
    }
    if (filter === 'mes') return `${months[referenceDate.getMonth()]} ${referenceDate.getFullYear()}`;
    if (filter === 'año') return `${referenceDate.getFullYear()}`;
    return '';
  }, [filter, referenceDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      switch (filter) {
        case 'dia':
          return expenseDate.toDateString() === referenceDate.toDateString();
        case 'semana':
          const startOfWeek = new Date(referenceDate);
          startOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay());
          startOfWeek.setHours(0,0,0,0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          return expenseDate >= startOfWeek && expenseDate < endOfWeek;
        case 'mes':
          return expenseDate.getMonth() === referenceDate.getMonth() && expenseDate.getFullYear() === referenceDate.getFullYear();
        case 'año':
          return expenseDate.getFullYear() === referenceDate.getFullYear();
      }
    });
  }, [expenses, filter, referenceDate]);

  const fallbackColors = ['#4C6EF5', '#FF8787', '#FCC419', '#51CF66', '#339AF0', '#845EF7', '#FF922B'];

  const categoryData = useMemo(() => {
    const grouped: Record<string, { value: number; color: string; label: string }> = {};
    let colorIndex = 0;
    
    filteredExpenses.filter(e => !e.is_income).forEach(e => {
      const catName = e.categories?.name || 'Otros';
      let color = e.categories?.color_hex ? `#${e.categories.color_hex}` : fallbackColors[colorIndex % fallbackColors.length];
      if (!grouped[catName]) {
        grouped[catName] = { value: 0, color, label: catName };
        colorIndex++;
      }
      grouped[catName].value += e.amount;
    });

    return Object.values(grouped).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const totalSpent = useMemo(() => {
    return categoryData.reduce((sum, cat) => sum + cat.value, 0);
  }, [categoryData]);

  const barData = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number; label: string }> = {};
    
    filteredExpenses.forEach(e => {
      const date = new Date(e.expense_date);
      let key = '';
      let label = '';
      
      switch (filter) {
        case 'dia': 
          key = date.getHours().toString(); 
          label = `${key}:00`; 
          break;
        case 'semana': 
          key = date.getDate().toString(); 
          label = `${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()]} ${key}`; 
          break;
        case 'mes': 
          key = date.getDate().toString(); 
          label = `Día ${key}`; 
          break;
        case 'año': 
          key = date.getMonth().toString(); 
          label = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][date.getMonth()]; 
          break;
      }
      
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0, label };
      if (e.is_income) grouped[key].income += e.amount;
      else grouped[key].expense += e.amount;
    });

    const result: any[] = [];
    Object.values(grouped).forEach(item => {
      // Barra de Ingreso (Verde)
      result.push({
        value: item.income,
        frontColor: '#51CF66',
        gradientColor: '#40C057',
        showGradient: true,
        spacing: 4, // poco espacio entre la verde y la azul
        label: item.label,
        isIncome: true
      });
      // Barra de Gasto (Azul)
      result.push({
        value: item.expense,
        frontColor: '#4C6EF5',
        gradientColor: '#339AF0',
        showGradient: true,
        spacing: filter === 'mes' ? 8 : 16, // más espacio hacia el siguiente grupo
        label: '', 
        isExpense: true
      });
    });

    return result;
  }, [filteredExpenses, filter]);

  const lineData = useMemo(() => {
    let startDate = new Date(referenceDate);
    switch (filter) {
      case 'dia': startDate.setHours(0,0,0,0); break;
      case 'semana': 
        startDate.setDate(startDate.getDate() - startDate.getDay()); 
        startDate.setHours(0,0,0,0);
        break;
      case 'mes': startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1); break;
      case 'año': startDate = new Date(startDate.getFullYear(), 0, 1); break;
    }

    let startingBalance = 0;
    expenses.forEach(e => {
      if (new Date(e.expense_date) < startDate) {
        startingBalance += e.is_income ? e.amount : -e.amount;
      }
    });

    let currentBalance = startingBalance;
    const points: any[] = [];
    
    const sortedFiltered = [...filteredExpenses].sort((a, b) => new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime());
    
    if (sortedFiltered.length === 0) {
      points.push({ value: startingBalance, label: 'Inicio', dataPointText: formatCurrencyShort(startingBalance) });
      points.push({ value: startingBalance, label: 'Fin', dataPointText: formatCurrencyShort(startingBalance) });
    } else {
      points.push({ value: startingBalance, label: 'Inicio' });
      let lastLabel = '';
      sortedFiltered.forEach(e => {
        currentBalance += e.is_income ? e.amount : -e.amount;
        const date = new Date(e.expense_date);
        let label = '';
        if (filter === 'dia') label = `${date.getHours()}:00`;
        else if (filter === 'semana') label = `${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()]} ${date.getDate()}`;
        else if (filter === 'mes') label = `Día ${date.getDate()}`;
        else label = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][date.getMonth()];
        
        points.push({ 
          value: currentBalance, 
          label: label === lastLabel ? '' : label 
        });
        lastLabel = label;
      });
      // Asegurar que el gráfico termine en el valor actual si estamos en el presente
      if (referenceDate.getMonth() === new Date().getMonth() && referenceDate.getFullYear() === new Date().getFullYear()) {
        points.push({ value: currentBalance, label: 'Hoy' });
      }
    }

    return points;
  }, [expenses, filteredExpenses, filter, referenceDate]);

  return {
    isLoading,
    filter,
    setFilter: handleSetFilter,
    periodLabel,
    navigatePrevious,
    navigateNext,
    categoryData,
    totalSpent,
    barData,
    lineData
  };
}
