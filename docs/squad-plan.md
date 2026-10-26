# Squad on Supabase: the plan

Built in three steps. Each step adds one new migration in `supabase/migrations/`
(the two that already ran are never edited) and the app code that uses it.

## Plain English

**What leaves the phone, and who can see it**

| Data | Stored in | Who can read it |
|---|---|---|
| Handle, name, school, public flag | `profiles` | You. Others only if `is_public`. Squadmates always see the handle (they chose to join); name and school only if the profile is public. |
| "I have a plan" yes/no + "share with squads" flag | `voting_plans.has_plan`, `share_with_squad` | Only you (existing "own plan" policy). Squads only see a count, through `squad_plan_progress()`. `has_plan` is only ever sent as true while sharing is on. |
| Address, method, place, day, time | Nowhere. They stay on the phone. | Only you. |
| Streak (current, best, last day) + opt-in | `public_streaks` (new) | Only you. Leaderboards read it through a function that drops anyone not opted in. |
| Squad, members, invite code | `squads`, `squad_members` | Members only (existing `is_squad_member()`). |
| Nudges | `squad_nudges` (new) | Only the person nudged. The sender never sees who was nudged, since that would reveal who lacks a plan. |

**Step 1, sync.** After sign-in the app keeps the `profiles` row up to date. A
taken handle shows "That handle is taken" on the profile step. The plan screen
gets a "Share my plan status with my squads" toggle (off by default). The app
sends only `has_plan` and that flag. Streaks sync to `public_streaks` after each
finished Drop, with a "Show my streak on leaderboards" toggle on Celebrate.
Signed-out people see a sign-in card on the Squad tab that opens the same
account screen used in onboarding.

**Step 2, squads.** Creating, joining, leaving and owner actions all go through
`security definer` functions so the rules (invite code, 3-squad limit, owner
only) live in the database. The open "join self" policy is dropped, so the
only way into a squad is a valid invite code. Codes are 10 characters from a
31-letter alphabet (about 50 bits) made with `gen_random_bytes`, so they can't
be guessed; the owner can reset one. Nudges: one per sender per squad per day,
sent only to members who aren't counted as having a plan. The Ballot tab shows
"Your squad nudged you to make a plan" until the person's own plan is done.

**Step 3, leaderboards.** Two functions. Streaks: opted-in people only, scoped
to my squad, my school or Delaware, plus my own row. Squads: only squads with
5 or more members, ranked by percent with a plan.

## Pseudocode

```
-- step 1
voting_plans += has_plan bool
squad_plan_progress(sid) = count members, count where share_with_squad and has_plan
public_streaks(user_id, current, best, last_day, opted_in, updated_at), owner-only RLS

app:
  AuthProvider: userId from supabase.auth (onAuthStateChange)
  ProfileProvider: when userId and handle valid -> upsert profiles
    account step: upsert after sign-in; if unique violation on handle -> show error on Handle
  BallotProvider: when userId -> upsert voting_plans(has_plan = share && complete, share_with_squad)
  StreakProvider: when userId or streak changes -> upsert public_streaks

-- step 2
squads += invite_code (random, unique, >= 8 chars)
drop policy "join self"; trigger: max 3 squads per person
create_squad(name, goal, ends)      -> new squad, caller is owner
join_squad(code)                    -> squad id, if code matches and under limit
squad_roster(sid)                   -> handle always; name only if public; role (members only)
update_squad / reset_invite_code / remove_member  -> owner only
leave_squad(sid)                    -> owner leaving hands off to longest member, last one out deletes it
nudge_squad(sid)                    -> once per day; insert nudge for each member without a shared plan
my_nudge()                          -> latest nudge to me in the last day

-- step 3
streak_board(scope, sid)  -> opted-in rows in scope, ranked; top 50 + me
squad_board(scope)        -> squads with members >= 5, pct with plan, ranked
```

Push notifications for nudges are a TODO (Expo push through an Edge Function).

## Sign-out

Signing out (the "Switch" link) asks first: "This will remove your plan and
progress from this phone." Then it clears the profile and address, voting
plan, streak, saved Drops and questions, follows and scheduled reminders, so
the next person on the phone starts clean. Squad data is never cached on the
device.

## Testing

- **Privacy (SQL editor):** `pbcopy < supabase/tests/privacy_tests.sql`, paste, run.
  Every test should come back as PASS, and the script removes its own test data.
- **Backend end to end:** put the service role key in `.secrets/service.env`
  (git-ignored), then
  `node --env-file=.env --env-file=.secrets/service.env scripts/dev/squad-e2e.mjs`.
  It creates 5 throwaway accounts, runs every squad and leaderboard flow, and deletes them.
- **Second account in the app:**
  `node --env-file=.env --env-file=.secrets/service.env scripts/dev/create-test-user.mjs you+2@example.test`
  prints a sign-in code, so no email delivery is needed.
