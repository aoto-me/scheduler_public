import { theme } from '@/theme';
import { getPathHierarchy, normalizePath } from '@/utils';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Breadcrumbs as MuiBreadcrumbs, Stack } from '@mui/material';
import { memo, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbsItem {
  path: string;
  title: string;
}

interface BreadcrumbsProps {
  breadcrumbs?: BreadcrumbsItem[];
}

export const Breadcrumbs = memo(({ breadcrumbs }: BreadcrumbsProps) => {
  const location = useLocation();

  const breadcrumbsItems = useMemo(() => {
    // データが渡されていてれば利用し、なければURLから生成
    if (breadcrumbs) return breadcrumbs;
    const decodedPath = normalizePath(location.pathname, {
      removeFilePrefix: false,
    });
    const splitPath = decodedPath.split('/').filter(Boolean);
    const pathHierarchy = getPathHierarchy(decodedPath);

    const breadcrumbsList: BreadcrumbsItem[] = [];
    for (const [index, title] of splitPath.entries()) {
      breadcrumbsList.push({ path: pathHierarchy[index], title });
    }

    return breadcrumbsList;
  }, [location.pathname]);

  return (
    <Stack spacing={1}>
      <MuiBreadcrumbs aria-label="パンくずリスト" separator={<NavigateNextIcon fontSize="small" />}>
        {breadcrumbsItems.map((item, index) => {
          const isLast = index === breadcrumbsItems.length - 1;
          return (
            <Link
              aria-current={isLast ? 'page' : undefined}
              key={item.path}
              style={{
                color: isLast ? theme.palette.text.primary : theme.palette.text.secondary,
                fontSize: '0.875rem',
              }}
              to={item.path}
            >
              {item.title}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Stack>
  );
});
