import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface AiMessage {
  content: string;
  imageUrl?: string;
  role: 'assistant' | 'user';
}

interface AiState {
  messages: AiMessage[];
}

const initialState: AiState = {
  messages: [],
};

export const aiSlice = createSlice({
  initialState,
  name: 'ai',
  reducers: {
    addAiMessage: (state, action: PayloadAction<AiMessage>) => {
      state.messages.push(action.payload);
    },
    resetAiMessages: state => {
      state.messages = [];
    },
  },
});

export const { addAiMessage, resetAiMessages } = aiSlice.actions;

export default aiSlice.reducer;

export const selectAiMessages = (state: RootState) => state.ai.messages;
