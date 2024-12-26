import React from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  TextFieldProps,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

interface SearchInputProps extends Omit<TextFieldProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
  clearable?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
  debounceMs = 300,
  placeholder = 'Search...',
  clearable = true,
  ...props
}) => {
  const [searchTerm, setSearchTerm] = React.useState(value);
  const debounceTimeout = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchTerm(newValue);
    onChange(newValue);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (onSearch) {
      debounceTimeout.current = setTimeout(() => {
        onSearch(newValue);
      }, debounceMs);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onSearch) {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      onSearch(searchTerm);
    }
  };

  return (
    <TextField
      value={searchTerm}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="action" />
          </InputAdornment>
        ),
        endAdornment: clearable && searchTerm ? (
          <InputAdornment position="end">
            <IconButton
              aria-label="clear search"
              onClick={handleClear}
              edge="end"
              size="small"
            >
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      {...props}
    />
  );
};

export default SearchInput; 