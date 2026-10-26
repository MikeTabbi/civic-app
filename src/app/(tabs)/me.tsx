import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Avatar, Button, Card, Row, Screen, Segmented, T } from '@/components/ui';
import { me } from '@/data/mock';
import { useProfile } from '@/state/ProfileProvider';
import { useStreak } from '@/state/StreakProvider';
import { useTheme, type AppearancePref } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** Me tab: public profile on top, private stuff clearly marked, settings at the bottom. */
export default function Me() {
  const { t, appearance, setAppearance } = useTheme();
  const { reset } = useProfile();
  const streak = useStreak();
  const badges = me.badges.map((b) => (b.label === 'Day streak' ? { ...b, big: String(streak.current) } : b));

  return (
    <Screen>
      <T variant="heading">{me.handle}</T>
      <Row gap={16}>
        <Avatar size={76} ring={t.accent} label="Profile photo" />
        <Row gap={18} style={{ flex: 1, justifyContent: 'space-around' }}>
          {me.counts.map((c) => (
            <View key={c.label} style={{ alignItems: 'center' }}>
              <T variant="heading">{c.n}</T>
              <T variant="caption" tone="faint">{c.label}</T>
            </View>
          ))}
        </Row>
      </Row>
      <View>
        <T variant="label">{me.name}</T>
        <T variant="caption" tone="faint">{me.line}</T>
      </View>
      <Row>
        <Button label="Edit profile" kind="quiet" style={{ flex: 1, minHeight: 44 }} />
        <Button label="Share profile" kind="quiet" style={{ flex: 1, minHeight: 44 }} />
      </Row>

      <Row gap={8}>
        {badges.map((b) => (
          <View
            key={b.label}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 12,
              borderRadius: radius.md,
              backgroundColor: t.surface,
              borderWidth: b.highlight ? 2 : 1,
              borderColor: b.highlight ? t.accent : t.line,
            }}
          >
            <T variant="heading" tone={b.highlight ? 'accent' : 'text'}>{b.big}</T>
            <T variant="caption" tone="faint" style={{ textAlign: 'center' }}>{b.label}</T>
          </View>
        ))}
      </Row>

      <Card tone="sub">
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={6}>
            <Ionicons name="lock-closed" size={14} color={t.text} />
            <T variant="label">Private to you</T>
          </Row>
          <T variant="label" tone="accent">Manage</T>
        </Row>
        <T variant="caption" tone="faint">Voter status, issues, Matchup picks</T>
      </Card>

      <T variant="heading">Shared Drops</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {me.shared.map((s, i) => (
          <View
            key={s.title}
            style={{
              width: '48.5%',
              aspectRatio: 0.9,
              borderRadius: radius.md,
              padding: 12,
              justifyContent: 'space-between',
              backgroundColor: i === 0 ? t.accent : i === 1 ? t.text : t.surface,
              borderWidth: i > 1 ? 1 : 0,
              borderColor: t.line,
            }}
          >
            <T variant="eyebrow" style={{ color: i === 0 ? t.onAccent : i === 1 ? t.bg : t.faint }}>{s.tag}</T>
            <T variant="heading" style={{ color: i === 0 ? t.onAccent : i === 1 ? t.bg : t.text }}>{s.title}</T>
          </View>
        ))}
      </View>

      <T variant="heading" style={{ marginTop: 8 }}>Appearance</T>
      <Segmented<AppearancePref>
        value={appearance}
        onChange={setAppearance}
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />
      <Button label="Restart onboarding (dev)" kind="quiet" icon="refresh" onPress={reset} />
    </Screen>
  );
}
