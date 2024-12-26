import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
  Box,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  LinearProgress,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

export interface Column<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  defaultSortBy?: keyof T | string;
  defaultSortDirection?: 'asc' | 'desc';
  onSort?: (sortBy: keyof T | string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, string>) => void;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  emptyMessage?: string;
  rowKey?: keyof T | ((row: T) => string);
  onRowClick?: (row: T) => void;
  selectedRow?: T | null;
  hover?: boolean;
}

const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  defaultSortBy,
  defaultSortDirection = 'asc',
  onSort,
  onFilter,
  page = 0,
  rowsPerPage = 10,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  emptyMessage = 'No data available',
  rowKey,
  onRowClick,
  selectedRow,
  hover = true,
}: DataTableProps<T>) => {
  const [sortBy, setSortBy] = React.useState<keyof T | string | undefined>(defaultSortBy);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(defaultSortDirection);
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    const isAsc = sortBy === column.id && sortDirection === 'asc';
    const newDirection = isAsc ? 'desc' : 'asc';
    setSortBy(column.id);
    setSortDirection(newDirection);
    onSort?.(column.id, newDirection);
  };

  const handleFilter = (columnId: string, value: string) => {
    const newFilters = { ...filters, [columnId]: value };
    if (!value) {
      delete newFilters[columnId];
    }
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    onPageChange?.(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange?.(parseInt(event.target.value, 10));
  };

  const getRowKey = (row: T): string => {
    if (!rowKey) return JSON.stringify(row);
    if (typeof rowKey === 'function') return rowKey(row);
    return String(row[rowKey]);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {loading && (
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
      )}
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {column.sortable ? (
                      <TableSortLabel
                        active={sortBy === column.id}
                        direction={sortBy === column.id ? sortDirection : 'asc'}
                        onClick={() => handleSort(column)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                    {column.filterable && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                          size="small"
                          placeholder={`Filter ${column.label}`}
                          value={filters[column.id] || ''}
                          onChange={(e) => handleFilter(String(column.id), e.target.value)}
                          InputProps={{
                            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
                            endAdornment: filters[column.id] && (
                              <IconButton
                                size="small"
                                onClick={() => handleFilter(String(column.id), '')}
                              >
                                <ClearIcon fontSize="small" />
                              </IconButton>
                            ),
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography color="textSecondary">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  hover={hover}
                  key={getRowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  selected={selectedRow === row}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((column) => {
                    const value = row[column.id as keyof T];
                    return (
                      <TableCell key={String(column.id)} align={column.align}>
                        {column.format ? column.format(value) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {onPageChange && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount || data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
    </Paper>
  );
};

export default DataTable; 