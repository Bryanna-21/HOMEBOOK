import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

const COLORS = {
  background: '#F4F8FA',
  surface: '#FFFFFF',
  primary: '#176B87',
  primaryLight: '#E5F2F6',
  text: '#172B36',
  muted: '#71818A',
  border: '#E2E9ED',
};

export default function AppTabs() {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;

  return (
    <Tabs>
      <TabSlot
        style={[
          styles.slot,
          desktop ? styles.desktopSlot : styles.mobileSlot,
        ]}
      />

      <TabList asChild>
        <CustomTabList />
      </TabList>
    </Tabs>
  );
}

function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && styles.tabButtonActive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.tabText,
          isFocused && styles.tabTextActive,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;

  return (
    <View
      {...props}
      style={[
        props.style,
        styles.navigation,
        desktop ? styles.desktopNavigation : styles.mobileNavigation,
      ]}
    >
      {desktop && (
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandLetter}>H</Text>
          </View>
          <View>
            <Text style={styles.brandName}>HOMEBOOK</Text>
            <Text style={styles.brandCaption}>PERSONAL MEDIA HUB</Text>
          </View>
        </View>
      )}

      <View
        style={[
          styles.navigationItems,
          desktop ? styles.desktopItems : styles.mobileItems,
        ]}
      >
        <TabTrigger name="home" href="/" asChild>
          <TabButton>Home</TabButton>
        </TabTrigger>

        <TabTrigger name="library" href="/library" asChild>
          <TabButton>Library</TabButton>
        </TabTrigger>

        <TabTrigger name="search" href="/search" asChild>
          <TabButton>Search</TabButton>
        </TabTrigger>

        <TabTrigger name="downloads" href="/downloads" asChild>
          <TabButton>Downloads</TabButton>
        </TabTrigger>

        <TabTrigger name="history" href="/history" asChild>
          <TabButton>History</TabButton>
        </TabTrigger>
      </View>

      {desktop && (
        <Text style={styles.sidebarFooter}>
          YOUR MEDIA. YOUR CONTROL.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  desktopSlot: {
    marginLeft: 248,
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
    width: 248,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 24,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  mobileNavigation: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 48,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  navigationItems: {
    gap: 8,
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
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 10,
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    color: COLORS.muted,
    fontSize: 14,
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
