import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification, { NotificationSeverity } from '../components/common/Notification';

interface NotificationOptions {
  message: string;
  severity?: NotificationSeverity;
  title?: string;
  autoHideDuration?: number;
  action?: React.ReactNode;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

interface NotificationContextType {
  showNotification: (options: NotificationOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<NotificationOptions>({
    message: '',
  });

  const handleClose = () => {
    setOpen(false);
  };

  const showNotification = useCallback((newOptions: NotificationOptions) => {
    setOptions(newOptions);
    setOpen(true);
  }, []);

  const success = useCallback(
    (message: string, title?: string) => {
      showNotification({
        message,
        title,
        severity: 'success',
      });
    },
    [showNotification]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      showNotification({
        message,
        title,
        severity: 'error',
      });
    },
    [showNotification]
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      showNotification({
        message,
        title,
        severity: 'warning',
      });
    },
    [showNotification]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      showNotification({
        message,
        title,
        severity: 'info',
      });
    },
    [showNotification]
  );

  const value = {
    showNotification,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Notification
        open={open}
        onClose={handleClose}
        message={options.message}
        severity={options.severity}
        title={options.title}
        autoHideDuration={options.autoHideDuration}
        action={options.action}
        anchorOrigin={options.anchorOrigin}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 