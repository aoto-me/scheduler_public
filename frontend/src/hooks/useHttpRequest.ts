import { useAuthContext, useErrorContext } from '@/contexts';
import type { ErrorResponse } from '@/types';
import axios, { isAxiosError } from 'axios';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { useCallback } from 'react';

interface GetRequestParams {
  apiUrl: string;
  queryParams: object;
  signal?: AbortSignal;
}

interface MutationRequestParams {
  apiUrl: string;
  data: object;
  signal?: AbortSignal;
}

export const useHttpRequest = () => {
  const { csrfToken } = useAuthContext();
  const { setErrors, setIsSessionExpired } = useErrorContext();

  const request = useCallback(
    async <T>(config: AxiosRequestConfig, defaultErrorMessage: string): Promise<null | T> => {
      try {
        const response = await axios.request<{ message?: string; result?: T }>({
          ...config,
          headers: { ...(config.headers as Record<string, string | undefined>), 'X-CSRF-Token': csrfToken },
          withCredentials: import.meta.env.DEV,
        });
        if (import.meta.env.DEV) console.log(response.data.result);
        return response.data.result ?? null;
      } catch (error) {
        if (isAxiosError(error) && error.code === 'ERR_CANCELED') return null;

        let errorMessage = defaultErrorMessage;
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
        if (import.meta.env.DEV) console.error(error);
        return null;
      }
    },
    [csrfToken, setErrors, setIsSessionExpired]
  );

  const getRequest = useCallback(
    <T>({ apiUrl, queryParams, signal }: GetRequestParams) =>
      request<T>(
        {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          method: 'GET',
          params: { ...queryParams, ts: Date.now() },
          signal,
          url: apiUrl,
        },
        'データの取得に失敗しました'
      ),
    [request]
  );

  const postRequest = useCallback(
    <T>({ apiUrl, data, signal }: MutationRequestParams) =>
      request<T>({ data, method: 'POST', signal, url: apiUrl }, 'データの送信に失敗しました'),
    [request]
  );

  const patchRequest = useCallback(
    <T>({ apiUrl, data, signal }: MutationRequestParams) =>
      request<T>({ data, method: 'PATCH', signal, url: apiUrl }, 'データの更新に失敗しました'),
    [request]
  );

  const putRequest = useCallback(
    <T>({ apiUrl, data, signal }: MutationRequestParams) =>
      request<T>({ data, method: 'PUT', signal, url: apiUrl }, 'データの更新に失敗しました'),
    [request]
  );

  const deleteRequest = useCallback(
    <T>({ apiUrl, data, signal }: MutationRequestParams) =>
      request<T>({ data, method: 'DELETE', signal, url: apiUrl }, 'データの削除に失敗しました'),
    [request]
  );

  return { deleteRequest, getRequest, patchRequest, postRequest, putRequest };
};
