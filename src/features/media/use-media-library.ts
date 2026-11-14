import { useCallback, useEffect, useState } from 'react';

import { mediaRepository } from './repository';
import type {
  AddMediaInput,
  MediaRecord,
  PlaybackRecord,
} from './types';

export function useMediaLibrary() {
  const [media, setMedia] = useState<MediaRecord[]>([]);
  const [history, setHistory] = useState<PlaybackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextMedia, nextHistory] = await Promise.all([
        mediaRepository.list(),
        mediaRepository.listHistory(),
      ]);

      setMedia(nextMedia);
      setHistory(nextHistory);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to load the media library.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(reload);
  }, [reload]);

  const addMedia = useCallback(
    async (input: AddMediaInput) => {
      const record = await mediaRepository.add(input);
      await reload();
      return record;
    },
    [reload],
  );

  const addMediaBatch = useCallback(
    async (inputs: AddMediaInput[]) => {
      const result = await mediaRepository.addMany(inputs);
      if (result.added > 0) await reload();
      return result;
    },
    [reload],
  );

  const updateMedia = useCallback(
    async (
      id: string,
      changes: Partial<Omit<MediaRecord, 'id' | 'addedAt'>>,
    ) => {
      const record = await mediaRepository.update(id, changes);
      await reload();
      return record;
    },
    [reload],
  );

  const removeMedia = useCallback(
    async (id: string) => {
      await mediaRepository.remove(id);
      await reload();
    },
    [reload],
  );

  const saveProgress = useCallback(
    async (mediaId: string, positionMs: number, durationMs?: number) => {
      const record = await mediaRepository.saveProgress(
        mediaId,
        positionMs,
        durationMs,
      );
      await reload();
      return record;
    },
    [reload],
  );

  const clearHistory = useCallback(async () => {
    await mediaRepository.clearHistory();
    await reload();
  }, [reload]);

  const toggleFavorite = useCallback(
    async (item: MediaRecord) => {
      return updateMedia(item.id, { isFavorite: !item.isFavorite });
    },
    [updateMedia],
  );

  return {
    media,
    history,
    loading,
    error,
    reload,
    addMedia,
    addMediaBatch,
    updateMedia,
    removeMedia,
    saveProgress,
    clearHistory,
    toggleFavorite,
  };
}
