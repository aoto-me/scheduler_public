import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ErrorContextType {
  errors: string[];
  isSessionExpired: boolean;
  resetError: () => void;
  setErrors: React.Dispatch<React.SetStateAction<string[]>>;
  setIsSessionExpired: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  const resetError = useCallback(() => {
    setErrors([]);
    setIsSessionExpired(false);
  }, []);

  const value = useMemo(
    () => ({
      errors,
      isSessionExpired,
      resetError,
      setErrors,
      setIsSessionExpired,
    }),
    [errors, isSessionExpired, resetError]
  );

  return <ErrorContext value={value}>{children}</ErrorContext>;
};

export const useErrorContext = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('ErrorContextをプロバイダーの中で取得してください');
  }
  return context;
};
