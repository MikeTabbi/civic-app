import { generalElection2026 as E, parseLocalDate } from '@/data/delaware';
import type { VotingMethod, VotingPlan } from '@/state/BallotProvider';

export const methodLabel: Record<VotingMethod, string> = {
  early: 'Early voting',
  in_person: 'Election Day',
  mail: 'Absentee',
};

function isoDay(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function range(fromIso: string, toIso: string) {
  const out: string[] = [];
  const end = parseLocalDate(toIso);
  for (let d = parseLocalDate(fromIso); d <= end; d.setDate(d.getDate() + 1)) out.push(isoDay(d));
  return out;
}

/** Opening hours (24-hour) for voting on this day with this method, or null if closed. */
function hoursFor(method: VotingMethod, day: string): [number, number] | null {
  if (method === 'in_person') return day === E.date ? [7, 20] : null;
  if (method === 'early') {
    if (day < E.earlyVotingStart || day > E.earlyVotingEnd || E.earlyVotingClosed.includes(day)) return null;
    return [day >= E.earlyVotingLateOpenFrom ? 11 : 7, 19];
  }
  // Absentee: the person picks when they'll mail or drop off their ballot. Must arrive by 8 p.m. Election Day.
  return day <= E.date ? [8, 20] : null;
}

/** Days someone can pick for this method, from today on. */
export function planDays(method: VotingMethod, now = new Date()) {
  const today = isoDay(now);
  const all = method === 'early' ? range(E.earlyVotingStart, E.earlyVotingEnd) : method === 'in_person' ? [E.date] : range(today, E.date);
  return all.filter((d) => d >= today && hoursFor(method, d) && planTimes(method, d, now).length > 0);
}

/** Hourly start times on that day, dropping ones already past. Last slot is an hour before closing. */
export function planTimes(method: VotingMethod, day: string, now = new Date()) {
  const hours = hoursFor(method, day);
  if (!hours) return [];
  const out: string[] = [];
  for (let h = hours[0]; h < hours[1]; h++) {
    const at = parseLocalDate(day);
    at.setHours(h);
    if (at > now) out.push(`${String(h).padStart(2, '0')}:00`);
  }
  return out;
}

export function formatDay(iso: string) {
  return parseLocalDate(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
}

/** When the plan happens, as a Date, or null if no day/time is picked. */
export function planDate(plan: VotingPlan) {
  if (!plan.day || !plan.time) return null;
  const d = parseLocalDate(plan.day);
  const [h, m] = plan.time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

/** True when the picked day and time still fit the picked method (e.g. after switching method). */
export function planWhenValid(plan: VotingPlan, now = new Date()) {
  if (!plan.method || !plan.day || !plan.time) return false;
  return planTimes(plan.method, plan.day, now).includes(plan.time);
}

export function planSteps(plan: VotingPlan) {
  return [
    { id: 'registered', label: 'Registered', done: plan.registered },
    { id: 'method', label: plan.method ? methodLabel[plan.method] : 'How', done: !!plan.method },
    { id: 'where', label: 'Where', done: plan.place.trim().length > 0 },
    { id: 'when', label: plan.day && plan.time ? `${formatDay(plan.day)}, ${formatTime(plan.time)}` : 'When', done: !!plan.day && !!plan.time },
  ];
}
