export type MediaType = 'movie' | 'series' | 'episode' | 'video';

export type MediaRecord = {
  id: string;
  title: string;
  type: MediaType;
  uri: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  durationMs?: number;
  year?: number;
  description?: string;
  artworkUri?: string;
  genres: string[];
  addedAt: number;
  updatedAt: number;
  isFavorite: boolean;
};

export type PlaybackRecord = {
  mediaId: string;
  positionMs: number;
  durationMs?: number;
  updatedAt: number;
  completed: boolean;
};

export type MediaLibrarySnapshot = {
  version: 1;
  media: MediaRecord[];
  playback: PlaybackRecord[];
};

export type AddMediaInput = Omit<
  MediaRecord,
  'id' | 'addedAt' | 'updatedAt' | 'isFavorite'
> & {
  id?: string;
  isFavorite?: boolean;
};
