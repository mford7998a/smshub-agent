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
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingScreen from '../../components/loading/LoadingScreen';

interface MessageDetails {
  id: string;
  type: 'incoming' | 'outgoing';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  phoneNumber: string;
  content: string;
  timestamp: string;
  modemName: string;
  modemId: string;
  priority: 'low' | 'normal' | 'high';
  requestDeliveryReport: boolean;
  deliveryStatus?: {
    timestamp: string;
    status: string;
    errorCode?: string;
    errorMessage?: string;
  };
  scheduledTime?: string;
}

const MessageDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<MessageDetails | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchMessage = async () => {
    try {
      const response = await fetch(`/api/messages/${id}`);
      if (!response.ok) throw new Error('Failed to fetch message details');
      const data = await response.json();
      setMessage(data);
    } catch (err) {
      showError('Failed to fetch message details');
      navigate('/messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessage();
  }, [id]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete message');
      success('Message deleted successfully');
      navigate('/messages');
    } catch (err) {
      showError('Failed to delete message');
    }
    setDeleteDialogOpen(false);
  };

  const handleReply = () => {
    if (!message) return;
    navigate('/messages/new', {
      state: {
        phoneNumber: message.phoneNumber,
        modemId: message.modemId,
      },
    });
  };

  const handleRefresh = () => {
    fetchMessage();
  };

  if (loading || !message) {
    return <LoadingScreen />;
  }

  return (
    <Container maxWidth="lg">
      <PageHeader
        title={`${message.type === 'incoming' ? 'Received' : 'Sent'} Message`}
        subtitle={`Message details from ${message.phoneNumber}`}
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
            {message.type === 'incoming' && (
              <Button
                variant="contained"
                startIcon={<ReplyIcon />}
                onClick={handleReply}
                sx={{ mr: 1 }}
              >
                Reply
              </Button>
            )}
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
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Details
              </Typography>
              <List disablePadding>
                <ListItem>
                  <ListItemText
                    primary="Type"
                    secondary={
                      <Chip
                        label={message.type === 'incoming' ? 'Received' : 'Sent'}
                        color={message.type === 'incoming' ? 'info' : 'default'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={<StatusChip status={message.status} />}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Phone Number"
                    secondary={message.phoneNumber}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Modem"
                    secondary={message.modemName}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Time"
                    secondary={new Date(message.timestamp).toLocaleString()}
                  />
                </ListItem>
                {message.scheduledTime && (
                  <>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText
                        primary="Scheduled Time"
                        secondary={new Date(message.scheduledTime).toLocaleString()}
                      />
                    </ListItem>
                  </>
                )}
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Priority"
                    secondary={
                      <Chip
                        label={message.priority}
                        color={
                          message.priority === 'high'
                            ? 'error'
                            : message.priority === 'normal'
                            ? 'primary'
                            : 'default'
                        }
                        size="small"
                      />
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Content
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  minHeight: 100,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                <Typography variant="body1">{message.content}</Typography>
              </Paper>
            </CardContent>
          </Card>
          {message.type === 'outgoing' && message.requestDeliveryReport && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Delivery Report
                </Typography>
                {message.deliveryStatus ? (
                  <List disablePadding>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <StatusChip status={message.deliveryStatus.status} />
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText
                        primary="Time"
                        secondary={new Date(
                          message.deliveryStatus.timestamp
                        ).toLocaleString()}
                      />
                    </ListItem>
                    {message.deliveryStatus.errorCode && (
                      <>
                        <Divider component="li" />
                        <ListItem>
                          <ListItemText
                            primary="Error Code"
                            secondary={message.deliveryStatus.errorCode}
                          />
                        </ListItem>
                      </>
                    )}
                    {message.deliveryStatus.errorMessage && (
                      <>
                        <Divider component="li" />
                        <ListItem>
                          <ListItemText
                            primary="Error Message"
                            secondary={message.deliveryStatus.errorMessage}
                          />
                        </ListItem>
                      </>
                    )}
                  </List>
                ) : (
                  <Typography color="textSecondary">
                    No delivery report received yet
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Container>
  );
};

export default MessageDetailsPage; 