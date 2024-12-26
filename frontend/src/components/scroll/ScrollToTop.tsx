import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Fab, Zoom, useTheme, useScrollTrigger } from '@mui/material';
import { KeyboardArrowUp as KeyboardArrowUpIcon } from '@mui/icons-material';

interface ScrollToTopProps {
  threshold?: number;
  children?: React.ReactNode;
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({
  threshold = 100,
  children,
}) => {
  const theme = useTheme();
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold,
  });

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <Zoom in={trigger}>
      <Fab
        onClick={handleClick}
        size="small"
        aria-label="scroll back to top"
        sx={{
          position: 'fixed',
          bottom: theme.spacing(2),
          right: theme.spacing(2),
          zIndex: theme.zIndex.speedDial,
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  );
};

export const ScrollToTopOnMount: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop; 