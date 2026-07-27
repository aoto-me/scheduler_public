import { useErrorContext } from '@/contexts';
import { fileDownload } from '@/utils';
import { useCallback, useRef } from 'react';

export interface ShareOrDownloadParams {
  filename: string;
  fileSize?: number;
  mimeType?: string;
  url: string;
}

interface ExtendedNavigator extends Navigator {
  standalone?: boolean;
}

// iOS PWA（ホーム画面追加から起動）かどうかを判定
export const isIOSPWA = (): boolean => (navigator as ExtendedNavigator).standalone === true;

// iOS PWA でのファイル共有サイズ上限 (100MB)
export const IOS_PWA_MAX_SIZE = 100 * 1024 * 1024;

const IOS_PWA_SIZE_ERROR =
  'ファイルサイズが100MBを超えるため、iOS での共有ができません。PCのブラウザからダウンロードしてください。';

// 拡張子から MIME タイプを決定
const getMimeTypeFromFilename = (filename: string): string | undefined => {
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  const mimeMap: Record<string, string> = {
    avi: 'video/x-msvideo',
    gif: 'image/gif',
    heic: 'image/heic',
    heif: 'image/heif',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    mov: 'video/quicktime',
    mp4: 'video/mp4',
    png: 'image/png',
    webp: 'image/webp',
  };
  return mimeMap[extension];
};

export const useShareOrDownload = () => {
  const isSharing = useRef(false);
  const { setErrors } = useErrorContext();

  const shareOrDownload = useCallback(
    async ({ filename, fileSize, mimeType, url }: ShareOrDownloadParams): Promise<void> => {
      // 連打対策
      if (isSharing.current) return;

      // iOS PWA 以外・Web Share API 非対応は通常ダウンロード
      if (!isIOSPWA() || !('share' in navigator)) {
        fileDownload(url, filename);
        return;
      }

      // ファイルサイズが分かる場合はフェッチ前にチェック
      if (fileSize !== undefined && fileSize > IOS_PWA_MAX_SIZE) {
        setErrors(prev => (prev.includes(IOS_PWA_SIZE_ERROR) ? prev : [...prev, IOS_PWA_SIZE_ERROR]));
        return;
      }

      isSharing.current = true;

      try {
        const response = await fetch(url);
        const blob = await response.blob();

        // フェッチ後のサイズチェック（fileSize が不明だった場合のセーフティネット）
        if (blob.size > IOS_PWA_MAX_SIZE) {
          setErrors(prev => (prev.includes(IOS_PWA_SIZE_ERROR) ? prev : [...prev, IOS_PWA_SIZE_ERROR]));
          return;
        }

        const resolvedMimeType = mimeType ?? getMimeTypeFromFilename(filename) ?? blob.type;
        const file = new File([blob], filename, { type: resolvedMimeType });

        // 共有不可の場合はフォールバック
        if (!navigator.canShare({ files: [file] })) {
          fileDownload(url, filename);
          return;
        }

        await navigator.share({ files: [file] });
      } catch (error) {
        // AbortError はユーザーが共有シートを閉じた正常操作なので無視
        if (error instanceof Error && error.name === 'AbortError') return;
        // それ以外のエラーは従来のダウンロードにフォールバック
        fileDownload(url, filename);
      } finally {
        isSharing.current = false;
      }
    },
    [setErrors]
  );

  return shareOrDownload;
};
