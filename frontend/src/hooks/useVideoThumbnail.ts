import { videoExtensions } from '@/configs';
import { createFileUrl, generateVideoThumbnail, normalizeExtension } from '@/utils';
import { useEffect, useState } from 'react';

interface Cache {
  thumbnail: string;
  timestamp: number;
}

export const useVideoThumbnail = ({
  extension,
  fileName,
  path,
}: {
  extension: string;
  fileName: string;
  path: string;
}) => {
  const [thumbnail, setThumbnail] = useState<null | string>(null);

  useEffect(() => {
    if (!videoExtensions.includes(normalizeExtension(extension, { lowerCase: true }))) return;

    const storageKey = `video-cache:${path}${fileName}${normalizeExtension(extension, { withDot: true })}`;

    const loadFromCache = () => {
      try {
        const cached = localStorage.getItem(storageKey);
        if (!cached) return false;

        const parsed = JSON.parse(cached) as Cache;
        const now = Date.now();
        const expireMs = 7 * 24 * 60 * 60 * 1000;

        if (now - parsed.timestamp < expireMs) {
          setThumbnail(parsed.thumbnail); // キャッシュからの読み込み
          return true;
        } else {
          localStorage.removeItem(storageKey); // 期限切れ
          return false;
        }
      } catch {
        localStorage.removeItem(storageKey); // パース失敗
        return false;
      }
    };

    if (loadFromCache()) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let idleId: number | undefined;
    let cancelVideo: (() => void) | null = null;

    const generate = async () => {
      const fileUrl = createFileUrl(`${fileName}${normalizeExtension(extension, { withDot: true })}`, path);

      const { cancel, promise } = generateVideoThumbnail(fileUrl);
      cancelVideo = cancel;

      try {
        const thumb = await promise;
        setThumbnail(thumb);

        const cache: Cache = {
          thumbnail: thumb,
          timestamp: Date.now(),
        };

        try {
          localStorage.setItem(storageKey, JSON.stringify(cache));
        } catch {
          // QuotaExceededError: 期限切れキャッシュを削除してリトライ
          const expireMs = 7 * 24 * 60 * 60 * 1000;
          const now = Date.now();
          for (const key of Object.keys(localStorage)) {
            if (!key.startsWith('video-cache:')) continue;
            try {
              const item = localStorage.getItem(key);
              if (!item) continue;
              const parsed = JSON.parse(item) as Cache;
              if (now - parsed.timestamp >= expireMs) localStorage.removeItem(key);
            } catch {
              localStorage.removeItem(key);
            }
          }
          try {
            localStorage.setItem(storageKey, JSON.stringify(cache));
          } catch {
            // 削除後もリトライが失敗した場合はキャッシュを諦める
          }
        }
      } catch (error) {
        console.error('動画のサムネイル生成に失敗:', error);
      }
    };

    if ('requestIdleCallback' in globalThis) {
      idleId = globalThis.requestIdleCallback(() => {
        timeoutId = globalThis.setTimeout(() => {
          void generate();
        }, 1500);
      });
    } else {
      timeoutId = globalThis.setTimeout(() => {
        void generate();
      }, 1500);
    }

    return () => {
      if (idleId !== undefined && 'cancelIdleCallback' in globalThis) {
        globalThis.cancelIdleCallback(idleId);
      }

      clearTimeout(timeoutId);

      if (cancelVideo) {
        cancelVideo();
      }
    };
  }, [fileName, path, extension]);

  return thumbnail;
};
