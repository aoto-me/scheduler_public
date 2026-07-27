import { bgBlack, fontSerif } from '@/styles';
import { type CSSProperties, Typography } from '@mui/material';
import { memo } from 'react';

interface SectionTitleProps {
  style?: CSSProperties;
  title: string;
}

export const SectionTitle = memo(({ style, title }: SectionTitleProps) => (
  <Typography
    component="h3"
    sx={{
      ...fontSerif,
      fontWeight: 700,
      lineHeight: 1.35,
      mb: '1rem',
      paddingLeft: '1rem',
      position: 'relative',
      ...style,
      '&:before': {
        content: '""',
        height: '90%',
        left: 0,
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '4px',
        ...bgBlack,
      },
    }}
    variant="h5"
  >
    {title}
  </Typography>
));
