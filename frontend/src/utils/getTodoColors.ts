import { theme } from '@/theme';

export const todoMainColor = (type: string) => {
  switch (type) {
    case 'プライベート': {
      return theme.palette.privateColor.main;
    }
    case '仕事': {
      return theme.palette.workColor.main;
    }
    case '休憩・睡眠': {
      return theme.palette.restColor.main;
    }
    case '生活': {
      return theme.palette.routineColor.main;
    }
    case '趣味・勉強': {
      return theme.palette.studyColor.main;
    }
    default: {
      return theme.palette.secondary.main;
    }
  }
};

export const todoDarkColor = (type: string) => {
  switch (type) {
    case 'プライベート': {
      return theme.palette.privateColor.dark;
    }
    case '仕事': {
      return theme.palette.workColor.dark;
    }
    case '休憩・睡眠': {
      return theme.palette.restColor.dark;
    }
    case '生活': {
      return theme.palette.routineColor.dark;
    }
    case '趣味・勉強': {
      return theme.palette.studyColor.dark;
    }
    default: {
      return theme.palette.primary.main;
    }
  }
};

export const todoLightColor = (type: string) => {
  switch (type) {
    case 'プライベート': {
      return theme.palette.privateColor.light;
    }
    case '仕事': {
      return theme.palette.workColor.light;
    }
    case '休憩・睡眠': {
      return theme.palette.restColor.light;
    }
    case '生活': {
      return theme.palette.routineColor.light;
    }
    case '趣味・勉強': {
      return theme.palette.studyColor.light;
    }
    default: {
      return `rgba(0, 0, 0, 0.06)`;
    }
  }
};
