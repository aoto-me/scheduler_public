import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface AuthContextType {
  csrfToken: string;
  entryURL: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPrivate: boolean | null;
  resetAuth: () => void;
  setCsrfToken: React.Dispatch<React.SetStateAction<string>>;
  setEntryURL: React.Dispatch<React.SetStateAction<string>>;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPrivate: React.Dispatch<React.SetStateAction<boolean | null>>;
  setUserId: React.Dispatch<React.SetStateAction<number>>;
  setUserName: React.Dispatch<React.SetStateAction<string>>;
  userId: number;
  userName: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState(0);
  const [userName, setUserName] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [entryURL, setEntryURL] = useState('/');
  const [isPrivate, setIsPrivate] = useState<boolean | null>(null);

  const resetAuth = useCallback(() => {
    setIsPrivate(null);
    setUserId(0);
    setUserName('');
    setCsrfToken('');
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      csrfToken,
      entryURL,
      isAuthenticated,
      isLoading,
      isPrivate,
      resetAuth,
      setCsrfToken,
      setEntryURL,
      setIsAuthenticated,
      setIsLoading,
      setIsPrivate,
      setUserId,
      setUserName,
      userId,
      userName,
    }),
    [userId, userName, csrfToken, isLoading, isAuthenticated, entryURL, isPrivate, resetAuth]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('AuthContextをプロバイダーの中で取得してください');
  }
  return context;
};
