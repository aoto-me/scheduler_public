import { center, fontSerif, navHeight } from '@/styles';
import { Box, Typography } from '@mui/material';
import type { CSSProperties } from 'react';

interface NotFoundProps {
  style?: CSSProperties;
}

export const NotFound = ({ style }: NotFoundProps) => {
  return (
    <Box
      sx={{
        height: '100%',
        ...center,
        ...style,
      }}
    >
      <Typography
        sx={{
          ...fontSerif,
          fontWeight: 500,
          marginBottom: '2rem',
        }}
      >
        ページが見つかりません
      </Typography>
    </Box>
  );
};

export const Private = () => {
  return (
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
      <Typography
        sx={{
          ...fontSerif,
          fontWeight: 500,
          marginBottom: '2rem',
        }}
      >
        プライベートモードです
      </Typography>
    </Box>
  );
};

export const CenterText = ({ style, text }: { style?: CSSProperties; text: string }) => {
  return (
    <Box
      sx={{
        ...center,
        height: '100%',
        minHeight: {
          md: 'calc(100vh - 4rem)',
          xs: `calc(100vh - (${navHeight} + 4rem))`,
        },
        ...style,
      }}
    >
      <Typography
        sx={{
          ...fontSerif,
          fontWeight: 500,
          marginBottom: '2rem',
        }}
      >
        {text}
      </Typography>
    </Box>
  );
};
