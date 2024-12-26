import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Button,
  IconButton,
  Tooltip,
  Box,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import SearchInput from '../../components/common/SearchInput';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../contexts/NotificationContext';

interface Message {
  id: string;
  type: 'incoming' | 'outgoing';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  phoneNumber: string;
  content: string;
  timestamp: string;
  modemName: string;
  modemId: string;
}

const MessageListPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageType, setMessageType] = useState<'all' | 'incoming' | 'outgoing'>('all');

  const columns: Column<Message>[] = [
    {
      id: 'type',
      label: 'Type',
      minWidth: 100,
      align: 'center',
      format: (value) => (
        <Chip
          label={value === 'incoming' ? 'Received' : 'Sent'}
          color={value === 'incoming' ? 'info' : 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'phoneNumber',
      label: 'Phone Number',
      minWidth: 130,
      filterable: true,
    },
    {
      id: 'content',
      label: 'Message',
      minWidth: 200,
      filterable: true,
      format: (value) => value.length > 50 ? `${value.substring(0, 50)}...` : value,
    },
    {
      id: 'modemName',
      label: 'Modem',
      minWidth: 130,
      filterable: true,
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      align: 'center',
      format: (value) => <StatusChip status={value} />,
    },
    {
      id: 'timestamp',
      label: 'Time',
      minWidth: 170,
      format: (value) => new Date(value).toLocaleString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      align: 'right',
      format: (_, message) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(message);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/messages?page=${page + 1}&limit=${rowsPerPage}&search=${searchQuery}&type=${messageType}`
      );
      const data = await response.json();
      setMessages(data.items);
      setTotalCount(data.total);
    } catch (err) {
      showError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page, rowsPerPage, searchQuery, messageType]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleAdd = () => {
    navigate('/messages/new');
  };

  const handleDeleteClick = (message: Message) => {
    setSelectedMessage(message);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMessage) return;

    try {
      await fetch(`/api/messages/${selectedMessage.id}`, {
        method: 'DELETE',
      });
      success('Message deleted successfully');
      fetchMessages();
    } catch (err) {
      showError('Failed to delete message');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedMessage(null);
    }
  };

  const handleRefresh = () => {
    fetchMessages();
  };

  const handleTypeChange = (_: React.SyntheticEvent, newValue: 'all' | 'incoming' | 'outgoing') => {
    setMessageType(newValue);
    setPage(0);
  };

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Messages"
        subtitle="Manage SMS messages"
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
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Send Message
            </Button>
          </>
        }
      />
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={messageType}
          onChange={handleTypeChange}
          sx={{ mb: 2 }}
        >
          <Tab label="All Messages" value="all" />
          <Tab label="Received" value="incoming" />
          <Tab label="Sent" value="outgoing" />
        </Tabs>
        <SearchInput
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search messages..."
          fullWidth
        />
      </Box>
      <DataTable
        columns={columns}
        data={messages}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onRowClick={(row) => navigate(`/messages/${row.id}`)}
        hover
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedMessage(null);
        }}
      />
    </Container>
  );
};

export default MessageListPage; 