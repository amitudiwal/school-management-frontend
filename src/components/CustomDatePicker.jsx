import React, { useState, useEffect, useRef } from 'react';
import { TextField, Popover, Box, IconButton, Typography, Grid, useTheme, Select, MenuItem } from '@mui/material';
import { 
  ChevronLeft as LeftIcon, 
  ChevronRight as RightIcon, 
  CalendarToday as CalendarIcon 
} from '@mui/icons-material';

function CustomDatePicker({ 
  label, 
  value, 
  onChange, 
  required = false, 
  fullWidth = false,
  disabled = false,
  error = false,
  helperText = "",
  sx = {}
}) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  // Parse YYYY-MM-DD date string
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date();
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  };

  // Format value for textfield display (e.g. DD/MM/YYYY or readable date)
  const getDisplayValue = () => {
    if (!value) return '';
    const date = parseDate(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const selectedDate = parseDate(value);
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth()); // 0-11

  // Parse date typed by user in DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, or 8-digit formats
  const parseTypedDate = (str) => {
    const cleanStr = str.trim();
    if (!cleanStr) return null;

    // 1. Try DD/MM/YYYY or DD-MM-YYYY
    const dmYRegex = /^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/;
    let match = cleanStr.match(dmYRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }
    }

    // 2. Try YYYY-MM-DD or YYYY/MM/DD
    const YmdRegex = /^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})$/;
    match = cleanStr.match(YmdRegex);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }
    }

    // 3. Try DDMMYYYY (8 digits)
    const dmYDigitsRegex = /^(\d{2})(\d{2})(\d{4})$/;
    match = cleanStr.match(dmYDigitsRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }
    }

    // 4. Try YYYYMMDD (8 digits)
    const YmdDigitsRegex = /^(\d{4})(\d{2})(\d{2})$/;
    match = cleanStr.match(YmdDigitsRegex);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }
    }

    return null;
  };

  // Additional states and refs for typing support
  const [inputValue, setInputValue] = useState(getDisplayValue());
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!isTypingRef.current) {
      setInputValue(getDisplayValue());
    }
  }, [value]);

  const formatInputDate = (val) => {
    // Remove all non-digits
    const clean = val.replace(/\D/g, '');
    
    // Limit to 8 digits (DDMMYYYY)
    const limited = clean.slice(0, 8);
    
    // Format based on length
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    } else {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
    }
  };

  const handleInputChange = (e) => {
    isTypingRef.current = true;
    const rawVal = e.target.value;
    const newVal = formatInputDate(rawVal);
    setInputValue(newVal);

    const parsedDate = parseTypedDate(newVal);
    if (parsedDate) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      if (onChange) {
        onChange({
          target: {
            value: formattedDate
          }
        });
      }
    } else {
      if (onChange) {
        onChange({
          target: {
            value: ''
          }
        });
      }
    }
  };

  const handleInputBlur = () => {
    isTypingRef.current = false;
    setInputValue(getDisplayValue());
  };

  // Generate a dynamic list of years, accommodating a range suitable for dates of birth
  const currentYearNum = new Date().getFullYear();
  const minYear = Math.min(currentYearNum - 100, currentYear - 5);
  const maxYear = Math.max(currentYearNum + 10, currentYear + 5);
  const years = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  const handleOpen = (event) => {
    if (disabled) return;
    setAnchorEl(event.currentTarget);
    // Sync calendar view with current value on open
    const d = parseDate(value);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day) => {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formattedDate = `${currentYear}-${monthStr}-${dayStr}`;
    
    // Call onChange with a mock event matching standard text input changes
    if (onChange) {
      onChange({
        target: {
          value: formattedDate
        }
      });
    }
    handleClose();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const daysGrid = [];
  // Offset for first day of the week
  for (let i = 0; i < firstDay; i++) {
    daysGrid.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d);
  }

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  const isSelected = (day) => {
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentMonth && 
           selectedDate.getFullYear() === currentYear &&
           value; // only selected if there's a value
  };

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <Box>
      <TextField
        label={label}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder="DD/MM/YYYY"
        fullWidth={fullWidth}
        required={required}
        disabled={disabled}
        error={error}
        helperText={helperText}
        InputProps={{
          endAdornment: (
            <IconButton size="small" onClick={handleOpen} disabled={disabled} sx={{ color: theme.palette.primary.main }}>
              <CalendarIcon />
            </IconButton>
          ),
          style: { cursor: disabled ? 'default' : 'text' }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            cursor: disabled ? 'default' : 'text',
            '& input': {
              cursor: disabled ? 'default' : 'text',
            }
          },
          ...sx
        }}
      />
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            p: 2,
            width: 290,
            borderRadius: 4,
            mt: 1,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px #1F2937'
              : '0 10px 30px rgba(99, 102, 241, 0.08), 0 0 0 1px #E2E8F0',
            backgroundColor: theme.palette.background.paper
          }
        }}
      >
        {/* Calendar Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <IconButton size="small" onClick={handlePrevMonth}>
            <LeftIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              variant="standard"
              disableUnderline
              sx={{
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                fontSize: '0.95rem',
                cursor: 'pointer',
                color: 'text.primary',
                '& .MuiSelect-select': {
                  py: 0.5,
                  px: 0.5,
                  '&:focus': {
                    backgroundColor: 'transparent',
                  }
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1.1rem',
                  ml: -0.5,
                  color: 'text.secondary',
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 250,
                    borderRadius: 2,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px #1F2937'
                      : '0 10px 30px rgba(99, 102, 241, 0.08), 0 0 0 1px #E2E8F0',
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.15)' 
                        : 'rgba(0, 0, 0, 0.15)',
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.3)' 
                        : 'rgba(0, 0, 0, 0.25)',
                    }
                  }
                }
              }}
            >
              {months.map((m, idx) => (
                <MenuItem key={idx} value={idx} sx={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.9rem' }}>
                  {m}
                </MenuItem>
              ))}
            </Select>

            <Select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              variant="standard"
              disableUnderline
              sx={{
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                fontSize: '0.95rem',
                cursor: 'pointer',
                color: 'text.primary',
                '& .MuiSelect-select': {
                  py: 0.5,
                  px: 0.5,
                  '&:focus': {
                    backgroundColor: 'transparent',
                  }
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1.1rem',
                  ml: -0.5,
                  color: 'text.secondary',
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 250,
                    borderRadius: 2,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px #1F2937'
                      : '0 10px 30px rgba(99, 102, 241, 0.08), 0 0 0 1px #E2E8F0',
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.15)' 
                        : 'rgba(0, 0, 0, 0.15)',
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.3)' 
                        : 'rgba(0, 0, 0, 0.25)',
                    }
                  }
                }
              }}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y} sx={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.9rem' }}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <IconButton size="small" onClick={handleNextMonth}>
            <RightIcon />
          </IconButton>
        </Box>

        {/* Weekdays */}
        <Grid container spacing={0.5} sx={{ mb: 1 }}>
          {weekdays.map((day, idx) => (
            <Grid item xs={12/7} key={idx} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Days Grid */}
        <Grid container spacing={0.5}>
          {daysGrid.map((day, idx) => (
            <Grid item xs={12/7} key={idx} sx={{ display: 'flex', justifyContent: 'center' }}>
              {day ? (
                <IconButton
                  size="small"
                  onClick={() => handleSelectDay(day)}
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: '0.8rem',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: isSelected(day) || isToday(day) ? 700 : 500,
                    backgroundColor: isSelected(day) 
                      ? theme.palette.primary.main
                      : 'transparent',
                    color: isSelected(day)
                      ? '#FFFFFF'
                      : isToday(day)
                        ? theme.palette.primary.main
                        : 'text.primary',
                    border: isToday(day) && !isSelected(day) 
                      ? `1px solid ${theme.palette.primary.main}` 
                      : 'none',
                    '&:hover': {
                      backgroundColor: isSelected(day)
                        ? theme.palette.primary.dark
                        : theme.palette.mode === 'dark'
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'rgba(99, 102, 241, 0.08)',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.15s ease-in-out'
                  }}
                >
                  {day}
                </IconButton>
              ) : (
                <Box sx={{ width: 32, height: 32 }} />
              )}
            </Grid>
          ))}
        </Grid>
      </Popover>
    </Box>
  );
}

export default CustomDatePicker;
