import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Grid, Card, CardContent, Typography, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  CircularProgress, Alert, Avatar, IconButton, Chip, useTheme, CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  EventNote as EventIcon,
  Celebration as HolidayIcon,
  CalendarMonth as CalendarIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { GET_EVENTS, CREATE_EVENT, DELETE_EVENT } from '../graphql/operations';
import { showToast } from '../store/slices/uiSlice';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

function EventsManagement() {
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Form states
  const [openModal, setOpenModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('EVENT');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // GraphQL Queries/Mutations
  const { loading, error, data, refetch } = useQuery(GET_EVENTS);

  const [createEventMutation, { loading: addLoading }] = useMutation(CREATE_EVENT, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Event/Holiday added successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteEventMutation] = useMutation(DELETE_EVENT, {
    onCompleted: () => {
      refetch();
      dispatch(showToast({ message: 'Event/Holiday deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearForm = () => {
    setTitle('');
    setType('EVENT');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!date) {
      setFormError('Date is required');
      return;
    }

    createEventMutation({
      variables: {
        title: title.trim(),
        type,
        date: new Date(date),
        description: description.trim() || null
      }
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this event/holiday?')) {
      deleteEventMutation({ variables: { id } });
    }
  };

  // Check if current user has add permission (Super Teachers with 'events' perm, or School Admins)
  const isSuperTeacher = user?.role === 'SUPER_TEACHER';
  const hasSchoolAdminAccess = ['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role);
  
  // Custom permissions check logic matching App.jsx
  const hasAddPermission = hasSchoolAdminAccess || (isSuperTeacher);

  const isDark = theme.palette.mode === 'dark';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading events: {error.message}</Alert>
      </Box>
    );
  }

  const events = data?.getEvents || [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Top Header Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {hasSchoolAdminAccess && (
            <IconButton onClick={() => navigate('/')} color="primary" sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <BackIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: 'text.primary' }}>
              Events & School Holidays
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Plan and view upcoming academic events and festive school holidays.
            </Typography>
          </Box>
        </Box>

        {hasAddPermission && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenModal(true)}
            sx={{
              py: 1.5,
              px: 3,
              fontWeight: 700,
              borderRadius: 3,
              boxShadow: isDark ? 'none' : '0px 4px 14px rgba(99, 102, 241, 0.4)'
            }}
          >
            Add Event / Holiday
          </Button>
        )}
      </Box>

      {events.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 4,
            border: `1px dashed ${theme.palette.divider}`,
            background: 'transparent'
          }}
        >
          <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            No Events or Holidays Scheduled
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add new academic functions, parent-teacher meets, or festive holidays.
          </Typography>
          {hasAddPermission && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}>
              Schedule First Event
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
          {events.map((event) => {
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            // Colorful styling based on type
            const isHoliday = event.type === 'HOLIDAY';
            const accentColor = isHoliday ? theme.palette.secondary.main : theme.palette.primary.main;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={event.id} component={motion.div} variants={itemVariants}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                    background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '6px',
                      height: '100%',
                      backgroundColor: accentColor
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: isDark ? '0 12px 24px -10px rgba(0,0,0,0.6)' : '0 12px 24px -10px rgba(99, 102, 241, 0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ pl: 3, pt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Chip
                        label={isHoliday ? 'Holiday' : 'School Event'}
                        size="small"
                        icon={isHoliday ? <HolidayIcon style={{ color: '#fff', fontSize: '0.9rem' }} /> : <EventIcon style={{ color: '#fff', fontSize: '0.9rem' }} />}
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.65rem',
                          backgroundColor: accentColor,
                          color: '#ffffff',
                          '.MuiChip-icon': { color: '#ffffff' }
                        }}
                      />
                      {hasAddPermission && (
                        <IconButton size="small" color="error" onClick={() => handleDelete(event.id)}>
                          <DeleteIcon sx={{ fontSize: '1.2rem' }} />
                        </IconButton>
                      )}
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, fontFamily: "'Outfit', sans-serif", pr: 2 }}>
                      {event.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
                      <CalendarIcon sx={{ fontSize: '1.1rem', color: accentColor }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {formattedDate}
                      </Typography>
                    </Box>

                    {event.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ lineBreak: 'anywhere' }}>
                        {event.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Modal Dialog for Adding Event */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            backgroundImage: 'none',
            bgcolor: isDark ? 'background.paper' : '#ffffff',
            boxShadow: '0px 20px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, pb: 1 }}>
          Create New Event / Holiday
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Event/Holiday Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Independence Day, Annual Science Fair"
              fullWidth
              required
              variant="outlined"
            />

            <TextField
              select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="EVENT">School Event / Function</MenuItem>
              <MenuItem value="HOLIDAY">Holiday / Vacation Day</MenuItem>
            </TextField>

            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />

            <TextField
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about timings, guidelines, or celebratory dress codes..."
              multiline
              rows={3}
              fullWidth
              variant="outlined"
            />
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={() => setOpenModal(false)} variant="outlined" color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={addLoading}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              {addLoading ? <CircularProgress size={24} /> : 'Save Event'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default EventsManagement;
