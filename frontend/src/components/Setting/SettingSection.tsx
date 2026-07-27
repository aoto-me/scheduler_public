import { Box, Typography } from '@mui/material';
import { type JSX, memo, type ReactNode } from 'react';
import { DataTable, SectionTitle } from '../ui';

interface SettingSectionProps<T> {
  data: null | T[];
  description?: ReactNode;
  table: string;
  title: string;
}

const SettingSectionContent = <T extends { date: Date | string; id: number | string }>({
  data,
  description,
  table,
  title,
}: SettingSectionProps<T>) => (
  <Box>
    <SectionTitle title={title} />
    {description && (
      <Typography
        sx={{
          marginBottom: '0.5rem',
        }}
        variant={'body2'}
      >
        {description}
      </Typography>
    )}
    <DataTable ariaLabel={title} gridRows={data} table={table} />
  </Box>
);

export const SettingSection = memo(SettingSectionContent) as <T>(props: SettingSectionProps<T>) => JSX.Element;
