// ═══════════════════════════════════════════════
// GOAL REPOSITORY
// ═══════════════════════════════════════════════

import { supabase } from '../../../lib/supabase';
import { Goal, CreateGoal, GoalContribution } from '../../../core/models/types';

export interface GoalRepository {
  getAll(userId: string): Promise<Goal[]>;
  getById(id: string): Promise<Goal | null>;
  create(goal: CreateGoal): Promise<Goal>;
  update(id: string, data: Partial<Goal>): Promise<Goal>;
  delete(id: string): Promise<void>;
  contribute(goalId: string, amount: number, note?: string): Promise<void>;
  getContributions(goalId: string): Promise<GoalContribution[]>;
}

export class GoalRepositoryImpl implements GoalRepository {
  async getAll(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<Goal | null> {
    const { data, error } = await supabase.from('goals').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async create(goal: CreateGoal): Promise<Goal> {
    const { data, error } = await supabase.from('goals').insert(goal).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Partial<Goal>): Promise<Goal> {
    const { data, error } = await supabase.from('goals').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
  }

  async contribute(goalId: string, amount: number, note?: string): Promise<void> {
    // Insertar contribución
    const { error: contribError } = await supabase
      .from('goal_contributions')
      .insert({ goal_id: goalId, amount, note });
    if (contribError) throw contribError;

    // Actualizar monto actual de la meta
    const goal = await this.getById(goalId);
    if (goal) {
      const newAmount = goal.current_amount + amount;
      await this.update(goalId, {
        current_amount: newAmount,
        is_completed: newAmount >= goal.target_amount,
      });
    }
  }

  async getContributions(goalId: string): Promise<GoalContribution[]> {
    const { data, error } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('goal_id', goalId)
      .order('contributed_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
}
