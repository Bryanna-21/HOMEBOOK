import { ImageBackground } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const started = useRef(false);
  const [opacity] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.96));
  const [progress] = useState(() => new Animated.Value(0));

  const startAnimation = useCallback(() => {
    if (started.current) return;
    started.current = true;

    SplashScreen.hideAsync().catch(() => undefined);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(1450),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scale, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 },
      ),
    ]).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  }, [opacity, progress, scale]);

  useEffect(() => {
    return () => {
      opacity.stopAnimation();
      scale.stopAnimation();
      progress.stopAnimation();
    };
  }, [opacity, progress, scale]);

  if (!visible) return null;

  const progressTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-42, 42],
  });

  return (
    <Animated.View
      onLayout={startAnimation}
      pointerEvents="none"
      style={[styles.overlay, { opacity }]}
    >
      <ImageBackground
        source={require('@/assets/images/homebook-splash.png')}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.scrim} />

      <Animated.View
        style={[
          styles.content,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={styles.brand}>HOMEBOOK</Text>
        <View style={styles.rule} />
        <Text style={styles.byline}>BY X EXILE</Text>

        <View style={styles.loadingTrack}>
          <Animated.View
            style={[
              styles.loadingBeam,
              { transform: [{ translateX: progressTranslate }] },
            ]}
          />
        </View>
        <Text style={styles.loadingText}>PREPARING YOUR MEDIA SPACE</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#050B14',
    zIndex: 10000,
    elevation: 10000,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 76,
    overflow: 'hidden',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(3, 9, 19, 0.48)',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  brand: {
    color: '#F3F8FC',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 7,
    textShadowColor: '#001B38',
    textShadowRadius: 18,
  },
  rule: {
    width: 92,
    height: 2,
    backgroundColor: '#28C7F2',
    marginTop: 17,
    marginBottom: 12,
  },
  byline: {
    color: '#B7D7E8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 4,
  },
  loadingTrack: {
    width: 112,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
    marginTop: 34,
    borderRadius: 4,
  },
  loadingBeam: {
    width: 42,
    height: 3,
    backgroundColor: '#28C7F2',
    borderRadius: 4,
  },
  loadingText: {
    color: '#D1E2EE',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 12,
  },
});
