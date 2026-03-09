
-- Player progress table for level-based system
CREATE TABLE IF NOT EXISTS public.daily_zip_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  current_level integer NOT NULL DEFAULT 1,
  total_score integer NOT NULL DEFAULT 0,
  total_games_played integer NOT NULL DEFAULT 0,
  best_time_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.daily_zip_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view progress for leaderboard" ON public.daily_zip_progress FOR SELECT USING (true);
CREATE POLICY "Users can insert own progress" ON public.daily_zip_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.daily_zip_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all progress" ON public.daily_zip_progress FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Level scores table
CREATE TABLE IF NOT EXISTS public.daily_zip_level_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  level_number integer NOT NULL,
  time_seconds integer NOT NULL,
  score integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, level_number)
);

ALTER TABLE public.daily_zip_level_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view level scores" ON public.daily_zip_level_scores FOR SELECT USING (true);
CREATE POLICY "Users can insert own level scores" ON public.daily_zip_level_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage level scores" ON public.daily_zip_level_scores FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_zip_progress;
