import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Grid, MenuItem, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, IconButton, Tabs, Tab, Avatar, InputAdornment,
  TablePagination
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import {
  GET_TEACHERS, REGISTER_TEACHER, UPDATE_TEACHER, DELETE_TEACHER,
  GET_STAFF, REGISTER_STAFF, UPDATE_STAFF, DELETE_STAFF
} from '../graphql/operations';
import CustomDatePicker from '../components/CustomDatePicker';
import { BACKEND_URL } from '../graphql/client';

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  return `${BACKEND_URL}${avatarPath}`;
};

function TeacherList() {
  const dispatch = useDispatch();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state && typeof location.state.activeTab === 'number') {
      return location.state.activeTab;
    }
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'staff' || tabParam === '1') {
      return 1;
    }
    return 0;
  });
  const [pageTeachers, setPageTeachers] = useState(0);
  const [pageStaff, setPageStaff] = useState(0);

  // Teacher states
  const [openTeacherModal, setOpenTeacherModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  // Staff states
  const [openStaffModal, setOpenStaffModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);

  // Common/Teacher Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [designation, setDesignation] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('HR');
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

  // Queries
  const { loading: teachersLoading, error: teachersError, data: teachersData, refetch: refetchTeachers } = useQuery(GET_TEACHERS);
  const { loading: staffLoading, error: staffError, data: staffData, refetch: refetchStaff } = useQuery(GET_STAFF);

  const filteredTeachers = (teachersData?.getTeachers || []).filter(t => t.userId?.role !== 'SUPER_TEACHER');

  // Teacher Mutations
  const [registerTeacher, { loading: addTeacherLoading }] = useMutation(REGISTER_TEACHER, {
    onCompleted: () => {
      setOpenTeacherModal(false);
      clearTeacherForm();
      refetchTeachers();
      dispatch(showToast({ message: 'Teacher registered successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateTeacher, { loading: updateTeacherLoading }] = useMutation(UPDATE_TEACHER, {
    onCompleted: () => {
      setOpenTeacherModal(false);
      clearTeacherForm();
      refetchTeachers();
      dispatch(showToast({ message: 'Teacher updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteTeacher, { loading: deleteTeacherLoading }] = useMutation(DELETE_TEACHER, {
    onCompleted: () => {
      setTeacherToDelete(null);
      refetchTeachers();
      dispatch(showToast({ message: 'Teacher deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  // Staff Mutations
  const [registerStaff, { loading: addStaffLoading }] = useMutation(REGISTER_STAFF, {
    onCompleted: () => {
      setOpenStaffModal(false);
      clearStaffForm();
      refetchStaff();
      dispatch(showToast({ message: 'Staff member registered successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateStaff, { loading: updateStaffLoading }] = useMutation(UPDATE_STAFF, {
    onCompleted: () => {
      setOpenStaffModal(false);
      clearStaffForm();
      refetchStaff();
      dispatch(showToast({ message: 'Staff member updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteStaff, { loading: deleteStaffLoading }] = useMutation(DELETE_STAFF, {
    onCompleted: () => {
      setStaffToDelete(null);
      refetchStaff();
      dispatch(showToast({ message: 'Staff member deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearTeacherForm = () => {
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

  const clearStaffForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setGender('MALE');
    setPhone('');
    setDepartment('HR');
    setDesignation('');
    setFormError('');
    setErrors({});
    setSelectedStaff(null);
  };

  const handleTeacherEdit = (teacher) => {
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
    setFormError('');
    setErrors({});
    setOpenTeacherModal(true);
  };

  const handleStaffEdit = (staff) => {
    setSelectedStaff(staff);
    setFirstName(staff.firstName);
    setLastName(staff.lastName);
    setEmail(staff.email);
    setGender(staff.gender || 'MALE');
    setPhone(staff.phone);
    setDepartment(staff.department || 'HR');
    setDesignation(staff.designation || '');
    setFormError('');
    setErrors({});
    setOpenStaffModal(true);
  };

  const handleTeacherSubmit = (e) => {
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
      setFormError('Please correct the highlighted errors before submitting.');
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
          avatar
        }
      });
    }
  };

  const handleStaffSubmit = (e) => {
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

    if (!department) newErrors.department = 'Department is required.';
    if (!designation.trim()) newErrors.designation = 'Designation is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError('Please correct the highlighted errors before submitting.');
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
          department,
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
          department,
          designation: designation.trim()
        }
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Directory Management
        </Typography>
        {activeTab === 0 ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { clearTeacherForm(); setOpenTeacherModal(true); }}
            sx={{ width: { xs: '100%', sm: 'auto' }, background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF' }}
          >
            Register Faculty
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { clearStaffForm(); setOpenStaffModal(true); }}
            sx={{ width: { xs: '100%', sm: 'auto' }, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF' }}
          >
            Register Staff Member
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newVal) => setActiveTab(newVal)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Teachers / Faculty" sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif" }} />
          <Tab label="General Staff" sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif" }} />
        </Tabs>
      </Paper>

      {activeTab === 0 ? (
        // --- TEACHERS TABLE ---
        teachersLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
        ) : teachersError ? (
          <Alert severity="error">{teachersError.message}</Alert>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 2 }}>
              <Table sx={{ minWidth: 760 }}>
                <TableHead sx={{ backgroundColor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }} width="80px">Photo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Teacher Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Qualification</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTeachers
                    .slice(pageTeachers * 10, (pageTeachers + 1) * 10)
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
                          <IconButton color="primary" onClick={() => handleTeacherEdit(teacher)}><EditIcon /></IconButton>
                          <IconButton color="error" onClick={() => setTeacherToDelete(teacher)}><DeleteIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredTeachers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {filteredTeachers.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[10]}
                component="div"
                count={filteredTeachers.length}
                rowsPerPage={10}
                page={pageTeachers}
                onPageChange={(e, newPage) => setPageTeachers(newPage)}
              />
            )}
          </>
        )
      ) : (
        // --- GENERAL STAFF TABLE ---
        staffLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
        ) : staffError ? (
          <Alert severity="error">{staffError.message}</Alert>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 2 }}>
              <Table sx={{ minWidth: 760 }}>
                <TableHead sx={{ backgroundColor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Staff Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(staffData?.getStaff || [])
                    .slice(pageStaff * 10, (pageStaff + 1) * 10)
                    .map((staff) => (
                      <TableRow key={staff.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{`${staff.firstName} ${staff.lastName}`}</TableCell>
                        <TableCell>{staff.email}</TableCell>
                        <TableCell>{staff.phone}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{staff.department.toLowerCase()}</TableCell>
                        <TableCell>{staff.designation}</TableCell>
                        <TableCell align="right">
                          <IconButton color="primary" onClick={() => handleStaffEdit(staff)}><EditIcon /></IconButton>
                          <IconButton color="error" onClick={() => setStaffToDelete(staff)}><DeleteIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  {(!staffData?.getStaff || staffData.getStaff.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {staffData?.getStaff?.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[10]}
                component="div"
                count={staffData.getStaff.length}
                rowsPerPage={10}
                page={pageStaff}
                onPageChange={(e, newPage) => setPageStaff(newPage)}
              />
            )}
          </>
        )
      )}

      {/* --- TEACHER DIALOG --- */}
      <Dialog open={openTeacherModal} onClose={() => setOpenTeacherModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedTeacher ? 'Update Teacher Profile' : 'Register Teacher'}</DialogTitle>
        <form onSubmit={handleTeacherSubmit}>
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
                    label="Teacher Login Password"
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
            <Button onClick={() => setOpenTeacherModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addTeacherLoading || updateTeacherLoading}>
              {addTeacherLoading || updateTeacherLoading ? 'Saving...' : selectedTeacher ? 'Update Teacher' : 'Add Teacher'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* --- STAFF DIALOG --- */}
      <Dialog open={openStaffModal} onClose={() => setOpenStaffModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedStaff ? 'Update Staff Profile' : 'Register General Staff Member'}</DialogTitle>
        <form onSubmit={handleStaffSubmit}>
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
                  select 
                  label="Department" 
                  value={department} 
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    if (errors.department) setErrors(prev => ({ ...prev, department: '' }));
                  }}
                  error={Boolean(errors.department)}
                  helperText={errors.department}
                >
                  <MenuItem value="LIBRARY">Library</MenuItem>
                  <MenuItem value="HR">HR Staff</MenuItem>
                  {/* <MenuItem value="FINANCE">Finance</MenuItem> */}
                  <MenuItem value="TRANSPORT">Transport</MenuItem>
                  <MenuItem value="RECEPTION">Reception</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="SECURITY">Security</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  required 
                  label="Designation (e.g. Librarian, Cleaner, Peon)" 
                  value={designation} 
                  onChange={(e) => {
                    setDesignation(e.target.value);
                    if (errors.designation) setErrors(prev => ({ ...prev, designation: '' }));
                  }} 
                  error={Boolean(errors.designation)}
                  helperText={errors.designation}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Button onClick={() => setOpenStaffModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={addStaffLoading || updateStaffLoading}>
              {addStaffLoading || updateStaffLoading ? 'Saving...' : selectedStaff ? 'Update Staff' : 'Add Staff'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Teacher Delete Confirmation Dialog */}
      <Dialog open={Boolean(teacherToDelete)} onClose={() => setTeacherToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Teacher Profile</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete teacher "{teacherToDelete ? `${teacherToDelete.firstName} ${teacherToDelete.lastName}` : ''}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setTeacherToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleTeacherConfirmDelete} variant="contained" color="error" disabled={deleteTeacherLoading}>
            {deleteTeacherLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Staff Delete Confirmation Dialog */}
      <Dialog open={Boolean(staffToDelete)} onClose={() => setStaffToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Staff Profile</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete staff member "{staffToDelete ? `${staffToDelete.firstName} ${staffToDelete.lastName}` : ''}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setStaffToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleStaffConfirmDelete} variant="contained" color="error" disabled={deleteStaffLoading}>
            {deleteStaffLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  function handleTeacherConfirmDelete() {
    if (!teacherToDelete) return;
    deleteTeacher({ variables: { id: teacherToDelete.id } });
  }

  function handleStaffConfirmDelete() {
    if (!staffToDelete) return;
    deleteStaff({ variables: { id: staffToDelete.id } });
  }
}

export default TeacherList;
