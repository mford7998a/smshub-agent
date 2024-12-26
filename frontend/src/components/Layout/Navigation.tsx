import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Router as ModemIcon,
  Message as MessageIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Modems',
      icon: <ModemIcon />,
      path: '/modems',
    },
    {
      text: 'Messages',
      icon: <MessageIcon />,
      path: '/messages',
    },
    {
      text: 'Profile',
      icon: <ProfileIcon />,
      path: '/profile',
    },
  ];

  return (
    <List component="nav">
      {menuItems.map((item, index) => (
        <React.Fragment key={item.text}>
          {index > 0 && index % 3 === 0 && <Divider sx={{ my: 1 }} />}
          <ListItemButton
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </React.Fragment>
      ))}
    </List>
  );
};

export default Navigation; 