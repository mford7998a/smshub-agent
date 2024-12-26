import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Box,
  Button,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PageHeader from '../../components/common/PageHeader';
import LoadingButton from '../../components/common/LoadingButton';
import { useNotification } from '../../contexts/NotificationContext';

interface ModemFormData {
  name: string;
  port: string;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: string;
  flowControl: string;
}

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  port: Yup.string().required('Port is required'),
  baudRate: Yup.number()
    .required('Baud rate is required')
    .positive('Baud rate must be positive'),
  dataBits: Yup.number()
    .required('Data bits is required')
    .oneOf([5, 6, 7, 8], 'Invalid data bits value'),
  stopBits: Yup.number()
    .required('Stop bits is required')
    .oneOf([1, 1.5, 2], 'Invalid stop bits value'),
  parity: Yup.string()
    .required('Parity is required')
    .oneOf(['none', 'even', 'odd', 'mark', 'space'], 'Invalid parity value'),
  flowControl: Yup.string()
    .required('Flow control is required')
    .oneOf(['none', 'hardware', 'software'], 'Invalid flow control value'),
});

const baudRates = [
  300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400, 57600, 115200,
];

const dataBits = [5, 6, 7, 8];
const stopBits = [1, 1.5, 2];
const parityOptions = [
  { value: 'none', label: 'None' },
  { value: 'even', label: 'Even' },
  { value: 'odd', label: 'Odd' },
  { value: 'mark', label: 'Mark' },
  { value: 'space', label: 'Space' },
];
const flowControlOptions = [
  { value: 'none', label: 'None' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
];

const ModemFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const isEditMode = Boolean(id);

  const formik = useFormik<ModemFormData>({
    initialValues: {
      name: '',
      port: '',
      baudRate: 115200,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      flowControl: 'none',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const url = isEditMode ? `/api/modems/${id}` : '/api/modems';
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          throw new Error('Failed to save modem');
        }

        success(`Modem ${isEditMode ? 'updated' : 'created'} successfully`);
        navigate('/modems');
      } catch (err) {
        showError(
          `Failed to ${isEditMode ? 'update' : 'create'} modem: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`
        );
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    const fetchPorts = async () => {
      try {
        const response = await fetch('/api/modems/ports');
        const data = await response.json();
        setAvailablePorts(data);
      } catch (err) {
        showError('Failed to fetch available ports');
      }
    };

    const fetchModem = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/modems/${id}`);
        const data = await response.json();
        formik.setValues(data);
      } catch (err) {
        showError('Failed to fetch modem details');
        navigate('/modems');
      } finally {
        setLoading(false);
      }
    };

    fetchPorts();
    if (isEditMode) {
      fetchModem();
    }
  }, [id]);

  return (
    <Container maxWidth="lg">
      <PageHeader
        title={isEditMode ? 'Edit Modem' : 'Add Modem'}
        subtitle={
          isEditMode
            ? 'Update modem configuration'
            : 'Configure a new GSM modem connection'
        }
      />
      <Paper sx={{ p: 3 }}>
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Modem Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="port"
                name="port"
                label="Port"
                select
                value={formik.values.port}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.port && Boolean(formik.errors.port)}
                helperText={formik.touched.port && formik.errors.port}
              >
                {availablePorts.map((port) => (
                  <MenuItem key={port} value={port}>
                    {port}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="baudRate"
                name="baudRate"
                label="Baud Rate"
                select
                value={formik.values.baudRate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.baudRate && Boolean(formik.errors.baudRate)}
                helperText={formik.touched.baudRate && formik.errors.baudRate}
              >
                {baudRates.map((rate) => (
                  <MenuItem key={rate} value={rate}>
                    {rate}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="dataBits"
                name="dataBits"
                label="Data Bits"
                select
                value={formik.values.dataBits}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.dataBits && Boolean(formik.errors.dataBits)}
                helperText={formik.touched.dataBits && formik.errors.dataBits}
              >
                {dataBits.map((bits) => (
                  <MenuItem key={bits} value={bits}>
                    {bits}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="stopBits"
                name="stopBits"
                label="Stop Bits"
                select
                value={formik.values.stopBits}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.stopBits && Boolean(formik.errors.stopBits)}
                helperText={formik.touched.stopBits && formik.errors.stopBits}
              >
                {stopBits.map((bits) => (
                  <MenuItem key={bits} value={bits}>
                    {bits}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="parity"
                name="parity"
                label="Parity"
                select
                value={formik.values.parity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.parity && Boolean(formik.errors.parity)}
                helperText={formik.touched.parity && formik.errors.parity}
              >
                {parityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="flowControl"
                name="flowControl"
                label="Flow Control"
                select
                value={formik.values.flowControl}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.flowControl &&
                  Boolean(formik.errors.flowControl)
                }
                helperText={
                  formik.touched.flowControl && formik.errors.flowControl
                }
              >
                {flowControlOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={loading}
            >
              {isEditMode ? 'Update' : 'Create'}
            </LoadingButton>
            <Button
              variant="outlined"
              onClick={() => navigate('/modems')}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ModemFormPage; 