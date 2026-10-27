import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Animated as RNAnimated,
  Modal,
  PanResponder,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useReducedMotion } from './motion';

const DURATION = 220;

export function Sheet({
  visible,
  onClose,
  children,
  style,
  accessibilityLabel = 'Details',
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [translateY] = useState(() => new RNAnimated.Value(reduceMotion ? 0 : 36));
  const [opacity] = useState(() => new RNAnimated.Value(0));

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      translateY.setValue(reduceMotion ? 0 : 36);
      RNAnimated.parallel([
        RNAnimated.timing(opacity, { toValue: 1, duration: DURATION, useNativeDriver: true }),
        RNAnimated.timing(translateY, { toValue: 0, duration: reduceMotion ? 0 : DURATION, useNativeDriver: true }),
      ]).start();
    }
  }, [opacity, reduceMotion, translateY, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => !reduceMotion && gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 90 || gesture.vy > 1) onClose();
          else RNAnimated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }).start();
        },
      }),
    [onClose, reduceMotion, translateY],
  );

  if (!visible) return null;

  return (
    <Modal transparent visible onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <RNAnimated.View style={{ ...ViewStyleBackDrop, opacity }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close sheet" onPress={onClose} style={{ flex: 1 }} />
        </RNAnimated.View>
        <RNAnimated.View
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel}
          style={[
            {
              backgroundColor: t.surface,
              borderTopLeftRadius: radius.xxl,
              borderTopRightRadius: radius.xxl,
              paddingHorizontal: 20,
              paddingBottom: Math.max(insets.bottom, 20),
              maxHeight: '88%',
              opacity,
              transform: [{ translateY }],
            },
            style,
          ]}
          {...panResponder.panHandlers}
        >
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: t.emptyBorder, marginVertical: 10 }} />
          {children}
        </RNAnimated.View>
      </View>
    </Modal>
  );
}

const ViewStyleBackDrop: ViewStyle = {
  ...({ position: 'absolute', inset: 0 } as ViewStyle),
  backgroundColor: 'rgba(0,0,0,0.42)',
};
