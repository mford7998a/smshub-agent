import React from 'react';
import {
  Box,
  Breadcrumbs,
  Typography,
  Link,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  backButton?: boolean;
  onBack?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  backButton,
  onBack,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
      }}
      elevation={0}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" />}
              aria-label="breadcrumb"
              sx={{ mb: 1 }}
            >
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return item.href && !isLast ? (
                  <Link
                    key={item.label}
                    component={RouterLink}
                    to={item.href}
                    color="inherit"
                    underline="hover"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <Typography
                    key={item.label}
                    color={isLast ? 'textPrimary' : 'inherit'}
                  >
                    {item.label}
                  </Typography>
                );
              })}
            </Breadcrumbs>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom={!!subtitle}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="subtitle1" color="textSecondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        {actions && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              justifyContent: 'flex-end',
              flexShrink: 0,
            }}
          >
            {actions}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PageHeader; 