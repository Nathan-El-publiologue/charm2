

# Plan: Ajouter toutes les fonctionnalités proposées

## Scope

6 nouvelles fonctionnalités pour CharmAI:
1. **Mode Entraînement** - Conversation simulée avec l'IA jouant le rôle cible
2. **Gamification** - XP, niveaux, badges, défis quotidiens, streaks
3. **Analyseur de Profil Dating** - Upload capture profil Tinder/Bumble pour feedback IA
4. **Favoris** - Sauvegarder les messages générés qui marchent bien
5. **Onboarding guidé** - Tour interactif pour les nouveaux utilisateurs
6. **Page Profil** - Vue profil utilisateur avec progression et stats

## Database Changes (1 migration)

```sql
-- Table favoris
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  category varchar(50),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
-- RLS: users CRUD own favorites

-- Table gamification
CREATE TABLE public.user_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  streak_days integer DEFAULT 0,
  last_active_date date,
  badges jsonb DEFAULT '[]',
  daily_challenge_completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
-- RLS: users CRUD own gamification

-- Add onboarding_completed to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
```

Trigger `handle_new_user` updated to also create a `user_gamification` row.

## Edge Function

- **`simulate-chat`** - New edge function for training mode. Same streaming pattern as `chat` but with a different system prompt where the AI plays the role of a target person based on selected personality.
- **`analyze-profile`** - New edge function for dating profile analysis (reuses vision model like `analyze-screenshot`).

## New Pages & Components

| File | Purpose |
|------|---------|
| `src/pages/Training.tsx` | Conversation simulation - select a profile from DB, chat with AI playing that person |
| `src/pages/ProfileAnalyzer.tsx` | Upload dating app profile screenshot for AI feedback |
| `src/pages/Favorites.tsx` | List saved messages with category filter and search |
| `src/pages/Profile.tsx` | User profile with XP bar, level badge, streak counter, stats |
| `src/components/OnboardingTour.tsx` | Step-by-step overlay tour (5 steps highlighting key features) |
| `src/components/XPNotification.tsx` | Animated XP gain popup |
| `src/components/LevelBadge.tsx` | Level display component with rank name |
| `src/hooks/useGamification.ts` | Hook to track XP, award badges, check streaks, daily challenges |

## Gamification System

- **XP Awards**: Send message (+10), complete quiz (+50), use generator (+15), analyze screenshot (+20), complete daily challenge (+30)
- **Levels**: Apprenti (0-99), Débutant (100-299), Charmeur (300-599), Expert (600-999), Maître du Charme (1000+)
- **Badges**: jsonb array in user_gamification (e.g., "first_message", "quiz_completed", "streak_7", "100_messages")
- **Daily Challenges**: Rotating list of simple tasks ("Envoie un compliment aujourd'hui", "Utilise le générateur", etc.)
- **Streaks**: Track consecutive days of activity

## Navigation Updates

- Bottom nav stays at 5 items (Home, Coach, Profils, Messages, Stats)
- Add access to Training, Favorites, Profile, ProfileAnalyzer via the Home page as feature cards
- Profile page accessible via avatar/icon in top bar of AppLayout

## Routing (App.tsx)

Add routes: `/training`, `/profile-analyzer`, `/favorites`, `/profile`

## Onboarding Flow

- Shows on first login (checks `onboarding_completed` in user_profiles)
- 5 steps with backdrop overlay highlighting each nav item
- Marks complete in DB when dismissed

## Integration Points

- Generator page: Add "save to favorites" heart icon on each generated message
- Chat page: Award XP on message send
- All pages: XP notification component mounted globally
- AppLayout: Add profile avatar link in header

## Technical Details

- All new edge functions follow existing CORS + error handling patterns
- `simulate-chat` streams like `chat` function but with roleplay system prompt
- `analyze-profile` returns structured JSON like `analyze-screenshot`
- Gamification hook uses Supabase realtime for instant XP updates
- Onboarding uses Framer Motion for step animations with portal overlay

