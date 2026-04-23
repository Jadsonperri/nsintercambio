
-- Profiles table (1 per auth user)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  age INTEGER,
  country TEXT,
  city TEXT,
  about TEXT,
  -- Academic
  education_level TEXT,
  english_level TEXT, -- A1..C2
  ielts_score NUMERIC,
  toefl_score INTEGER,
  -- Financial
  monthly_income NUMERIC,
  monthly_expenses NUMERIC,
  current_savings NUMERIC,
  budget_goal NUMERIC,
  -- Goals
  target_country TEXT, -- USA, CANADA, BOTH
  main_goal TEXT,     -- sport, study, hybrid
  -- Documents
  has_passport BOOLEAN DEFAULT false,
  has_transcript BOOLEAN DEFAULT false,
  documents_progress INTEGER DEFAULT 0,
  -- Behavior
  willingness TEXT,
  daily_time TEXT,
  commitment_level TEXT,
  -- Avatar menu / global
  monthly_focus TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Public read for username availability check
CREATE POLICY "Username availability check" ON public.profiles FOR SELECT USING (true);

-- Universities (global, shared)
CREATE TABLE public.universities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL, -- USA, CANADA
  state TEXT NOT NULL,
  city TEXT,
  type TEXT NOT NULL,     -- community_college, college, university
  nature TEXT NOT NULL,   -- public, private
  division TEXT,          -- NCAA_D1, NCAA_D2, NCAA_D3, NAIA, NJCAA, NONE
  estimated_cost_usd INTEGER,
  scholarship_available BOOLEAN DEFAULT false,
  acceptance_chance TEXT, -- low, medium, high
  latitude NUMERIC,
  longitude NUMERIC,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view universities" ON public.universities FOR SELECT USING (true);

CREATE INDEX idx_universities_country ON public.universities(country);
CREATE INDEX idx_universities_state ON public.universities(state);

-- Favorites
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, university_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Pipeline
CREATE TABLE public.pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interest', -- interest, email_sent, response, applied, accepted, rejected
  interest_level TEXT DEFAULT 'medium',    -- low, medium, high
  email_sent BOOLEAN DEFAULT false,
  response_received BOOLEAN DEFAULT false,
  applied BOOLEAN DEFAULT false,
  notes TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, university_id)
);

ALTER TABLE public.pipeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pipeline" ON public.pipeline FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER pipeline_updated_at BEFORE UPDATE ON public.pipeline FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
