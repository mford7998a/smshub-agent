import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Lock as LockIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const UnauthorizedPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
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
          <LockIcon
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
          sx={{ mb: 2 }}
        >
          Access Denied
        </Typography>
        <Typography
          variant="h6"
          component="h2"
          color="textSecondary"
          gutterBottom
          sx={{ mb: 4 }}
        >
          401 - Unauthorized
        </Typography>
        <Typography
          variant="body1"
          color="textSecondary"
          sx={{ maxWidth: 480, mb: 4 }}
        >
          You don't have permission to access this page. Please contact your
          administrator if you believe this is a mistake.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            size="large"
            startIcon={<ArrowBackIcon />}
          >
            Back to Home
          </Button>
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            size="large"
            startIcon={<LockIcon />}
          >
            Login
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default UnauthorizedPage; 