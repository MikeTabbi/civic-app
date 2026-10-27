import { Text, type StyleProp, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

export function AccentHeading({
  children,
  accent,
  style,
  color,
  accentColor,
}: {
  children: string;
  accent: string;
  style?: StyleProp<TextStyle>;
  color?: string;
  accentColor?: string;
}) {
  const { t } = useTheme();
  const index = children.toLocaleLowerCase().indexOf(accent.toLocaleLowerCase());
  const shared: TextStyle = {
    color: color ?? t.text,
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 37,
    letterSpacing: -1.19,
  };

  if (index < 0) return <Text style={[shared, style]}>{children}</Text>;

  const before = children.slice(0, index);
  const word = children.slice(index, index + accent.length);
  const after = children.slice(index + accent.length);
  return (
    <Text style={[shared, style]}>
      {before}
      <Text style={{ fontFamily: fonts.serifItalic, color: accentColor }}>{word}</Text>
      {after}
    </Text>
  );
}
