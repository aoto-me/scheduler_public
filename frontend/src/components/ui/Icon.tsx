import * as Icons from '@remixicon/react';
import { memo, useMemo } from 'react';
import { theme } from '../../theme';

interface IconProps {
  color?: string;
  icon: keyof typeof Icons;
  size?: string;
  style?: React.CSSProperties;
}

export const convertToRemixIcon = (iconName: string): keyof typeof Icons => {
  const words = iconName.split('-');
  const pascalCase = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  return `Ri${pascalCase}` as keyof typeof Icons;
};

export const Icon = memo(({ color = 'secondary', icon, size = '1.25rem', style }: IconProps) => {
  const RemixIcon = useMemo(
    // eslint-disable-next-line import/namespace
    () => Icons[icon] as Icons.RemixiconComponentType | undefined,
    [icon]
  );

  if (!RemixIcon) {
    return null;
  }

  const fillColor =
    color === 'primary' ? theme.palette.primary.main : color === 'secondary' ? theme.palette.secondary.main : color;

  return <RemixIcon color={fillColor} size={size} style={style} />;
});
