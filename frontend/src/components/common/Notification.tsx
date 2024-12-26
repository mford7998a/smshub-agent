import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export type NotificationSeverity = 'success' | 'info' | 'warning' | 'error';

export interface NotificationProps {
  open: boolean;
  message: string;
  severity?: NotificationSeverity;
  title?: string;
  autoHideDuration?: number;
  onClose: () => void;
  action?: React.ReactNode;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

const Notification: React.FC<NotificationProps> = ({
  open,
  message,
  severity = 'info',
  title,
  autoHideDuration = 6000,
  onClose,
  action,
  anchorOrigin = {
    vertical: 'bottom',
    horizontal: 'right',
  },
}) => {
  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        elevation={6}
        variant="filled"
        onClose={handleClose}
        severity={severity}
        action={
          action || (
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )
        }
        sx={{
          width: '100%',
          minWidth: 288,
          maxWidth: 400,
          boxShadow: (theme) => theme.shadows[3],
        }}
      >
        {title && (
          <AlertTitle>
            <Typography variant="subtitle2" component="span">
              {title}
            </Typography>
          </AlertTitle>
        )}
        <Box
          component="span"
          sx={{
            display: 'block',
            whiteSpace: 'pre-wrap',
          }}
        >
          {message}
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default Notification; 