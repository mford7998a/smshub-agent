import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Grid,
  TextField,
  Box,
  Button,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PageHeader from '../../components/common/PageHeader';
import LoadingButton from '../../components/common/LoadingButton';
import { useNotification } from '../../contexts/NotificationContext';

interface Modem {
  id: string;
  name: string;
  status: string;
}

interface SendMessageForm {
  modemId: string;
  phoneNumber: string;
  message: string;
  scheduledTime?: string;
  requestDeliveryReport: boolean;
  priority: 'low' | 'normal' | 'high';
}

const validationSchema = Yup.object({
  modemId: Yup.string().required('Modem is required'),
  phoneNumber: Yup.string()
    .required('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  message: Yup.string()
    .required('Message is required')
    .max(1600, 'Message cannot exceed 1600 characters'),
  scheduledTime: Yup.date().min(
    new Date(),
    'Scheduled time must be in the future'
  ),
  requestDeliveryReport: Yup.boolean(),
  priority: Yup.string()
    .oneOf(['low', 'normal', 'high'])
    .required('Priority is required'),
});

const SendMessagePage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [modems, setModems] = useState<Modem[]>([]);
  const [messageLength, setMessageLength] = useState(0);
  const [messageSegments, setMessageSegments] = useState(1);

  const formik = useFormik<SendMessageForm>({
    initialValues: {
      modemId: '',
      phoneNumber: '',
      message: '',
      scheduledTime: undefined,
      requestDeliveryReport: true,
      priority: 'normal',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        success('Message sent successfully');
        navigate('/messages');
      } catch (err) {
        showError(
          `Failed to send message: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`
        );
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    const fetchModems = async () => {
      try {
        const response = await fetch('/api/modems');
        const data = await response.json();
        setModems(data.items.filter((modem: Modem) => modem.status === 'active'));
      } catch (err) {
        showError('Failed to fetch modems');
      }
    };

    fetchModems();
  }, []);

  useEffect(() => {
    const length = formik.values.message.length;
    setMessageLength(length);
    
    // Calculate number of message segments
    // GSM 7-bit encoding: 160 chars per segment
    // Unicode: 70 chars per segment
    const isGSM7bit = /^[\x20-\x7E]*$/.test(formik.values.message);
    const charsPerSegment = isGSM7bit ? 160 : 70;
    const segments = Math.ceil(length / charsPerSegment);
    setMessageSegments(segments);
  }, [formik.values.message]);

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Send Message"
        subtitle="Send a new SMS message"
      />
      <Paper sx={{ p: 3 }}>
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="modemId"
                name="modemId"
                label="Modem"
                select
                value={formik.values.modemId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.modemId && Boolean(formik.errors.modemId)}
                helperText={formik.touched.modemId && formik.errors.modemId}
              >
                {modems.map((modem) => (
                  <MenuItem key={modem.id} value={modem.id}>
                    {modem.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="phoneNumber"
                name="phoneNumber"
                label="Phone Number"
                placeholder="+1234567890"
                value={formik.values.phoneNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.phoneNumber &&
                  Boolean(formik.errors.phoneNumber)
                }
                helperText={
                  formik.touched.phoneNumber && formik.errors.phoneNumber
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="message"
                name="message"
                label="Message"
                multiline
                rows={4}
                value={formik.values.message}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.message && Boolean(formik.errors.message)
                }
                helperText={
                  (formik.touched.message && formik.errors.message) ||
                  `${messageLength} characters (${messageSegments} ${
                    messageSegments === 1 ? 'message' : 'messages'
                  })`
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="scheduledTime"
                name="scheduledTime"
                label="Schedule Time (Optional)"
                type="datetime-local"
                value={formik.values.scheduledTime}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.scheduledTime &&
                  Boolean(formik.errors.scheduledTime)
                }
                helperText={
                  formik.touched.scheduledTime && formik.errors.scheduledTime
                }
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="priority"
                name="priority"
                label="Priority"
                select
                value={formik.values.priority}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.priority && Boolean(formik.errors.priority)
                }
                helperText={formik.touched.priority && formik.errors.priority}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="requestDeliveryReport"
                    name="requestDeliveryReport"
                    checked={formik.values.requestDeliveryReport}
                    onChange={formik.handleChange}
                  />
                }
                label="Request Delivery Report"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={loading}
            >
              Send Message
            </LoadingButton>
            <Button
              variant="outlined"
              onClick={() => navigate('/messages')}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default SendMessagePage; 