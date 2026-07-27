export interface Holiday {
  classNames: string;
  start: string;
  title: string;
}

export interface YearEvent {
  date: Date | string;
  id: number;
  name: string;
}

export type YearEventWithNew = YearEvent & {
  isNew: boolean;
};
