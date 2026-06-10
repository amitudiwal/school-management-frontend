import { createSlice } from '@reduxjs/toolkit';

const savedTheme = localStorage.getItem('themeMode') || 'dark'; // Defaulting to premium dark mode

const initialState = {
  themeMode: savedTheme,
  sidebarOpen: true,
  toast: {
    open: false,
    message: '',
    severity: 'success'
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', state.themeMode);
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },
    showToast(state, action) {
      state.toast = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || 'success'
      };
    },
    hideToast(state) {
      state.toast.open = false;
    }
  },
});

export const { toggleTheme, toggleSidebar, setSidebarOpen, showToast, hideToast } = uiSlice.actions;
export default uiSlice.reducer;
