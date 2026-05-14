// ═══════════════════════════════════════════════
// UTILS (Equivalentes a CurrencyFormatter.swift, DateHelper.swift, LocationHelper.swift)
// ═══════════════════════════════════════════════

// ── CURRENCY FORMATTER ──
export function formatCurrency(amount: number, currency: string = 'COP'): string {
  const symbols: Record<string, string> = { COP: '$', USD: '$', EUR: '€', MXN: '$', BRL: 'R$', GBP: '£' };
  const symbol = symbols[currency] || '$';
  return `${symbol}${amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toFixed(0);
}

// ── DATE HELPER ──
export function formatDate(date: string | Date, style: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const optionsMap: Record<'short' | 'medium' | 'long', Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  };
  const options = optionsMap[style];
  return d.toLocaleDateString('es-CO', options);
}

export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

export function isThisMonth(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

export function getMonthName(month: number): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[month - 1] || '';
}

export function daysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── INSIGHTS ENGINE (Equivalente a InsightsEngine de Swift) ──
export interface Insight {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: 'tip' | 'warning' | 'achievement';
}

export function generateInsights(
  expenses: { amount: number; is_income: boolean; category_id?: string; expense_date: string }[],
  categories: { id: string; name: string }[],
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const thisMonth = expenses.filter(e => isThisMonth(e.expense_date) && !e.is_income);
  const totalThisMonth = thisMonth.reduce((s, e) => s + e.amount, 0);

  // Top categoría
  const byCat: Record<string, number> = {};
  thisMonth.forEach(e => { if (e.category_id) byCat[e.category_id] = (byCat[e.category_id] || 0) + e.amount; });
  const topCatId = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  if (topCatId) {
    const cat = categories.find(c => c.id === topCatId[0]);
    insights.push({
      id: '1', icon: 'chart-bar', title: `Mayor gasto: ${cat?.name || 'Categoría'}`,
      description: `Has gastado ${formatCurrency(topCatId[1])} en ${cat?.name} este mes.`, type: 'tip',
    });
  }

  // Días sin gastar
  const daysWithExpenses = new Set(thisMonth.map(e => new Date(e.expense_date).getDate()));
  const daysWithout = now.getDate() - daysWithExpenses.size;
  if (daysWithout >= 3) {
    insights.push({
      id: '2', icon: 'star', title: `🌟 ${daysWithout} días sin gastar`,
      description: `¡Increíble autocontrol esta semana!`, type: 'achievement',
    });
  }

  return insights;
}
