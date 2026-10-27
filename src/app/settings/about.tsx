import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';

import { Card, IconButton, Row, Screen, T } from '@/components/ui';
import { WHYY_GUIDE_URL } from '@/data/ballot2026';
import { OFFICIAL_SITE } from '@/data/delaware';
import { useTheme } from '@/theme/ThemeProvider';

const close = () => (router.canGoBack() ? router.back() : router.replace('/me'));

const PRINCIPLES = [
  'Nonpartisan. We never tell you who to vote for.',
  'No party colors. Orange is our only accent and never stands for a party.',
  'Candidates and officials are listed by office and last name, never by party.',
  'Every civic fact shows its source.',
  'Your address, voting plan and reminders stay private to you.',
];

const SOURCES: { name: string; use: string; url: string | null }[] = [
  { name: 'Delaware Department of Elections', use: 'Election dates, deadlines, candidates and voting locations', url: OFFICIAL_SITE },
  { name: 'U.S. Census Geocoder', use: 'Turns your address into your districts', url: 'https://geocoding.geo.census.gov/geocoder/' },
  { name: 'WHYY voter guide', use: 'Plain-language race and candidate details', url: WHYY_GUIDE_URL },
  { name: 'Official government sites', use: 'Officials, their offices and contact info. Each official page links its source.', url: null },
  { name: 'Photon and OpenStreetMap', use: 'Address suggestions as you type', url: 'https://www.openstreetmap.org/copyright' },
];

/** Me > About and sources. */
export default function About() {
  const { t } = useTheme();
  return (
    <Screen style={{ gap: 16 }}>
      <Row style={{ minHeight: 44 }}>
        <IconButton icon="chevron-back" label="Back" onPress={close} />
      </Row>
      <T variant="title">About and sources</T>

      <Card>
        <T variant="heading">Our principles</T>
        {PRINCIPLES.map((p) => (
          <Row key={p} gap={10} style={{ alignItems: 'flex-start' }}>
            <Ionicons name="checkmark-circle" size={18} color={t.done} style={{ marginTop: 1 }} />
            <T style={{ flex: 1 }}>{p}</T>
          </Row>
        ))}
      </Card>

      <Card>
        <T variant="heading">Where our data comes from</T>
        {SOURCES.map((s) => {
          const body = (
            <View style={{ flex: 1 }}>
              <T variant="label" tone={s.url ? 'accent' : 'text'}>{s.name}</T>
              <T variant="caption" tone="faint">{s.use}</T>
            </View>
          );
          return s.url ? (
            <Pressable key={s.name} accessibilityRole="link" onPress={() => Linking.openURL(s.url!)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}>
              {body}
              <Ionicons name="open-outline" size={16} color={t.faint} />
            </Pressable>
          ) : (
            <View key={s.name} style={{ minHeight: 44, justifyContent: 'center' }}>{body}</View>
          );
        })}
        <T variant="caption" tone="faint">Each Drop also links the news reports and documents it draws on.</T>
      </Card>
    </Screen>
  );
}
