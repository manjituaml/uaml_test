import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isHead: false,
  isStatus: null,   // ← added
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    loginSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;

      // 🔐 role + status updates
      state.isAdmin = action.payload.isAdmin || false;
      state.isHead = action.payload.isHead || false;
      state.isStatus = action.payload.isStatus || null;
    },

    loginFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    logoutSuccess: (state) => {
      return { ...initialState }; // full reset
    },
  },
});

export const { loginStart, loginSuccess, loginFail, logoutSuccess } =
  authSlice.actions;

export default authSlice.reducer;
