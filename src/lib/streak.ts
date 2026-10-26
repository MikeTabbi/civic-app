/**
 * Streak math on local calendar days ('YYYY-MM-DD'). Pure functions, no storage,
 * so the counts are always derived from the days completed and can't drift.
 */

export const MILESTONES = [3, 7, 14, 30] as const;
export type Milestone = (typeof MILESTONES)[number];

export const BADGE_NAMES: Record<Milestone, string> = {
  3: 'Three in a Row',
  7: 'Week One',
  14: 'Two Weeks Strong',
  30: 'Month of Drops',
};

/** Shift a 'YYYY-MM-DD' key by whole days. Uses local dates, so DST never skips a day. */
export function addDays(key: string, n: number) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export type StreakStats = {
  /** Consecutive days ending today, or yesterday if today isn't done yet. */
  current: number;
  best: number;
  daysCompleted: number;
  /** Milestones reached by the best streak. Once earned, a badge stays. */
  badges: Milestone[];
  /** The next milestone above the current streak, or null after the last one. */
  next: Milestone | null;
};

export function computeStreak(days: Iterable<string>, today: string): StreakStats {
  const set = new Set(days);

  // Today not done yet doesn't break the streak; it's still alive from yesterday.
  let cursor = set.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let best = 0;
  for (const day of set) {
    if (set.has(addDays(day, -1))) continue; // only count from the start of each run
    let run = 1;
    while (set.has(addDays(day, run))) run++;
    best = Math.max(best, run);
  }

  return {
    current,
    best,
    daysCompleted: set.size,
    badges: MILESTONES.filter((m) => best >= m),
    next: MILESTONES.find((m) => m > current) ?? null,
  };
}

/** The milestone newly earned by going from `before` to `after`, if any (the highest one). */
export function newBadge(before: StreakStats, after: StreakStats): Milestone | null {
  const fresh = after.badges.filter((b) => !before.badges.includes(b));
  return fresh.length ? fresh[fresh.length - 1] : null;
}
