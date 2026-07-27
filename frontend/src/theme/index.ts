import type { PaletteColor, PaletteColorOptions } from '@mui/material';
import { createTheme } from '@mui/material';
import { type CSSObject } from '@mui/system';

declare module '@mui/material/styles' {
  interface Palette {
    incomeColor: PaletteColor;
    expenseColor: PaletteColor;
    balanceColor: PaletteColor;
    privateColor: PaletteColor;
    workColor: PaletteColor;
    routineColor: PaletteColor;
    studyColor: PaletteColor;
    restColor: PaletteColor;
  }
  interface PaletteOptions {
    incomeColor?: PaletteColorOptions;
    expenseColor?: PaletteColorOptions;
    balanceColor?: PaletteColorOptions;
    privateColor?: PaletteColorOptions;
    workColor?: PaletteColorOptions;
    routineColor?: PaletteColorOptions;
    studyColor?: PaletteColorOptions;
    restColor?: PaletteColorOptions;
  }
  interface Components {
    MuiLoadingButton?: {
      styleOverrides?: {
        root?: CSSObject;
        loading?: CSSObject;
      };
    };
  }
}

// 色とフォントを設定
let theme = createTheme({
  typography: {
    fontFamily:
      "YuGothic, 'Yu Gothic', 'Helvetica Neue', 'Helvetica', 'Hiragino Sans', 'ヒラギノ角ゴシック', Arial, Meiryo, sans-serif",
  },
  palette: {
    primary: {
      main: '#3f3f3f',
    },
    secondary: {
      main: '#999999',
    },
    error: {
      main: '#a52525',
    },
    incomeColor: {
      main: '#768093',
      light: '#D3DDE5',
      dark: '#2B3955',
    },
    expenseColor: {
      main: '#ab777e',
      light: '#EBDADA',
      dark: '#790011',
    },
    balanceColor: {
      main: '#6E989B',
      light: '#D7E5E4',
      dark: '#235658',
    },
    workColor: {
      main: '#c7a0a0',
      light: '#f7dfdf',
      dark: '#883e3e',
    },
    privateColor: {
      main: '#99a6b9',
      light: '#cadae9',
      dark: '#3e5577',
    },
    routineColor: {
      main: '#9aadaf',
      light: '#d2e5e4',
      dark: '#456359',
    },
    studyColor: {
      main: '#d3c892',
      light: '#f9f1d8',
      dark: '#9b8a62',
    },
    restColor: {
      main: '#bfb0c1',
      light: '#e1dbed',
      dark: '#716281',
    },
  },
});

// テーマの上書き
theme = createTheme(theme, {
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none !important',
          outlineColor: '#000',
          textTransform: 'capitalize',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '3px',
          '& .MuiTouchRipple-child': {
            borderRadius: '3px !important',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginLeft: 0,
          marginRight: 0,
          width: '100%',
          lineHeight: 1.35,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          '.MuiDataGrid-toolbar': {
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            gap: '4px',
            backgroundColor: 'transparent',
            backgroundImage:
              'linear-gradient(45deg,rgba(40, 40, 40, 0.93),rgba(40, 40, 40, 0.93)),url(/img/noise.webp)',
            backgroundSize: 'auto, 125px',
            color: 'white',
            minHeight: 'fit-content',
          },
        },
      },
    },
    MuiChartsTooltip: {
      styleOverrides: {
        root: {
          zIndex: '1300 !important',
          '& .MuiChartsTooltip-mark': {
            width: '13px',
            height: '13px',
          },
          '& .MuiChartsTooltip-paper *': {
            fontSize: '13px',
          },
        },
      },
    },
  },
});

export { theme };
