# Me tab build-out: plan

## Plain English

The Me tab stops reading `src/data/mock.ts` and reads only the providers that already hold your data.

- **Public header.** Shows your initials avatar, name, @handle, and school (when it's a named school). A chip says whether your profile is public. Below that, three real stats: day streak (StreakProvider), races explored X of Y (BallotProvider plus `racesForDistricts`), and officials followed (FollowProvider). Then badges: streak, ballot X/Y, "Plan ready" (only once `hasCompletePlan` is true), and any streak badges you've earned. A caption says these stats are only shown to you.
- **Edit profile** (`/profile/edit`, a modal). Edits name, handle, school (the same three choices as onboarding) and a Public profile toggle. When you're signed in it saves to Supabase first through `syncProfile` (cloud.ts `upsertProfile`). A taken handle shows the same field error as onboarding, and nothing is saved locally until the server accepts it. When you're signed out it saves on the phone only.
- **Share profile.** Opens the system share sheet with "Find me on Delaware Civic: @handle". The app name comes from `src/lib/brand.ts`. There's a TODO to add a link once the website can show profiles.
- **Private card**, labeled "Only you can see this":
  - Address and districts: the district summary, never the address. Edit opens `/address?mode=edit`.
  - Voting plan: a summary (method, day and time, or steps done) plus whether plan status is shared with squads. Edit opens `/plan`.
  - Reminders: opens a new `/settings/reminders` screen with the onboarding toggles, the notification permission state (on, off with an Open Settings link, not asked yet, or web), and a re-sync on every change.
  - Leaderboards: the same `streak.setOnLeaderboard` toggle Celebrate uses, shown inline.
- **Saved / Following tabs** replace "Shared Drops". Saved lists your saved Drops (each opens that Drop through a new `?id=` param on `/drop`) and your questions, marked "Waiting for an answer". Following lists the officials you follow (each opens `/official/[id]`) with an Unfollow button. Both tabs have friendly empty states.
- **Settings:** Appearance (the existing control), About and sources (new `/settings/about`), Sign out (`useSignOut`), Delete account, and Restart onboarding (only when `__DEV__` is true).
- **Delete account.** Asks for confirmation twice, then calls the `delete-account` Edge Function. The function checks your token, leaves each of your squads with your own token (so ownership passes to the next member, and an empty squad gets deleted), then deletes the auth user with the service key. Every table that holds your rows has `on delete cascade` from `auth.users`, so your rows are removed in the same step. The phone is then wiped the same way sign-out wipes it.
- **No new migration is needed.** The existing cascades and `leave_squad` already cover deletion.
- **Cleanup.** Delete `src/data/mock.ts`. me.tsx was its only importer.

Small refactors so nothing is duplicated:
- `SCHOOLS` and the school helpers move to ProfileProvider, and a `SchoolPicker` component is shared by AccountForm and Edit profile.
- `REMINDER_OPTIONS` and `reminderPermission()` move to `lib/reminders.ts`, so onboarding and Settings use the same list.
- `useSignOut.ts` gains `useClearDevice()`, which wipes the phone. Sign-out and delete both use it.

## Pseudocode

```
Me():
  stats = { streak.current, explored/total for my districts, count(valid follows) }
  badges = [streak, ballot X/Y, planReady? , ...earned milestones]
  header(initials(name || handle), name, @handle, school if named, public chip)
  buttons: Edit -> push /profile/edit ; Share -> Share.share(text)
  PrivateCard: rows -> /address?mode=edit, /plan, /settings/reminders ; leaderboard toggle
  Tabs saved|following -> lists or empty states
  Settings: appearance, about, sign in or (sign out, delete), dev restart

EditProfile.save():
  validate name, handle
  if signed in: res = syncProfile(fields)
     handle_taken -> field error, stop ; other error -> notice, stop
  update(fields) ; back

Reminders screen:
  perm = reminderPermission() on focus and when app returns to foreground
  toggle(key): prefs' = ..., update(prefs'), resync(prefs')
  resync: if perm granted and any pref on -> syncReminders(prefs, plan) else clearReminders()

deleteAccount():
  confirm #1, confirm #2
  res = functions.invoke('delete-account')
  if !res.ok -> show error, stop
  signOut (local) ; clearDevice()

Edge function delete-account:
  user = getUser(bearer token) else 401
  for squad in rpc my_squads (as user): rpc leave_squad(squad.id)
  admin.deleteUser(user.id)   // cascades every owner row
```
