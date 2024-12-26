import React from 'react';
import { Chip, ChipProps, useTheme } from '@mui/material';

export type StatusType = 'active' | 'busy' | 'error' | 'offline' | 'waiting' | 'completed' | 'cancelled' | 'refunded';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: StatusType;
  size?: 'small' | 'medium';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small', ...props }) => {
  const theme = useTheme();

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'active':
      case 'completed':
        return {
          color: theme.palette.success.main,
          backgroundColor: theme.palette.success.main + '1A',
        };
      case 'busy':
      case 'waiting':
        return {
          color: theme.palette.warning.main,
          backgroundColor: theme.palette.warning.main + '1A',
        };
      case 'error':
      case 'cancelled':
        return {
          color: theme.palette.error.main,
          backgroundColor: theme.palette.error.main + '1A',
        };
      case 'offline':
        return {
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.action.hover,
        };
      case 'refunded':
        return {
          color: theme.palette.info.main,
          backgroundColor: theme.palette.info.main + '1A',
        };
      default:
        return {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.action.hover,
        };
    }
  };

  const getStatusLabel = (status: StatusType) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const { color, backgroundColor } = getStatusColor(status);

  return (
    <Chip
      label={getStatusLabel(status)}
      size={size}
      sx={{
        color,
        backgroundColor,
        borderRadius: '4px',
        fontWeight: 600,
        '& .MuiChip-label': {
          px: 1,
        },
      }}
      {...props}
    />
  );
};

export default StatusChip; 