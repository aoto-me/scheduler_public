import { NO_IMG_URL } from '@/configs';
import { fontSerif } from '@/styles';
import type { WebCSV } from '@/types';
import styled from '@emotion/styled';
import { Box, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { format } from 'date-fns';
import { memo } from 'react';

interface WebListProps {
  webCsv: null | Record<string, WebCSV[]>;
}

const PaperLink = styled.a`
  display: flex;
  align-items: stretch;
  flex-wrap: nowrap;
  overflow: hidden;
  width: 100%;
  transition:
    background-color 0.3s ease-out,
    filter 0.3s ease-out;
  border-radius: 4px;

  &:focus-visible {
    filter: brightness(0.94);
    background-color: #fcfcfc;
  }

  @media (hover: hover) {
    &:hover {
      filter: brightness(0.94);
      background-color: #fcfcfc;
    }
  }
`;

export const WebList = memo(({ webCsv }: WebListProps) => {
  return (
    <>
      {webCsv ? (
        <Stack spacing={3}>
          {Object.entries(webCsv).map(([date, items]) => (
            <div key={date}>
              <Typography
                sx={{
                  fontFamily: fontSerif,
                  fontWeight: 700,
                  lineHeight: 1.5,
                  marginBottom: '0.5rem',
                }}
                variant={'h6'}
              >
                {format(date, 'yyyy年MM月dd日')}
              </Typography>
              <Stack spacing={1}>
                {items.map((item, index) => (
                  <Paper key={item.url || index} variant={'outlined'}>
                    <PaperLink href={item.url} rel="noreferrer" target="_blank" title={item.siteName}>
                      <Box
                        sx={{
                          display: 'block',
                          flexShrink: 0,
                          height: 'auto',
                          maxWidth: '183px',
                          minHeight: '100px',
                          overflow: 'hidden',
                          width: { sm: '40%', xs: '25%' },
                        }}
                      >
                        <img
                          alt=""
                          src={item.ogp || NO_IMG_URL}
                          style={{
                            height: '100%',
                            objectFit: 'cover',
                            width: '100%',
                          }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          flexGrow: 1,
                          flexShrink: 1,
                          padding: '0.5rem',
                          width: { sm: '50%', xs: '100%' },
                        }}
                      >
                        <Typography
                          className="linkBlockTitle"
                          sx={{
                            display: '-webkit-box',
                            fontWeight: 700,
                            lineHeight: 1.5,
                            overflow: 'hidden',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2,
                          }}
                          variant={'subtitle1'}
                        >
                          {item.siteName}
                        </Typography>
                        <Typography
                          sx={{
                            display: '-webkit-box',
                            marginTop: 'auto',
                            overflow: 'hidden',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 1,
                          }}
                          variant={'caption'}
                        >
                          {item.url}
                        </Typography>
                      </Box>
                    </PaperLink>
                  </Paper>
                ))}
              </Stack>
            </div>
          ))}
        </Stack>
      ) : (
        <Stack
          spacing={1}
          sx={{
            opacity: 0.7,
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Paper key={i} variant="outlined">
              <Box sx={{ display: 'flex', overflow: 'hidden' }}>
                <Skeleton
                  animation="wave"
                  sx={{
                    flexShrink: 0,
                    height: 'auto',
                    maxWidth: '183px',
                    minHeight: '100px',
                    overflow: 'hidden',
                    width: { sm: '40%', xs: '25%' },
                  }}
                  variant="rectangular"
                />
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    flexShrink: 1,
                    gap: '0.4rem',
                    padding: '0.5rem',
                  }}
                >
                  <Skeleton animation="wave" height={20} variant="text" width="90%" />
                  <Skeleton animation="wave" height={14} sx={{ mt: 'auto' }} variant="text" width="60%" />
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}
    </>
  );
});
