import React, { Component, ErrorInfo } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const ErrorFallback: React.FC<{
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}> = ({ error, errorInfo, resetError }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleReport = () => {
    // Implement error reporting logic here
    const errorReport = {
      error: {
        message: error?.message,
        stack: error?.stack,
      },
      errorInfo: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    console.error('Error Report:', errorReport);
    // You can send this to your error tracking service
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 8,
        }}
      >
        <Box
          sx={{
            width: isMobile ? 80 : 120,
            height: isMobile ? 80 : 120,
            borderRadius: '50%',
            backgroundColor: theme.palette.error.main + '20',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <ErrorIcon
            sx={{
              fontSize: isMobile ? 40 : 60,
              color: theme.palette.error.main,
            }}
          />
        </Box>
        <Typography
          variant={isMobile ? 'h4' : 'h3'}
          component="h1"
          gutterBottom
          align="center"
        >
          Oops! Something went wrong
        </Typography>
        <Typography
          variant="body1"
          color="textSecondary"
          align="center"
          sx={{ maxWidth: 480, mb: 4 }}
        >
          We apologize for the inconvenience. Please try refreshing the page or
          contact support if the problem persists.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<RefreshIcon />}
            onClick={resetError}
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<BugReportIcon />}
            onClick={handleReport}
          >
            Report Problem
          </Button>
        </Box>
        {(error || errorInfo) && (
          <Paper
            sx={{
              p: 3,
              maxWidth: '100%',
              overflow: 'auto',
              bgcolor: theme.palette.grey[100],
            }}
          >
            <Typography variant="h6" gutterBottom>
              Error Details
            </Typography>
            {error && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="error">
                  {error.toString()}
                </Typography>
              </Box>
            )}
            {errorInfo && (
              <Box
                component="pre"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: theme.palette.background.paper,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                }}
              >
                <code>{errorInfo.componentStack}</code>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </Container>
  );
};

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    console.error('Uncaught error:', error, errorInfo);
  }

  public resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 