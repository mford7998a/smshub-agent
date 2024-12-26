import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, Modem, ModemWithStats } from '../../services/api';

interface ModemsState {
  modems: Modem[];
  selectedModem: ModemWithStats | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ModemsState = {
  modems: [],
  selectedModem: null,
  isLoading: false,
  error: null,
};

export const fetchModems = createAsyncThunk(
  'modems/fetchModems',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getModems();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch modems');
    }
  }
);

export const fetchModem = createAsyncThunk(
  'modems/fetchModem',
  async (id: number, { rejectWithValue }) => {
    try {
      return await api.getModem(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch modem');
    }
  }
);

export const createModem = createAsyncThunk(
  'modems/createModem',
  async (data: Partial<Modem>, { rejectWithValue }) => {
    try {
      return await api.createModem(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create modem');
    }
  }
);

export const updateModem = createAsyncThunk(
  'modems/updateModem',
  async ({ id, data }: { id: number; data: Partial<Modem> }, { rejectWithValue }) => {
    try {
      return await api.updateModem(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update modem');
    }
  }
);

export const deleteModem = createAsyncThunk(
  'modems/deleteModem',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.deleteModem(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete modem');
    }
  }
);

export const connectModem = createAsyncThunk(
  'modems/connectModem',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.connectModem(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to connect modem');
    }
  }
);

export const disconnectModem = createAsyncThunk(
  'modems/disconnectModem',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.disconnectModem(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to disconnect modem');
    }
  }
);

const modemsSlice = createSlice({
  name: 'modems',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedModem: (state) => {
      state.selectedModem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Modems
      .addCase(fetchModems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchModems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.modems = action.payload;
        state.error = null;
      })
      .addCase(fetchModems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Single Modem
      .addCase(fetchModem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchModem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedModem = action.payload;
        state.error = null;
      })
      .addCase(fetchModem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Modem
      .addCase(createModem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createModem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.modems.push(action.payload);
        state.error = null;
      })
      .addCase(createModem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Modem
      .addCase(updateModem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateModem.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.modems.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) {
          state.modems[index] = action.payload;
        }
        if (state.selectedModem?.id === action.payload.id) {
          state.selectedModem = { ...state.selectedModem, ...action.payload };
        }
        state.error = null;
      })
      .addCase(updateModem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Modem
      .addCase(deleteModem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteModem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.modems = state.modems.filter((m) => m.id !== action.payload);
        if (state.selectedModem?.id === action.payload) {
          state.selectedModem = null;
        }
        state.error = null;
      })
      .addCase(deleteModem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Connect Modem
      .addCase(connectModem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(connectModem.fulfilled, (state, action) => {
        state.isLoading = false;
        const modem = state.modems.find((m) => m.id === action.payload);
        if (modem) {
          modem.status = 'active';
        }
        if (state.selectedModem?.id === action.payload) {
          state.selectedModem.status = 'active';
        }
        state.error = null;
      })
      .addCase(connectModem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Disconnect Modem
      .addCase(disconnectModem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(disconnectModem.fulfilled, (state, action) => {
        state.isLoading = false;
        const modem = state.modems.find((m) => m.id === action.payload);
        if (modem) {
          modem.status = 'offline';
        }
        if (state.selectedModem?.id === action.payload) {
          state.selectedModem.status = 'offline';
        }
        state.error = null;
      })
      .addCase(disconnectModem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSelectedModem } = modemsSlice.actions;
export default modemsSlice.reducer; 