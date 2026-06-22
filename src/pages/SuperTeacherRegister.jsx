import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Grid, MenuItem, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, IconButton, Avatar, InputAdornment,
  TablePagination
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import {
  GET_TEACHERS, REGISTER_TEACHER, UPDATE_TEACHER, DELETE_TEACHER
} from '../graphql/operations';
import CustomDatePicker from '../components/CustomDatePicker';
import { BACKEND_URL } from '../graphql/client';

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  return `${BACKEND_URL}${avatarPath}`;
};

function SuperTeacherRegister() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);

  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [designation, setDesignation] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState({});
  
  // Image Upload States
  const { token } = useSelector((state) => state.auth);
  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const result = await response.json();
      if (response.ok) {
        setAvatar(result.url);
        dispatch(showToast({ message: 'Image uploaded successfully!', severity: 'success' }));
      } else {
        dispatch(showToast({ message: result.error || 'Upload failed', severity: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(showToast({ message: 'Error uploading image', severity: 'error' }));
    } finally {
      setUploading(false);
    }
  };

  // Query teachers
  const { loading, error, data, refetch } = useQuery(GET_TEACHERS);

  // Super Teachers List (filtered client-side)
  const superTeachers = data?.getTeachers?.filter(t => t.userId?.role === 'SUPER_TEACHER') || [];

  // Mutations
  const [registerTeacher, { loading: addLoading }] = useMutation(REGISTER_TEACHER, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Super Teacher registered successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateTeacher, { loading: updateLoading }] = useMutation(UPDATE_TEACHER, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Super Teacher updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteTeacher, { loading: deleteLoading }] = useMutation(DELETE_TEACHER, {
    onCompleted: () => {
      setTeacherToDelete(null);
      refetch();
      dispatch(showToast({ message: 'Super Teacher deleted successfully!', severity: 'success' }));
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
    setDob('');
    setPhone('');
    setQualification('');
    setDesignation('');
    setPassword('');
    setFormError('');
    setErrors({});
    setSelectedTeacher(null);
    setAvatar('');
    setShowPassword(false);
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFirstName(teacher.firstName);
    setLastName(teacher.lastName);
    setEmail(teacher.email);
    setGender(teacher.gender || 'MALE');
    setDob(teacher.dateOfBirth ? teacher.dateOfBirth.split('T')[0] : '');
    setPhone(teacher.phone);
    setQualification(teacher.qualification);
    setDesignation(teacher.designation || '');
    setPassword('dummy_pass');
    setAvatar(teacher.userId?.avatar || '');
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

    if (!dob) newErrors.dob = 'Date of Birth is required.';

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(phone.trim())) {
      newErrors.phone = 'Phone number must be exactly 10 digits.';
    }

    if (!qualification.trim()) newErrors.qualification = 'Qualification is required.';

    if (!selectedTeacher && !password) {
      newErrors.password = 'Password is required for registration.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (selectedTeacher) {
      updateTeacher({
        variables: {
          id: selectedTeacher.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          gender,
          dateOfBirth: dob,
          phone: phone.trim(),
          qualification: qualification.trim(),
          designation: designation.trim()
        }
      });
    } else {
      registerTeacher({
        variables: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          gender,
          dateOfBirth: dob,
          phone: phone.trim(),
          qualification: qualification.trim(),
          designation: designation.trim(),
          password,
          avatar,
          role: 'SUPER_TEACHER'
        }
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!teacherToDelete) return;
    deleteTeacher({ variables: { id: teacherToDelete.id } });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Super Teacher Registration
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => { clearForm(); setOpenModal(true); }}
          sx={{ width: { xs: '100%', sm: 'auto' }, background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF' }}
        >
          Register Super Teacher
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
                  <TableCell sx={{ fontWeight: 700 }} width="80px">Photo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Super Teacher Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Qualification</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {superTeachers
                  .slice(page * 10, (page + 1) * 10)
                  .map((teacher) => (
                    <TableRow key={teacher.id} hover>
                      <TableCell>
                        <Avatar src={getAvatarUrl(teacher.userId?.avatar)} sx={{ width: 44, height: 44, border: '1px solid', borderColor: 'divider' }}>
                          {teacher.firstName?.charAt(0) || ''}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{`${teacher.firstName} ${teacher.lastName}`}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.phone}</TableCell>
                      <TableCell>{teacher.qualification}</TableCell>
                      <TableCell>{teacher.designation || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleEdit(teacher)}><EditIcon /></IconButton>
                        <IconButton color="error" onClick={() => setTeacherToDelete(teacher)}><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                {superTeachers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No Super Teachers registered yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {superTeachers.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10]}
              component="div"
              count={superTeachers.length}
              rowsPerPage={10}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
            />
          )}
        </>
      )}

      {/* Register/Update Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedTeacher ? 'Update Super Teacher Profile' : 'Register Super Teacher'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar src={getAvatarUrl(avatar)} sx={{ width: 64, height: 64 }}>
                  {firstName?.charAt(0) || ''}
                </Avatar>
                <Button variant="outlined" component="label" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                  <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </Button>
              </Grid>
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
                <CustomDatePicker 
                  fullWidth 
                  required 
                  label="Date of Birth" 
                  value={dob} 
                  onChange={(e) => {
                    setDob(e.target.value);
                    if (errors.dob) setErrors(prev => ({ ...prev, dob: '' }));
                  }} 
                  error={Boolean(errors.dob)}
                  helperText={errors.dob}
                />
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
                  label="Qualification" 
                  value={qualification} 
                  onChange={(e) => {
                    setQualification(e.target.value);
                    if (errors.qualification) setErrors(prev => ({ ...prev, qualification: '' }));
                  }} 
                  error={Boolean(errors.qualification)}
                  helperText={errors.qualification}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
              </Grid>
              {!selectedTeacher && (
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    required={!selectedTeacher} 
                    type={showPassword ? 'text' : 'password'} 
                    label="Super Teacher Password" 
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
            <Button type="submit" variant="contained" disabled={addLoading || updateLoading}>
              {addLoading || updateLoading ? 'Saving...' : selectedTeacher ? 'Update Super Teacher' : 'Add Super Teacher'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(teacherToDelete)} onClose={() => setTeacherToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Super Teacher</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete Super Teacher "{teacherToDelete ? `${teacherToDelete.firstName} ${teacherToDelete.lastName}` : ''}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setTeacherToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SuperTeacherRegister;
