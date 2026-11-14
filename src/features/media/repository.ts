import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AddMediaInput,
  MediaLibrarySnapshot,
  MediaRecord,
  PlaybackRecord,
} from './types';

const STORAGE_KEY = '@homebook/media-library/v1';
const COMPLETION_THRESHOLD = 0.95;

type StorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

const emptySnapshot = (): MediaLibrarySnapshot => ({
  version: 1,
  media: [],
  playback: [],
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isOptionalNonNegativeNumber(value: unknown): boolean {
  return (
    value === undefined ||
    (isFiniteNumber(value) && value >= 0)
  );
}

function isMediaType(value: unknown): value is MediaRecord['type'] {
  return (
    value === 'movie' ||
    value === 'series' ||
    value === 'episode' ||
    value === 'video'
  );
}

function isMediaRecord(value: unknown): value is MediaRecord {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    isMediaType(value.type) &&
    typeof value.uri === 'string' &&
    value.uri.length > 0 &&
    typeof value.fileName === 'string' &&
    value.fileName.length > 0 &&
    isOptionalString(value.mimeType) &&
    isOptionalNonNegativeNumber(value.sizeBytes) &&
    isOptionalNonNegativeNumber(value.durationMs) &&
    isOptionalNonNegativeNumber(value.year) &&
    isOptionalString(value.description) &&
    isOptionalString(value.artworkUri) &&
    Array.isArray(value.genres) &&
    value.genres.every((genre) => typeof genre === 'string') &&
    isFiniteNumber(value.addedAt) &&
    isFiniteNumber(value.updatedAt) &&
    typeof value.isFavorite === 'boolean'
  );
}

function isPlaybackRecord(value: unknown): value is PlaybackRecord {
  if (!isRecord(value)) return false;

  return (
    typeof value.mediaId === 'string' &&
    value.mediaId.length > 0 &&
    isFiniteNumber(value.positionMs) &&
    value.positionMs >= 0 &&
    isOptionalNonNegativeNumber(value.durationMs) &&
    isFiniteNumber(value.updatedAt) &&
    typeof value.completed === 'boolean'
  );
}

function validateSnapshot(value: unknown): MediaLibrarySnapshot {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.media) ||
    !Array.isArray(value.playback)
  ) {
    throw new Error('Invalid or unsupported media library snapshot.');
  }

  if (!value.media.every(isMediaRecord)) {
    throw new Error('The media library contains an invalid media record.');
  }

  if (!value.playback.every(isPlaybackRecord)) {
    throw new Error('The media library contains an invalid playback record.');
  }

  const mediaIds = new Set<string>();

  for (const item of value.media) {
    if (mediaIds.has(item.id)) {
      throw new Error(`Duplicate media record ID detected: ${item.id}`);
    }

    mediaIds.add(item.id);
  }

  const playbackIds = new Set<string>();

  for (const item of value.playback) {
    if (!mediaIds.has(item.mediaId)) {
      throw new Error(
        `Playback record references missing media: ${item.mediaId}`,
      );
    }

    if (playbackIds.has(item.mediaId)) {
      throw new Error(
        `Duplicate playback record detected: ${item.mediaId}`,
      );
    }

    playbackIds.add(item.mediaId);
  }

  return {
    version: 1,
    media: value.media,
    playback: value.playback,
  };
}

function createId(): string {
  const randomPart = Math.random().toString(36).slice(2, 12);
  return `media-${Date.now().toString(36)}-${randomPart}`;
}

export function createMediaRepository(
  storageKey: string,
  storage: StorageAdapter = AsyncStorage,
) {
  if (!storageKey.trim()) {
    throw new Error('A storage key is required for the media repository.');
  }

  // Each repository instance has its own operation queue.
  let operationQueue: Promise<void> = Promise.resolve();

  function serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = operationQueue.then(operation, operation);

    operationQueue = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }

  async function readSnapshot(): Promise<MediaLibrarySnapshot> {
    const raw = await storage.getItem(storageKey);

    if (!raw) return emptySnapshot();

    try {
      const parsed: unknown = JSON.parse(raw);
      return validateSnapshot(parsed);
    } catch (error) {
      throw new Error(
        `Unable to read the HOMEBOOK library. Stored data may be damaged. ${
          error instanceof Error ? error.message : ''
        }`,
      );
    }
  }

  async function writeSnapshot(
    snapshot: MediaLibrarySnapshot,
  ): Promise<void> {
    await storage.setItem(storageKey, JSON.stringify(snapshot));
  }

  return {
    async list(): Promise<MediaRecord[]> {
      return serialize(async () => {
        const snapshot = await readSnapshot();
        return [...snapshot.media].sort(
          (a, b) => b.addedAt - a.addedAt,
        );
      });
    },

    async get(id: string): Promise<MediaRecord | null> {
      return serialize(async () => {
        const snapshot = await readSnapshot();
        return snapshot.media.find((item) => item.id === id) ?? null;
      });
    },

    async add(input: AddMediaInput): Promise<MediaRecord> {
      return serialize(async () => {
        const snapshot = await readSnapshot();

        const duplicate = snapshot.media.find(
          (item) => item.uri === input.uri,
        );

        if (duplicate) return duplicate;

        const now = Date.now();

        const record: MediaRecord = {
          ...input,
          id: input.id || createId(),
          genres: [...input.genres],
          addedAt: now,
          updatedAt: now,
          isFavorite: input.isFavorite ?? false,
        };

        snapshot.media.push(record);
        await writeSnapshot(snapshot);

        return record;
      });
    },

    async addMany(
      inputs: AddMediaInput[],
    ): Promise<{ added: number; existing: number }> {
      return serialize(async () => {
        const snapshot = await readSnapshot();
        const knownUris = new Set(snapshot.media.map((item) => item.uri));
        const knownIds = new Map(snapshot.media.map((item) => [item.id, item.uri]));
        let added = 0;
        let existing = 0;
        const now = Date.now();

        for (const input of inputs) {
          if (knownUris.has(input.uri)) {
            existing += 1;
            continue;
          }

          const id = input.id || createId();
          const existingUri = knownIds.get(id);

          if (existingUri && existingUri !== input.uri) {
            throw new Error(`Media identifier collision: ${id}`);
          }

          if (existingUri) {
            existing += 1;
            continue;
          }

          const record: MediaRecord = {
            ...input,
            id,
            genres: [...input.genres],
            addedAt: now,
            updatedAt: now,
            isFavorite: input.isFavorite ?? false,
          };

          snapshot.media.push(record);
          knownUris.add(record.uri);
          knownIds.set(record.id, record.uri);
          added += 1;
        }

        if (added > 0) await writeSnapshot(snapshot);
        return { added, existing };
      });
    },

    async update(
      id: string,
      changes: Partial<Omit<MediaRecord, 'id' | 'addedAt'>>,
    ): Promise<MediaRecord> {
      return serialize(async () => {
        const snapshot = await readSnapshot();
        const index = snapshot.media.findIndex(
          (item) => item.id === id,
        );

        if (index === -1) {
          throw new Error(`Media item not found: ${id}`);
        }

        const updated: MediaRecord = {
          ...snapshot.media[index],
          ...changes,
          id,
          addedAt: snapshot.media[index].addedAt,
          updatedAt: Date.now(),
        };

        snapshot.media[index] = updated;
        await writeSnapshot(snapshot);

        return updated;
      });
    },

    async remove(id: string): Promise<void> {
      return serialize(async () => {
        const snapshot = await readSnapshot();

        // Removing metadata never deletes the underlying media file.
        snapshot.media = snapshot.media.filter(
          (item) => item.id !== id,
        );

        snapshot.playback = snapshot.playback.filter(
          (item) => item.mediaId !== id,
        );

        await writeSnapshot(snapshot);
      });
    },

    async saveProgress(
      mediaId: string,
      positionMs: number,
      durationMs?: number,
    ): Promise<PlaybackRecord> {
      return serialize(async () => {
        const snapshot = await readSnapshot();

        if (!snapshot.media.some((item) => item.id === mediaId)) {
          throw new Error(
            `Cannot save progress for unknown media: ${mediaId}`,
          );
        }

        const safePosition = Number.isFinite(positionMs)
          ? Math.max(0, positionMs)
          : 0;

        const safeDuration =
          typeof durationMs === 'number' &&
          Number.isFinite(durationMs) &&
          durationMs > 0
            ? durationMs
            : undefined;

        const completed =
          safeDuration !== undefined &&
          safePosition / safeDuration >= COMPLETION_THRESHOLD;

        const record: PlaybackRecord = {
          mediaId,
          positionMs: safeDuration
            ? Math.min(safePosition, safeDuration)
            : safePosition,
          durationMs: safeDuration,
          updatedAt: Date.now(),
          completed,
        };

        const existingIndex = snapshot.playback.findIndex(
          (item) => item.mediaId === mediaId,
        );

        if (existingIndex === -1) {
          snapshot.playback.push(record);
        } else {
          snapshot.playback[existingIndex] = record;
        }

        await writeSnapshot(snapshot);
        return record;
      });
    },

    async listHistory(): Promise<PlaybackRecord[]> {
      return serialize(async () => {
        const snapshot = await readSnapshot();

        return snapshot.playback
          .filter(
            (item) => !item.completed && item.positionMs > 0,
          )
          .sort((a, b) => b.updatedAt - a.updatedAt);
      });
    },

    async clearHistory(): Promise<void> {
      return serialize(async () => {
        const snapshot = await readSnapshot();
        snapshot.playback = [];
        await writeSnapshot(snapshot);
      });
    },
  };
}

export const mediaRepository = createMediaRepository(STORAGE_KEY);
