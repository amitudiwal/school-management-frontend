import React, { useState } from 'react';
import { TextField, Popover, Box, IconButton, Typography, Grid, useTheme } from '@mui/material';
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

  const selectedDate = parseDate(value);
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth()); // 0-11

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

  // Format value for textfield display (e.g. DD/MM/YYYY or readable date)
  const getDisplayValue = () => {
    if (!value) return '';
    const date = parseDate(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
        value={getDisplayValue()}
        onClick={handleOpen}
        fullWidth={fullWidth}
        required={required}
        disabled={disabled}
        error={error}
        helperText={helperText}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <IconButton size="small" onClick={handleOpen} disabled={disabled} sx={{ color: theme.palette.primary.main }}>
              <CalendarIcon />
            </IconButton>
          ),
          style: { cursor: disabled ? 'default' : 'pointer' }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            cursor: disabled ? 'default' : 'pointer',
            '& input': {
              cursor: disabled ? 'default' : 'pointer',
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
          <Typography sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
            {months[currentMonth]} {currentYear}
          </Typography>
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
