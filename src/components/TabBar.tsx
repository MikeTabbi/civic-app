import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';

import { dropForDate } from '@/data/drops';
import { useStreak } from '@/state/StreakProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { PressableScale } from './PressableScale';
import type { IconName } from './ui';

const TABS: Record<string, { label: string; icon: IconName; iconOn: IconName }> = {
  index: { label: 'Ballot', icon: 'checkbox-outline', iconOn: 'checkbox' },
  map: { label: 'Map', icon: 'map-outline', iconOn: 'map' },
  squad: { label: 'Squad', icon: 'people-outline', iconOn: 'people' },
  me: { label: 'Me', icon: 'person-circle-outline', iconOn: 'person-circle' },
};

/**
 * Ballot · Map · [Drop] · Squad · Me.
 */
export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const { t } = useTheme();
  const { isDone } = useStreak();
  const current = dropForDate();
  const dropPending = !!current && !isDone(current.id);
  const routes = state.routes.filter((r) => TABS[r.name]);
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  const renderTab = (route: (typeof routes)[number]) => {
    const meta = TABS[route.name];
    const focused = state.routes[state.index]?.key === route.key;
    const color = focused ? t.text : t.faint;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={meta.label}
        onPress={() => navigateToTab(route.key)}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 52 }}
      >
        <Ionicons name={focused ? meta.iconOn : meta.icon} size={24} color={color} />
        <Text style={{ fontFamily: focused ? fonts.bodyHeavy : fonts.bodySemi, fontSize: 11, color }}>{meta.label}</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderTopWidth: 1,
        borderTopColor: t.navLine,
        paddingTop: 6,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingHorizontal: 8,
      }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: t.bg, opacity: 0.94 }} />
      {left.map(renderTab)}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={dropPending ? "Open today's Drop, not finished yet" : "Open today's Drop"}
          onPress={() => router.push('/drop')}
          style={{
            width: 58,
            height: 58,
            marginTop: -26,
            borderRadius: 29,
            backgroundColor: t.scheme === 'light' ? t.forest : t.primary.bg,
            borderWidth: 4,
            borderColor: t.bg,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: t.forest,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.24,
            shadowRadius: 10,
            elevation: 7,
          }}
        >
          <Ionicons name="flame" size={26} color={t.scheme === 'dark' ? t.primary.fg : t.lime} />
          {dropPending ? (
            <View
              style={{ position: 'absolute', top: 1, right: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: t.lime, borderWidth: 2, borderColor: t.forest }}
            />
          ) : null}
        </PressableScale>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: t.faint, marginTop: 2 }}>Drop</Text>
      </View>
      {right.map(renderTab)}
    </View>
  );
}
