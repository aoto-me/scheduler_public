import type { Action, ThunkAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import aiReducer from './slices/aiSlice';
import diaryReducer from './slices/diarySlice';
import eventReducer from './slices/eventSlice';
import fileReducer from './slices/fileSlice';
import foodReducer from './slices/foodSlice';
import galleryReducer from './slices/gallerySlice';
import healthReducer from './slices/healthSlice';
import memoReducer from './slices/memoSlice';
import moneyReducer from './slices/moneySlice';
import monthlyMemoReducer from './slices/monthlyMemoSlice';
import projectReducer from './slices/projectSlice';
import todoReducer from './slices/todoSlice';
import webReducer from './slices/webSlice';

export const store = configureStore({
  reducer: {
    ai: aiReducer,
    diary: diaryReducer,
    event: eventReducer,
    file: fileReducer,
    food: foodReducer,
    gallery: galleryReducer,
    health: healthReducer,
    memo: memoReducer,
    money: moneyReducer,
    monthlyMemo: monthlyMemoReducer,
    project: projectReducer,
    todo: todoReducer,
    web: webReducer,
  },
});

export type AppDispatch = AppStore['dispatch'];
export type AppStore = typeof store;
export type AppThunk<ThunkReturnType = void> = ThunkAction<ThunkReturnType, RootState, unknown, Action>;
export type RootState = ReturnType<AppStore['getState']>;
