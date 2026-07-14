import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Button, Card, CardContent, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, IconButton, Stack, Alert, Tooltip, Divider
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Schedule as ScheduleIcon, Info as InfoIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { showToast } from '../store/slices/uiSlice';
import {
  GET_SHIFTS,
  CREATE_SHIFT,
  UPDATE_SHIFT,
  DELETE_SHIFT
} from '../graphql/operations';

function ShiftManagement() {
  const dispatch = useDispatch();
  const [openModal, setOpenModal] = useState(false);
  const [formMode, setFormMode] = useState('CREATE'); // 'CREATE', 'EDIT'
  
  // Form fields
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('08:00'); // HTML5 time input format
  const [endTime, setEndTime] = useState('13:00');     // HTML5 time input format
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [shiftToDelete, setShiftToDelete] = useState(null);

  // Queries
  const { loading, error, data, refetch } = useQuery(GET_SHIFTS);

  // Mutations
  const [createShiftMutation, { loading: addLoading }] = useMutation(CREATE_SHIFT, {
    onCompleted: () => {
      dispatch(showToast({ message: 'Shift created successfully!', severity: 'success' }));
      handleCloseModal();
      refetch();
    },
    onError: (err) => {
      setFormError(err.message);
    }
  });

  const [updateShiftMutation, { loading: updateLoading }] = useMutation(UPDATE_SHIFT, {
    onCompleted: () => {
      dispatch(showToast({ message: 'Shift updated successfully!', severity: 'success' }));
      handleCloseModal();
      refetch();
    },
    onError: (err) => {
      setFormError(err.message);
    }
  });

  const [deleteShiftMutation] = useMutation(DELETE_SHIFT, {
    onCompleted: () => {
      dispatch(showToast({ message: 'Shift deleted successfully!', severity: 'success' }));
      setShiftToDelete(null);
      refetch();
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message || 'Error deleting shift', severity: 'error' }));
      setShiftToDelete(null);
    }
  });

  // Convert "HH:MM" (HTML5) to "HH:MM AM/PM" or vice versa if needed
  // Let's store & present it in standard readable time format
  const formatTimeTo12Hour = (time24) => {
    if (!time24) return '';
    // If it is already in 12hr format
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    
    const [hrs, mins] = time24.split(':');
    const hours = parseInt(hrs, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${mins} ${ampm}`;
  };

  const convert12HourTo24Hour = (time12) => {
    if (!time12) return '08:00';
    if (!time12.includes('AM') && !time12.includes('PM')) return time12;
    
    const [time, modifier] = time12.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleOpenCreateModal = () => {
    setFormMode('CREATE');
    setShiftName('');
    setStartTime('08:00');
    setEndTime('13:00');
    setDescription('');
    setFormError('');
    setOpenModal(true);
  };

  const handleOpenEditModal = (shift) => {
    setFormMode('EDIT');
    setSelectedShiftId(shift.id);
    setShiftName(shift.name);
    setStartTime(convert12HourTo24Hour(shift.startTime));
    setEndTime(convert12HourTo24Hour(shift.endTime));
    setDescription(shift.description || '');
    setFormError('');
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedShiftId(null);
    setShiftName('');
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!shiftName.trim()) {
      setFormError('Shift name is required.');
      return;
    }
    
    const formattedStart = formatTimeTo12Hour(startTime);
    const formattedEnd = formatTimeTo12Hour(endTime);

    if (formMode === 'CREATE') {
      createShiftMutation({
        variables: {
          name: shiftName,
          startTime: formattedStart,
          endTime: formattedEnd,
          description
        }
      });
    } else {
      updateShiftMutation({
        variables: {
          id: selectedShiftId,
          name: shiftName,
          startTime: formattedStart,
          endTime: formattedEnd,
          description
        }
      });
    }
  };

  const handleDelete = () => {
    if (shiftToDelete) {
      deleteShiftMutation({
        variables: { id: shiftToDelete.id }
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const shifts = data?.getShifts || [];

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
            Shift Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure school sessions, shifts, and control lesson and class timings.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateModal}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)'
          }}
        >
          Create New Shift
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Shifts Table */}
        <Grid item xs={12} md={8}>
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)' }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Shift Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Start Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>End Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No shifts created yet.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  shifts.map((shift) => (
                    <TableRow key={shift.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{shift.name}</TableCell>
                      <TableCell>{shift.startTime}</TableCell>
                      <TableCell>{shift.endTime}</TableCell>
                      <TableCell>{shift.description || '-'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit Shift">
                            <IconButton color="primary" onClick={() => handleOpenEditModal(shift)} size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Shift">
                            <IconButton color="error" onClick={() => setShiftToDelete(shift)} size="small">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Visual Timeline / Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)', height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <ScheduleIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Shifts Overview
                </Typography>
              </Stack>
              <Divider sx={{ mb: 3 }} />
              
              {shifts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Configure shifts to visualize daily school schedules.
                </Typography>
              ) : (
                <Stack spacing={3}>
                  {shifts.map((shift, idx) => (
                    <Box key={shift.id} sx={{ p: 2, borderRadius: 2, bgcolor: idx % 2 === 0 ? 'primary.soft' : 'secondary.soft', borderLeft: `4px solid ${idx % 2 === 0 ? '#6366F1' : '#EC4899'}` }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {shift.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        🕒 {shift.startTime} - {shift.endTime}
                      </Typography>
                      {shift.description && (
                        <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                          {shift.description}
                        </Typography>
                      )}
                    </Box>
                  ))}
                  
                  <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <InfoIcon color="info" fontSize="small" sx={{ mt: 0.3 }} />
                    <Typography variant="caption" color="text.secondary">
                      Once shifts are configured, you can assign them to specific sections on the Class Management screen. This allows separate timetables and schedules to run simultaneously.
                    </Typography>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add / Edit Dialog */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {formMode === 'CREATE' ? 'Create New Shift' : 'Edit Shift'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Stack spacing={3}>
              <TextField
                label="Shift Name"
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                placeholder="e.g. Morning Shift"
                fullWidth
                required
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
              </Stack>

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Morning batch for elementary school students"
                multiline
                rows={3}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseModal} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={addLoading || updateLoading}
              sx={{
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
              }}
            >
              {formMode === 'CREATE' ? 'Create' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(shiftToDelete)} onClose={() => setShiftToDelete(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the shift <strong>{shiftToDelete?.name}</strong>?
            This might affect sections assigned to this shift.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setShiftToDelete(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ShiftManagement;
