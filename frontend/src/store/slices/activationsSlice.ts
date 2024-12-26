import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, Activation } from '../../services/api';

interface ActivationsState {
  activations: Activation[];
  selectedActivation: Activation | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ActivationsState = {
  activations: [],
  selectedActivation: null,
  isLoading: false,
  error: null,
};

export const fetchActivations = createAsyncThunk(
  'activations/fetchActivations',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getActivations();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch activations');
    }
  }
);

export const fetchActivation = createAsyncThunk(
  'activations/fetchActivation',
  async (id: string, { rejectWithValue }) => {
    try {
      return await api.getActivation(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch activation');
    }
  }
);

export const createActivation = createAsyncThunk(
  'activations/createActivation',
  async (data: Partial<Activation>, { rejectWithValue }) => {
    try {
      return await api.createActivation(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create activation');
    }
  }
);

export const updateActivationStatus = createAsyncThunk(
  'activations/updateActivationStatus',
  async ({ id, status }: { id: string; status: number }, { rejectWithValue }) => {
    try {
      return await api.updateActivation(id, status);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update activation status');
    }
  }
);

const activationsSlice = createSlice({
  name: 'activations',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedActivation: (state) => {
      state.selectedActivation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Activations
      .addCase(fetchActivations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activations = action.payload;
        state.error = null;
      })
      .addCase(fetchActivations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Single Activation
      .addCase(fetchActivation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedActivation = action.payload;
        state.error = null;
      })
      .addCase(fetchActivation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Activation
      .addCase(createActivation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createActivation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activations.push(action.payload);
        state.error = null;
      })
      .addCase(createActivation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Activation Status
      .addCase(updateActivationStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateActivationStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.activations.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.activations[index] = action.payload;
        }
        if (state.selectedActivation?.id === action.payload.id) {
          state.selectedActivation = action.payload;
        }
        state.error = null;
      })
      .addCase(updateActivationStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSelectedActivation } = activationsSlice.actions;
export default activationsSlice.reducer; 