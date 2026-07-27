import { API_ENDPOINTS } from '@/configs';
import { useAuthContext, useErrorContext } from '@/contexts';
import type { ErrorResponse } from '@/types';
import { normalizeExtension, normalizePath } from '@/utils';
import axios, { AxiosError, isAxiosError } from 'axios';
import { useCallback } from 'react';
import { useShareOrDownload } from './useShareOrDownload';

interface DownloadZipParams {
  files: {
    extension: string;
    name: string;
  }[];
  path: string;
  signal?: AbortSignal;
}

interface DownloadZipResponse {
  message: string;
  result: DownloadZipResult[];
}

interface DownloadZipResult {
  extension: string;
  message: string;
  name: string;
}

interface DownloadZipSuccess {
  zipFileName: string;
}

export const useDownloadZip = () => {
  const { csrfToken } = useAuthContext();
  const { setErrors, setIsSessionExpired } = useErrorContext();
  const baseURL = import.meta.env.DEV ? 'http://localhost' : '';
  const isDev = import.meta.env.DEV;
  const shareOrDownload = useShareOrDownload();

  const downloadZip = useCallback(
    async ({ files, path, signal }: DownloadZipParams): Promise<null | string> => {
      try {
        const normalizedPath = normalizePath(path, { endSlash: 'keep' });

        const response = await axios.post<DownloadZipResponse | DownloadZipSuccess>(
          API_ENDPOINTS.download,
          {
            files,
            path: normalizedPath,
          },
          {
            headers: { 'X-CSRF-Token': csrfToken },
            ...(signal && { signal }),
            ...(isDev && { withCredentials: true }),
          }
        );

        // 成功
        if ('zipFileName' in response.data) {
          const fileApi = '/backend/public/downloadZip.php';

          const splitPath = path.split('/').filter(Boolean);
          const name = splitPath[splitPath.length - 1];
          const params = new URLSearchParams({ file: response.data.zipFileName, name });
          const downloadUrl = `${baseURL}${fileApi}?${params.toString()}`;
          const fileName = name ? `${name}.zip` : 'scheduler_download.zip';
          // ダウンロード処理（iOS PWA は Web Share API 経由）
          await shareOrDownload({ filename: fileName, mimeType: 'application/zip', url: downloadUrl });
          return 'ok';
        }

        // エラーがある場合
        const json: DownloadZipResponse | { message: string } = response.data;

        if ('result' in json) {
          const { message, result } = json;

          // 全体のエラー
          setErrors(prev => (prev.includes(message) ? prev : [...prev, message]));

          // 個別のファイルのエラー
          for (const file of result) {
            const dotExtension = normalizeExtension(file.extension, { withDot: true });
            const errorMessage = `【${file.name}${dotExtension}】${file.message}`;
            setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
          }

          return null;
        }

        // その他失敗
        if ('message' in json) {
          setErrors(prev => (prev.includes(json.message) ? prev : [...prev, json.message]));
          return null;
        }

        // エラーは発生してないが、成功もしていない場合
        throw new Error(`Unexpected response: ${String(response.status)}`);
      } catch (error) {
        // Abort は何もしない
        if (isAxiosError(error) && error.code === 'ERR_CANCELED') {
          return null;
        }

        let errorMessage = 'ダウンロードに失敗しました';

        if (isAxiosError(error)) {
          const axiosError = error as AxiosError<ErrorResponse>;
          if (axiosError.response) {
            const { data, status } = axiosError.response;
            errorMessage = `【${String(status)}】${data.error}`;

            if (status === 401 || status === 403) {
              setIsSessionExpired(true);
              return null;
            }
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));

        if (isDev) console.error(error);
        return null; // throw せず null を返す
      }
    },
    [csrfToken, shareOrDownload]
  );

  return downloadZip;
};
