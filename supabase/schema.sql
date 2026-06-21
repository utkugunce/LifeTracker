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
  is_custom   BOOLEAN NOT NULL DEFAULT FALSE,
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
  tags              TEXT[] DEFAULT '{}',
  is_pomodoro       BOOLEAN DEFAULT FALSE,
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
-- TABLE: user_streaks
-- ============================================================
CREATE TABLE IF NOT EXISTS user_streaks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id      UUID REFERENCES activities(id) ON DELETE CASCADE,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  last_logged_date DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- ============================================================
-- TABLE: badges (system-wide definitions)
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  icon            TEXT NOT NULL,
  condition_type  TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: user_badges
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id        UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_time_logs_active ON time_logs(user_id) WHERE end_time IS NULL AND start_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE activities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own activities" ON activities FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own time_logs" ON time_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON goals FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own streaks" ON user_streaks FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can read badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Users can manage own user_badges" ON user_badges FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SEED: Badge definitions
-- ============================================================
INSERT INTO badges (name, description, icon, condition_type) VALUES
  ('İlk Adım', 'İlk aktivite kaydını oluşturdun!', '🚀', 'first_log'),
  ('Derin Odaklanma Üstadı', 'Tek seferde 90+ dakika odaklandın!', '🧠', 'deep_focus_90'),
  ('Düzen Lideri', 'Haftalık ev işi hedefine ulaştın!', '🧹', 'weekly_home_goal'),
  ('Haftalık Seri', '7 gün üst üste aktivite girdin!', '🔥', 'streak_7'),
  ('Ay Yıldızı', '30 gün üst üste aktivite girdin!', '⭐', 'streak_30'),
  ('Pomodoro Ustası', '10 pomodoro seansı tamamladın!', '🍅', 'pomodoro_10')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Preset activities for new users (via trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_preset_activities()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.activities (user_id, name, is_custom) VALUES
    (NEW.id, 'Ev İşleri', false),
    (NEW.id, 'Bulaşık Yıkama', false),
    (NEW.id, 'Temizlik', false),
    (NEW.id, 'Yemek Pişirme', false),
    (NEW.id, 'Çalışma', false),
    (NEW.id, 'Toplantı', false),
    (NEW.id, 'E-posta', false),
    (NEW.id, 'Proje', false),
    (NEW.id, 'Spor', false),
    (NEW.id, 'Koşu', false),
    (NEW.id, 'Yoga', false),
    (NEW.id, 'Yürüyüş', false),
    (NEW.id, 'Kitap Okuma', false),
    (NEW.id, 'Ders Çalışma', false),
    (NEW.id, 'Online Kurs', false),
    (NEW.id, 'Sosyal Medya', false),
    (NEW.id, 'Film/Dizi', false),
    (NEW.id, 'Oyun', false),
    (NEW.id, 'Müzik Dinleme', false),
    (NEW.id, 'Kişisel Bakım', false),
    (NEW.id, 'Uyku', false),
    (NEW.id, 'Meditasyon', false),
    (NEW.id, 'Aile Vakti', false),
    (NEW.id, 'Arkadaşlar', false),
    (NEW.id, 'Alışveriş', false),
    (NEW.id, 'Ulaşım', false);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_preset_activities();
