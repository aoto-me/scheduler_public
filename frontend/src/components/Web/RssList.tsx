import { ICONS, NO_IMG_URL } from '@/configs';
import { theme } from '@/theme';
import type { RSSItem } from '@/types';
import styled from '@emotion/styled';
import AddCircleSharpIcon from '@mui/icons-material/AddCircleSharp';
import { Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { format } from 'date-fns';
import { memo, useState } from 'react';
import { Icon } from '../ui';

interface RssListProps {
  isLoading: boolean;
  rssItems: null | RSSItem[];
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

export const RssList = memo(({ isLoading, rssItems }: RssListProps) => {
  const [visibleCount, setVisibleCount] = useState(10); // 表示件数

  return (
    <>
      {rssItems && !isLoading ? (
        <Stack spacing={1}>
          {rssItems.slice(0, visibleCount).map(item => (
            <Paper key={item.link} variant="outlined">
              <PaperLink href={item.link} rel="noreferrer" target="_blank" title={item.title}>
                <Box
                  sx={{
                    display: 'block',
                    flexShrink: 0,
                    height: 'auto',
                    maxWidth: '238px',
                    minHeight: '128px',
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
                    {item.title}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      marginBottom: '0.25rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    <Typography
                      sx={{
                        alignItems: 'center',
                        color: theme.palette.secondary.dark,
                        display: 'flex',
                        mr: 2,
                      }}
                      variant="body2"
                    >
                      <Icon
                        icon={ICONS.browser}
                        size="1rem"
                        style={{
                          marginRight: '0.35rem',
                        }}
                      />
                      {item.siteName}
                    </Typography>
                    <Typography
                      sx={{
                        alignItems: 'center',
                        color: theme.palette.secondary.dark,
                        display: 'flex',
                      }}
                      variant={'body2'}
                    >
                      <Icon
                        icon={ICONS.calendar}
                        size="1rem"
                        style={{
                          marginRight: '0.35rem',
                        }}
                      />
                      {format(item.pubDate, 'yyyy/MM/dd')}
                    </Typography>
                  </Box>
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
                    {item.link}
                  </Typography>
                </Box>
              </PaperLink>
            </Paper>
          ))}
          {visibleCount < rssItems.length && (
            <Button
              fullWidth
              onClick={() => {
                setVisibleCount(prev => prev + 10);
              }}
              startIcon={<AddCircleSharpIcon color="primary" />}
              sx={{
                height: 'fit-content',
                letterSpacing: 0.5,
              }}
              variant="outlined"
            >
              もっと見る
            </Button>
          )}
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
                    maxWidth: '238px',
                    minHeight: '128px',
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
                  <Box sx={{ display: 'flex', gap: 2, mt: '0.1rem' }}>
                    <Skeleton animation="wave" height={16} variant="text" width="30%" />
                    <Skeleton animation="wave" height={16} variant="text" width="25%" />
                  </Box>
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
