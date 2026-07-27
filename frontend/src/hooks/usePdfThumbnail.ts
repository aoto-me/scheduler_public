import { createFileUrl, generatePdfThumbnail, normalizeExtension } from '@/utils';
import { useEffect, useState } from 'react';

interface Cache {
  thumbnail: string;
  timestamp: number;
}

export const usePdfThumbnail = ({
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
    if (normalizeExtension(extension, { lowerCase: true }) !== 'pdf') return;
    if (navigator.maxTouchPoints > 0) return; // モバイルはPDFサムネイル生成をスキップ

    const storageKey = `pdf-cache:${path}${fileName}${normalizeExtension(extension, { withDot: true })}`;

    const loadFromCache = () => {
      try {
        const cached = localStorage.getItem(storageKey);
        if (!cached) return false;

        const parsed = JSON.parse(cached) as Cache;
        const now = Date.now();
        const expireMs = 7 * 24 * 60 * 60 * 1000;

        if (now - parsed.timestamp < expireMs) {
          setThumbnail(parsed.thumbnail);
          return true; // キャッシュからの読み込み
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
    let idleId: number;
    let cancelPdf: (() => void) | null = null;
    let isActive = true;

    const generate = async () => {
      const fileUrl = createFileUrl(`${fileName}${normalizeExtension(extension, { withDot: true })}`, path);

      const { cancel, promise } = generatePdfThumbnail(fileUrl);
      cancelPdf = cancel;

      try {
        const thumb = await promise;

        if (!isActive) return; // アンマウント後なら何もしない

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
            if (!key.startsWith('pdf-cache:')) continue;
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
        if (!isActive) return;

        // Worker終了は想定内なので無視
        if (error instanceof Error && error.message.includes('Worker was terminated')) {
          return;
        }

        console.error('PDFのサムネイル生成に失敗:', error);
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
      isActive = false;

      if ('cancelIdleCallback' in globalThis) {
        globalThis.cancelIdleCallback(idleId);
      }

      clearTimeout(timeoutId);

      if (cancelPdf) {
        cancelPdf();
      }
    };
  }, [extension, fileName, path]);

  return thumbnail;
};
