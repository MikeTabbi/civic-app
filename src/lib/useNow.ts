import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { parseLocalDate } from '@/data/delaware';

/**
 * The current time, fixed for the life of the screen.
 * Dev only: a `?date=YYYY-MM-DD` route param fakes "today" (noon local), so Drops and
 * streaks can be tested for other days, e.g. /drop?date=2026-10-29.
 */
export function useNow() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const [now] = useState(() => {
    if (__DEV__ && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const d = parseLocalDate(date);
      d.setHours(12);
      return d;
    }
    return new Date();
  });
  return now;
}
