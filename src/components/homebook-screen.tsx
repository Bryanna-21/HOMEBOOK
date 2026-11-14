import AnimatedBackground from '@/components/animated-background';
import MediaLibraryPanel from '@/components/media-library-panel';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

type ScreenName = 'Home' | 'Library' | 'Search' | 'Downloads' | 'History';
type Category = 'For You' | 'Trending' | 'Movies' | 'Series' | 'Recently Added';

type MediaItem = {
  id: string;
  title: string;
  subtitle: string;
  category: 'Movies' | 'Series';
  year: string;
  genre: string;
  duration: string;
  accent: string;
  artwork: string;
  trending?: boolean;
  recentlyAdded?: boolean;
  progress?: number;
};

type Props = {
  screen: ScreenName;
};

const C = {
  background: '#050B14',
  surface: '#0D1726',
  raised: '#122238',
  primary: '#28C7F2',
  primarySoft: '#102B3A',
  text: '#F3F8FC',
  muted: '#8FA5B8',
  border: '#1C3042',
};

const categories: Category[] = [
  'For You',
  'Trending',
  'Movies',
  'Series',
  'Recently Added',
];

const descriptions: Record<ScreenName, string> = {
  Home: 'Your personal cinema. Your collection. Your space.',
  Library: 'Everything in your personal media collection.',
  Search: 'Find something worth watching.',
  Downloads: 'Your media, ready wherever you are.',
  History: 'Continue exactly where you left off.',
};

// Demonstration catalogue only. These are not local files or playable media.
const demoMedia: MediaItem[] = [
  {
    id: 'blue-horizon',
    title: 'Blue Horizon',
    subtitle: 'Beyond the edge of the known',
    category: 'Movies',
    year: '2026',
    genre: 'Adventure',
    duration: '2h 08m',
    accent: '#12658B',
    artwork: 'OCEAN',
    trending: true,
    recentlyAdded: true,
  },
  {
    id: 'silent-orbit',
    title: 'Silent Orbit',
    subtitle: 'Some signals should stay lost',
    category: 'Movies',
    year: '2025',
    genre: 'Sci-Fi',
    duration: '1h 54m',
    accent: '#423C78',
    artwork: 'ORBIT',
    trending: true,
    progress: 62,
  },
  {
    id: 'the-last-signal',
    title: 'The Last Signal',
    subtitle: 'The truth is out there',
    category: 'Series',
    year: '2026',
    genre: 'Mystery',
    duration: 'S1 · E4',
    accent: '#7A493B',
    artwork: 'SIGNAL',
    trending: true,
    recentlyAdded: true,
    progress: 34,
  },
  {
    id: 'wild-earth',
    title: 'Wild Earth',
    subtitle: 'A world without borders',
    category: 'Series',
    year: '2025',
    genre: 'Documentary',
    duration: 'S2 · E1',
    accent: '#37664F',
    artwork: 'WILD',
    recentlyAdded: true,
    progress: 81,
  },
  {
    id: 'afterlight',
    title: 'Afterlight',
    subtitle: 'Every ending has a beginning',
    category: 'Movies',
    year: '2024',
    genre: 'Drama',
    duration: '2h 01m',
    accent: '#805B38',
    artwork: 'LIGHT',
  },
  {
    id: 'deep-blue',
    title: 'Deep Blue',
    subtitle: 'The ocean keeps its secrets',
    category: 'Series',
    year: '2025',
    genre: 'Documentary',
    duration: 'S1 · E6',
    accent: '#176B83',
    artwork: 'DEEP',
    trending: true,
  },
];

export default function HomebookScreen({ screen }: Props) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('For You');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const { width } = useWindowDimensions();
  const compact = width < 600;
  const medium = width >= 600 && width < 1000;
  const horizontalPadding = compact ? 20 : medium ? 30 : 48;
  const posterWidth = compact ? 142 : medium ? 158 : 174;

  const filteredMedia = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return demoMedia.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        `${item.title} ${item.subtitle} ${item.genre} ${item.category}`
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesCategory =
        activeCategory === 'For You' ||
        (activeCategory === 'Trending' && item.trending) ||
        (activeCategory === 'Recently Added' && item.recentlyAdded) ||
        item.category === activeCategory;

      return matchesQuery && matchesCategory;
    });
  }, [activeCategory, query]);

  const continueWatching = demoMedia.filter(
    (item) => typeof item.progress === 'number',
  );

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return [];

    return demoMedia.filter((item) =>
      `${item.title} ${item.subtitle} ${item.genre} ${item.category}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query]);

  const renderPoster = (item: MediaItem, width: number) => (
    <Pressable
      key={item.id}
      style={[styles.posterCard, { width }]}
      onPress={() => setSelectedMedia(item)}
    >
      <View style={[styles.posterArtwork, { backgroundColor: item.accent }]}>
        <View style={styles.posterGlow} />
        <View style={styles.posterArtworkTop}>
          <Text style={styles.posterBrand}>HOMEBOOK</Text>
          <Text style={styles.posterYear}>{item.year}</Text>
        </View>
        <View style={styles.posterArtworkCenter}>
          <Text style={styles.posterArtworkWord}>{item.artwork}</Text>
          <View style={styles.posterArtworkLine} />
        </View>
        <Text style={styles.posterArtworkTitle}>{item.title.toUpperCase()}</Text>
        <Text style={styles.posterArtworkGenre}>{item.genre.toUpperCase()}</Text>
        {item.progress !== undefined && (
          <View style={styles.posterProgressTrack}>
            <View
              style={[styles.posterProgressFill, { width: `${item.progress}%` }]}
            />
          </View>
        )}
      </View>
      <Text style={styles.posterTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.posterMeta} numberOfLines={1}>
        {item.year} · {item.category}
      </Text>
    </Pressable>
  );

  const renderSection = (
    title: string,
    subtitle: string,
    items: MediaItem[],
  ) => {
    if (!items.length) return null;

    return (
      <View style={styles.mediaSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadingCopy}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          </View>
          <Text style={styles.sectionCount}>
            {String(items.length).padStart(2, '0')}
          </Text>
        </View>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.posterRail}
        >
          {items.map((item) => renderPoster(item, posterWidth))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.pageRoot}>
      <AnimatedBackground screen={screen} />
      <ScrollView
      style={styles.page}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: horizontalPadding },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.brand}>
          <Image
            source={require('@/assets/images/homebook-logo.png')}
            style={styles.brandImage}
            contentFit="cover"
          />
          <View>
            <Text style={styles.brandName}>HOMEBOOK</Text>
            <Text style={styles.brandCaption}>BY X EXILE</Text>
          </View>
        </View>
        <View style={styles.headerStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>PERSONAL MEDIA</Text>
        </View>
      </View>

      <View style={styles.heading}>
        <Text style={styles.eyebrow}>
          {screen === 'Home' ? 'YOUR WORLD OF ENTERTAINMENT' : 'HOMEBOOK LIBRARY'}
        </Text>
        <Text style={[styles.title, compact && styles.titleCompact]}>
          {screen === 'Home' ? 'Welcome home.' : screen}
        </Text>
        <Text style={styles.subtitle}>{descriptions[screen]}</Text>
      </View>

      {(screen === 'Home' || screen === 'Search') && (
        <View style={styles.searchBox}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            size={20}
            tintColor={C.primary}
            style={styles.searchSymbol}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search movies, series..."
            placeholderTextColor={C.muted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <Text style={styles.clearSearch}>×</Text>
            </Pressable>
          )}
        </View>
      )}

      {screen === 'Home' && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRail}
          >
            {categories.map((category) => {
              const active = category === activeCategory;

              return (
                <Pressable
                  key={category}
                  onPress={() => {
                    setActiveCategory(category);
                    setSelectedMedia(null);
                  }}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      active && styles.categoryChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.hero}>
            <View style={styles.heroOrbLarge} />
            <View style={styles.heroOrbSmall} />
            <View style={styles.heroContent}>
              <View style={styles.heroLabel}>
                <View style={styles.heroLabelDot} />
                <Text style={styles.heroLabelText}>FEATURED COLLECTION</Text>
              </View>
              <Text style={styles.heroEyebrow}>A MORE PERSONAL WAY TO WATCH</Text>
              <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
                Your collection.
                {'\n'}Your experience.
              </Text>
              <Text style={styles.heroText}>
                One beautifully organised home for the media you own and love.
                Built around privacy and offline access.
              </Text>
              <View style={styles.heroFooter}>
                <Text style={styles.heroSignature}>X EXILE</Text>
                <Text style={styles.heroHint}>DISCOVER YOUR LIBRARY  →</Text>
              </View>
            </View>
            <View style={styles.heroSideMark}>
              <Text style={styles.heroSideMarkText}>H</Text>
            </View>
          </View>

          <View style={styles.demoNotice}>
            <View style={styles.demoNoticeDot} />
            <Text style={styles.demoNoticeText}>
              DEMO CATALOGUE · SAMPLE TITLES, NOT LOCAL MEDIA
            </Text>
          </View>

          {renderSection(
            activeCategory === 'For You' ? 'Picked for your space' : activeCategory,
            activeCategory === 'For You'
              ? 'A preview of the HOMEBOOK browsing experience'
              : `Showing ${activeCategory.toLowerCase()} demo titles`,
            filteredMedia,
          )}

          {activeCategory === 'For You' &&
            renderSection(
              'Continue watching',
              'Your progress will appear here once playback is connected',
              continueWatching,
            )}

          {activeCategory === 'For You' &&
            renderSection(
              'Recently added',
              'New additions to your personal collection',
              demoMedia.filter((item) => item.recentlyAdded),
            )}

          {filteredMedia.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nothing found</Text>
              <Text style={styles.emptyText}>
                Try another category or search term.
              </Text>
            </View>
          )}

          {selectedMedia && (
            <View style={styles.detailPanel}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailEyebrow}>DEMO TITLE DETAILS</Text>
                <Pressable onPress={() => setSelectedMedia(null)} hitSlop={12}>
                  <Text style={styles.detailClose}>×</Text>
                </Pressable>
              </View>
              <Text style={styles.detailTitle}>{selectedMedia.title}</Text>
              <Text style={styles.detailSubtitle}>{selectedMedia.subtitle}</Text>
              <Text style={styles.detailMeta}>
                {selectedMedia.year} · {selectedMedia.genre} · {selectedMedia.duration}
              </Text>
              <Text style={styles.detailDisclaimer}>
                This is sample catalogue content. Playback is not connected yet.
              </Text>
            </View>
          )}

          <View style={styles.featureCard}>
            <SymbolView
              name={{ ios: 'lock.shield.fill', android: 'shield', web: 'shield' }}
              size={27}
              tintColor={C.primary}
              fallback={<Text style={styles.featureSymbol}>◉</Text>}
            />
            <View style={styles.featureCopy}>
              <Text style={styles.featureTitle}>Your media stays yours</Text>
              <Text style={styles.featureText}>
                HOMEBOOK is being built around local media, private library data
                and reliable offline playback.
              </Text>
            </View>
          </View>
        </>
      )}

      {screen === 'Search' && (
        <>
          <View style={styles.demoNotice}>
            <View style={styles.demoNoticeDot} />
            <Text style={styles.demoNoticeText}>SEARCHING SAMPLE DEMO CATALOGUE</Text>
          </View>
          {query.trim() ? (
            searchResults.length ? (
              <View style={styles.searchResultsGrid}>
                {searchResults.map((item) => renderPoster(item, posterWidth))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No matching demo titles</Text>
                <Text style={styles.emptyText}>
                  Try a different title, genre or media type.
                </Text>
              </View>
            )
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>What would you like to find?</Text>
              <Text style={styles.emptyText}>
                Search the sample catalogue. Local library search will be
                connected when media indexing is implemented.
              </Text>
            </View>
          )}
          {selectedMedia && (
            <View style={styles.detailPanel}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailEyebrow}>DEMO TITLE DETAILS</Text>
                <Pressable onPress={() => setSelectedMedia(null)} hitSlop={12}>
                  <Text style={styles.detailClose}>×</Text>
                </Pressable>
              </View>
              <Text style={styles.detailTitle}>{selectedMedia.title}</Text>
              <Text style={styles.detailSubtitle}>{selectedMedia.subtitle}</Text>
              <Text style={styles.detailDisclaimer}>
                Sample content only. Playback is not connected yet.
              </Text>
            </View>
          )}
        </>
      )}

      {screen === 'Library' && <MediaLibraryPanel />}

      {(screen === 'Downloads' || screen === 'History') && (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <SymbolView
              name={screen === 'Downloads'
                ? { ios: 'arrow.down.to.line', android: 'download', web: 'download' }
                : { ios: 'clock', android: 'history', web: 'history' }}
              size={29}
              tintColor={C.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {screen === 'Downloads'
              ? 'Nothing downloaded yet'
              : 'Your viewing history is empty'}
          </Text>
          <Text style={styles.emptyText}>
            {screen === 'Downloads'
              ? 'Media saved to this device will appear here and be available offline.'
              : 'Your watched media and saved playback positions will appear here.'}
          </Text>
          <View style={styles.emptyDivider} />
          <Text style={styles.emptyFootnote}>HOMEBOOK · BY X EXILE</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerBrand}>HOMEBOOK</Text>
        <Text style={styles.footerText}>YOUR MEDIA. YOUR CONTROL.</Text>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
    backgroundColor: '#050812',
    overflow: 'hidden',
  },
  page: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    paddingTop: 22,
    paddingBottom: 48,
  },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 34,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandImage: {
    width: 43,
    height: 43,
    borderRadius: 12,
  },
  brandName: {
    color: C.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  brandCaption: {
    color: C.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginTop: 4,
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.surface,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  statusText: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heading: {
    marginBottom: 22,
  },
  eyebrow: {
    color: C.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: C.text,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginBottom: 7,
  },
  titleCompact: {
    fontSize: 35,
  },
  subtitle: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  searchBox: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchIcon: {
    color: C.primary,
    fontSize: 25,
    marginRight: 11,
  },
  searchSymbol: {
    marginRight: 11,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 13,
    outlineStyle: 'none',
  } as any,
  clearSearch: {
    color: C.muted,
    fontSize: 23,
    paddingLeft: 10,
  },
  categoryRail: {
    gap: 9,
    paddingBottom: 22,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.surface,
  },
  categoryChipActive: {
    backgroundColor: C.primarySoft,
    borderColor: C.primary,
  },
  categoryChipText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: C.primary,
  },
  hero: {
    minHeight: 300,
    borderRadius: 23,
    padding: 27,
    justifyContent: 'center',
    backgroundColor: '#0B3150',
    borderWidth: 1,
    borderColor: '#174B6A',
    overflow: 'hidden',
    marginBottom: 17,
  },
  heroContent: {
    maxWidth: 590,
    zIndex: 2,
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    right: -70,
    top: -100,
    backgroundColor: '#12658B',
    opacity: 0.38,
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: 75,
    bottom: -125,
    backgroundColor: '#28C7F2',
    opacity: 0.12,
  },
  heroLabel: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#39718D',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 23,
  },
  heroLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  heroLabelText: {
    color: '#DDF7FF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  heroEyebrow: {
    color: '#8FE8FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroTitleCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
  heroText: {
    color: '#C5DDEB',
    fontSize: 13,
    lineHeight: 21,
    maxWidth: 470,
    marginTop: 12,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 27,
  },
  heroSignature: {
    color: '#8FE8FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  heroHint: {
    color: '#DDF7FF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroSideMark: {
    position: 'absolute',
    right: 55,
    top: 45,
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: '#8FE8FF',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.2,
  },
  heroSideMarkText: {
    color: '#FFFFFF',
    fontSize: 130,
    fontWeight: '900',
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
    marginBottom: 25,
  },
  demoNoticeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E6B65C',
  },
  demoNoticeText: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.15,
  },
  mediaSection: {
    marginBottom: 29,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionHeadingCopy: {
    flex: 1,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: C.muted,
    fontSize: 10,
    marginTop: 5,
  },
  sectionCount: {
    color: C.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  posterRail: {
    gap: 13,
    paddingRight: 5,
    paddingBottom: 3,
  },
  posterCard: {
    flexShrink: 0,
  },
  posterArtwork: {
    height: 218,
    borderRadius: 13,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF20',
  },
  posterGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -65,
    top: 35,
    backgroundColor: '#FFFFFF',
    opacity: 0.10,
  },
  posterArtworkTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  posterBrand: {
    color: '#FFFFFFB8',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  posterYear: {
    color: '#FFFFFFB8',
    fontSize: 8,
    fontWeight: '700',
  },
  posterArtworkCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterArtworkWord: {
    color: '#FFFFFFD9',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 3,
  },
  posterArtworkLine: {
    width: 36,
    height: 2,
    backgroundColor: '#FFFFFFB8',
    marginTop: 8,
  },
  posterArtworkTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  posterArtworkGenre: {
    color: '#FFFFFFB8',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginTop: 4,
  },
  posterProgressTrack: {
    height: 3,
    backgroundColor: '#FFFFFF55',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 9,
  },
  posterProgressFill: {
    height: '100%',
    backgroundColor: C.primary,
    borderRadius: 3,
  },
  posterTitle: {
    color: C.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },
  posterMeta: {
    color: C.muted,
    fontSize: 9,
    marginTop: 4,
  },
  searchResultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  detailPanel: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: 17,
    padding: 18,
    marginTop: 4,
    marginBottom: 25,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailEyebrow: {
    color: C.primary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  detailClose: {
    color: C.muted,
    fontSize: 24,
  },
  detailTitle: {
    color: C.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 12,
  },
  detailSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 5,
  },
  detailMeta: {
    color: C.primary,
    fontSize: 10,
    marginTop: 12,
    fontWeight: '700',
  },
  detailDisclaimer: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 19,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderColor: C.border,
    borderWidth: 1,
    marginTop: 5,
  },
  featureSymbol: {
    color: C.primary,
    fontSize: 27,
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: '800',
  },
  featureText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },
  emptyCard: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: C.surface,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 25,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primarySoft,
    marginBottom: 19,
  },
  emptyIconText: {
    color: C.primary,
    fontSize: 29,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 390,
    marginTop: 9,
  },
  emptyDivider: {
    width: 45,
    height: 2,
    backgroundColor: C.primary,
    marginTop: 25,
    marginBottom: 13,
  },
  emptyFootnote: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 38,
    gap: 5,
  },
  footerBrand: {
    color: C.text,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  footerText: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
