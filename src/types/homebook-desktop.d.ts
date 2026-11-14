export {};

declare global {
  interface Window {
    homebookDesktop?: {
      platform: 'desktop';

      importMedia: () => Promise<{
        id: string;
        title: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        uri: string;
      } | null>;

      scanMedia: (
        onProgress: (progress: {
          drives: string[];
          scannedDirectories: number;
          skippedDirectories: number;
          foundVideos: number;
          currentPath: string;
        }) => void,
      ) => Promise<{
        cancelled: boolean;
        drives: string[];
        media: {
          id: string;
          title: string;
          fileName: string;
          mimeType: string;
          sizeBytes: number;
          modifiedAt: number;
          uri: string;
        }[];
        scannedDirectories: number;
        skippedDirectories: number;
      }>;

      cancelMediaScan: () => Promise<boolean>;
    };
  }
}
