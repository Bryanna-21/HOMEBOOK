import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

type ScreenName = 'Home' | 'Library' | 'Search' | 'Downloads' | 'History';

type Props = {
  screen: ScreenName;
};

const backgrounds: Record<ScreenName, number> = {
  Home: require('../../assets/images/backgrounds/home.jpeg'),
  Library: require('../../assets/images/backgrounds/library.jpeg'),
  Search: require('../../assets/images/backgrounds/search.jpeg'),
  Downloads: require('../../assets/images/backgrounds/downloads.jpeg'),
  History: require('../../assets/images/backgrounds/history.jpeg'),
};

export default function AnimatedBackground({ screen }: Props) {
  return (
    <View pointerEvents="none" style={styles.container}>
      <Image
        source={backgrounds[screen]}
        style={styles.image}
        contentFit="cover"
        transition={450}
        cachePolicy="memory-disk"
      />
      <View style={styles.overlay} />
      <View style={styles.bottomShade} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    backgroundColor: '#050812',
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(3, 7, 15, 0.48)',
  },
  bottomShade: {
    position: 'absolute',
    top: '42%',
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(3, 7, 15, 0.22)',
  },
});
