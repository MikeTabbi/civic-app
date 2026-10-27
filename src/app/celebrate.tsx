import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccentHeading } from '@/components/AccentHeading';
import { PressableScale } from '@/components/PressableScale';
import { useReducedMotion } from '@/components/motion';
import { ProgressBar, Row, T, ToggleRow } from '@/components/ui';
import { drops } from '@/data/drops';
import { success } from '@/lib/haptics';
import { BADGE_NAMES, MILESTONES, type Milestone } from '@/lib/streak';
import { useNow } from '@/lib/useNow';
import { useAuth } from '@/state/AuthProvider';
import { useStreak } from '@/state/StreakProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const needsMoreDrops = (milestone: Milestone) => milestone > drops.length;

export default function Celebrate() {
  const { t } = useTheme();
  const { badge: badgeParam } = useLocalSearchParams<{ badge?: string }>();
  const streak = useStreak();
  const stats = streak.statsOn(useNow());
  const signedIn = !!useAuth().user;
  const celebrated = useRef(false);
  const badge = MILESTONES.find((milestone) => String(milestone) === badgeParam) ?? null;
  const days = stats.current;
  const next = stats.next;

  useEffect(() => {
    if (!badge || celebrated.current) return;
    celebrated.current = true;
    void success();
  }, [badge]);

  if (!badge) return <Redirect href="/" />;

  const dayWord: Record<Milestone, string> = { 3: 'Three', 7: 'Seven', 14: 'Fourteen', 30: 'Thirty' };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.drop.bg }}>
      <Confetti />
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 18 }}>
        <View style={{ alignItems: 'center', marginTop: 18, gap: 14 }}>
          <View
            accessibilityLabel={`${days} day streak`}
            style={{ width: 168, height: 168, borderRadius: 84, borderWidth: 8, borderColor: t.lime, alignItems: 'center', justifyContent: 'center', backgroundColor: t.forest }}
          >
            <Ionicons name="flame" size={28} color={t.lime} />
            <T variant="display" style={{ color: t.lime, fontSize: 56, lineHeight: 58 }}>{days}</T>
            <T variant="eyebrow" style={{ color: t.lime }}>{days === 1 ? 'Day' : 'Days'}</T>
          </View>
          <AccentHeading accent="row" color={t.drop.text} style={{ textAlign: 'center' }}>{`${dayWord[badge]} in a row`}</AccentHeading>
          <T style={{ color: t.drop.text, textAlign: 'center' }}>
            You finished a Drop {days} {days === 1 ? 'day' : 'days'} in a row.
          </T>
        </View>

        <View style={{ padding: 16, gap: 10, borderRadius: radius.lg, backgroundColor: t.drop.card }}>
          <T variant="eyebrow" style={{ color: t.drop.cardAccent }}>Badge unlocked</T>
          <Row gap={8}>
            <Ionicons name="ribbon" size={22} color={t.drop.cardAccent} />
            <T variant="heading" style={{ color: t.drop.cardText }}>{BADGE_NAMES[badge]}</T>
          </Row>
          {next ? (
            <>
              <Row style={{ justifyContent: 'space-between' }}>
                <T variant="label" style={{ color: t.drop.cardText }}>Next badge: {next} days</T>
                <T variant="label" style={{ color: t.drop.cardMuted }}>{days} / {next}</T>
              </Row>
              <ProgressBar value={days / next} color={t.lime} track={t.empty} />
              <T variant="caption" style={{ color: t.drop.cardMuted }}>
                {needsMoreDrops(next) ? `${BADGE_NAMES[next]}: more Drops coming` : `${next - days} more ${next - days === 1 ? 'day' : 'days'} for ${BADGE_NAMES[next]}`}
              </T>
            </>
          ) : (
            <T variant="label" style={{ color: t.drop.cardText }}>You've reached every milestone.</T>
          )}
        </View>

        <View style={{ padding: 14, borderRadius: radius.lg, backgroundColor: t.drop.card }}>
          <ToggleRow
            title="Show my streak on leaderboards"
            subtitle={
              signedIn
                ? 'Only your handle and streak. Never your voter status or quiz answers.'
                : 'Sign in from the Squad tab to appear. Never your voter status or quiz answers.'
            }
            value={streak.onLeaderboard}
            onValueChange={streak.setOnLeaderboard}
          />
        </View>

        <View style={{ flex: 1 }} />
        <PressableScale
          accessibilityRole="button"
          onPress={() => router.dismissTo('/')}
          style={{ minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: t.drop.btnBg }}
        >
          <T variant="label" style={{ color: t.drop.btnFg }}>Keep it going</T>
        </PressableScale>
      </ScrollView>
    </SafeAreaView>
  );
}

const CONFETTI = [
  { left: '8%', top: 60, rotate: '18deg', delay: 0 },
  { left: '23%', top: 120, rotate: '-22deg', delay: 70 },
  { left: '72%', top: 78, rotate: '35deg', delay: 130 },
  { left: '88%', top: 150, rotate: '-12deg', delay: 190 },
  { left: '14%', top: 280, rotate: '48deg', delay: 110 },
  { left: '81%', top: 330, rotate: '8deg', delay: 40 },
] as const;

function Confetti() {
  const { t } = useTheme();
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  const colors = [t.lime, t.drop.text, t.scheme === 'light' ? t.level.federal.tint : t.level.federal.ink];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      {CONFETTI.map((piece, index) => <ConfettiPiece key={index} {...piece} color={colors[index % colors.length]} />)}
    </View>
  );
}

function ConfettiPiece({ left, top, rotate, delay, color }: { left: string; top: number; rotate: string; delay: number; color: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withRepeat(withTiming(1, { duration: 260 }), -1, true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, progress]);
  const style = useAnimatedStyle(() => ({ opacity: 0.45 + progress.value * 0.55, transform: [{ translateY: progress.value * 14 }, { rotate }] }));
  return <Animated.View style={[{ position: 'absolute', left: left as `${number}%`, top, width: 8, height: 18, borderRadius: 3, backgroundColor: color }, style]} />;
}
