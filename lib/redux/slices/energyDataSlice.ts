import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as Sentry from '@sentry/nextjs';
import { IEnergy, getEnergyEntries, insertEnergyEntry } from '@/lib/supabase/energy';

interface EnergyDataState {
  energyEntries: IEnergy[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: EnergyDataState = {
  energyEntries: [],
  isLoading: false,
  error: null,
};

// Async thunk for fetching energy entries
export const fetchEnergyData = createAsyncThunk<
  IEnergy[], // Return type
  string, // Argument (address)
  { rejectValue: string } // ThunkApiConfig
>('energyData/fetchEnergyData', async (address, { rejectWithValue }) => {
  try {
    const energyEntries = await getEnergyEntries({ address: address.toLowerCase() });
    return energyEntries;
  } catch (error) {
    Sentry.captureException(error);
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch energy data');
  }
});

// Async thunk for adding an energy entry (meal)
export const addEnergyEntry = createAsyncThunk(
  'energyData/addEnergyEntry',
  async (
    { address, energyData }: { address: string; energyData: Partial<IEnergy> },
    { rejectWithValue },
  ) => {
    try {
      if (!address) {
        throw new Error('Address is required to add energy entry');
      }
      const newEntry = await insertEnergyEntry({ address: address.toLowerCase(), energyData });
      return newEntry;
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add energy entry');
    }
  },
);

// Create the slice
const energyDataSlice = createSlice({
  name: 'energyData',
  initialState,
  reducers: {
    resetEnergyError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchEnergyData
      .addCase(fetchEnergyData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEnergyData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.energyEntries = action.payload;
      })
      .addCase(fetchEnergyData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch energy data';
      })

      // Handle addEnergyEntry
      .addCase(addEnergyEntry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addEnergyEntry.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Add the new entry to the beginning of the array
        state.energyEntries.unshift(action.payload);
      })
      .addCase(addEnergyEntry.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to add energy entry';
      });
  },
});

export const { resetEnergyError } = energyDataSlice.actions;
export default energyDataSlice.reducer;
