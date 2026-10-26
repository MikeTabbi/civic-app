import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import type { IconName } from './ui';

const TABS: Record<string, { label: string; icon: IconName; iconOn: IconName }> = {
  index: { label: 'Ballot', icon: 'checkbox-outline', iconOn: 'checkbox' },
  map: { label: 'Map', icon: 'map-outline', iconOn: 'map' },
  squad: { label: 'Squad', icon: 'people-outline', iconOn: 'people' },
  me: { label: 'Me', icon: 'person-circle-outline', iconOn: 'person-circle' },
};

/**
 * v8 tab bar: Ballot · Map · [Drop] · Squad · Me.
 * The Drop sits in the middle as a raised orange button and opens full-screen.
 */
export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const { t } = useTheme();
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
        backgroundColor: t.bg,
        borderTopWidth: 1,
        borderTopColor: t.navLine,
        paddingTop: 6,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingHorizontal: 8,
      }}
    >
      {left.map(renderTab)}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open today's Drop"
          onPress={() => router.push('/drop')}
          style={({ pressed }) => ({
            width: 60,
            height: 60,
            marginTop: -26,
            borderRadius: 30,
            backgroundColor: t.accent,
            borderWidth: 4,
            borderColor: t.bg,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Ionicons name="flame" size={26} color={t.onAccent} />
        </Pressable>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: t.faint, marginTop: 2 }}>Drop</Text>
      </View>
      {right.map(renderTab)}
    </View>
  );
}
