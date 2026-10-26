import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { generalElection2026 as E, parseLocalDate } from '@/data/delaware';
import { planDate } from '@/lib/votingPlan';
import type { VotingPlan } from '@/state/BallotProvider';
import type { ReminderPrefs } from '@/state/ProfileProvider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

function at(iso: string, hour: number, minute = 0) {
  const d = parseLocalDate(iso);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** The reminders we would send, given today's date. Past ones are dropped. */
export function plannedReminders(prefs: ReminderPrefs, now = new Date(), plan?: VotingPlan) {
  const list: { key: keyof ReminderPrefs | 'plan'; title: string; body: string; date: Date }[] = [];
  const earlyEnd = at(E.earlyVotingEnd, 23, 59);

  if (prefs.earlyVoting && now < earlyEnd) {
    // Tomorrow at 10 a.m., or the first early-voting day if it hasn't started.
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10);
    const start = at(E.earlyVotingStart, 10);
    const date = tomorrow < start ? start : tomorrow;
    if (date < earlyEnd) {
      list.push({ key: 'earlyVoting', title: 'Early voting is open', body: 'Skip the Election Day line. Find an early voting site in your county.', date });
    }
  }
  if (prefs.absenteeDeadline) {
    list.push({ key: 'absenteeDeadline', title: 'Absentee deadline is tomorrow', body: 'Absentee ballot applications must be received by Friday, Oct. 30.', date: at('2026-10-29', 12) });
  }
  if (prefs.dayBefore) {
    list.push({ key: 'dayBefore', title: 'Election Day is tomorrow', body: 'Check your polling place and pick a time to go.', date: at('2026-11-02', 18) });
  }
  if (prefs.electionDay) {
    list.push({ key: 'electionDay', title: 'Polls are open until 8 p.m.', body: "It's Election Day in Delaware. Your plan is ready in the app.", date: at(E.date, 8) });
  }
  // An hour before the time in the voting plan. Generic text: the plan's place is private and stays off the lock screen.
  const planned = plan ? planDate(plan) : null;
  if (planned) {
    const body = plan?.method === 'mail' ? 'Time to mail or drop off your absentee ballot.' : 'Time to head out and vote. Your plan is in the app.';
    list.push({ key: 'plan', title: 'Your voting plan is in an hour', body, date: new Date(planned.getTime() - 3_600_000) });
  }
  return list.filter((r) => r.date > now);
}

/** Replaces all scheduled election reminders with the current choices. */
export async function syncReminders(prefs: ReminderPrefs, plan?: VotingPlan) {
  if (Platform.OS === 'web') return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const list = plannedReminders(prefs, new Date(), plan);
  for (const r of list) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.date },
    });
  }
  return list.length;
}
