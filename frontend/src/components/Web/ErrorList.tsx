import { dotListStyle } from '@/styles';
import { theme } from '@/theme';
import type { RSSList, WebCSV } from '@/types';
import { Paper } from '@mui/material';
import { memo } from 'react';

interface ErrorListProps {
  emptyRssList: RSSList[];
  errorWebCsv: WebCSV[];
}

export const ErrorList = memo(({ emptyRssList, errorWebCsv }: ErrorListProps) => {
  return (
    <Paper sx={{ padding: '1rem' }} variant="outlined">
      <ul
        style={{
          paddingLeft: '1.25rem',
        }}
      >
        {emptyRssList.map(rss => {
          return (
            <li key={`rss-${String(rss.id)}`} style={dotListStyle}>
              <p
                style={{
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                }}
              >
                {rss.siteName}
              </p>
              <p>
                URL：
                <a
                  href={rss.url}
                  rel="noreferrer"
                  style={{
                    textDecoration: 'underline',
                  }}
                  target="_blank"
                >
                  {rss.url}
                </a>
              </p>
              <p>エラー：RSSの取得が0件でした</p>
            </li>
          );
        })}
        {errorWebCsv.map(item => {
          return (
            <li key={item.url} style={dotListStyle}>
              <p
                style={{
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                }}
              >
                {item.siteName}
              </p>
              <p>
                URL：
                <a
                  href={item.url}
                  rel="noreferrer"
                  style={{
                    textDecoration: 'underline',
                  }}
                  target="_blank"
                >
                  {item.url}
                </a>
              </p>
              <p>エラー：{item.error}</p>
            </li>
          );
        })}
      </ul>
    </Paper>
  );
});
