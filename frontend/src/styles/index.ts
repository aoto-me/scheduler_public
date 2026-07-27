import { theme } from '@/theme';

export const navHeight = '50px';
export const navWidth = '80px';
export const drawerWidth = '240px';
export const drawerHeader = '48px';

export const fontSerif = {
  fontFamily: `"Zen Old Mincho", "Times New Roman", "ヒラギノ明朝 ProN", "Hiragino Mincho ProN", "Yu Mincho", serif !important`,
};

export const center = {
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
};

export const bgBlack = {
  backgroundColor: 'transparent',
  backgroundImage: 'linear-gradient(45deg,rgba(20, 19, 19, 0.93),rgba(40, 40, 40, 0.93)),url(/img/noise.webp)',
  backgroundSize: 'auto, 125px',
  color: 'white',
};

export const bgWhite = {
  backgroundColor: 'transparent',
  backgroundImage: 'linear-gradient(180deg,rgba(247, 244, 240, 0.93),rgba(247, 244, 240, 0.93)),url(/img/noise.webp)',
  backgroundSize: 'auto, 125px',
};

export const scrollbarBlack = {
  '&::-webkit-scrollbar': {
    ...bgBlack,
    height: 6,
    width: 6,
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#ffffff54',
    borderRadius: '999px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#ffffff82',
  },
  WebkitOverflowScrolling: 'touch',
};

export const scrollbarWhite = {
  '&::-webkit-scrollbar': {
    backgroundColor: '#e4e4e4',
    height: 6,
    width: 6,
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#c7c7c7',
    borderRadius: '999px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#afafaf',
  },
  WebkitOverflowScrolling: 'touch',
};

export const scrollbarTransparent = {
  '&::-webkit-scrollbar': {
    backgroundColor: '#ffffff7d',
    height: 6,
    width: 6,
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#c2bfb6',
    borderRadius: '999px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#a4a199',
  },
  WebkitOverflowScrolling: 'touch',
};

export const editorOuter = {
  backgroundColor: '#fff',
  border: 'solid 1px',
  borderColor: theme.palette.divider,
  borderRadius: '6px',
  padding: '2.5rem 2.25rem',
};

export const zIndexes = {
  drawerLeft: 1200, // 基準（MUIのデフォルト）
  navigation: 1201,
};

export const dotListStyle = {
  color: theme.palette.text.secondary,
  fontSize: '0.8725rem',
  lineHeight: 1.5,
  listStyle: 'disc',
  marginTop: '0.5rem',
};

export const datePickerWithLabel = {
  '& .Mui-focused fieldset': {
    borderBottom: `solid 1px ${theme.palette.primary.main} !important`,
    borderLeft: 'none !important',
    borderRight: 'none !important',
    borderTop: 'none !important',
  },
  '& .MuiButtonBase-root.MuiIconButton-root .MuiSvgIcon-root': {
    fontSize: '1.25rem',
  },
  '& .MuiFormLabel-root': {
    borderRadius: '3px',
    flexShrink: 0,
    fontSize: '0.825rem',
    letterSpacing: '0.035em',
    lineHeight: 1,
    marginRight: '0.5rem',
    padding: '0.75rem 0.5rem',
    pointerEvents: 'all',
    position: 'static !important',
    transform: 'none !important',
    ...bgBlack,
    color: '#fff !important',
  },
  '.MuiButtonBase-root.MuiIconButton-root': {
    borderRadius: '999px',
  },
  '.MuiButtonBase-root.MuiIconButton-root .MuiTouchRipple-root': {
    borderRadius: '999px !important',
  },
  '.MuiPickersInputBase-root': {
    borderRadius: '0',
    flexGrow: 1,
    minWidth: 0,
    padding: '0 0.5rem 0 0',
    width: 'min-content',
  },
  '.MuiPickersSectionList-root': {
    padding: '0.5rem 0',
    width: '100%',
  },
  alignItems: 'center',
  fieldset: {
    border: 'none',
  },
  flexDirection: 'row',
  flexWrap: 'wrap',
  width: '100%',
};

export const datePickerWithGrayLabel = {
  '& .Mui-focused fieldset': {
    borderBottom: `solid 1px ${theme.palette.primary.main} !important`,
    borderLeft: 'none !important',
    borderRight: 'none !important',
    borderTop: 'none !important',
  },
  '& .MuiButtonBase-root.MuiIconButton-root .MuiSvgIcon-root': {
    fontSize: '1.25rem',
  },
  '& .MuiFormLabel-root': {
    backgroundColor: theme.palette.grey[200],
    borderRadius: '3px',
    color: `${theme.palette.text.secondary} !important`,
    flexShrink: 0,
    fontSize: '0.825rem',
    letterSpacing: '0.035em',
    lineHeight: 1,
    marginRight: '0.5rem',
    padding: '0.75rem 0.5rem',
    pointerEvents: 'all',
    position: 'static !important',
    transform: 'none !important',
  },
  '.MuiButtonBase-root.MuiIconButton-root': {
    borderRadius: '999px',
  },
  '.MuiButtonBase-root.MuiIconButton-root .MuiTouchRipple-root': {
    borderRadius: '999px !important',
  },
  '.MuiPickersInputBase-root': {
    borderRadius: '0',
    flexGrow: 1,
    minWidth: 0,
    padding: '0 0.5rem 0 0',
    width: 'min-content',
  },
  '.MuiPickersSectionList-root': {
    padding: '0.5rem 0',
    width: '100%',
  },
  alignItems: 'center',
  fieldset: {
    border: 'none',
  },
  flexDirection: 'row',
  flexWrap: 'wrap',
  width: '100%',
};

export const autocompleteTextFieldStyle = {
  '& .MuiFilledInput-root': {
    borderRadius: '0.25rem',
    paddingBottom: '0.5rem !important',
    paddingTop: '0.5rem  !important',
  },
  '& .MuiFilledInput-root::before': {
    display: 'none',
  },
  '.MuiFormLabel-root[data-shrink="false"]': {
    color: theme.palette.text.disabled,
    top: '-2px',
    transition: 'none',
  },
  '.MuiFormLabel-root[data-shrink="true"]': {
    display: 'none',
    transition: 'none',
  },
};

export const textFieldOutlinedStyleWithLabel = {
  '& .MuiFormLabel-asterisk': {
    display: 'none',
  },
  '& .MuiFormLabel-root': {
    borderRadius: '3px',
    flexShrink: 0,
    fontSize: '0.825rem',
    letterSpacing: '0.035em',
    lineHeight: 1,
    marginRight: '0.5rem',
    padding: '0.75rem 0.5rem',
    pointerEvents: 'all',
    position: 'static !important',
    transform: 'none !important',
    ...bgBlack,
    color: '#fff !important',
  },
  '& .MuiInputBase-root': {
    flexGrow: 1,
    width: 'min-content',
  },
  alignItems: 'center',
  fieldset: {
    top: 0,
  },
  flexDirection: 'row',
  flexWrap: 'wrap',
  legend: {
    display: 'none',
    opacity: 0,
  },
  width: '100%',
};

export const textFieldOutlinedStyleWithGrayLabel = {
  '& .MuiFormLabel-asterisk': {
    display: 'none',
  },
  '& .MuiFormLabel-root': {
    backgroundColor: theme.palette.grey[200],
    borderRadius: '3px',
    color: `${theme.palette.text.secondary} !important`,
    flexShrink: 0,
    fontSize: '0.825rem',
    letterSpacing: '0.035em',
    lineHeight: 1,
    marginRight: '0.5rem',
    padding: '0.75rem 0.5rem',
    pointerEvents: 'all',
    position: 'static !important',
    transform: 'none !important',
  },
  '& .MuiInputBase-root': {
    flexGrow: 1,
    width: 'min-content',
  },
  alignItems: 'center',
  fieldset: {
    top: 0,
  },
  flexDirection: 'row',
  flexWrap: 'wrap',
  legend: {
    display: 'none',
    opacity: 0,
  },
  width: '100%',
};

export const textFieldSelectStyle = {
  '& .MuiFilledInput-root': {
    borderRadius: '0.25rem',
  },
  '& .MuiFilledInput-root::before': {
    display: 'none',
  },
  '& .MuiFormLabel-asterisk': {
    display: 'none',
  },
};

export const textFieldSelectStyleWithLabel = {
  '& .MuiFilledInput-root': {
    borderRadius: '0.25rem',
  },
  '& .MuiFilledInput-root::before': {
    display: 'none',
  },
  '& .MuiFormLabel-asterisk': {
    display: 'none',
  },
  '& .MuiFormLabel-root': {
    borderRadius: '3px',
    flexShrink: 0,
    fontSize: '0.825rem',
    letterSpacing: '0.035em',
    lineHeight: 1,
    marginRight: '0.5rem',
    padding: '0.75rem 0.5rem',
    pointerEvents: 'all',
    position: 'static !important',
    transform: 'none !important',
    ...bgBlack,
    color: '#fff !important',
  },
  '& .MuiInputBase-root': {
    flexGrow: 1,
    width: 'min-content',
  },
  '& .MuiSelect-select.MuiSelect-filled': {
    paddingBottom: '0.5rem',
    paddingTop: '0.5rem',
  },
  alignItems: 'center',
  fieldset: {
    top: 0,
  },
  flexDirection: 'row',
  flexWrap: 'wrap',
  legend: {
    display: 'none',
    opacity: 0,
  },
  width: '100%',
};

export const chartColor = [
  '#7B2935',
  '#a34b4b',
  '#c99696',
  '#36516f',
  '#4d7395',
  '#8998af',
  '#235658',
  '#517a7f',
  '#8aa2a5',
];
