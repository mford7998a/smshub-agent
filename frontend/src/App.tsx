import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/layout/Layout';
import theme from './theme';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage';

// Modem Pages
import ModemListPage from './pages/modems/ModemListPage';
import ModemFormPage from './pages/modems/ModemFormPage';
import ModemDetailsPage from './pages/modems/ModemDetailsPage';

// Message Pages
import MessageListPage from './pages/messages/MessageListPage';
import SendMessagePage from './pages/messages/SendMessagePage';
import MessageDetailsPage from './pages/messages/MessageDetailsPage';

// Profile Pages
import ProfilePage from './pages/profile/ProfilePage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Private Routes */}
              <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* Modem Routes */}
                <Route path="/modems" element={<ModemListPage />} />
                <Route path="/modems/new" element={<ModemFormPage />} />
                <Route path="/modems/:id" element={<ModemDetailsPage />} />
                <Route path="/modems/:id/edit" element={<ModemFormPage />} />

                {/* Message Routes */}
                <Route path="/messages" element={<MessageListPage />} />
                <Route path="/messages/new" element={<SendMessagePage />} />
                <Route path="/messages/:id" element={<MessageDetailsPage />} />

                {/* Profile Routes */}
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Catch-all Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App; 