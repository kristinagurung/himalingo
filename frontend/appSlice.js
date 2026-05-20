// appSlice.js  — put this in src/appSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Language
  targetLanguage: "Nepali",

  // Mode
  mode: "translate",

  // Messages
  messages: [],
  isChatting: false,
  currentChatId: null,

  // User login
  loggedIn: false,
  userEmail: "",
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {

    // ── Language ──────────────────────────────────────────────
    setTargetLanguage(state, action) {
      state.targetLanguage = action.payload;
    },

    // ── Mode ──────────────────────────────────────────────────
    setMode(state, action) {
      state.mode = action.payload;
    },

    // ── Messages ──────────────────────────────────────────────
    addMessage(state, action) {
      state.messages.push(action.payload);
    },

    updateLastMessage(state, action) {
      if (state.messages.length > 0) {
        state.messages[state.messages.length - 1] = action.payload;
      }
    },

    setMessages(state, action) {
      state.messages = action.payload;
    },

    clearMessages(state) {
      state.messages = [];
    },

    // ── Chat state ────────────────────────────────────────────
    setIsChatting(state, action) {
      state.isChatting = action.payload;
    },

    setCurrentChatId(state, action) {
      state.currentChatId = action.payload;
    },

    // ── Login ─────────────────────────────────────────────────
    loginUser(state, action) {
      state.loggedIn   = true;
      state.userEmail  = action.payload.email;
    },

    logoutUser(state) {
      state.loggedIn  = false;
      state.userEmail = "";
    },

    // ── Reset entire chat (new chat button) ───────────────────
    resetChat(state) {
      state.messages      = [];
      state.isChatting    = false;
      state.currentChatId = null;
      state.mode          = "translate";
    },
  },
});

export const {
  setTargetLanguage,
  setMode,
  addMessage,
  updateLastMessage,
  setMessages,
  clearMessages,
  setIsChatting,
  setCurrentChatId,
  loginUser,
  logoutUser,
  resetChat,
} = appSlice.actions;

export default appSlice.reducer;

