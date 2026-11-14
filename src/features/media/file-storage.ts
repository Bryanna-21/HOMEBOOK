const DATABASE_NAME = 'homebook-media-files';
const DATABASE_VERSION = 1;
const STORE_NAME = 'files';

export type StoredMediaFile = {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uri: string;
};

type StoredBlob = {
  id: string;
  blob: Blob;
};

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `media-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(
      new Error('Browser file storage is unavailable in this environment.'),
    );
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Unable to open media storage.'));
  });
}

function saveBlob(id: string, blob: Blob): Promise<void> {
  return getDatabase().then(
    (database) =>
      new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).put({ id, blob } satisfies StoredBlob);

        transaction.oncomplete = () => {
          database.close();
          resolve();
        };

        transaction.onerror = () => {
          database.close();
          reject(transaction.error ?? new Error('Unable to store media file.'));
        };

        transaction.onabort = () => {
          database.close();
          reject(transaction.error ?? new Error('Media storage was interrupted.'));
        };
      }),
  );
}

function readBlob(id: string): Promise<Blob | null> {
  return getDatabase().then(
    (database) =>
      new Promise<Blob | null>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const request = transaction.objectStore(STORE_NAME).get(id);

        request.onsuccess = () => {
          const result = request.result as StoredBlob | undefined;
          resolve(result?.blob ?? null);
        };

        request.onerror = () =>
          reject(request.error ?? new Error('Unable to retrieve media file.'));

        transaction.oncomplete = () => database.close();
        transaction.onerror = () => database.close();
      }),
  );
}

function getTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

function getMimeType(file: File): string {
  if (file.type.startsWith('video/')) return file.type;

  const extension = file.name.split('.').pop()?.toLowerCase();

  const knownTypes: Record<string, string> = {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
  };

  return knownTypes[extension ?? ''] ?? 'application/octet-stream';
}

function chooseBrowserFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,.mkv,.avi,.m4v,.mpg,.mpeg';

    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      input.remove();
      resolve(file);
    };

    input.click();
  });
}

export async function importMediaFile(): Promise<StoredMediaFile | null> {
  if (typeof window === 'undefined') {
    throw new Error('Media importing is only available in a desktop or web session.');
  }

  if (window.homebookDesktop?.platform === 'desktop') {
    return window.homebookDesktop.importMedia();
  }

  const file = await chooseBrowserFile();

  if (!file) return null;

  if (!file.type.startsWith('video/') &&
      !/\.(mp4|m4v|mov|webm|mkv|avi|mpeg|mpg)$/i.test(file.name)) {
    throw new Error('Choose a supported video file.');
  }

  const id = createId();
  await saveBlob(id, file);

  return {
    id,
    title: getTitle(file.name) || file.name,
    fileName: file.name,
    mimeType: getMimeType(file),
    sizeBytes: file.size,
    uri: `homebook-idb://media/${id}`,
  };
}

export async function resolveMediaUri(uri: string): Promise<string> {
  if (uri.startsWith('homebook-media://')) {
    return uri;
  }

  if (uri.startsWith('homebook-local://')) {
    if (!/^homebook-local:\/\/media\/[a-f0-9]{32}$/.test(uri)) {
      throw new Error('Invalid trusted local media address.');
    }
    return uri;
  }

  if (!uri.startsWith('homebook-idb://media/')) {
    throw new Error('This media item has an unsupported storage address.');
  }

  const id = uri.slice('homebook-idb://media/'.length);

  if (!id || id.includes('/')) {
    throw new Error('Invalid media storage identifier.');
  }

  const blob = await readBlob(id);

  if (!blob) {
    throw new Error('The stored video file could not be found.');
  }

  return URL.createObjectURL(blob);
}
