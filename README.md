# civic-app

Everything political where you live — your ballot, your reps, election dates and deadlines, and a 60-second Daily Drop — built for young voters (18–29), launching first with students at Delaware State University.

> Working title. The app name is still TBD, so the UI shows `[App name]`.

## Principles

- **Nonpartisan.** Orange is the only accent and never stands for a party. Candidates are shown in neutral colors.
- **Sourced.** Every civic fact carries a source line.
- **Private by default.** Addresses, voting plans and reminders stay private to their owner, and row-level security enforces this. Squads see only a yes/no "has a plan," and only for members who opted in.

## Stack

| Layer | Choice |
| --- | --- |
| App | [Expo](https://expo.dev) SDK 58 · React Native 0.88 · TypeScript |
| Navigation | Expo Router (file-based, `src/app/`) |
| Backend | [Supabase](https://supabase.com) — Postgres, Auth, row-level security |
| Notifications | Expo push notifications (Phase 1 reminders) |
| Fonts | Space Grotesk (display) · Inter (body) |

## Getting started

```bash
npm install
npm start          # then press i (iOS), a (Android) or w (web), or scan the QR code with Expo Go
```

The app runs on mock data (`src/data/mock.ts`) until Supabase is connected:

```bash
cp .env.example .env   # add your Supabase URL + anon key
```

To turn on accounts (email codes, Apple, Google), follow [docs/auth-setup.md](docs/auth-setup.md). To set up the database, create a Supabase project, then run `supabase/migrations/20261025000000_phase1_init.sql` in the SQL editor, or use `supabase db push` with the Supabase CLI.

Checks:

```bash
npm run typecheck
npx expo export --platform web   # confirms the bundle builds
```

## Project layout

```
src/
  app/                    # routes (Expo Router) — every file is a screen
    _layout.tsx           # fonts, theme, onboarding gate, root stack
    onboarding.tsx        # "Where do you vote?"
    (tabs)/
      _layout.tsx         # 5-slot tab bar: Ballot · Map · [Drop] · Squad · Me
      index.tsx           # Ballot
      map.tsx             # Power Map
      squad.tsx           # Squad
      me.tsx              # Profile + appearance setting
    drop.tsx              # Daily Drop (full-screen, opened from the center button)
    celebrate.tsx         # Streak celebration (after closing a Drop)
    leaderboard.tsx       # Streak / squad leaderboard
  components/             # ui.tsx (Screen, T, Card, Button, …), TabBar.tsx
  theme/                  # v8 orange tokens (light + dark), ThemeProvider
  state/                  # OnboardingProvider (local until auth lands)
  data/mock.ts            # placeholder data mirroring the v8 prototype
  lib/supabase.ts         # Supabase client (null until env is set)
supabase/migrations/      # Phase 1 schema + RLS policies
```

## Design

Screens follow the **v8 Orange** prototype. Light and dark modes follow the system setting, and **Me → Appearance** overrides it.

| Token | Light | Dark |
| --- | --- | --- |
| Background | `#FFFCF2` | `#252422` |
| Surface | `#FFFFFF` | `#403D39` |
| Text | `#252422` | `#FFFCF2` |
| Accent | `#EB5E28` | `#EB5E28` |
| Accent text | `#B8481C` | `#F27A4C` |
| Done | `#8FB996` | `#8FB996` |

## Data sources (planned)

- **Delaware Department of Elections:** election dates, deadlines, ballots
- **U.S. Census Geocoder:** address or map point → districts (live)
- **Photon (OpenStreetMap):** address suggestions while typing (live; swap for a paid provider at launch)
- **Open congressional data:** federal officials
- **OpenStates:** state legislators (free API key)
- **City council and school board:** entered by hand at first

## Roadmap

**Phase 1 (MVP):** onboarding and sign-up (personal or school email, or Apple/Google, with an optional school email check), Ballot, Power Map, reminders, Squads, and profile and settings.

**Later:** Daily Drop content pipeline, streaks, squad chat, Matchups, Receipts, and other states.
