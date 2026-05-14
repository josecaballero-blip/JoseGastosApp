// ═══════════════════════════════════════════════
// DOMAIN MODELS (Equivalente a Models/ en Swift)
// Tipos puros, sin dependencias de frameworks
// ═══════════════════════════════════════════════

export interface Expense {
  id: string;
  user_id: string;
  category_id?: string;
  category?: string;
  amount: number;
  currency: string;
  amount_base: number;
  description?: string;
  place_name?: string;
  lat?: number;
  lng?: number;
  receipt_url?: string;
  expense_date: string;
  is_income: boolean;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  // Relación (join)
  categories?: { name: string; icon: string; color_hex: string } | null;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color_hex: string;
  budget_amount: number;
  is_default: boolean;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  deadline?: string;
  image_url?: string;
  is_completed: boolean;
  created_at: string;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  amount: number;
  note?: string;
  contributed_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  period_type: 'monthly' | 'weekly' | 'yearly';
  amount: number;
  currency: string;
  year: number;
  month: number;
  created_at: string;
  // Join
  categories?: { name: string; icon: string; color_hex: string } | null;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category_id?: string;
  is_income: boolean;
  day_of_month: number;
  is_active: boolean;
  last_processed_at?: string;
  created_at: string;
  // Join
  categories?: { name: string; icon: string; color_hex: string } | null;
}

export interface FamilyGroup {
  id: string;
  name: string;
  owner_id: string;
  invite_code?: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'member' | 'viewer';
  joined_at: string;
}

// ── UTILIDADES DE TIPO ──
export type CreateExpense = Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'categories'>;
export type CreateCategory = Omit<Category, 'id' | 'created_at'>;
export type CreateGoal = Omit<Goal, 'id' | 'created_at'>;
export type CreateBudget = Omit<Budget, 'id' | 'created_at' | 'categories'>;
