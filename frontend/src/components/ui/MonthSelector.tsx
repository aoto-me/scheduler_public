import { ICONS } from '@/configs';
import { fontSerif } from '@/styles';
import { Button, type CSSProperties, Stack } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addMonths } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { memo } from 'react';
import { Icon } from './Icon';

interface MonthSelectorProps {
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  style?: CSSProperties;
}

const buttonStyle: CSSProperties = {
  '&::before': {
    border: '1px solid #fff',
    borderRadius: '2px',
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
      backgroundImage: 'linear-gradient(180deg, rgba(70, 70, 70, 0.93), rgba(70, 70, 70, 0.93)), url(/img/noise.webp)',
      boxShadow: 'none',
    },
  },
  backgroundColor: 'transparent',
  backgroundImage: 'linear-gradient(45deg,rgba(40, 40, 40, 0.93),rgba(40, 40, 40, 0.93)),url(/img/noise.webp)',
  backgroundSize: 'auto, 125px',
  maxWidth: '54px',
  minWidth: 0,
  overflow: 'hidden',
  padding: '6px',
  position: 'relative',
  width: '35vw',
};

export const MonthSelector = memo(({ currentMonth, setCurrentMonth, style }: MonthSelectorProps) => {
  const handlePreviousMonth = () => {
    const previousMonth = addMonths(currentMonth, -1);
    setCurrentMonth(previousMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    setCurrentMonth(nextMonth);
  };

  return (
    <LocalizationProvider adapterLocale={ja} dateAdapter={AdapterDateFns}>
      <Stack
        aria-label="月選択"
        direction="row"
        role="group"
        spacing={2}
        sx={{
          justifyContent: 'center',
          ...style,
        }}
      >
        <Button
          aria-label="前の月"
          color="primary"
          onClick={handlePreviousMonth}
          sx={{
            ...buttonStyle,
          }}
          variant="contained"
        >
          <Icon color="#fff" icon={ICONS.arrowLeft} />
        </Button>
        <DatePicker
          format="yyyy年MM月"
          onChange={value => {
            if (value instanceof Date) {
              setCurrentMonth(value);
            }
          }}
          sx={{
            '& span.MuiPickersSectionList-section': {
              ...fontSerif,
              fontSize: '1.35rem',
              fontWeight: 700,
              letterSpacing: '0.025em',
            },
            '& span.MuiPickersSectionList-sectionContent': {
              ...fontSerif,
              fontSize: '1.35rem',
              fontWeight: 700,
              letterSpacing: '0.025em',
            },
            '.MuiButtonBase-root.MuiIconButton-root': {
              borderRadius: '999px',
            },
            '.MuiButtonBase-root.MuiIconButton-root .MuiSvgIcon-root': {
              fontSize: '1.25rem',
            },
            '.MuiButtonBase-root.MuiIconButton-root .MuiTouchRipple-root': {
              borderRadius: '999px !important',
            },
            '.MuiPickersSectionList-root.MuiPickersInputBase-sectionsContainer': {
              justifyContent: 'center',
              padding: '10px 0 10px 12px',
            },
            backgroundColor: 'white',
          }}
          value={currentMonth}
          views={['year', 'month']}
        />
        <Button
          aria-label="次の月"
          onClick={handleNextMonth}
          sx={{
            ...buttonStyle,
          }}
          variant="contained"
        >
          <Icon color="#fff" icon={ICONS.arrowRight} />
        </Button>
      </Stack>
    </LocalizationProvider>
  );
});
