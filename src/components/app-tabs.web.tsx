import { useState } from 'react';
import { usePathname } from 'expo-router';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

const COLORS = {
  background: '#050B14',
  surface: '#0D1726',
  primary: '#28C7F2',
  primaryLight: '#102B3A',
  text: '#F3F8FC',
  muted: '#8FA5B8',
  border: '#1C3042',
};

const NAV_ITEMS = [
  { name: 'index', href: '/', label: 'Home', ios: 'house.fill', android: 'home' },
  { name: 'library', href: '/library', label: 'Library', ios: 'square.grid.2x2.fill', android: 'video_library' },
  { name: 'search', href: '/search', label: 'Search', ios: 'magnifyingglass', android: 'search' },
  { name: 'downloads', href: '/downloads', label: 'Downloads', ios: 'arrow.down.circle', android: 'download' },
  { name: 'history', href: '/history', label: 'History', ios: 'clock.arrow.circlepath', android: 'history' },
] as const;

function NavIcon({
  ios,
  android,
  active,
  size = 20,
}: {
  ios: string;
  android: string;
  active?: boolean;
  size?: number;
}) {
  return (
    <SymbolView
      name={{ ios: ios as any, android: android as any, web: android as any }}
      size={size}
      tintColor={active ? COLORS.primary : COLORS.muted}
      fallback={<Text style={{ color: active ? COLORS.primary : COLORS.muted, fontSize: size }}>•</Text>}
    />
  );
}

export default function AppTabs() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const desktop = width >= 900;
  const [expanded, setExpanded] = useState(true);
  const sidebarWidth = expanded ? 248 : 76;

  return (
    <Tabs>
      <TabSlot
        style={[
          styles.slot,
          desktop ? { marginLeft: sidebarWidth } : styles.mobileSlot,
        ]}
      />

      <TabList
        style={[
          styles.navigation,
          desktop
            ? [styles.desktopNavigation, { width: sidebarWidth, paddingHorizontal: expanded ? 20 : 12 }]
            : styles.mobileNavigation,
        ]}
      >
        {desktop && (
          <View style={[styles.brand, !expanded && styles.brandCollapsed]}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>H</Text>
            </View>
            {expanded && (
              <View>
                <Text style={styles.brandName}>HOMEBOOK</Text>
                <Text style={styles.brandCaption}>PERSONAL MEDIA HUB</Text>
              </View>
            )}
          </View>
        )}

        {desktop && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            onPress={() => setExpanded((value) => !value)}
            style={({ pressed }) => [
              styles.sidebarToggle,
              !expanded && styles.sidebarToggleCollapsed,
              pressed && styles.pressed,
            ]}
          >
            <NavIcon
              ios={expanded ? 'sidebar.left' : 'sidebar.right'}
              android={expanded ? 'left_panel_close' : 'left_panel_open'}
              size={19}
            />
            {expanded && <Text style={styles.toggleText}>Collapse sidebar</Text>}
          </Pressable>
        )}

        {NAV_ITEMS.map((item) => (
            <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={({ pressed }: any) => [
                  styles.tabButton,
                  !desktop && styles.mobileTabButton,
                  !expanded && desktop && styles.collapsedTabButton,
                  pressed && styles.pressed,
                ]}
              >
                <>
                  <NavIcon
                    ios={item.ios}
                    android={item.android}
                    active={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))}
                    size={desktop ? 20 : 19}
                  />
                  {(expanded || !desktop) && (
                    <Text style={[styles.tabText, (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))) && styles.tabTextActive]}>
                      {item.label}
                    </Text>
                  )}
                </>
              </Pressable>
            </TabTrigger>
        ))}

        {desktop && expanded && (
          <Text style={styles.sidebarFooter}>YOUR MEDIA. YOUR CONTROL.</Text>
        )}
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mobileSlot: {
    paddingBottom: 78,
  },
  navigation: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    zIndex: 10,
  },
  desktopNavigation: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: 1,
    paddingTop: 25,
    paddingBottom: 24,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
  },
  mobileNavigation: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 2,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    minHeight: 44,
  },
  brandCollapsed: {
    justifyContent: 'center',
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandLetter: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
  },
  brandName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandCaption: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 3,
  },
  sidebarToggle: {
    minHeight: 42,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sidebarToggleCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  toggleText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  navigationItems: {
    gap: 7,
  },
  desktopItems: {
    flexDirection: 'column',
  },
  mobileItems: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 2,
  },
  tabButton: {
    minHeight: 46,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  mobileTabButton: {
    minWidth: 55,
    minHeight: 54,
    paddingHorizontal: 5,
    paddingVertical: 5,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 4,
  },
  collapsedTabButton: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  tabText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.65,
  },
  sidebarFooter: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 'auto',
  },
});
