import { center, navHeight, navWidth } from '@/styles';
import { Box, Container } from '@mui/material';
import { memo, type ReactNode } from 'react';

interface MainContainerProps {
  children: ReactNode;
}

export const MainContainer = memo(({ children }: MainContainerProps) => (
  <Container
    component="main"
    disableGutters
    maxWidth={false}
    sx={{
      minHeight: '100svh',
      p: {
        md: `2rem min(5vw, 1.5rem) 2rem min(calc(${navWidth} + 5vw), calc(${navWidth} + 1.5rem))`,
        xs: `2rem min(5vw, 1.5rem) calc(${navHeight} + 2rem)`,
      },
    }}
  >
    {children}
  </Container>
));

interface MainContainerInnerProps {
  children: React.ReactNode;
}

export const MainContainerInner = memo(({ children }: MainContainerInnerProps) => (
  <Box
    sx={{
      ...center,
      height: '100%',
      minHeight: {
        md: 'calc(100vh - 4rem)',
        xs: `calc(100vh - (${navHeight} + 4rem))`,
      },
    }}
  >
    {children}
  </Box>
));
