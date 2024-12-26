import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Link,
  Paper,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import LoadingButton from '../../components/common/LoadingButton';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [submitted, setSubmitted] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await resetPassword(values.email);
        setSubmitted(true);
      } catch (error) {
        // Error handling is done in the AuthContext
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (submitted) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: 8,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography component="h1" variant="h4" gutterBottom>
              Check Your Email
            </Typography>
            <Typography color="textSecondary" paragraph>
              We've sent password reset instructions to your email address. Please
              check your inbox and follow the instructions to reset your password.
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Didn't receive the email?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => {
                  setSubmitted(false);
                  formik.resetForm();
                }}
                underline="hover"
              >
                Try again
              </Link>
            </Typography>
            <Link
              component={RouterLink}
              to="/login"
              variant="body2"
              sx={{ mt: 2 }}
              underline="hover"
            >
              Return to login
            </Link>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 8,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Forgot Password
          </Typography>
          <Typography color="textSecondary" gutterBottom>
            Enter your email address and we'll send you instructions to reset your
            password
          </Typography>
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            noValidate
            sx={{ mt: 3, width: '100%' }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            <LoadingButton
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              loading={formik.isSubmitting}
              sx={{ mt: 3, mb: 3 }}
            >
              Reset Password
            </LoadingButton>
            <Typography variant="body2" align="center">
              Remember your password?{' '}
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                underline="hover"
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage; 