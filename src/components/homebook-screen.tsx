
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ScreenName = 'Home' | 'Library' | 'Search' | 'Downloads' | 'History';

type Props = {
  screen: ScreenName;
};

const COLORS = {
  background: '#F4F8FA',
  surface: '#FFFFFF',
  primary: '#176B87',
  primaryLight: '#E5F2F6',
  text: '#172B36',
  muted: '#71818A',
  border: '#E2E9ED',
};

export default function HomebookScreen({ screen }: Props) {
  const [query, setQuery] = useState('');

  const descriptions: Record<ScreenName, string> = {
    Home: 'Your personal media space.',
    Library: 'Your locally indexed media collection.',
    Search: 'Find something in your collection.',
    Downloads: 'Media saved through HOMEBOOK.',
    History: 'Pick up where you left off.',
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandLetter}>H</Text>
          </View>
          <Text style={styles.brandName}>HOMEBOOK</Text>
        </View>
        <Text style={styles.headerLabel}>PERSONAL MEDIA HUB</Text>
      </View>

      <View style={styles.heading}>
        <Text style={styles.eyebrow}>YOUR MEDIA, YOUR SPACE</Text>
        <Text style={styles.title}>{screen}</Text>
        <Text style={styles.subtitle}>{descriptions[screen]}</Text>
      </View>

      {(screen === 'Home' || screen === 'Search') && (
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search your media library"
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      )}

      {screen === 'Home' && (
        <>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Your library</Text>
            <Text style={styles.sectionCaption}>A space for everything you enjoy</Text>
          </View>

          <View style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeEyebrow}>WELCOME TO HOMEBOOK</Text>
              <Text style={styles.welcomeTitle}>
                Your media.{"\n"}All in one place.
              </Text>
              <Text style={styles.welcomeText}>
                Organise and enjoy your personal collection, with privacy and offline access at its core.
              </Text>
            </View>
            <View style={styles.artCircle}>
              <Text style={styles.artLetter}>H</Text>
            </View>
          </View>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Get started</Text>
            <Text style={styles.sectionCaption}>Your next steps</Text>
          </View>

          <View style={styles.cardGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.cardSymbol}>▤</Text>
              <Text style={styles.cardTitle}>Build your library</Text>
              <Text style={styles.cardText}>
                Add local media sources to begin organising your collection.
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.cardSymbol}>▶</Text>
              <Text style={styles.cardTitle}>Enjoy your media</Text>
              <Text style={styles.cardText}>
                Playback and resume features will be added as we validate media support.
              </Text>
            </View>
          </View>
        </>
      )}

      {screen !== 'Home' && (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>
              {screen === 'Library' ? '▤' :
                screen === 'Search' ? '⌕' :
                screen === 'Downloads' ? '↓' : '◷'}
            </Text>
          </View>
          <Text style={styles.emptyTitle}>
            {screen === 'Search' && query.trim()
              ? 'Search is not connected yet'
              : `Your ${screen.toLowerCase()} starts here`}
          </Text>
          <Text style={styles.emptyText}>
            {screen === 'Library'
              ? 'No local media sources have been indexed yet.'
              : screen === 'Downloads'
                ? 'Files downloaded through HOMEBOOK will appear here.'
                : screen === 'History'
                  ? 'Your playback history will appear here once playback is implemented.'
                  : 'The search interface is ready for the library search engine.'}
          </Text>
        </View>
      )}

      <Text style={styles.footer}>HOMEBOOK · YOUR MEDIA, YOUR CONTROL</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingTop: 30,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 52,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
  },
  brandName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  heading: {
    marginBottom: 28,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: {
    color: COLORS.text,
    fontSize: 38,
    fontWeight: '800',
    marginBottom: 7,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 36,
  },
  searchIcon: {
    color: COLORS.primary,
    fontSize: 25,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    outlineStyle: 'none',
  } as any,
  sectionHeading: {
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionCaption: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
  },
  welcomeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 30,
    minHeight: 230,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    marginBottom: 38,
  },
  welcomeContent: {
    flex: 1,
    maxWidth: 570,
  },
  welcomeEyebrow: {
    color: '#C6E6F0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 39,
  },
  welcomeText: {
    color: '#E1F1F5',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 440,
  },
  artCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#FFFFFF20',
    borderWidth: 1,
    borderColor: '#FFFFFF40',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
  artLetter: {
    color: '#FFFFFF',
    fontSize: 78,
    fontWeight: '800',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
    flexGrow: 1,
    flexBasis: 240,
    minHeight: 155,
  },
  cardSymbol: {
    color: COLORS.primary,
    fontSize: 24,
    marginBottom: 13,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 7,
  },
  cardText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 270,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyIconText: {
    color: COLORS.primary,
    fontSize: 27,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 420,
    marginTop: 9,
  },
  footer: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 42,
  },
});
