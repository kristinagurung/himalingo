import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  targetLanguage: "Bhutia",
  mode: "translate",
  messages: [],
  isChatting: false,
  currentChatId: null,
  loggedIn: false,
  userEmail: "",
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setTargetLanguage(state, action) { state.targetLanguage = action.payload; },
    setMode(state, action) { state.mode = action.payload; },
    addMessage(state, action) { state.messages.push(action.payload); },
    updateLastMessage(state, action) {
      if (state.messages.length > 0) {
        state.messages[state.messages.length - 1] = action.payload;
      }
    },
    setMessages(state, action) { state.messages = action.payload; },
    clearMessages(state) { state.messages = []; },
    setIsChatting(state, action) { state.isChatting = action.payload; },
    setCurrentChatId(state, action) { state.currentChatId = action.payload; },
    loginUser(state, action) { state.loggedIn = true; state.userEmail = action.payload.email; },
    logoutUser(state) { state.loggedIn = false; state.userEmail = ""; },
    resetChat(state) { state.messages = []; state.isChatting = false; state.currentChatId = null; state.mode = "translate"; },
  },
});

export const {
  setTargetLanguage, setMode, addMessage, updateLastMessage,
  setMessages, clearMessages, setIsChatting, setCurrentChatId,
  loginUser, logoutUser, resetChat,
} = appSlice.actions;

export default appSlice.reducer;
