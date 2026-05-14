// ═══════════════════════════════════════════════
// CATEGORY REPOSITORY
// ═══════════════════════════════════════════════

import { supabase } from '../../../lib/supabase';
import { Category, CreateCategory } from '../../../core/models/types';
import { DefaultCategories, CategoryIcons } from '../../../theme/tokens';

export interface CategoryRepository {
  getAll(userId: string): Promise<Category[]>;
  create(category: CreateCategory): Promise<Category>;
  update(id: string, data: Partial<Category>): Promise<Category>;
  delete(id: string): Promise<void>;
  seedDefaults(userId: string): Promise<void>;
}

export class CategoryRepositoryImpl implements CategoryRepository {
  async getAll(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) throw error;
    return data || [];
  }

  async create(category: CreateCategory): Promise<Category> {
    const { data, error } = await supabase.from('categories').insert(category).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  }

  async seedDefaults(userId: string): Promise<void> {
    const existing = await this.getAll(userId);
    if (existing.length > 0) return;

    const categories = DefaultCategories.map(cat => ({
      user_id: userId,
      name: cat.name,
      icon: cat.icon,
      color_hex: cat.colorHex,
      budget_amount: 0,
      is_default: true,
    }));

    const { error } = await supabase.from('categories').insert(categories);
    if (error) console.log('Error sembrando categorías:', error);
  }
}
