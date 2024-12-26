import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import LoadingButton from './LoadingButton';

interface FormDialogProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  disabled?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  submitButtonProps?: React.ComponentProps<typeof Button>;
  cancelButtonProps?: React.ComponentProps<typeof Button>;
  hideCancel?: boolean;
  contentProps?: React.ComponentProps<typeof DialogContent>;
}

const FormDialog: React.FC<FormDialogProps> = ({
  open,
  title,
  children,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
  loading = false,
  disabled = false,
  maxWidth = 'sm',
  fullWidth = true,
  submitButtonProps = {},
  cancelButtonProps = {},
  hideCancel = false,
  contentProps = {},
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby="form-dialog-title"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle id="form-dialog-title">
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </DialogTitle>
        <DialogContent {...contentProps}>
          <Box sx={{ mt: 2 }}>{children}</Box>
        </DialogContent>
        <DialogActions>
          {!hideCancel && (
            <Button
              onClick={onCancel}
              color="inherit"
              disabled={loading}
              {...cancelButtonProps}
            >
              {cancelLabel}
            </Button>
          )}
          <LoadingButton
            type="submit"
            color="primary"
            variant="contained"
            loading={loading}
            disabled={disabled}
            {...submitButtonProps}
          >
            {submitLabel}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FormDialog; 