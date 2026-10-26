import type { StyleProp, ViewStyle } from 'react-native';

import { Button } from '@/components/ui';
import { useFollows } from '@/state/FollowProvider';

/** Follow / Following toggle for an official. Saved on the device by FollowProvider. */
export function FollowButton({ id, name, style }: { id: string; name: string; style?: StyleProp<ViewStyle> }) {
  const { isFollowing, toggleFollow } = useFollows();
  const on = isFollowing(id);
  return (
    <Button
      label={on ? 'Following' : 'Follow'}
      kind={on ? 'quiet' : 'dark'}
      icon={on ? 'checkmark' : 'add'}
      accessibilityLabel={on ? `Following ${name}. Tap to unfollow.` : `Follow ${name}`}
      onPress={() => toggleFollow(id)}
      style={style}
    />
  );
}
