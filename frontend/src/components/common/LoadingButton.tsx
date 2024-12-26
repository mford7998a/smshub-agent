import React from 'react';
import {
  Button,
  ButtonProps,
  CircularProgress,
  useTheme,
} from '@mui/material';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingPosition?: 'start' | 'center' | 'end';
  loadingIndicator?: React.ReactNode;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  loading = false,
  loadingPosition = 'center',
  loadingIndicator,
  disabled,
  startIcon,
  endIcon,
  sx,
  ...props
}) => {
  const theme = useTheme();

  const defaultLoadingIndicator = (
    <CircularProgress
      size={20}
      sx={{
        color: props.variant === 'contained' ? 'inherit' : theme.palette.primary.main,
      }}
    />
  );

  const indicator = loadingIndicator || defaultLoadingIndicator;

  const getLoadingStyles = () => {
    if (!loading) return {};

    const baseStyles = {
      position: 'relative',
      '& .MuiButton-startIcon, & .MuiButton-endIcon': {
        opacity: 0,
      },
    };

    const indicatorStyles = {
      '& .loading-indicator': {
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    };

    switch (loadingPosition) {
      case 'start':
        return {
          ...baseStyles,
          ...indicatorStyles,
          '& .loading-indicator': {
            left: 14,
          },
        };
      case 'end':
        return {
          ...baseStyles,
          ...indicatorStyles,
          '& .loading-indicator': {
            right: 14,
          },
        };
      default:
        return {
          ...baseStyles,
          ...indicatorStyles,
          '& .loading-indicator': {
            left: '50%',
            transform: 'translateX(-50%)',
          },
          '& .button-text': {
            opacity: 0,
          },
        };
    }
  };

  return (
    <Button
      disabled={loading || disabled}
      startIcon={startIcon}
      endIcon={endIcon}
      sx={{
        minWidth: 88,
        position: 'relative',
        ...getLoadingStyles(),
        ...sx,
      }}
      {...props}
    >
      <span className="button-text">{children}</span>
      {loading && <span className="loading-indicator">{indicator}</span>}
    </Button>
  );
};

export default LoadingButton; 