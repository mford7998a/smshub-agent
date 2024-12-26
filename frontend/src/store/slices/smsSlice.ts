import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, SMSMessage } from '../../services/api';

interface SMSState {
  messages: SMSMessage[];
  selectedMessage: SMSMessage | null;
  undeliveredMessages: SMSMessage[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SMSState = {
  messages: [],
  selectedMessage: null,
  undeliveredMessages: [],
  isLoading: false,
  error: null,
};

export const fetchMessages = createAsyncThunk(
  'sms/fetchMessages',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getMessages();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch messages');
    }
  }
);

export const fetchMessage = createAsyncThunk(
  'sms/fetchMessage',
  async (id: string, { rejectWithValue }) => {
    try {
      return await api.getMessage(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch message');
    }
  }
);

export const fetchUndeliveredMessages = createAsyncThunk(
  'sms/fetchUndeliveredMessages',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getUndeliveredMessages();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch undelivered messages');
    }
  }
);

const smsSlice = createSlice({
  name: 'sms',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedMessage: (state) => {
      state.selectedMessage = null;
    },
    updateMessageDeliveryStatus: (state, action) => {
      const { id, delivered, error } = action.payload;
      const message = state.messages.find((m) => m.id === id);
      if (message) {
        message.delivered = delivered;
        message.last_error = error || null;
        message.delivery_attempts += 1;
      }
      const undeliveredMessage = state.undeliveredMessages.find((m) => m.id === id);
      if (undeliveredMessage) {
        if (delivered) {
          state.undeliveredMessages = state.undeliveredMessages.filter((m) => m.id !== id);
        } else {
          undeliveredMessage.delivery_attempts += 1;
          undeliveredMessage.last_error = error || null;
        }
      }
      if (state.selectedMessage?.id === id) {
        state.selectedMessage = {
          ...state.selectedMessage,
          delivered,
          last_error: error || null,
          delivery_attempts: (state.selectedMessage.delivery_attempts || 0) + 1,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Single Message
      .addCase(fetchMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedMessage = action.payload;
        state.error = null;
      })
      .addCase(fetchMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Undelivered Messages
      .addCase(fetchUndeliveredMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUndeliveredMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.undeliveredMessages = action.payload;
        state.error = null;
      })
      .addCase(fetchUndeliveredMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSelectedMessage, updateMessageDeliveryStatus } = smsSlice.actions;
export default smsSlice.reducer; 