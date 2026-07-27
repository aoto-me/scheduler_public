import { center } from '@/styles';
import { Box, CircularProgress, Paper } from '@mui/material';
import type { CSSProperties } from 'react';

export const FullscreenLoader = () => {
  return (
    <Box
      sx={{
        height: '100vh',
        left: 0,
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 9999,
        ...center,
      }}
    >
      <CircularProgress color={'secondary'} size={30} />
    </Box>
  );
};

interface PageLoaderProps {
  style?: CSSProperties;
}

export const PageLoader = ({ style }: PageLoaderProps) => {
  return (
    <Box
      sx={{
        height: '100%',
        marginBottom: '2rem',
        ...center,
        ...style,
      }}
    >
      <CircularProgress color={'secondary'} size={20} />
    </Box>
  );
};

interface LoaderProps {
  outline?: boolean;
  style?: CSSProperties;
}

export const Loader = ({ outline = false, style }: LoaderProps) => {
  if (outline) {
    return (
      <Paper
        sx={{
          height: 250,
          width: '100%',
          ...center,
          ...style,
        }}
        variant="outlined"
      >
        <CircularProgress color="secondary" size={20} />
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        height: 250,
        width: '100%',
        ...center,
        ...style,
      }}
    >
      <CircularProgress color="secondary" size={20} />
    </Box>
  );
};
