// ═══════════════════════════════════════════════
// DI CONTAINER (Equivalente a DIContainer.swift)
// Inyección de dependencias con React Context
// ═══════════════════════════════════════════════

import React, { createContext, useContext, ReactNode } from 'react';
import { ExpenseRepository, ExpenseRepositoryImpl } from '../features/expenses/data/ExpenseRepository';
import { CategoryRepository, CategoryRepositoryImpl } from '../features/categories/data/CategoryRepository';
import { GoalRepository, GoalRepositoryImpl } from '../features/goals/data/GoalRepository';
import { BudgetRepository, BudgetRepositoryImpl } from '../features/budgets/data/BudgetRepository';

import { 
  GetMonthlyExpensesUseCase, GetMonthlyExpensesUseCaseImpl,
  AddExpenseUseCase, AddExpenseUseCaseImpl,
  GetDashboardStatsUseCase, GetDashboardStatsUseCaseImpl
} from '../features/expenses/domain/ExpenseUseCases';

// ── INTERFAZ DEL CONTENEDOR ──
export interface DIContainerType {
  // Repositorios
  expenseRepo: ExpenseRepository;
  categoryRepo: CategoryRepository;
  goalRepo: GoalRepository;
  budgetRepo: BudgetRepository;
  
  // Casos de Uso (Expenses)
  getMonthlyExpenses: GetMonthlyExpensesUseCase;
  addExpense: AddExpenseUseCase;
  getDashboardStats: GetDashboardStatsUseCase;
}

// ── CONTENEDOR REAL ──
export function createRealContainer(): DIContainerType {
  const expenseRepo = new ExpenseRepositoryImpl();
  const categoryRepo = new CategoryRepositoryImpl();
  const goalRepo = new GoalRepositoryImpl();
  const budgetRepo = new BudgetRepositoryImpl();

  return {
    expenseRepo,
    categoryRepo,
    goalRepo,
    budgetRepo,
    
    getMonthlyExpenses: new GetMonthlyExpensesUseCaseImpl(expenseRepo),
    addExpense: new AddExpenseUseCaseImpl(expenseRepo),
    getDashboardStats: new GetDashboardStatsUseCaseImpl(expenseRepo),
  };
}

// ── CONTEXT ──
const DIContext = createContext<DIContainerType | undefined>(undefined);

export function DIProvider({ children, container }: { children: ReactNode; container?: DIContainerType }) {
  const di = container || createRealContainer();
  return <DIContext.Provider value={di}>{children}</DIContext.Provider>;
}

export function useDI(): DIContainerType {
  const ctx = useContext(DIContext);
  if (!ctx) throw new Error('useDI debe usarse dentro de DIProvider');
  return ctx;
}
