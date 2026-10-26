/**
 * Placeholder data that mirrors the v8 prototype.
 * Bracketed values like "[Governor name]" are intentional: real names, dates
 * and counts come from the data sources listed in the README, never hard-coded.
 * Each screen swaps this file for a Supabase query in Phase 1.
 */

export type Level = 'Federal' | 'State' | 'County' | 'City' | 'Local';

export const election = {
  name: 'General Election',
  date: '2026-11-03',
  label: 'GENERAL ELECTION · NOV 3',
  source: 'Delaware Department of Elections',
};

export const races: { id: string; name: string; level: Level; candidates: string; explored: boolean }[] = [
  { id: 'us-senate', name: 'U.S. Senate', level: 'Federal', candidates: '[#] candidates', explored: true },
  { id: 'us-house', name: 'U.S. House · At-Large', level: 'Federal', candidates: '[#] candidates', explored: true },
  { id: 'ag', name: 'Attorney General', level: 'State', candidates: '[#] candidates', explored: true },
  { id: 'treasurer', name: 'State Treasurer', level: 'State', candidates: '[#] candidates', explored: false },
  { id: 'state-senate', name: 'State Senate · District [#]', level: 'State', candidates: '[#] candidates', explored: false },
  { id: 'state-house', name: 'State House · District [#]', level: 'State', candidates: '[#] candidates', explored: false },
  { id: 'levy-court', name: 'Kent County Levy Court', level: 'Local', candidates: '[#] candidates', explored: false },
];

export const votingPlan = [
  { id: 'registered', label: 'Registered', done: true },
  { id: 'polling', label: 'Polling place', done: true },
  { id: 'time', label: 'Pick a time', done: false },
];

export const officialsByLevel: Record<'Federal' | 'State' | 'County' | 'City', { name: string; role: string; newsThisWeek: boolean; covers: string }[]> = {
  Federal: [
    { name: '[U.S. senator]', role: 'U.S. Senate', newsThisWeek: false, covers: 'Federal laws, student aid' },
    { name: '[U.S. senator]', role: 'U.S. Senate', newsThisWeek: true, covers: 'Federal laws, student aid' },
    { name: '[U.S. rep]', role: 'U.S. House · At-Large', newsThisWeek: false, covers: 'Federal laws, student aid' },
  ],
  State: [
    { name: '[Governor name]', role: 'Governor of Delaware', newsThisWeek: true, covers: 'Taxes, tuition, roads' },
    { name: '[State senator]', role: 'State Senate · District [#]', newsThisWeek: true, covers: 'Taxes, tuition, roads' },
    { name: '[State rep]', role: 'State House · District [#]', newsThisWeek: false, covers: 'Taxes, tuition, roads' },
  ],
  County: [{ name: '[Levy Court member]', role: 'Kent County Levy Court', newsThisWeek: false, covers: 'Property tax, parks, 911' }],
  City: [
    { name: '[Mayor name]', role: 'Mayor of Dover', newsThisWeek: false, covers: 'Rent rules, policing, zoning' },
    { name: '[Council member]', role: 'Dover City Council', newsThisWeek: true, covers: 'Rent rules, policing, zoning' },
  ],
};

export const squad = {
  name: '[Hall name], Floor 3',
  members: 12,
  withPlan: 9,
  goal: 'Everyone has a voting plan',
  goalEnds: 'OCT 27',
  board: [
    { rank: 1, name: '[Org or hall name]', pct: '[X]%', you: false },
    { rank: 2, name: '[Hall name], Floor 3 (you)', pct: '75%', you: true },
    { rank: 3, name: '[Org or hall name]', pct: '[X]%', you: false },
  ],
  chatPreview: "[Name]: who's walking to the polls together?",
  unread: 4,
};

export const leaderboard = {
  podium: [
    { rank: 2, name: '[Name]', days: 41 },
    { rank: 1, name: '[Name]', days: 58 },
    { rank: 3, name: '[Name]', days: 37 },
  ],
  rows: [
    { rank: 4, name: '[Name]', days: 33 },
    { rank: 5, name: '[Name]', days: 29 },
    { rank: 6, name: '[Name]', days: 24 },
    { rank: 7, name: '[Name]', days: 21 },
  ],
  you: { rank: 14, days: 7, gap: '3 more days to pass [Name]' },
};

export const me = {
  handle: '@[handle]',
  name: '[Name]',
  line: 'DSU · Class of [year] · Dover, DE',
  counts: [
    { n: '[#]', label: 'Drops shared' },
    { n: '[#]', label: 'Followers' },
    { n: '[#]', label: 'Following' },
  ],
  badges: [
    { big: '7', label: 'Day streak', highlight: true },
    { big: '8/8', label: 'Knows reps', highlight: false },
    { big: '3/7', label: 'Ballot', highlight: false },
    { big: 'Plan', label: 'Ready to vote', highlight: false },
  ],
  shared: [
    { tag: 'LOCAL · DOVER', title: 'Why rent near campus could change' },
    { tag: 'STATE', title: 'What a state senator actually does' },
    { tag: 'SCHOOL BOARD', title: 'Yes, you can vote in these too' },
    { tag: 'FEDERAL', title: 'Your ballot in 60 seconds' },
  ],
};
