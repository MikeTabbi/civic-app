import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Button, Card, Notice, Screen, SourceTag, StepHeader, T, ToggleRow } from '@/components/ui';
import { generalElection2026 as E } from '@/data/delaware';
import { formatReminderTime, reminderChoices, requestNotificationPermission, syncReminders } from '@/lib/reminders';
import { useProfile, type ReminderPrefs } from '@/state/ProfileProvider';

/** Step 3 of 3: reminders. Only future reminders are offered. */
export default function Reminders() {
  const { profile, update } = useProfile();
  const [prefs, setPrefs] = useState<ReminderPrefs>(profile.reminders);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  const options = reminderChoices();

  const finish = (allowed: boolean) => {
    update({ reminders: prefs, notificationsAllowed: allowed, onboarded: true });
    router.replace('/');
  };

  const turnOn = async () => {
    setBusy(true);
    const allowed = await requestNotificationPermission().catch(() => false);
    if (allowed) await syncReminders(prefs).catch(() => 0);
    setBusy(false);
    if (!allowed && Platform.OS !== 'web') {
      setDenied(true);
      return;
    }
    finish(allowed);
  };

  return (
    <Screen style={{ gap: 16 }}>
      <StepHeader step={3} onBack={() => router.back()} />
      <T variant="title" style={{ marginTop: 8 }}>Never miss a deadline</T>
      <T tone="muted">We'll only send the reminders you pick. Election Day is {new Date(E.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.</T>

      <Card>
        {options.length ? (
          options.map((o) => (
            <ToggleRow
              key={o.key}
              title={o.title}
              subtitle={formatReminderTime(o.date)}
              value={prefs[o.key]}
              onValueChange={(v) => setPrefs({ ...prefs, [o.key]: v })}
            />
          ))
        ) : (
          <T tone="muted">This election's reminders have all passed. We'll offer new ones when the next election is set.</T>
        )}
        <SourceTag source={E.source} />
      </Card>

      {denied ? (
        <Notice tone="warn">
          <T variant="label">Notifications are off for this app.</T>
          <T variant="caption" tone="muted">Turn them on in your phone's Settings, or continue and set reminders later in Me.</T>
        </Notice>
      ) : null}
      {Platform.OS === 'web' ? (
        <Notice>
          <T variant="caption" tone="muted">Reminders work in the phone app. On the web we'll save your choices.</T>
        </Notice>
      ) : null}

      <View style={{ flex: 1, minHeight: 8 }} />
      {denied ? (
        <Button label="Continue without reminders" onPress={() => finish(false)} />
      ) : (
        <Button label="Turn on reminders" icon="notifications" onPress={turnOn} loading={busy} disabled={!options.length || !Object.values(prefs).some(Boolean)} />
      )}
      {!denied ? (
        <Pressable accessibilityRole="button" onPress={() => finish(false)} style={{ alignItems: 'center', minHeight: 44, justifyContent: 'center' }}>
          <T variant="label" tone="faint">Not now</T>
        </Pressable>
      ) : null}
    </Screen>
  );
}
