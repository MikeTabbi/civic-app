import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Notice, SourceTag, T, TextField } from '@/components/ui';
import {
  dropDateLabel,
  dropForDate,
  drops,
  localDateKey,
  nextDropAfter,
  personalizeCard,
  whoDecidesFor,
  type Drop as DropData,
  type WhoDecides,
} from '@/data/drops';
import type { Milestone } from '@/lib/streak';
import { useNow } from '@/lib/useNow';
import { useDrops } from '@/state/DropProvider';
import { useProfile } from '@/state/ProfileProvider';
import { useStreak } from '@/state/StreakProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

/**
 * Daily Drop: a 60-second local explainer as tap-through story cards, then a quick check.
 * Light mode uses the full orange background from v8; dark mode uses charcoal.
 */
export default function Drop() {
  const now = useNow();
  const drop = dropForDate(now);
  return drop ? <DropView key={drop.id} drop={drop} now={now} /> : <NoDropYet now={now} />;
}

/** When the next Drop lands, or that more are coming when none is scheduled. */
function nextDropLine(now: Date) {
  const next = nextDropAfter(now);
  return next ? `Next Drop: ${dropDateLabel(next.date)}` : 'More Drops coming soon';
}

function NoDropYet({ now }: { now: Date }) {
  const { t } = useTheme();
  const c = t.drop;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flex: 1, padding: 20, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <CloseButton onPress={close} />
        </View>
        <T variant="display" style={{ color: c.text }}>{nextDropLine(now)}</T>
        <T style={{ color: c.text, fontSize: 16, lineHeight: 23 }}>
          A new 60-second Drop lands every day from {dropDateLabel(drops[0].date)} to {dropDateLabel(drops[drops.length - 1].date)}.
        </T>
      </View>
    </SafeAreaView>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close"
      onPress={onPress}
      hitSlop={4}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.drop.track, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name="close" size={22} color={t.drop.text} />
    </Pressable>
  );
}

function DropView({ drop, now }: { drop: DropData; now: Date }) {
  const { t } = useTheme();
  const c = t.drop;
  const streak = useStreak();
  const saved = useDrops();
  const { districts } = useProfile().profile;
  const [index, setIndex] = useState(0);
  const [unlocked, setUnlocked] = useState<Milestone | null>(null);
  const [asking, setAsking] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const total = drop.cards.length + 1;
  const onQuiz = index === drop.cards.length;
  const finished = streak.isDone(drop.id);
  const stats = streak.statsOn(now);
  const isToday = drop.date === localDateKey(now);
  const bookmarked = saved.isSaved(drop.id);
  const card = onQuiz ? null : personalizeCard(drop, drop.cards[index], districts);

  const go = (step: number) => setIndex((i) => Math.max(0, Math.min(total - 1, i + step)));

  const pick = (choice: number) => {
    if (drop.id in saved.answers) return;
    saved.answer(drop.id, choice);
    const badge = streak.completeDrop(drop.id, now);
    if (badge) setUnlocked(badge);
  };

  // Finished with a new badge: celebrate. Otherwise (finished or not) just close back to the tabs.
  const onClose = () => {
    if (finished && unlocked) router.replace({ pathname: '/celebrate', params: { badge: String(unlocked), date: localDateKey(now) } });
    else close();
  };

  const openSource = (url: string) => {
    setOpenError(null);
    Linking.openURL(url).catch(() => setOpenError("Couldn't open that link on this device."));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={`Part ${index + 1} of ${total}`}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= index ? c.text : c.track }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <T variant="heading" style={{ color: c.text }}>{isToday ? "Today's Drop" : 'Latest Drop'}</T>
            <T variant="caption" style={{ color: c.text }}>
              {dropDateLabel(drop.date)} · {stats.current ? `Day ${stats.current} streak` : 'Finish it to start a streak'}
            </T>
            {isToday ? null : <T variant="caption" style={{ color: c.text }}>No new Drop today. {nextDropLine(now)}.</T>}
          </View>
          <CloseButton onPress={onClose} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32, gap: 14 }}>
        <View style={{ alignSelf: 'flex-start', backgroundColor: c.card, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
          <T variant="eyebrow" style={{ color: c.cardAccent }}>{drop.tag}</T>
        </View>
        <T variant="display" style={{ color: c.text, fontSize: 30, lineHeight: 33 }}>{drop.title}</T>
        <T style={{ color: c.text, fontSize: 16, lineHeight: 23 }}>{drop.summary}</T>

        <View style={{ minHeight: 300, borderRadius: radius.xl, backgroundColor: c.card, padding: 20, gap: 10 }}>
          {onQuiz || !card ? (
            <QuickCheckCard drop={drop} picked={saved.answers[drop.id]} onPick={pick} onBack={() => go(-1)} streakDays={stats.current} finished={finished} />
          ) : (
            <>
              <T variant="eyebrow" style={{ color: c.cardAccent }}>{index + 1} of {drop.cards.length}</T>
              <T variant="title" style={{ color: c.cardText, fontSize: 24, lineHeight: 28 }}>{card.title}</T>
              <T style={{ color: c.cardText, fontSize: 17, lineHeight: 25 }}>{card.body}</T>
              {card.link ? (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`${card.link.title}. Opens in browser`}
                  onPress={() => openSource(card.link!.url)}
                  // Above the tap zones so it stays tappable.
                  style={({ pressed }) => ({
                    zIndex: 2,
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    minHeight: 44,
                    paddingHorizontal: 14,
                    borderRadius: radius.md,
                    backgroundColor: c.cardSub,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <T variant="label" style={{ color: c.cardText }}>{card.link.title}</T>
                  <Ionicons name="open-outline" size={16} color={c.cardText} />
                </Pressable>
              ) : null}
              <View style={{ flex: 1 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <SourceTag source={drop.sources[card.source].outlet} color={c.cardMuted} />
                </View>
                <T variant="caption" style={{ color: c.cardMuted }}>{index === 0 ? 'Tap right for next' : 'Tap left to go back'}</T>
              </View>
              {/* Tap zones: left side goes back, right side goes forward. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous card"
                onPress={() => go(-1)}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%' }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={index === drop.cards.length - 1 ? 'Go to the quick check' : 'Next card'}
                onPress={() => go(1)}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60%' }}
              />
            </>
          )}
        </View>

        <T variant="eyebrow" style={{ color: c.text, marginTop: 4 }}>Who decides</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {whoDecidesFor(drop, districts).map((w) => (
            <WhoChip key={w.label} who={w} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAsking(true)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 52,
              borderRadius: radius.md,
              backgroundColor: c.btnBg,
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="help-circle-outline" size={20} color={c.btnFg} />
            <T style={{ color: c.btnFg, fontFamily: fonts.bodyHeavy }}>Ask a question</T>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={bookmarked ? 'Saved. Tap to remove' : 'Save this Drop'}
            accessibilityState={{ selected: bookmarked }}
            onPress={() => saved.toggleSaved(drop.id)}
            style={{ width: 52, minHeight: 52, borderRadius: radius.md, backgroundColor: c.track, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color={c.text} />
          </Pressable>
        </View>
        <T variant="caption" style={{ color: c.text, textAlign: 'center' }}>We'll answer top questions in a future Drop</T>

        {/*
          TODO(DSU Pulse): hidden until there's a backend. Plan:
          - Supabase `drop_answers` (user_id, drop_id, choice, correct, created_at), one row per user per Drop,
            insert/select own rows only under RLS.
          - A security-definer function `drop_pulse(drop_id)` that returns only aggregates
            (answered count, % correct, optionally filtered to verified DSU emails), never rows.
          - Show the card after the quick check only when answered >= 20, so no one can be singled out.
        */}

        <T variant="eyebrow" style={{ color: c.text, marginTop: 8 }}>Sources</T>
        <View style={{ gap: 8 }}>
          {drop.sources.map((s) => (
            <Pressable
              key={s.url}
              accessibilityRole="link"
              accessibilityLabel={`${s.outlet}: ${s.title}. Opens in browser`}
              onPress={() => openSource(s.url)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 12,
                borderRadius: radius.md,
                backgroundColor: c.track,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View style={{ flex: 1 }}>
                <T variant="label" style={{ color: c.text }}>{s.outlet}</T>
                <T variant="caption" style={{ color: c.text, textDecorationLine: 'underline' }}>{s.title}</T>
              </View>
              <Ionicons name="open-outline" size={18} color={c.text} />
            </Pressable>
          ))}
        </View>
        {openError ? (
          <Notice tone="warn">
            <T variant="caption" tone="muted">{openError}</T>
          </Notice>
        ) : null}
      </ScrollView>

      <AskSheet visible={asking} onClose={() => setAsking(false)} onSend={(text) => saved.ask(drop.id, text)} />
    </SafeAreaView>
  );
}

function QuickCheckCard({
  drop,
  picked,
  onPick,
  onBack,
  streakDays,
  finished,
}: {
  drop: DropData;
  picked: number | undefined;
  onPick: (choice: number) => void;
  onBack: () => void;
  streakDays: number;
  finished: boolean;
}) {
  const { t } = useTheme();
  const c = t.drop;
  const q = drop.quickCheck;
  const answered = picked !== undefined;
  const right = picked === q.answer;

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T variant="eyebrow" style={{ color: c.cardAccent }}>Quick check</T>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous card" onPress={onBack} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Ionicons name="chevron-back" size={14} color={c.cardMuted} />
          <T variant="caption" style={{ color: c.cardMuted }}>Back</T>
        </Pressable>
      </View>
      <T variant="heading" style={{ color: c.cardText, fontSize: 20, lineHeight: 25 }}>{q.question}</T>
      <View style={{ gap: 8 }}>
        {q.choices.map((choice, i) => {
          const isAnswer = answered && i === q.answer;
          const isWrongPick = answered && i === picked && !right;
          return (
            <Pressable
              key={choice}
              accessibilityRole="button"
              accessibilityState={{ disabled: answered, selected: i === picked }}
              accessibilityLabel={isAnswer ? `${choice}, correct answer` : isWrongPick ? `${choice}, your answer, not correct` : choice}
              disabled={answered}
              onPress={() => onPick(i)}
              style={({ pressed }) => ({
                minHeight: 48,
                borderRadius: radius.md,
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: isAnswer ? t.done : c.cardSub,
                borderWidth: 2,
                borderColor: isWrongPick ? t.accent : 'transparent',
                opacity: answered && !isAnswer && !isWrongPick ? 0.55 : pressed ? 0.85 : 1,
              })}
            >
              <T variant="label" style={{ flex: 1, color: isAnswer ? t.onDone : c.cardText }}>{choice}</T>
              {isAnswer ? <Ionicons name="checkmark-circle" size={20} color={t.onDone} /> : null}
              {isWrongPick ? <Ionicons name="close-circle" size={20} color={c.cardAccent} /> : null}
            </Pressable>
          );
        })}
      </View>
      {answered ? (
        <View style={{ gap: 6, marginTop: 4 }} accessibilityLiveRegion="polite">
          <T variant="heading" style={{ color: c.cardText }}>{right ? 'Right!' : 'Not quite'}</T>
          <T style={{ color: c.cardText }}>{q.explanation}</T>
          <SourceTag source={drop.sources[q.source].outlet} color={c.cardMuted} />
          {finished ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Ionicons name="flame" size={16} color={c.cardAccent} />
              <T variant="label" style={{ color: c.cardText }}>
                Drop finished{streakDays ? ` · Day ${streakDays} streak` : ''}
              </T>
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

function WhoChip({ who }: { who: WhoDecides }) {
  const { t } = useTheme();
  const c = t.drop;
  // Pushed inside the Drop's own stack (drop/_layout.tsx) so the page shows on top of the modal on iOS.
  const href = who.officialId
    ? ({ pathname: '/drop/official/[id]', params: { id: who.officialId } } as const)
    : who.raceId
      ? ({ pathname: '/drop/race/[id]', params: { id: who.raceId } } as const)
      : null;
  const body = (
    <>
      <View>
        <T variant="label" style={{ color: c.text }}>{who.label}</T>
        <T variant="caption" style={{ color: c.text, opacity: 0.8 }}>{who.role}</T>
      </View>
      {href ? <Ionicons name="chevron-forward" size={16} color={c.text} /> : null}
    </>
  );
  const style = { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, minHeight: 44, borderRadius: radius.md, backgroundColor: c.track } as const;
  if (!href) return <View style={style}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${who.label}, ${who.role}`}
      onPress={() => router.push(href)}
      style={({ pressed }) => [style, { opacity: pressed ? 0.8 : 1 }]}
    >
      {body}
    </Pressable>
  );
}

/** Short question box. Saved on the device until there's a backend inbox. */
function AskSheet({ visible, onClose, onSend }: { visible: boolean; onClose: () => void; onSend: (text: string) => void }) {
  const { t } = useTheme();
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  const dismiss = () => {
    setText('');
    setSent(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Close" onPress={dismiss} style={{ flex: 1 }} />
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: t.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderTopWidth: 1, borderColor: t.line }}>
          <View style={{ padding: 20, gap: 14 }}>
            <T variant="heading">Ask a question</T>
            {sent ? (
              <>
                <Notice tone="good">
                  <T variant="label">Got it. We'll answer top questions in a future Drop.</T>
                </Notice>
                <Button label="Done" onPress={dismiss} />
              </>
            ) : (
              <>
                <TextField
                  label="Your question about this Drop"
                  value={text}
                  onChangeText={setText}
                  placeholder="What do you want to know?"
                  maxLength={280}
                  multiline
                  autoFocus
                  hint={`${text.length}/280. Saved on this device for now.`}
                />
                <Button
                  label="Send"
                  disabled={!text.trim()}
                  onPress={() => {
                    onSend(text.trim());
                    setSent(true);
                  }}
                />
                <Button label="Cancel" kind="quiet" onPress={dismiss} />
              </>
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
