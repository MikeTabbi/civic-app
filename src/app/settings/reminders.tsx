import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { Button, Card, IconButton, Notice, Row, Screen, SourceTag, T, TextLink, ToggleRow } from '@/components/ui';
import { generalElection2026 as E } from '@/data/delaware';
import {
  clearReminders,
  formatReminderTime,
  reminderChoices,
  reminderPermission,
  requestNotificationPermission,
  syncReminders,
  type ReminderPermission,
} from '@/lib/reminders';
import { useBallot } from '@/state/BallotProvider';
import { useProfile, type ReminderPrefs } from '@/state/ProfileProvider';

const close = () => (router.canGoBack() ? router.back() : router.replace('/me'));

/** Me > Reminders: the onboarding toggles, where notification permission stands, and a re-sync on every change. */
export default function RemindersSettings() {
  const { profile, update } = useProfile();
  const { plan } = useBallot();
  const [perm, setPerm] = useState<ReminderPermission | null>(null);
  const [scheduled, setScheduled] = useState<number | null>(null);
  const options = reminderChoices();

  /** Replaces scheduled reminders with these choices. None on, or no permission: nothing scheduled. */
  const resync = useCallback(
    async (prefs: ReminderPrefs, allowed: boolean) => {
      if (allowed && Object.values(prefs).some(Boolean)) setScheduled(await syncReminders(prefs, plan).catch(() => 0));
      else {
        await clearReminders().catch(() => {});
        setScheduled(0);
      }
    },
    [plan],
  );

  // Check permission on open and when coming back from the phone's Settings. If it changed
  // there, keep the saved flag in line and resync.
  const check = useCallback(() => {
    reminderPermission()
      .catch((): ReminderPermission => 'unsupported')
      .then((p) => {
        setPerm(p);
        if (p === 'unsupported') return;
        const allowed = p === 'granted';
        if (allowed !== profile.notificationsAllowed) {
          update({ notificationsAllowed: allowed });
          resync(profile.reminders, allowed);
        }
      });
  }, [profile.notificationsAllowed, profile.reminders, update, resync]);
  useFocusEffect(check);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, [check]);

  const toggle = (key: keyof ReminderPrefs, on: boolean) => {
    const next = { ...profile.reminders, [key]: on };
    update({ reminders: next });
    resync(next, perm === 'granted');
  };

  const turnOn = async () => {
    await requestNotificationPermission().catch(() => false);
    check();
  };

  return (
    <Screen style={{ gap: 16 }}>
      <Row style={{ minHeight: 44 }}>
        <IconButton icon="chevron-back" label="Back" onPress={close} />
      </Row>
      <T variant="title">Reminders</T>
      <T tone="muted">Only you can see this. We only send the reminders you pick.</T>

      {perm === 'granted' ? (
        <Notice tone="good">
          <T variant="label">Notifications are on.</T>
          {scheduled !== null ? (
            <T variant="caption" tone="muted">
              Updated. {scheduled === 0 ? 'No reminders are scheduled.' : `${scheduled} ${scheduled === 1 ? 'reminder is' : 'reminders are'} scheduled.`}
            </T>
          ) : null}
        </Notice>
      ) : perm === 'undetermined' ? (
        <Notice tone="warn">
          <T variant="label">Notifications aren't on yet.</T>
          <T variant="caption" tone="muted">Your choices are saved. Turn on notifications so we can send them.</T>
          <Button label="Turn on notifications" icon="notifications" onPress={turnOn} style={{ marginTop: 4 }} />
        </Notice>
      ) : perm === 'denied' ? (
        <Notice tone="warn">
          <T variant="label">Notifications are off for this app.</T>
          <T variant="caption" tone="muted">Turn them on in your phone's Settings, then come back here.</T>
          <TextLink label="Open Settings" onPress={() => Linking.openSettings()} />
        </Notice>
      ) : perm === 'unsupported' ? (
        <Notice>
          <T variant="caption" tone="muted">Reminders work in the phone app. On the web we'll save your choices.</T>
        </Notice>
      ) : null}

      <Card>
        {options.length ? (
          options.map((o) => (
            <ToggleRow
              key={o.key}
              title={o.title}
              subtitle={formatReminderTime(o.date)}
              value={profile.reminders[o.key]}
              onValueChange={(v) => toggle(o.key, v)}
            />
          ))
        ) : (
          <T tone="muted">This election's reminders have all passed. We'll offer new ones when the next election is set.</T>
        )}
        <SourceTag source={E.source} />
      </Card>
      <T variant="caption" tone="faint">
        With any reminder on, we also remind you an hour before the time in your voting plan. The lock screen never shows where you vote.
      </T>
    </Screen>
  );
}
