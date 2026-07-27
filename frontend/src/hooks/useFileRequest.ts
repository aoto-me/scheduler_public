import { API_ENDPOINTS } from '@/configs';
import { useAuthContext, useErrorContext } from '@/contexts';
import type { ErrorResponse, FileRequestResult } from '@/types';
import { normalizePath } from '@/utils';
import axios, { isAxiosError } from 'axios';
import type { AxiosError, AxiosResponse } from 'axios';
import { useCallback } from 'react';

interface FileRequestParams {
  files: File[];
  path: string;
  signal?: AbortSignal;
}

interface FileRequestResponse {
  message?: string;
  result: null | {
    failedFile?: {
      error: string;
      name: string;
    };
    uploadedFile?: string;
  };
}

export const useFileRequest = () => {
  const { csrfToken } = useAuthContext();
  const { setErrors, setIsSessionExpired } = useErrorContext();
  const isDev = import.meta.env.DEV;

  const fileRequest = useCallback(
    async ({ files, path, signal }: FileRequestParams): Promise<FileRequestResult | null> => {
      try {
        const normalizedPath = normalizePath(path, { endSlash: 'keep' });

        const uploadedFiles: string[] = [];
        const failedFiles: { error: string; name: string }[] = [];

        const chunkSize = 5 * 1024 * 1024; // 5MB

        for (const file of files) {
          const uploadId = crypto.randomUUID();
          const totalChunks = Math.ceil(file.size / chunkSize);

          try {
            // チャンクの送信
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
              if (signal?.aborted) return null;

              const start = chunkIndex * chunkSize;
              const end = Math.min(start + chunkSize, file.size);
              const chunk = file.slice(start, end);

              const formData = new FormData();
              formData.append('chunk', chunk);
              formData.append('uploadId', uploadId);
              formData.append('fileName', file.name);
              formData.append('chunkIndex', String(chunkIndex));
              formData.append('totalChunks', String(totalChunks));
              formData.append('path', normalizedPath);

              await axios.post(`${API_ENDPOINTS.upload}chunk/`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  'X-CSRF-Token': csrfToken,
                },
                ...(signal && { signal }),
                ...(isDev && { withCredentials: true }),
              });
            }

            // 完了通知（結合＋サムネイル生成）
            const completeResponse: AxiosResponse<FileRequestResponse> = await axios.post(
              `${API_ENDPOINTS.upload}complete/`,
              {
                fileName: file.name,
                path: normalizedPath,
                uploadId,
              },
              {
                headers: {
                  'X-CSRF-Token': csrfToken,
                },
                ...(signal && { signal }),
                ...(isDev && { withCredentials: true }),
              }
            );

            if (completeResponse.status === 200) {
              if (completeResponse.data.result?.uploadedFile) {
                uploadedFiles.push(completeResponse.data.result.uploadedFile);
              }
              if (completeResponse.data.result?.failedFile) {
                failedFiles.push(completeResponse.data.result.failedFile);
              }
            } else {
              throw new Error(`Unexpected response: ${String(completeResponse.status)}`);
            }
          } catch (fileError) {
            failedFiles.push({
              error: 'アップロードに失敗しました',
              name: file.name,
            });

            if (isDev) console.error(fileError);
          }
        }

        return {
          failedFiles,
          uploadedFiles,
        };
      } catch (error) {
        if (isAxiosError(error) && error.code === 'ERR_CANCELED') {
          return null;
        }

        let errorMessage = 'ファイルの送信に失敗しました';

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

        return null;
      }
    },
    [csrfToken]
  );

  return fileRequest;
};
