

# CharmAI - Respectful Dating Coach

## Overview
A mobile-first dating coach app built with React + Vite + Tailwind + Supabase (Lovable Cloud). Uses Lovable AI (Gemini) for coaching. French-only at launch. PWA-installable.

## Architecture

### Pages & Routing
- `/login` — Auth page (email/password + Google OAuth)
- `/` — Home with Personality Quiz (5 questions → Direct/Flirty/Playful/Serious score)
- `/chat` — AI Chat Coach (streaming responses via Lovable AI)
- `/search` — Name Search (lookup personality profiles from Supabase)
- `/analyzer` — Screenshot Analyzer (upload image → AI analysis of conversation metrics)
- `/generator` — Message Generator (icebreakers + anti-ghosting follow-ups)
- `/guide` — Dating Guide (tips & best practices)
- `/dashboard` — Success Tracking (messages sent/accepted, dates obtained)
- `/admin` — Admin Panel (protected, manage name database + test APIs)

### Backend (Supabase Edge Functions)
- `chat` — Streaming AI coaching via Lovable AI gateway
- `analyze-screenshot` — Image analysis via Lovable AI (Gemini vision)
- `generate-messages` — Structured message generation with personality context

### Database Schema
- **names** — 50 pre-seeded profiles (name, personality JSONB, style, country, age_range, success_rate, examples)
- **user_profiles** — Quiz results, style preferences, language
- **conversations** — Chat history per user
- **success_metrics** — Track messages sent, responses received, dates obtained
- **user_roles** — Admin role management (secure, separate table)

### Authentication
- Email/password + Google OAuth via Lovable Cloud
- Protected routes with auth guard
- Admin panel restricted to admin role

## Features Detail

### 1. Personality Quiz (Home)
- 5 animated cards with multiple-choice questions
- Framer Motion transitions between questions
- Results: personality type score (Direct/Flirty/Playful/Serious)
- Saved to user profile, influences all AI prompts

### 2. AI Chat Coach
- Streaming chat interface with markdown rendering
- AI uses structured prompts: ROLE (dating coach matching user style) + CONTEXT (target name/personality) + GOAL
- Returns 3 exact messages + explanation of why each works
- Chat history persisted in Supabase

### 3. Name Search
- Search Supabase names database by name, country, style
- Display personality cards with glassmorphism design
- Inject personality data into AI coaching context

### 4. Screenshot Analyzer
- Upload conversation screenshot
- AI vision analysis: response time patterns, emoji ratio, tone score, interest level
- Visual metrics dashboard with animated charts

### 5. Message Generator
- Category selector: Icebreakers, Follow-ups, Anti-ghosting, Compliments
- AI generates 3 options based on user style + target personality
- Copy-to-clipboard functionality

### 6. Success Dashboard
- Track: messages sent, responses received, dates obtained
- AI learns from success patterns
- Visual progress charts

### 7. Admin Panel
- Protected route (admin role check)
- CRUD for names database
- API health check for AI endpoints

## UI/Design
- Mobile-first (360px primary viewport)
- Glassmorphism cards with backdrop blur
- Framer Motion page transitions and micro-interactions
- shadcn/ui components throughout
- Dark/warm color palette suitable for dating app
- Bottom navigation bar for main sections
- PWA manifest + service worker for installability

## Data Seeding
- 50 French/African name profiles with personality data, cultural context, and example approaches

## Security
- All AI calls server-side via edge functions
- Zod validation on all inputs
- RLS policies on all tables
- Admin role in separate user_roles table
- Rate limiting awareness (429/402 handling)

