-- ============================================================
-- Life Tracker - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: activities
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  emoji       TEXT NOT NULL DEFAULT '📌',
  category    TEXT NOT NULL DEFAULT 'günlük',
  is_preset   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: time_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS time_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id       UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  start_time        TIMESTAMPTZ,
  end_time          TIMESTAMPTZ,
  duration_minutes  INTEGER,
  mood              INTEGER CHECK (mood BETWEEN 1 AND 5),
  notes             TEXT,
  log_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: goals
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id      UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('target', 'limit')),
  target_minutes   INTEGER NOT NULL,
  period           TEXT NOT NULL CHECK (period IN ('weekly', 'monthly')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_time_logs_active ON time_logs(user_id) WHERE end_time IS NULL AND start_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals      ENABLE ROW LEVEL SECURITY;

-- Activities RLS
CREATE POLICY "Users can manage own activities"
  ON activities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Time logs RLS
CREATE POLICY "Users can manage own time_logs"
  ON time_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Goals RLS
CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SEED: Preset activities for new users (via trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_preset_activities()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.activities (user_id, name, emoji, category, is_preset)
  SELECT NEW.id, name, emoji, category, true
  FROM (VALUES
    ('Uyku', '😴', 'sağlık'),
    ('Egzersiz', '🏋️', 'spor'),
    ('Koşu', '🏃', 'spor'),
    ('Yürüyüş', '🚶', 'spor'),
    ('Bisiklet', '🚴', 'spor'),
    ('Yüzme', '🏊', 'spor'),
    ('Yoga', '🧘', 'sağlık'),
    ('Meditasyon', '🧘‍♂️', 'sağlık'),
    ('Okuma', '📚', 'kişisel gelişim'),
    ('Çalışma', '💼', 'iş'),
    ('Kodlama', '💻', 'iş'),
    ('Toplantı', '🤝', 'iş'),
    ('Yemek Yapma', '🍳', 'ev'),
    ('Temizlik', '🧹', 'ev'),
    ('Alışveriş', '🛒', 'ev'),
    ('Sosyal Medya', '📱', 'eğlence'),
    ('Oyun', '🎮', 'eğlence'),
    ('Film/Dizi', '🎬', 'eğlence'),
    ('Müzik', '🎵', 'eğlence'),
    ('Arkadaşlar', '👥', 'sosyal'),
    ('Aile', '👨‍👩‍👧‍👦', 'sosyal'),
    ('Dil Öğrenme', '🌍', 'kişisel gelişim'),
    ('Günlük Yazma', '📝', 'kişisel gelişim'),
    ('Kahve/Çay', '☕', 'günlük'),
    ('Ulaşım', '🚗', 'günlük'),
    ('Hobi', '🎨', 'eğlence')
  ) AS preset(name, emoji, category)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_preset_activities();
