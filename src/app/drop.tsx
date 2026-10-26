import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { T } from '@/components/ui';
import { drop, streak } from '@/data/mock';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

/**
 * Daily Drop: a 60-second local explainer plus a quick check.
 * Light mode uses the full orange background from v8; dark mode uses charcoal.
 */
export default function Drop() {
  const { t } = useTheme();
  const light = t.scheme === 'light';
  const c = light
    ? { bg: t.accent, text: '#252422', track: 'rgba(37,36,34,0.14)', chip: '#252422', chipText: '#F27A4C', btnBg: '#252422', btnFg: '#FFFCF2', play: '#FFFCF2' }
    : { bg: t.bg, text: t.text, track: 'rgba(255,252,242,0.12)', chip: t.surface, chipText: t.accentText, btnBg: t.accent, btnFg: t.onAccent, play: t.accent };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel="Part 2 of 4">
          {[1, 1, 0, 0].map((on, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: on ? c.text : c.track }} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <T variant="heading" style={{ color: c.text }}>Today's Drop</T>
            <T variant="caption" style={{ color: c.text }}>{drop.date} · Day {streak.days} streak</T>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => router.replace('/celebrate')}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.track, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close" size={22} color={c.text} />
          </Pressable>
        </View>

        <View style={{ alignSelf: 'flex-start', backgroundColor: c.chip, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
          <T variant="eyebrow" style={{ color: c.chipText }}>{drop.tag}</T>
        </View>
        <T variant="display" style={{ color: c.text }}>{drop.title}</T>
        <T style={{ color: c.text, fontSize: 16, lineHeight: 23 }}>{drop.summary}</T>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Play ${drop.length} video`}
          style={{ flex: 1, minHeight: 110, borderRadius: radius.xl, backgroundColor: c.chip, alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.play, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="play" size={24} color="#252422" />
          </View>
          <T variant="caption" style={{ position: 'absolute', left: 14, bottom: 12, color: '#CCC5B9' }}>
            {drop.length} · {drop.creator}
          </T>
          <T variant="caption" style={{ position: 'absolute', right: 14, bottom: 12, color: '#CCC5B9' }}>
            Source: {drop.source}
          </T>
        </Pressable>

        <View style={{ backgroundColor: c.track, borderRadius: radius.lg, padding: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T variant="eyebrow" style={{ color: c.text }}>DSU Pulse · after your quick check</T>
            <T variant="caption" style={{ color: c.text }}>{drop.pulseAnswered} answered</T>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
            <T variant="display" style={{ color: c.text, fontSize: 32 }}>{drop.pulsePct}%</T>
            <T variant="label" style={{ color: c.text, flex: 1 }}>of DSU students didn't know this either</T>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: c.track }}>
            <View style={{ width: `${drop.pulsePct}%`, height: 8, borderRadius: 4, backgroundColor: c.text }} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            style={{ flex: 1, minHeight: 52, borderRadius: radius.md, backgroundColor: c.btnBg, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="help-circle-outline" size={20} color={c.btnFg} />
            <T style={{ color: c.btnFg, fontFamily: fonts.bodyHeavy }}>Ask a question</T>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save"
            style={{ width: 52, minHeight: 52, borderRadius: radius.md, backgroundColor: c.track, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="bookmark-outline" size={20} color={c.text} />
          </Pressable>
        </View>
        <T variant="caption" style={{ color: c.text, textAlign: 'center' }}>Top questions get answered in tomorrow's Drop</T>
      </View>
    </SafeAreaView>
  );
}
