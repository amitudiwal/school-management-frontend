import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Grid, MenuItem, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, IconButton, TablePagination, InputAdornment
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import {
  GET_STAFF, REGISTER_STAFF, UPDATE_STAFF, DELETE_STAFF
} from '../graphql/operations';

function AccountantRegister() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);

  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('MALE');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('School Accountant');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Query staff members
  const { loading, error, data, refetch } = useQuery(GET_STAFF);

  // Accountants List (filtered client-side: department is FINANCE or user role is ACCOUNTANT)
  const accountants = data?.getStaff?.filter(s => s.department === 'FINANCE' || s.userId?.role === 'ACCOUNTANT') || [];

  // Mutations
  const [registerStaff, { loading: addLoading }] = useMutation(REGISTER_STAFF, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Accountant registered successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateStaff, { loading: updateLoading }] = useMutation(UPDATE_STAFF, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Accountant profile updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteStaff, { loading: deleteLoading }] = useMutation(DELETE_STAFF, {
    onCompleted: () => {
      setStaffToDelete(null);
      refetch();
      dispatch(showToast({ message: 'Accountant profile deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setGender('MALE');
    setPhone('');
    setDesignation('School Accountant');
    setPassword('');
    setFormError('');
    setErrors({});
    setSelectedStaff(null);
    setShowPassword(false);
  };

  const handleEdit = (staff) => {
    setSelectedStaff(staff);
    setFirstName(staff.firstName);
    setLastName(staff.lastName);
    setEmail(staff.email);
    setGender(staff.gender || 'MALE');
    setPhone(staff.phone);
    setDesignation(staff.designation || 'School Accountant');
    setPassword('dummy_pass');
    setOpenModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setErrors({});

    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = 'First Name is required.';
    if (!lastName.trim()) newErrors.lastName = 'Last Name is required.';

    if (!email.trim()) {
      newErrors.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(phone.trim())) {
      newErrors.phone = 'Phone number must be exactly 10 digits.';
    }

    if (!designation.trim()) newErrors.designation = 'Designation is required.';

    if (!selectedStaff && !password) {
      newErrors.password = 'Password is required for registration.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (selectedStaff) {
      updateStaff({
        variables: {
          id: selectedStaff.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          gender,
          phone: phone.trim(),
          department: 'FINANCE',
          designation: designation.trim()
        }
      });
    } else {
      registerStaff({
        variables: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          gender,
          phone: phone.trim(),
          department: 'FINANCE',
          designation: designation.trim(),
          password
        }
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!staffToDelete) return;
    deleteStaff({ variables: { id: staffToDelete.id } });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          School Accountant Registration
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { clearForm(); setOpenModal(true); }}
          sx={{ width: { xs: '100%', sm: 'auto' }, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF' }}
        >
          Register Accountant
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 2 }}>
            <Table sx={{ minWidth: 760 }}>
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Accountant Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Phone No.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accountants
                  .slice(page * 10, (page + 1) * 10)
                  .map((staff) => (
                    <TableRow key={staff.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{`${staff.firstName} ${staff.lastName}`}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>{staff.phone}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{staff.department.toLowerCase()}</TableCell>
                      <TableCell>{staff.designation}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleEdit(staff)}><EditIcon /></IconButton>
                        <IconButton color="error" onClick={() => setStaffToDelete(staff)}><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                {accountants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No School Accountants registered yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {accountants.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10]}
              component="div"
              count={accountants.length}
              rowsPerPage={10}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
            />
          )}
        </>
      )}

      {/* Register/Update Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedStaff ? 'Update Accountant Profile' : 'Register School Accountant'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="First Name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
                  }}
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
                  }}
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Email Address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required select label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Phone"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  error={Boolean(errors.phone)}
                  helperText={errors.phone}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Designation"
                  value={designation}
                  onChange={(e) => {
                    setDesignation(e.target.value);
                    if (errors.designation) setErrors(prev => ({ ...prev, designation: '' }));
                  }}
                  error={Boolean(errors.designation)}
                  helperText={errors.designation}
                />
              </Grid>
              {!selectedStaff && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required={!selectedStaff}
                    type={showPassword ? 'text' : 'password'}
                    label="Accountant Login Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    error={Boolean(errors.password)}
                    helperText={errors.password}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Button onClick={() => setOpenModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={addLoading || updateLoading}>
              {addLoading || updateLoading ? 'Saving...' : selectedStaff ? 'Update Accountant' : 'Add Accountant'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(staffToDelete)} onClose={() => setStaffToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Accountant</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete Accountant "{staffToDelete ? `${staffToDelete.firstName} ${staffToDelete.lastName}` : ''}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setStaffToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AccountantRegister;
