import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, BoxProps, Link, useTheme } from '@mui/material';
import { SvgIcon } from '@mui/material';

interface LogoProps extends BoxProps {
  disabledLink?: boolean;
  sx?: object;
}

const Logo: React.FC<LogoProps> = ({ disabledLink = false, sx, ...other }) => {
  const theme = useTheme();

  const logo = (
    <Box
      sx={{
        width: 40,
        height: 40,
        display: 'inline-flex',
        ...sx,
      }}
      {...other}
    >
      <SvgIcon
        viewBox="0 0 512 512"
        sx={{
          width: '100%',
          height: '100%',
          color: theme.palette.primary.main,
        }}
      >
        {/* Replace with your custom SVG path */}
        <path
          fill="currentColor"
          d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 48c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m140.204 130.267l-22.536-22.718c-4.667-4.705-12.265-4.736-16.97-.068L215.346 303.697l-59.792-60.277c-4.667-4.705-12.265-4.736-16.97-.069l-22.719 22.536c-4.705 4.667-4.736 12.265-.068 16.971l90.781 91.516c4.667 4.705 12.265 4.736 16.97.068l172.589-171.204c4.704-4.668 4.734-12.266.067-16.971z"
        />
      </SvgIcon>
    </Box>
  );

  if (disabledLink) {
    return logo;
  }

  return (
    <Link component={RouterLink} to="/" sx={{ display: 'contents' }}>
      {logo}
    </Link>
  );
};

export default Logo; 