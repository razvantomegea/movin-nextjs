import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteData {
  id: string;
  type: string;
  path: RoutePoint[];
  distance: number; // in kilometers
  duration: number; // in seconds
  date: string;
  calories: number;
}

interface RouteDataState {
  routes: RouteData[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RouteDataState = {
  routes: [],
  isLoading: false,
  error: null,
};

// Async thunk for saving route data
export const saveRouteData = createAsyncThunk(
  'routeData/saveRouteData',
  async (routeData: RouteData, { rejectWithValue }) => {
    try {
      // In a real app, you would save this to a database
      // For now, we'll just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return routeData;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save route data');
    }
  },
);

const routeDataSlice = createSlice({
  name: 'routeData',
  initialState,
  reducers: {
    addRoute: (state, action: PayloadAction<RouteData>) => {
      state.routes.push(action.payload);
    },
    clearRoutes: (state) => {
      state.routes = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveRouteData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveRouteData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.routes.push(action.payload);
      })
      .addCase(saveRouteData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addRoute, clearRoutes } = routeDataSlice.actions;
export default routeDataSlice.reducer;
