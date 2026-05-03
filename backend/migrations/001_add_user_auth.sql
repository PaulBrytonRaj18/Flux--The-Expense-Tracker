-- Flux: Add Supabase Auth — user_id columns + RLS policies
-- Run this in Supabase SQL Editor after enabling Email Auth in Dashboard

-- 1. Add user_id columns to all data tables
-- Using VARCHAR(255) to match SQLAlchemy String type. Supabase user IDs are UUIDs which fit fine.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE expenses   ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE goals      ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE settings   ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- 2. Add index for faster user-scoped queries
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id   ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id      ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id   ON settings(user_id);

-- 3. Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings   ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies — each user can only access their own data
-- Note: RLS works with Supabase client SDK. Backend bypasses RLS via service role key
-- or direct PostgreSQL connection. These policies protect direct Supabase API access.

-- Categories
CREATE POLICY "Users can view own categories"       ON categories FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own categories"     ON categories FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own categories"     ON categories FOR UPDATE TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own categories"     ON categories FOR DELETE TO authenticated USING (auth.uid()::text = user_id);

-- Expenses
CREATE POLICY "Users can view own expenses"         ON expenses FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own expenses"       ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own expenses"       ON expenses FOR UPDATE TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own expenses"       ON expenses FOR DELETE TO authenticated USING (auth.uid()::text = user_id);

-- Goals
CREATE POLICY "Users can view own goals"            ON goals FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own goals"          ON goals FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own goals"          ON goals FOR UPDATE TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own goals"          ON goals FOR DELETE TO authenticated USING (auth.uid()::text = user_id);

-- Settings
CREATE POLICY "Users can view own settings"         ON settings FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own settings"       ON settings FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own settings"       ON settings FOR UPDATE TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own settings"       ON settings FOR DELETE TO authenticated USING (auth.uid()::text = user_id);
