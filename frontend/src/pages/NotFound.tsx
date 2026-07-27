import { center, fontSerif, navHeight } from '@/styles';
import { Box, Typography } from '@mui/material';

const NotFound = () => {
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
        ページが見つかりません
      </Typography>
    </Box>
  );
};

export default NotFound;
