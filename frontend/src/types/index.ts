import * as Icons from '@remixicon/react';

export * from './event';
export * from './file';
export * from './food';
export * from './gallery';
export * from './health';
export * from './login';
export * from './memo';
export * from './menu';
export * from './money';
export * from './monthlyMemo';
export * from './project';
export * from './table';
export * from './todo';
export * from './web';

export interface ErrorResponse {
  error: string;
}

export interface Tab {
  content: () => React.ReactNode;
  icon: keyof typeof Icons;
  id: string;
  label: string;
}
