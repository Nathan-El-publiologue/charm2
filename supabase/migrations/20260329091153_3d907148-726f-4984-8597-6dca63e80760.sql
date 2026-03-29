
-- Table favoris
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  category varchar(50),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Table gamification
CREATE TABLE public.user_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  streak_days integer DEFAULT 0,
  last_active_date date,
  badges jsonb DEFAULT '[]'::jsonb,
  daily_challenge_completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gamification" ON public.user_gamification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gamification" ON public.user_gamification FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gamification" ON public.user_gamification FOR UPDATE USING (auth.uid() = user_id);

-- Add onboarding_completed to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Update handle_new_user to also create gamification row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  INSERT INTO public.success_metrics (user_id) VALUES (NEW.id);
  INSERT INTO public.user_gamification (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$function$;
