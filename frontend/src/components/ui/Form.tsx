import { theme } from '@/theme';
import { Typography } from '@mui/material';
import * as Icons from '@remixicon/react';
import { type CSSProperties, memo } from 'react';
import { Icon } from './Icon';

interface FormTitleProps {
  color?: string;
  icon: keyof typeof Icons;
  style?: CSSProperties;
  title: string;
}

export const FormTitle = memo(({ color, icon, style, title }: FormTitleProps) => (
  <Typography
    sx={{
      alignItems: 'center',
      display: 'flex',
      fontWeight: 700,
    }}
    variant="body2"
  >
    <Icon
      color={color ?? theme.palette.secondary.dark}
      icon={icon}
      size="1.2rem"
      style={{
        marginRight: '0.4rem',
        ...style,
      }}
    />
    {title}
  </Typography>
));
