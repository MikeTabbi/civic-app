import { useEffect, useState } from 'react';
import { View, type DimensionValue, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { useReducedMotion } from './motion';

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    if (reduceMotion || measuredWidth === 0) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    progress.value = withRepeat(withTiming(1, { duration: 280 }), -1, false);
    return () => cancelAnimation(progress);
  }, [measuredWidth, progress, reduceMotion]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -measuredWidth * 0.45 + progress.value * measuredWidth * 1.45 }],
  }));
  const onLayout = (event: LayoutChangeEvent) => setMeasuredWidth(event.nativeEvent.layout.width);

  return (
    <View onLayout={onLayout} style={[{ width, height, borderRadius: radius, overflow: 'hidden', backgroundColor: t.empty }, style]}>
      {!reduceMotion && measuredWidth > 0 ? (
        <Animated.View
          style={[
            { position: 'absolute', top: 0, bottom: 0, width: '38%', backgroundColor: t.surface, opacity: 0.5 },
            shimmerStyle,
          ]}
        />
      ) : null}
    </View>
  );
}
