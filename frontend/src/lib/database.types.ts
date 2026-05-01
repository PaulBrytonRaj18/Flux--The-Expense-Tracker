export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: { id: number; user_id: string; name: string; icon: string; color: string; budget_limit: number }
        Insert: { id?: number; user_id: string; name: string; icon?: string; color?: string; budget_limit?: number }
        Update: { id?: number; user_id?: string; name?: string; icon?: string; color?: string; budget_limit?: number }
      }
      expenses: {
        Row: { id: number; user_id: string; amount: number; category_id: number; description: string; date: string; satisfaction_score: number; is_recurring: boolean; recurring_id: string | null }
        Insert: { id?: number; user_id: string; amount: number; category_id: number; description?: string; date?: string; satisfaction_score?: number; is_recurring?: boolean; recurring_id?: string | null }
        Update: { id?: number; user_id?: string; amount?: number; category_id?: number; description?: string; date?: string; satisfaction_score?: number; is_recurring?: boolean; recurring_id?: string | null }
      }
      goals: {
        Row: { id: number; user_id: string; name: string; target_amount: number; current_amount: number; deadline: string | null; icon: string }
        Insert: { id?: number; user_id: string; name: string; target_amount: number; current_amount?: number; deadline?: string | null; icon?: string }
        Update: { id?: number; user_id?: string; name?: string; target_amount?: number; current_amount?: number; deadline?: string | null; icon?: string }
      }
      settings: {
        Row: { id: number; user_id: string; balance: number; committed_bills: number; goal_savings: number; privacy_mode: boolean; investment_rate: number; user_age: number; retirement_age: number }
        Insert: { id?: number; user_id: string; balance?: number; committed_bills?: number; goal_savings?: number; privacy_mode?: boolean; investment_rate?: number; user_age?: number; retirement_age?: number }
        Update: { id?: number; user_id?: string; balance?: number; committed_bills?: number; goal_savings?: number; privacy_mode?: boolean; investment_rate?: number; user_age?: number; retirement_age?: number }
      }
    }
  }
}
