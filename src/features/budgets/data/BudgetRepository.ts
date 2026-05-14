// ═══════════════════════════════════════════════
// BUDGET REPOSITORY
// ═══════════════════════════════════════════════

import { supabase } from '../../../lib/supabase';
import { Budget, CreateBudget } from '../../../core/models/types';

export interface BudgetRepository {
  getAll(userId: string, year: number, month: number): Promise<Budget[]>;
  create(budget: CreateBudget): Promise<Budget>;
  update(id: string, data: Partial<Budget>): Promise<Budget>;
  delete(id: string): Promise<void>;
}

export class BudgetRepositoryImpl implements BudgetRepository {
  async getAll(userId: string, year: number, month: number): Promise<Budget[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*, categories(name, icon, color_hex)')
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month);
    if (error) throw error;
    return data || [];
  }

  async create(budget: CreateBudget): Promise<Budget> {
    const { data, error } = await supabase.from('budgets').insert(budget).select('*, categories(name, icon, color_hex)').single();
    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Partial<Budget>): Promise<Budget> {
    const { categories, ...clean } = updates as any;
    const { data, error } = await supabase.from('budgets').update(clean).eq('id', id).select('*, categories(name, icon, color_hex)').single();
    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw error;
  }
}
