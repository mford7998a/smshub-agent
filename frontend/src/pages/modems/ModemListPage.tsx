import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Button,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import SearchInput from '../../components/common/SearchInput';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../contexts/NotificationContext';

interface Modem {
  id: string;
  name: string;
  port: string;
  status: 'active' | 'offline' | 'error';
  lastSeen: string;
  messageCount: number;
}

const ModemListPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [modems, setModems] = useState<Modem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedModem, setSelectedModem] = useState<Modem | null>(null);

  const columns: Column<Modem>[] = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 170,
      filterable: true,
    },
    {
      id: 'port',
      label: 'Port',
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
      id: 'lastSeen',
      label: 'Last Seen',
      minWidth: 170,
      format: (value) => new Date(value).toLocaleString(),
    },
    {
      id: 'messageCount',
      label: 'Messages',
      minWidth: 100,
      align: 'right',
      format: (value) => value.toLocaleString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      align: 'right',
      format: (_, modem) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(modem);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(modem);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const fetchModems = async () => {
    try {
      setLoading(true);
      // Replace with your API call
      const response = await fetch(
        `/api/modems?page=${page + 1}&limit=${rowsPerPage}&search=${searchQuery}`
      );
      const data = await response.json();
      setModems(data.items);
      setTotalCount(data.total);
    } catch (err) {
      showError('Failed to fetch modems');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModems();
  }, [page, rowsPerPage, searchQuery]);

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
    navigate('/modems/new');
  };

  const handleEdit = (modem: Modem) => {
    navigate(`/modems/${modem.id}/edit`);
  };

  const handleDeleteClick = (modem: Modem) => {
    setSelectedModem(modem);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedModem) return;

    try {
      // Replace with your API call
      await fetch(`/api/modems/${selectedModem.id}`, {
        method: 'DELETE',
      });
      success('Modem deleted successfully');
      fetchModems();
    } catch (err) {
      showError('Failed to delete modem');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedModem(null);
    }
  };

  const handleRefresh = () => {
    fetchModems();
  };

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Modems"
        subtitle="Manage your GSM modems"
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
              Add Modem
            </Button>
          </>
        }
      />
      <Box sx={{ mb: 3 }}>
        <SearchInput
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search modems..."
          fullWidth
        />
      </Box>
      <DataTable
        columns={columns}
        data={modems}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onRowClick={(row) => navigate(`/modems/${row.id}`)}
        hover
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Modem"
        message={`Are you sure you want to delete the modem "${selectedModem?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedModem(null);
        }}
      />
    </Container>
  );
};

export default ModemListPage; 