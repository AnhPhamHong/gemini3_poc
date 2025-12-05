import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { TopicSuggestion } from '@/types';

interface TopicState {
    suggestions: TopicSuggestion[];
    selectedTopic: TopicSuggestion | null;
    isGenerating: boolean;
}

const initialState: TopicState = {
    suggestions: [],
    selectedTopic: null,
    isGenerating: false,
};

const topicSlice = createSlice({
    name: 'topics',
    initialState,
    reducers: {
        setTopicSuggestions: (state, action: PayloadAction<TopicSuggestion[]>) => {
            state.suggestions = action.payload;
        },
        selectTopic: (state, action: PayloadAction<TopicSuggestion>) => {
            state.selectedTopic = action.payload;
        },
        clearTopicSelection: (state) => {
            state.selectedTopic = null;
        },
        clearAllTopics: (state) => {
            state.suggestions = [];
            state.selectedTopic = null;
            state.isGenerating = false;
        },
        setGenerating: (state, action: PayloadAction<boolean>) => {
            state.isGenerating = action.payload;
        },
    },
});

export const { setTopicSuggestions, selectTopic, clearTopicSelection, clearAllTopics, setGenerating } =
    topicSlice.actions;
export default topicSlice.reducer;
