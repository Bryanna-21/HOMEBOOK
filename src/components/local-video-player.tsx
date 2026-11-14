import { useEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { resolveMediaUri } from '@/features/media/file-storage';
import { mediaRepository } from '@/features/media/repository';
import type { MediaRecord } from '@/features/media/types';

type Props = {
  media: MediaRecord;
  onClose: () => void;
};

const COLORS = {
  background: '#050812',
  surface: '#0D1726',
  text: '#F3F8FC',
  muted: '#8FA5B8',
  primary: '#28C7F2',
  border: '#1C3042',
  danger: '#FF8585',
};

export default function LocalVideoPlayer({ media, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedAt = useRef<number | null>(null);
  const mediaKey = `${media.id}:${media.uri}`;
  const [loadState, setLoadState] = useState({
    mediaKey,
    source: null as string | null,
    loading: true,
    error: null as string | null,
    resumeMessage: '',
  });

  const isCurrentMedia = loadState.mediaKey === mediaKey;
  const source = isCurrentMedia ? loadState.source : null;
  const loading = !isCurrentMedia || loadState.loading;
  const error = isCurrentMedia ? loadState.error : null;
  const resumeMessage = isCurrentMedia ? loadState.resumeMessage : '';

  useEffect(() => {
    let active = true;
    let resolvedUri: string | null = null;

    void resolveMediaUri(media.uri)
      .then((uri) => {
        resolvedUri = uri;
        if (active) {
          setLoadState({
            mediaKey,
            source: uri,
            loading: false,
            error: null,
            resumeMessage: '',
          });
        }
      })
      .catch((cause) => {
        if (active) {
          setLoadState({
            mediaKey,
            source: null,
            loading: false,
            error: cause instanceof Error
              ? cause.message
              : 'Unable to open this video.',
            resumeMessage: '',
          });
        }
      });

    return () => {
      active = false;

      if (resolvedUri?.startsWith('blob:')) {
        URL.revokeObjectURL(resolvedUri);
      }
    };
  }, [media.id, media.uri, mediaKey]);

  async function restoreProgress(
    event: SyntheticEvent<HTMLVideoElement>,
  ) {
    const video = event.currentTarget;

    try {
      const history = await mediaRepository.listHistory();
      const previous = history.find((entry) => entry.mediaId === media.id);

      if (
        previous &&
        previous.positionMs > 0 &&
        Number.isFinite(video.duration) &&
        video.duration > 0
      ) {
        const resumeAt = Math.min(
          previous.positionMs / 1000,
          Math.max(0, video.duration - 1),
        );

        if (resumeAt > 2) {
          video.currentTime = resumeAt;
          setLoadState((previous) =>
            previous.mediaKey === mediaKey
              ? { ...previous, resumeMessage: 'Resumed from your last position' }
              : previous,
          );
        }
      }
    } catch {
      // Playback should continue even if history cannot be read.
    }
  }

  function saveProgress(
    video: HTMLVideoElement,
    timestamp: number,
    force = false,
  ) {
    if (!Number.isFinite(video.currentTime) || video.currentTime <= 0) {
      return;
    }

    if (
      !force &&
      lastSavedAt.current !== null &&
      timestamp - lastSavedAt.current < 5000
    ) {
      return;
    }

    lastSavedAt.current = timestamp;

    const duration =
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration * 1000
        : undefined;

    void mediaRepository
      .saveProgress(media.id, video.currentTime * 1000, duration)
      .catch(() => {
        // A temporary history write failure must not interrupt playback.
      });
  }

  function handleTimeUpdate(event: SyntheticEvent<HTMLVideoElement>) {
    saveProgress(event.currentTarget, event.timeStamp);
  }

  function handlePause(event: SyntheticEvent<HTMLVideoElement>) {
    saveProgress(event.currentTarget, event.timeStamp, true);
  }

  function handleEnded(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    const duration =
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration * 1000
        : video.currentTime * 1000;

    lastSavedAt.current = event.timeStamp;

    void mediaRepository
      .saveProgress(media.id, duration, duration)
      .catch(() => {});
  }

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.panel}>
        <Text style={styles.error}>
          The current player is available in the Electron and web versions.
        </Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Close player</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>NOW PLAYING</Text>
          <Text style={styles.title} numberOfLines={1}>
            {media.title}
          </Text>
          <Text style={styles.fileName} numberOfLines={1}>
            {media.fileName}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close player"
          onPress={onClose}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.videoFrame}>
        {source && (
          <video
            ref={videoRef}
            src={source}
            controls
            autoPlay={false}
            playsInline
            preload="metadata"
            onLoadedMetadata={restoreProgress}
            onTimeUpdate={handleTimeUpdate}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={() => {
              setLoadState((previous) =>
                previous.mediaKey === mediaKey
                  ? {
                      ...previous,
                      error: 'This video could not be decoded. Try an MP4 encoded with H.264 video and AAC audio.',
                    }
                  : previous,
              );
            }}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              maxHeight: '70vh',
              backgroundColor: '#000000',
              objectFit: 'contain',
            }}
          />
        )}

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.statusText}>Opening local video…</Text>
          </View>
        )}

        {error && (
          <View style={styles.loading}>
            <Text style={styles.error}>{error}</Text>
          </View>
        )}
      </View>

      {resumeMessage ? (
        <Text style={styles.resumeMessage}>{resumeMessage}</Text>
      ) : (
        <Text style={styles.hint}>
          Playback progress is saved automatically.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    padding: 16,
    gap: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headingCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
  },
  fileName: {
    color: COLORS.muted,
    fontSize: 10,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A293A',
  },
  closeText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  videoFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 180,
    maxHeight: 620,
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  statusText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  error: {
    color: COLORS.danger,
    fontSize: 12,
    lineHeight: 19,
  },
  resumeMessage: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  hint: {
    color: COLORS.muted,
    fontSize: 10,
  },
});
