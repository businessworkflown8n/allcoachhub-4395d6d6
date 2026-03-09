
-- Daily Zip Puzzles table
CREATE TABLE public.daily_zip_puzzles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  difficulty text NOT NULL DEFAULT 'easy',
  grid_size integer NOT NULL DEFAULT 4,
  puzzle_data jsonb NOT NULL DEFAULT '{}',
  solution_data jsonb NOT NULL DEFAULT '{}',
  scheduled_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Daily Zip Scores table
CREATE TABLE public.daily_zip_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  puzzle_id uuid NOT NULL REFERENCES public.daily_zip_puzzles(id) ON DELETE CASCADE,
  time_seconds integer NOT NULL,
  score integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, puzzle_id)
);

-- Enable RLS
ALTER TABLE public.daily_zip_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_zip_scores ENABLE ROW LEVEL SECURITY;

-- Puzzles policies
CREATE POLICY "Anyone can view active puzzles" ON public.daily_zip_puzzles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage puzzles" ON public.daily_zip_puzzles
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Scores policies
CREATE POLICY "Anyone can view scores" ON public.daily_zip_scores
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own scores" ON public.daily_zip_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage scores" ON public.daily_zip_scores
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated at trigger
CREATE TRIGGER update_daily_zip_puzzles_updated_at
  BEFORE UPDATE ON public.daily_zip_puzzles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
