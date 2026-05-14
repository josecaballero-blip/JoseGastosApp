// ═══════════════════════════════════════════════
// EXPENSE REPOSITORY (Clean Architecture: Data Layer)
// Equivalente a ExpenseRepository.swift
// ═══════════════════════════════════════════════

import { supabase } from '../../../lib/supabase';
import { Expense, CreateExpense } from '../../../core/models/types';

// ── INTERFAZ (Protocolo en Swift) ──
export interface ExpenseRepository {
  getAll(userId: string): Promise<Expense[]>;
  getById(id: string): Promise<Expense | null>;
  getByMonth(userId: string, year: number, month: number): Promise<Expense[]>;
  create(expense: CreateExpense): Promise<Expense>;
  update(id: string, data: Partial<Expense>): Promise<Expense>;
  delete(id: string): Promise<void>;
  getMonthlyTotals(userId: string, year: number, month: number): Promise<{ income: number; expenses: number }>;
}

// ── IMPLEMENTACIÓN REAL (Supabase) ──
export class ExpenseRepositoryImpl implements ExpenseRepository {
  async getAll(userId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, categories(name, icon, color_hex)')
      .eq('user_id', userId)
      .order('expense_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<Expense | null> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, categories(name, icon, color_hex)')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getByMonth(userId: string, year: number, month: number): Promise<Expense[]> {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from('expenses')
      .select('*, categories(name, icon, color_hex)')
      .eq('user_id', userId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async create(expense: CreateExpense): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select('*, categories(name, icon, color_hex)')
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Partial<Expense>): Promise<Expense> {
    const { categories, ...cleanUpdates } = updates as any;
    const { data, error } = await supabase
      .from('expenses')
      .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, categories(name, icon, color_hex)')
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  }

  async getMonthlyTotals(userId: string, year: number, month: number): Promise<{ income: number; expenses: number }> {
    const monthData = await this.getByMonth(userId, year, month);
    const income = monthData.filter(e => e.is_income).reduce((sum, e) => sum + e.amount, 0);
    const expenses = monthData.filter(e => !e.is_income).reduce((sum, e) => sum + e.amount, 0);
    return { income, expenses };
  }
}
