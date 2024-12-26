import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, SystemMetrics } from '../../services/api';

interface MetricsState {
  systemMetrics: SystemMetrics | null;
  modemStats: Record<string, any> | null;
  activationStats: Record<string, any> | null;
  smsStats: Record<string, any> | null;
  hourlyStats: Record<string, any> | null;
  errorStats: Record<string, any> | null;
  health: Record<string, any> | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MetricsState = {
  systemMetrics: null,
  modemStats: null,
  activationStats: null,
  smsStats: null,
  hourlyStats: null,
  errorStats: null,
  health: null,
  isLoading: false,
  error: null,
};

export const fetchSystemMetrics = createAsyncThunk(
  'metrics/fetchSystemMetrics',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getSystemMetrics();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch system metrics');
    }
  }
);

export const fetchHealth = createAsyncThunk(
  'metrics/fetchHealth',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getHealth();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch health status');
    }
  }
);

export const fetchModemStats = createAsyncThunk(
  'metrics/fetchModemStats',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getModemStats();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch modem statistics');
    }
  }
);

export const fetchActivationStats = createAsyncThunk(
  'metrics/fetchActivationStats',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getActivationStats();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch activation statistics');
    }
  }
);

export const fetchSMSStats = createAsyncThunk(
  'metrics/fetchSMSStats',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getSMSStats();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch SMS statistics');
    }
  }
);

export const fetchHourlyStats = createAsyncThunk(
  'metrics/fetchHourlyStats',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getHourlyStats();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch hourly statistics');
    }
  }
);

export const fetchErrorStats = createAsyncThunk(
  'metrics/fetchErrorStats',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getErrorStats();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch error statistics');
    }
  }
);

const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // System Metrics
      .addCase(fetchSystemMetrics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSystemMetrics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.systemMetrics = action.payload;
        state.error = null;
      })
      .addCase(fetchSystemMetrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Health Status
      .addCase(fetchHealth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHealth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.health = action.payload;
        state.error = null;
      })
      .addCase(fetchHealth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Modem Stats
      .addCase(fetchModemStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchModemStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.modemStats = action.payload;
        state.error = null;
      })
      .addCase(fetchModemStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Activation Stats
      .addCase(fetchActivationStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivationStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activationStats = action.payload;
        state.error = null;
      })
      .addCase(fetchActivationStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // SMS Stats
      .addCase(fetchSMSStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSMSStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.smsStats = action.payload;
        state.error = null;
      })
      .addCase(fetchSMSStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Hourly Stats
      .addCase(fetchHourlyStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHourlyStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hourlyStats = action.payload;
        state.error = null;
      })
      .addCase(fetchHourlyStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Error Stats
      .addCase(fetchErrorStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchErrorStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.errorStats = action.payload;
        state.error = null;
      })
      .addCase(fetchErrorStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = metricsSlice.actions;
export default metricsSlice.reducer; 