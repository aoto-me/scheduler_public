import { useLocation } from 'react-router-dom';

interface UsePathReturn {
  firstPath: string;
  pathname: string;
  segments: string[];
}

export const usePath = (): UsePathReturn => {
  const { pathname } = useLocation();

  const segments = pathname.split('/').filter(Boolean);
  const firstPath = segments[0] ?? '';

  return {
    firstPath,
    pathname,
    segments,
  };
};
