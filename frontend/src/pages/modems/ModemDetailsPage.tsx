import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  SignalCellular4Bar as SignalIcon,
  Battery90 as BatteryIcon,
  SimCard as SimCardIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingScreen from '../../components/loading/LoadingScreen';

interface ModemDetails {
  id: string;
  name: string;
  port: string;
  status: 'active' | 'offline' | 'error';
  lastSeen: string;
  messageCount: number;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: string;
  flowControl: string;
  signalStrength: number;
  batteryLevel: number;
  operator: string;
  imei: string;
  iccid: string;
  phoneNumber: string;
}

interface ModemStats {
  sentMessages: number;
  receivedMessages: number;
  failedMessages: number;
  uptime: number;
  lastError?: string;
}

const ModemDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [modem, setModem] = useState<ModemDetails | null>(null);
  const [stats, setStats] = useState<ModemStats | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchModem = async () => {
    try {
      const response = await fetch(`/api/modems/${id}`);
      if (!response.ok) throw new Error('Failed to fetch modem details');
      const data = await response.json();
      setModem(data);
    } catch (err) {
      showError('Failed to fetch modem details');
      navigate('/modems');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/modems/${id}/stats`);
      if (!response.ok) throw new Error('Failed to fetch modem statistics');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      showError('Failed to fetch modem statistics');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchModem(), fetchStats()]);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleEdit = () => {
    navigate(`/modems/${id}/edit`);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/modems/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete modem');
      success('Modem deleted successfully');
      navigate('/modems');
    } catch (err) {
      showError('Failed to delete modem');
    }
    setDeleteDialogOpen(false);
  };

  const handleStart = async () => {
    try {
      const response = await fetch(`/api/modems/${id}/start`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to start modem');
      success('Modem started successfully');
      fetchModem();
    } catch (err) {
      showError('Failed to start modem');
    }
  };

  const handleStop = async () => {
    try {
      const response = await fetch(`/api/modems/${id}/stop`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to stop modem');
      success('Modem stopped successfully');
      fetchModem();
    } catch (err) {
      showError('Failed to stop modem');
    }
  };

  const handleRefresh = () => {
    fetchModem();
    fetchStats();
  };

  if (loading || !modem) {
    return <LoadingScreen />;
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <Container maxWidth="lg">
      <PageHeader
        title={modem.name}
        subtitle="Modem Details and Statistics"
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            {modem.status === 'offline' ? (
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrowIcon />}
                onClick={handleStart}
                sx={{ mr: 1 }}
              >
                Start
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleStop}
                sx={{ mr: 1 }}
              >
                Stop
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </>
        }
      />
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <StatusChip status={modem.status} />
              </Box>
              <List disablePadding>
                <ListItem>
                  <ListItemText
                    primary="Last Seen"
                    secondary={new Date(modem.lastSeen).toLocaleString()}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Message Count"
                    secondary={modem.messageCount.toLocaleString()}
                  />
                </ListItem>
                {stats && (
                  <>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText
                        primary="Uptime"
                        secondary={formatUptime(stats.uptime)}
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hardware
              </Typography>
              <List disablePadding>
                <ListItem>
                  <ListItemText primary="Port" secondary={modem.port} />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Signal Strength"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SignalIcon
                          sx={{
                            mr: 1,
                            color: theme =>
                              modem.signalStrength > 70
                                ? theme.palette.success.main
                                : modem.signalStrength > 30
                                ? theme.palette.warning.main
                                : theme.palette.error.main,
                          }}
                        />
                        {modem.signalStrength}%
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Battery Level"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BatteryIcon
                          sx={{
                            mr: 1,
                            color: theme =>
                              modem.batteryLevel > 70
                                ? theme.palette.success.main
                                : modem.batteryLevel > 30
                                ? theme.palette.warning.main
                                : theme.palette.error.main,
                          }}
                        />
                        {modem.batteryLevel}%
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                SIM Card
              </Typography>
              <List disablePadding>
                <ListItem>
                  <ListItemText
                    primary="Operator"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SimCardIcon sx={{ mr: 1 }} />
                        {modem.operator}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary="IMEI" secondary={modem.imei} />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary="ICCID" secondary={modem.iccid} />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Phone Number"
                    secondary={modem.phoneNumber}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuration
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Baud Rate
                  </Typography>
                  <Typography variant="body1">{modem.baudRate}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Data Bits
                  </Typography>
                  <Typography variant="body1">{modem.dataBits}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Stop Bits
                  </Typography>
                  <Typography variant="body1">{modem.stopBits}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Parity
                  </Typography>
                  <Typography variant="body1">
                    {modem.parity.charAt(0).toUpperCase() + modem.parity.slice(1)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Flow Control
                  </Typography>
                  <Typography variant="body1">
                    {modem.flowControl.charAt(0).toUpperCase() +
                      modem.flowControl.slice(1)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        {stats && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Sent Messages
                    </Typography>
                    <Typography variant="body1">
                      {stats.sentMessages.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Received Messages
                    </Typography>
                    <Typography variant="body1">
                      {stats.receivedMessages.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Failed Messages
                    </Typography>
                    <Typography variant="body1">
                      {stats.failedMessages.toLocaleString()}
                    </Typography>
                  </Grid>
                  {stats.lastError && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="error">
                        Last Error
                      </Typography>
                      <Typography variant="body1">{stats.lastError}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Modem"
        message={`Are you sure you want to delete the modem "${modem.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Container>
  );
};

export default ModemDetailsPage; 