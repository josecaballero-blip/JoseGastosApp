// ═══════════════════════════════════════════════
// EXPENSE USE CASES (Clean Architecture: Domain Layer)
// Lógica de negocio pura, orquesta los repositorios
// ═══════════════════════════════════════════════

import { Expense, CreateExpense } from '../../../core/models/types';
import { ExpenseRepository } from '../data/ExpenseRepository';

// ── PROTOCOLOS (Interfaces) ──
export interface GetMonthlyExpensesUseCase {
  execute(userId: string, year: number, month: number): Promise<Expense[]>;
}

export interface AddExpenseUseCase {
  execute(expense: CreateExpense): Promise<Expense>;
}

export interface GetDashboardStatsUseCase {
  execute(userId: string, year: number, month: number): Promise<{ income: number; expenses: number; balance: number }>;
}

// ── IMPLEMENTACIONES ──

export class GetMonthlyExpensesUseCaseImpl implements GetMonthlyExpensesUseCase {
  constructor(private repository: ExpenseRepository) {}

  async execute(userId: string, year: number, month: number): Promise<Expense[]> {
    return this.repository.getByMonth(userId, year, month);
  }
}

export class AddExpenseUseCaseImpl implements AddExpenseUseCase {
  constructor(private repository: ExpenseRepository) {}

  async execute(expense: CreateExpense): Promise<Expense> {
    if (expense.amount <= 0) throw new Error('El monto debe ser mayor a cero');
    return this.repository.create(expense);
  }
}

export class GetDashboardStatsUseCaseImpl implements GetDashboardStatsUseCase {
  constructor(private repository: ExpenseRepository) {}

  async execute(userId: string, year: number, month: number): Promise<{ income: number; expenses: number; balance: number }> {
    const { income, expenses } = await this.repository.getMonthlyTotals(userId, year, month);
    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }
}
