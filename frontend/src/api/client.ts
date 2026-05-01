import { supabase } from '../lib/supabase';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    headers,
    ...options,
  });

  if (res.status === 401) {
    await supabase.auth.signOut();
    window.location.reload();
    throw new Error('Session expired');
  }

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  budget_limit: number;
}

export interface Expense {
  id: number;
  amount: number;
  category_id: number;
  description: string;
  date: string;
  satisfaction_score: number;
  is_recurring: boolean;
  recurring_id: string | null;
  category: Category;
}

export interface SafeToSpend {
  total: number;
  daily: number;
  weekly: number;
  percentage: number;
  status: 'healthy' | 'caution' | 'danger';
  color: string;
}

export interface SpendingSummary {
  today: number;
  this_week: number;
  this_month: number;
}

export interface CategoryBreakdown {
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface GhostAlert {
  recurring_id: string;
  description: string;
  category: string;
  monthly_cost: number;
  annual_cost: number;
  satisfaction_trend: number[];
  recommendation: string;
}

export interface Dashboard {
  safe_to_spend: SafeToSpend;
  spending_summary: SpendingSummary;
  category_breakdown: CategoryBreakdown[];
  spending_trend: { date: string; amount: number }[];
  ghost_alerts: GhostAlert[];
}

export interface EmotionalROI {
  category: string;
  icon: string;
  color: string;
  joy_per_dollar: number;
  total_spent: number;
  avg_satisfaction: number;
}

export interface OpportunityCost {
  category: string;
  total_spent: number;
  projected_value: number;
  years_to_grow: number;
}

export interface Insights {
  emotional_roi: EmotionalROI[];
  opportunity_costs: OpportunityCost[];
  ghost_subscriptions: GhostAlert[];
}

export interface OpportunityCostPrompt {
  amount: number;
  projected_value: number;
  years: number;
  message: string;
}

export interface Settings {
  id: number;
  balance: number;
  committed_bills: number;
  goal_savings: number;
  privacy_mode: boolean;
  investment_rate: number;
  user_age: number;
  retirement_age: number;
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
}

type ToastType = 'success' | 'error' | 'info';
type ToastListener = (msg: string, type: ToastType) => void;

let _toastListener: ToastListener | null = null;

export function onToast(listener: ToastListener) {
  _toastListener = listener;
}

export function showToast(msg: string, type: ToastType = 'success') {
  _toastListener?.(msg, type);
}

export const api = {
  seedData: () => request<{ ok: boolean; message: string }>('/auth/seed', { method: 'POST' }),

  getDashboard: () => request<Dashboard>('/dashboard'),

  getExpenses: (params?: { regret?: boolean; category_id?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.regret) query.set('regret', 'true');
    if (params?.category_id) query.set('category_id', String(params.category_id));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<Expense[]>(`/expenses${qs ? `?${qs}` : ''}`);
  },

  createExpense: (data: {
    amount: number;
    category_id: number;
    description: string;
    satisfaction_score: number;
  }) => request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),

  updateExpense: (id: number, data: {
    amount: number;
    category_id: number;
    description: string;
    satisfaction_score: number;
  }) => request<Expense>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteExpense: (id: number) => request<void>(`/expenses/${id}`, { method: 'DELETE' }),

  getCategories: () => request<Category[]>('/expenses/categories'),

  getInsights: () => request<Insights>('/insights'),

  getOpportunityCost: (amount: number) =>
    request<OpportunityCostPrompt>(`/insights/opportunity-cost?amount=${amount}`),

  getSettings: () => request<Settings>('/settings'),

  updateSettings: (data: Partial<Settings>) =>
    request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  getGoals: () => request<Goal[]>('/goals'),

  createGoal: (data: {
    name: string;
    target_amount: number;
    current_amount?: number;
    deadline?: string | null;
    icon?: string;
  }) => request<Goal>('/goals', { method: 'POST', body: JSON.stringify(data) }),

  updateGoal: (id: number, data: {
    name: string;
    target_amount: number;
    current_amount: number;
    deadline?: string | null;
    icon?: string;
  }) => request<Goal>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteGoal: (id: number) => request<void>(`/goals/${id}`, { method: 'DELETE' }),
};
