-- supabase/migrations/enable_rls_and_policies.sql
-- 全てのテーブルにRLSを有効化し、認証済みユーザーにフルアクセスを許可するポリシーを設定

-- ========== テーブルごとのRLS有効化とポリシー作成 ==========

-- 1. skills テーブル
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access all skills"
ON public.skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. time_slots テーブル
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access all time_slots"
ON public.time_slots FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. supporters テーブル
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access all supporters"
ON public.supporters FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. service_users テーブル
ALTER TABLE public.service_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access all service_users"
ON public.service_users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. activity_statuses テーブル
ALTER TABLE public.activity_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access all activity_statuses"
ON public.activity_statuses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. activities テーブル
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access all activities"
ON public.activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. supporter_skills テーブル (中間テーブル)
ALTER TABLE public.supporter_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access all supporter_skills"
ON public.supporter_skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. supporter_schedules テーブル (中間テーブル)
ALTER TABLE public.supporter_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access all supporter_schedules"
ON public.supporter_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);