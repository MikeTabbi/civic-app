import { useReducedMotion as useReanimatedReducedMotion } from 'react-native-reanimated';

/** App-wide motion preference. Motion components must consult this hook. */
export function useReducedMotion() {
  return useReanimatedReducedMotion();
}
