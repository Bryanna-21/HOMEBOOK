/**
 * HOMEBOOK uses a dark-only interface on every platform.
 * Returning a constant also keeps server and client rendering consistent.
 */
export function useColorScheme() {
  return 'dark' as const;
}
