import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  transparent?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  fullScreen = true,
  transparent = false,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: fullScreen ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: transparent
          ? alpha(theme.palette.background.paper, 0.75)
          : theme.palette.background.paper,
        zIndex: theme.zIndex.modal + 1,
      }}
    >
      <CircularProgress
        size={48}
        thickness={4}
        sx={{
          color: theme.palette.primary.main,
          mb: 2,
        }}
      />
      {message && (
        <Typography
          variant="h6"
          component="div"
          sx={{
            color: theme.palette.text.secondary,
            textAlign: 'center',
            px: 3,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingScreen; 