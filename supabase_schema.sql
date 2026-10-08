-- ============================================
-- StallMaster Supabase Database Schema
-- Paste and Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/choyvaovlmeicovtgtib/sql
-- ============================================

-- 1. STALL CONFIGURATION & STAFF SYNC TABLE
CREATE TABLE IF NOT EXISTS stall_config (
  id TEXT PRIMARY KEY DEFAULT 'default_stall',
  manager_pin TEXT NOT NULL DEFAULT '1234',
  staff_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial default row
INSERT INTO stall_config (id, manager_pin, staff_list)
VALUES ('default_stall', '1234', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 2. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TEXT DEFAULT '12:00',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  cash_amount DECIMAL(12,2) DEFAULT 0,
  upi_amount DECIMAL(12,2) DEFAULT 0,
  card_amount DECIMAL(12,2) DEFAULT 0,
  customer_count INT DEFAULT 1,
  packaging_type TEXT DEFAULT 'dine_in',
  packaging_cost DECIMAL(12,2) DEFAULT 0,
  cogs DECIMAL(12,2) DEFAULT 0,
  items JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  category_id TEXT DEFAULT 'cat-miscellaneous',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'Cash',
  vendor_name TEXT DEFAULT '',
  receipt_url TEXT,
  inventory_key TEXT,
  item_qty DECIMAL(12,2),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WASTAGE LOG TABLE
CREATE TABLE IF NOT EXISTS wastage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_name TEXT NOT NULL,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  estimated_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  reason TEXT DEFAULT 'Spoiled',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CASH CLOSURES TABLE
CREATE TABLE IF NOT EXISTS closures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_cash DECIMAL(12,2) DEFAULT 0,
  total_cash_sales DECIMAL(12,2) DEFAULT 0,
  total_cash_expenses DECIMAL(12,2) DEFAULT 0,
  expected_cash DECIMAL(12,2) DEFAULT 0,
  actual_cash DECIMAL(12,2) DEFAULT 0,
  difference DECIMAL(12,2) DEFAULT 0,
  staff_name TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ENABLE PERMISSIONS FOR ANON/PUBLIC ACCESS
ALTER TABLE stall_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wastage ENABLE ROW LEVEL SECURITY;
ALTER TABLE closures ENABLE ROW LEVEL SECURITY;

-- Allow read & write access for StallMaster terminals
CREATE POLICY "Allow public all on stall_config" ON stall_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on wastage" ON wastage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on closures" ON closures FOR ALL USING (true) WITH CHECK (true);
