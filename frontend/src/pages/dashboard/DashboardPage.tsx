import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Message as MessageIcon,
  People as PeopleIcon,
  PhoneAndroid as PhoneAndroidIcon,
  ArrowForward as ArrowForwardIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardData, DashboardData } from '../../services/dashboardService';
import { formatNumber, formatCurrency, formatDuration } from '../../utils/formatters';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  onClick,
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4],
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: theme.palette.primary.main + '20',
              color: theme.palette.primary.main,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" color="textSecondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon
              sx={{
                color:
                  trend.value >= 0
                    ? theme.palette.success.main
                    : theme.palette.error.main,
                mr: 0.5,
                fontSize: '1rem',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color:
                  trend.value >= 0
                    ? theme.palette.success.main
                    : theme.palette.error.main,
              }}
            >
              {trend.value}% {trend.label}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await getDashboardData();
        setData(dashboardData);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography color="error" align="center">
          {error || 'Failed to load dashboard data'}
        </Typography>
      </Container>
    );
  }

  const stats = [
    {
      title: 'Total Messages',
      value: formatNumber(data.messages.total),
      icon: <MessageIcon />,
      trend: {
        value: Math.round(data.messages.delivery_rate * 100),
        label: 'delivery rate',
      },
      onClick: () => navigate('/messages'),
    },
    {
      title: 'Connected Devices',
      value: formatNumber(data.modems.total),
      icon: <PhoneAndroidIcon />,
      trend: {
        value: Math.round((data.modems.active / data.modems.total) * 100),
        label: 'active',
      },
      onClick: () => navigate('/modems'),
    },
    {
      title: 'Revenue (USD)',
      value: formatCurrency(data.revenue.total_usd, 'USD'),
      icon: <MoneyIcon />,
      trend: {
        value: Math.round(data.activations.success_rate * 100),
        label: 'success rate',
      },
    },
  ];

  // Generate recent activity from data
  const recentActivity = [
    {
      id: 1,
      type: 'message',
      description: `${formatNumber(data.messages.delivered)} messages delivered (${formatDuration(data.messages.avg_delivery_time)} avg)`,
      timestamp: 'Current stats',
    },
    {
      id: 2,
      type: 'device',
      description: `${formatNumber(data.modems.active)} active, ${formatNumber(data.modems.busy)} busy, ${formatNumber(data.modems.offline)} offline devices`,
      timestamp: 'Current stats',
    },
    {
      id: 3,
      type: 'activation',
      description: `${formatNumber(data.activations.completed)} completed activations (${Math.round(data.activations.success_rate * 100)}% success)`,
      timestamp: 'Total stats',
    },
  ];

  return (
    <Container maxWidth="lg">
      <PageHeader
        title={`Welcome back, ${user?.name.split(' ')[0]}`}
        subtitle={`Last updated: ${new Date(data.last_updated).toLocaleString()}`}
      />
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              {recentActivity.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={activity.description}
                      secondary={activity.timestamp}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => {
                          switch (activity.type) {
                            case 'message':
                              navigate('/messages');
                              break;
                            case 'device':
                              navigate('/modems');
                              break;
                            case 'activation':
                              navigate('/activations');
                              break;
                          }
                        }}
                      >
                        <ArrowForwardIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage; 