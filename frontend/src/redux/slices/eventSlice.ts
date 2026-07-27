import type { Holiday, YearEvent } from '@/types';
import { splitDate } from '@/utils';
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface EventState {
  holidays: Holiday[];
  yearEvent: null | YearEvent[];
}

const initialState: EventState = {
  holidays: [],
  yearEvent: null,
};

export const eventSlice = createSlice({
  initialState,
  name: 'event',
  reducers: {
    addYearEvent: (state, action: PayloadAction<YearEvent>) => {
      const event = action.payload;
      state.yearEvent ??= [];
      if (!state.yearEvent.some(e => e.id === event.id)) {
        state.yearEvent.push(event);
      }
    },

    removeYearEvent: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.yearEvent) {
        state.yearEvent = state.yearEvent.filter(e => e.id !== id);
      }
    },

    setHolidays: (state, action: PayloadAction<Holiday[]>) => {
      const holiday = action.payload;
      state.holidays = holiday;
    },

    setYearEvent: (state, action: PayloadAction<YearEvent[]>) => {
      const event = action.payload;
      state.yearEvent = event;
    },

    updateYearEvent: (state, action: PayloadAction<YearEvent>) => {
      const event = action.payload;
      if (state.yearEvent) {
        const index = state.yearEvent.findIndex(e => e.id === event.id);
        if (index !== -1) state.yearEvent[index] = event;
      }
    },
  },
});

export const { addYearEvent, removeYearEvent, setHolidays, setYearEvent, updateYearEvent } = eventSlice.actions;

export default eventSlice.reducer;

export const selectYearEventState = (state: RootState) => state.event;

export const selectYearEvent = (state: RootState) => state.event.yearEvent;

export const selectHolidays = (state: RootState) => state.event.holidays;

// カレンダー用の YearEventデータ を取得
export const selectCalendarYearEventMap = createSelector(
  [(state: RootState) => state.event.yearEvent],
  (yearEvent): null | Record<string, string> => {
    const eventObj: Record<string, string> = {};
    if (!yearEvent) return null;

    for (const event of yearEvent) {
      const { day, month } = splitDate(new Date(event.date));
      const patternDate = `${month}-${day}`;
      const thisYear = new Date().getFullYear();
      // 各年の日付を取得
      const dateThisYear = `${String(thisYear)}-${patternDate}`;
      const dateLastYear = `${String(thisYear - 1)}-${patternDate}`;
      const dateNextYear = `${String(thisYear + 1)}-${patternDate}`;
      // 3年分を登録
      eventObj[dateThisYear] = event.name;
      eventObj[dateLastYear] = event.name;
      eventObj[dateNextYear] = event.name;
    }

    return eventObj;
  }
);
