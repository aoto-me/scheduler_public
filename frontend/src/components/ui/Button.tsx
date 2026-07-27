import type { CSSObject } from '@emotion/react';
import { Button, type ButtonProps } from '@mui/material';
import { memo } from 'react';

export const PrimaryButton = memo((props: ButtonProps) => {
  const { sx, ...rest } = props;

  return (
    <Button
      fullWidth
      sx={{
        '&.MuiButton-loading': {
          backgroundImage:
            'linear-gradient(180deg, rgba(110, 110, 110, 0.93), rgba(110, 110, 110, 0.93)), url(/img/noise.webp) !important',
        },
        '& .MuiButton-loadingIndicator': {
          color: '#fff',
        },
        '&::before': {
          border: '1px solid #fff',
          borderRadius: '3px',
          content: "''",
          height: 'calc(100% - 6px)',
          left: '50%',
          position: 'absolute',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 6px)',
          zIndex: 2,
        },
        '@media (hover: hover)': {
          '&:hover': {
            backgroundImage:
              'linear-gradient(180deg, rgba(70, 70, 70, 0.93), rgba(70, 70, 70, 0.93)), url(/img/noise.webp)',
            boxShadow: 'none',
          },
        },
        backgroundColor: 'transparent',
        backgroundImage: 'linear-gradient(45deg,rgba(40, 40, 40, 0.93),rgba(40, 40, 40, 0.93)),url(/img/noise.webp)',
        backgroundSize: 'auto, 125px',
        color: '#fff',
        overflow: 'hidden',
        padding: '0.5rem 1rem',
        position: 'relative',
        ...(sx as CSSObject),
      }}
      variant="contained"
      {...rest}
    />
  );
});

export const DeleteButton = memo((props: ButtonProps) => {
  const { sx, ...rest } = props;

  return (
    <Button
      color="secondary"
      fullWidth
      sx={{
        ...(sx as CSSObject),
      }}
      variant="outlined"
      {...rest}
    />
  );
});
