import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useMediaLibrary } from '@/features/media/use-media-library';
import { importMediaFile } from '@/features/media/file-storage';
import LocalVideoPlayer from '@/components/local-video-player';

const COLORS = {
  background: '#050B14',
  surface: '#0D1726',
  raised: '#122238',
  primary: '#28C7F2',
  text: '#F3F8FC',
  muted: '#8FA5B8',
  border: '#1C3042',
  danger: '#FF8585',
};

type ScanProgress = {
  drives: string[];
  scannedDirectories: number;
  skippedDirectories: number;
  foundVideos: number;
  currentPath: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function MediaLibraryPanel() {
  const {
    media,
    loading,
    error: libraryError,
    addMedia,
    addMediaBatch,
  } = useMediaLibrary();

  const desktop =
    typeof window !== 'undefined' &&
    window.homebookDesktop?.platform === 'desktop';

  const [selectedMedia, setSelectedMedia] = useState<typeof media[number] | null>(null);
  const [importing, setImporting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [confirmScan, setConfirmScan] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    setImporting(true);
    setMessage(null);
    setError(null);

    try {
      const file = await importMediaFile();

      if (!file) {
        setMessage('Import cancelled.');
        return;
      }

      await addMedia({
        id: file.id,
        title: file.title,
        type: 'video',
        uri: file.uri,
        fileName: file.fileName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        genres: [],
      });

      setMessage(`${file.title} was indexed in your library.`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The video could not be added.',
      );
    } finally {
      setImporting(false);
    }
  }

  async function handleScan() {
    const bridge = window.homebookDesktop;

    if (!bridge || bridge.platform !== 'desktop') {
      setError('Computer-wide scanning is available in the desktop app.');
      setConfirmScan(false);
      return;
    }

    setConfirmScan(false);
    setScanning(true);
    setProgress(null);
    setMessage(null);
    setError(null);

    try {
      const result = await bridge.scanMedia(setProgress);

      const inputs = result.media.map((item) => ({
        id: item.id,
        title: item.title,
        type: 'video' as const,
        uri: item.uri,
        fileName: item.fileName,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        genres: [],
      }));

      const saved = await addMediaBatch(inputs);
      const outcome = result.cancelled ? 'Scan stopped' : 'Scan complete';

      setMessage(
        `${outcome}. Added ${saved.added} videos; ` +
        `${saved.existing} were already in your library. ` +
        `Scanned ${result.scannedDirectories.toLocaleString()} folders.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The computer scan failed.',
      );
    } finally {
      setScanning(false);
      setProgress(null);
    }
  }

  async function handleCancelScan() {
    try {
      await window.homebookDesktop?.cancelMediaScan();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to stop the scan.',
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarCopy}>
          <Text style={styles.count}>
            {String(media.length).padStart(2, '0')} ITEMS
          </Text>
          <Text style={styles.caption}>
            Your personal video library
          </Text>
        </View>

        <View style={styles.actions}>
          {desktop && (
            <Pressable
              accessibilityRole="button"
              disabled={scanning || importing}
              onPress={() => {
                setError(null);
                setMessage(null);
                setConfirmScan(true);
              }}
              style={({ pressed }) => [
                styles.scanButton,
                pressed && styles.pressed,
                (scanning || importing) && styles.disabled,
              ]}
            >
              <Text style={styles.scanButtonText}>⌕ Scan computer</Text>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={importing || scanning}
            onPress={() => void handleImport()}
            style={({ pressed }) => [
              styles.importButton,
              pressed && styles.pressed,
              (importing || scanning) && styles.disabled,
            ]}
          >
            {importing ? (
              <ActivityIndicator color={COLORS.background} size="small" />
            ) : (
              <Text style={styles.importButtonText}>＋ Add video</Text>
            )}
          </Pressable>
        </View>
      </View>

      {confirmScan && (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>Scan this computer?</Text>
          <Text style={styles.confirmText}>
            HOMEBOOK will search detected drives for supported video files.
            Videos will be indexed where they already exist. Original files
            will not be copied, moved, or deleted. Protected and inaccessible
            folders may be skipped.
          </Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmScan(false)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Not now</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void handleScan()}
              style={styles.importButton}
            >
              <Text style={styles.importButtonText}>Start full scan</Text>
            </Pressable>
          </View>
        </View>
      )}

      {scanning && (
        <View style={styles.progressBox}>
          <View style={styles.progressHeading}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.progressTitle}>Scanning your drives…</Text>
          </View>

          <View style={styles.stats}>
            <Text style={styles.stat}>
              {progress?.foundVideos ?? 0} videos found
            </Text>
            <Text style={styles.stat}>
              {(progress?.scannedDirectories ?? 0).toLocaleString()} folders scanned
            </Text>
            <Text style={styles.stat}>
              {(progress?.skippedDirectories ?? 0).toLocaleString()} skipped
            </Text>
          </View>

          <Text style={styles.path} numberOfLines={2}>
            {progress?.currentPath ?? 'Preparing drive scan…'}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => void handleCancelScan()}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Stop scan</Text>
          </Pressable>
        </View>
      )}

      {message && (
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {message}
        </Text>
      )}

      {(error || libraryError) && (
        <Text style={styles.error}>{error || libraryError}</Text>
      )}

      {selectedMedia && (
        <LocalVideoPlayer
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.emptyText}>Loading your library…</Text>
        </View>
      ) : media.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>▣</Text>
          <Text style={styles.emptyTitle}>Your library starts here.</Text>
          <Text style={styles.emptyText}>
            Add a video or scan your computer. HOMEBOOK indexes local files
            in place; your original videos remain untouched.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {media.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Play ${item.title}`}
              onPress={() => setSelectedMedia(item)}
              style={({ pressed }) => [
                styles.mediaRow,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.mediaIcon}>
                <Text style={styles.mediaIconText}>▶</Text>
              </View>
              <View style={styles.mediaCopy}>
                <Text style={styles.mediaTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.mediaMeta} numberOfLines={1}>
                  {item.fileName}
                  {typeof item.sizeBytes === 'number'
                    ? ` · ${formatSize(item.sizeBytes)}`
                    : ''}
                </Text>
              </View>
              <View style={styles.indexedTag}>
                <Text style={styles.indexedTagText}>PLAY</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    marginTop: 8,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
  },
  toolbarCopy: {
    flex: 1,
    minWidth: 180,
    gap: 5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flexWrap: 'wrap',
  },
  count: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  caption: {
    color: COLORS.muted,
    fontSize: 11,
  },
  importButton: {
    minHeight: 42,
    paddingHorizontal: 17,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '900',
  },
  scanButton: {
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  confirmBox: {
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
  confirmTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },
  confirmText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  secondaryButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  progressBox: {
    padding: 16,
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  progressHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  stat: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  path: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  cancelButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: '#40202A',
  },
  cancelButtonText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '900',
  },
  message: {
    color: COLORS.primary,
    fontSize: 12,
    lineHeight: 18,
  },
  error: {
    color: COLORS.danger,
    fontSize: 12,
  },
  empty: {
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 28,
    gap: 12,
  },
  emptyIcon: {
    color: COLORS.primary,
    fontSize: 34,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 460,
  },
  list: {
    gap: 9,
  },
  mediaRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  mediaIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.raised,
  },
  mediaIconText: {
    color: COLORS.primary,
    fontSize: 15,
  },
  mediaCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  mediaTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },
  mediaMeta: {
    color: COLORS.muted,
    fontSize: 10,
  },
  indexedTag: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: '#12352F',
  },
  indexedTagText: {
    color: '#70DDBA',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
