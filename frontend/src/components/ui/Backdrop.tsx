import { Box, CircularProgress, Backdrop as MuiBackdrop, Typography } from '@mui/material';
import { memo } from 'react';

interface BackdropProps {
  isLoading: boolean;
  text?: string;
}

export const Backdrop = memo(({ isLoading, text = 'アップロード' }: BackdropProps) => (
  <MuiBackdrop
    open={isLoading}
    sx={{
      color: '#fff',
      zIndex: 9999,
    }}
  >
    <Box sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
      <CircularProgress color="inherit" />
      <Typography color="inherit" sx={{ mt: 2 }} variant="body2">
        {text}中...
      </Typography>
    </Box>
  </MuiBackdrop>
));
