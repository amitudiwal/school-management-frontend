import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSelector } from 'react-redux';
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, TextField, MenuItem, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress,
  Alert, IconButton, InputAdornment, Avatar, TablePagination
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, FileDownload as ExportIcon,
  Edit as EditIcon, Delete as DeleteIcon, Visibility, VisibilityOff
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import CustomDatePicker from '../components/CustomDatePicker';
import {
  GET_STUDENTS,
  GET_CLASSES,
  GET_SECTIONS,
  REGISTER_STUDENT,
  UPDATE_STUDENT,
  DELETE_STUDENT,
  GET_PARENTS
} from '../graphql/operations';
import { BACKEND_URL } from '../graphql/client';

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  return `${BACKEND_URL}${avatarPath}`;
};

function StudentList() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const canAddStudent = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'ACCOUNTANT'].includes(user?.role);
  const canManageStudent = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'ACCOUNTANT'].includes(user?.role);

  // States
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const [page, setPage] = useState(0);

  // Reset page on filter changes
  useEffect(() => {
    setPage(0);
  }, [search, classId, sectionId]);

  // Form States for Admission
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dob, setDob] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formSectionId, setFormSectionId] = useState('');
  const [formParentId, setFormParentId] = useState('');
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState({});

  // Parent simultaneous registration states
  const [parentMode, setParentMode] = useState('EXISTING'); // 'EXISTING' or 'NEW'
  const [parentFirstName, setParentFirstName] = useState('');
  const [parentLastName, setParentLastName] = useState('');
  const [parentRelation, setParentRelation] = useState('FATHER');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [showParentPassword, setShowParentPassword] = useState(false);

  // Image Upload States
  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);

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
  const { loading: studentsLoading, error: studentsError, data: studentsData, refetch } = useQuery(GET_STUDENTS, {
    variables: { classId: classId || undefined, sectionId: sectionId || undefined, search: search || undefined }
  });

  const { data: classesData } = useQuery(GET_CLASSES);
  const { data: sectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: classId || undefined }
  });
  const { data: formSectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: formClassId || undefined }
  });
  const { data: parentsData } = useQuery(GET_PARENTS);

  // Mutation
  const [registerStudentMutation, { loading: addLoading }] = useMutation(REGISTER_STUDENT, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Student registered successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateStudentMutation, { loading: updateLoading }] = useMutation(UPDATE_STUDENT, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Student details updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteStudentMutation, { loading: deleteLoading }] = useMutation(DELETE_STUDENT, {
    onCompleted: () => {
      setStudentToDelete(null);
      refetch();
      dispatch(showToast({ message: 'Student removed successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setAdmissionNo('');
    setRollNo('');
    setGender('MALE');
    setDob('');
    setFormClassId('');
    setFormSectionId('');
    setFormParentId('');
    setFormError('');
    setErrors({});
    setSelectedStudent(null);
    setAvatar('');
    setParentMode('EXISTING');
    setParentFirstName('');
    setParentLastName('');
    setParentRelation('FATHER');
    setParentPhone('');
    setParentEmail('');
    setParentPassword('');
    setShowParentPassword(false);
  };

  const handleOpenAdmission = () => {
    clearForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (student) => {
    setSelectedStudent(student);
    setFirstName(student.firstName || '');
    setLastName(student.lastName || '');
    setEmail(student.userId?.email || '');
    setAdmissionNo(student.admissionNo || '');
    setRollNo(student.rollNo || '');
    setGender(student.gender || 'MALE');
    setDob(student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '');
    setFormClassId(student.classId?.id || '');
    setFormSectionId(student.sectionId?.id || '');
    setFormParentId(student.parentId?.id || '');
    setFormError('');
    setErrors({});
    setAvatar(student.userId?.avatar || '');
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    clearForm();
  };

  const handleAdmissionSubmit = (e) => {
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

    if (!admissionNo.trim()) newErrors.admissionNo = 'Admission Number is required.';
    if (!dob) newErrors.dob = 'Date of Birth is required.';
    if (!formClassId) newErrors.formClassId = 'Class selection is required.';
    if (!formSectionId) newErrors.formSectionId = 'Section selection is required.';

    if (!selectedStudent && parentMode === 'NEW') {
      if (!parentFirstName.trim()) newErrors.parentFirstName = 'Parent First Name is required.';
      if (!parentLastName.trim()) newErrors.parentLastName = 'Parent Last Name is required.';
      
      if (!parentEmail.trim()) {
        newErrors.parentEmail = 'Parent Email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
        newErrors.parentEmail = 'Please enter a valid email address.';
      }

      if (!parentPhone.trim()) {
        newErrors.parentPhone = 'Parent Phone Number is required.';
      } else if (!/^\d{10}$/.test(parentPhone.trim())) {
        newErrors.parentPhone = 'Parent Phone Number must be exactly 10 digits.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError('Please correct the highlighted errors before submitting.');
      return;
    }

    const variables = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      admissionNo: admissionNo.trim(),
      rollNo: rollNo.trim(),
      gender,
      dateOfBirth: new Date(dob),
      classId: formClassId,
      sectionId: formSectionId
    };

    if (!selectedStudent && parentMode === 'NEW') {
      variables.parentId = null;
      variables.parentFirstName = parentFirstName.trim();
      variables.parentLastName = parentLastName.trim();
      variables.parentEmail = parentEmail.trim();
      variables.parentPhone = parentPhone.trim();
      variables.parentRelation = parentRelation;
      variables.parentPassword = parentPassword || null;
    } else {
      variables.parentId = formParentId || null;
      variables.parentFirstName = null;
      variables.parentLastName = null;
      variables.parentEmail = null;
      variables.parentPhone = null;
      variables.parentRelation = null;
      variables.parentPassword = null;
    }

    if (selectedStudent) {
      updateStudentMutation({
        variables: {
          id: selectedStudent.id,
          ...variables
        }
      });
      return;
    }

    registerStudentMutation({ 
      variables: {
        ...variables,
        avatar
      } 
    });
  };

  const handleConfirmDelete = () => {
    if (!studentToDelete) return;
    deleteStudentMutation({ variables: { id: studentToDelete.id } });
  };

  // Triggers report download from the backend API
  const handleExport = async (format) => {
    try {
      const response = await fetch(`http://localhost:5000/api/export/${format}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Export request failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student-directory.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Error exporting report: ' + err.message);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Student Register
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
          {/* Export Controls */}
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => handleExport('pdf')}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            PDF Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => handleExport('excel')}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Excel Sheet
          </Button>
          {canAddStudent && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAdmission}
              sx={{ width: { xs: '100%', sm: 'auto' }, background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF' }}
            >
              New Admission
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search Student Name / Adm No..."
                variant="outlined"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Filter by Grade Level"
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSectionId('');
                }}
              >
                <MenuItem value="">All Classes</MenuItem>
                {classesData?.getClasses?.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Filter by Section"
                value={sectionId}
                disabled={!classId}
                onChange={(e) => setSectionId(e.target.value)}
              >
                <MenuItem value="">All Sections</MenuItem>
                {sectionsData?.getSections?.map((sec) => (
                  <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Table */}
      {studentsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : studentsError ? (
        <Alert severity="error">{studentsError.message}</Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell width="80px">Photo</TableCell>
                  <TableCell>Admission No</TableCell>
                  <TableCell>Roll No</TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Grade Level</TableCell>
                  <TableCell>Assigned Section</TableCell>
                  <TableCell>Parent / Guardian</TableCell>
                  {canManageStudent && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {(studentsData?.getStudents || [])
                  .slice(page * 10, (page + 1) * 10)
                  .map((st) => (
                    <TableRow key={st.id} hover>
                      <TableCell>
                        <Avatar src={getAvatarUrl(st.userId?.avatar)} sx={{ width: 44, height: 44, border: '1px solid', borderColor: 'divider' }}>
                          {st.firstName?.charAt(0) || ''}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{st.admissionNo}</TableCell>
                      <TableCell>{st.rollNo || '-'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{`${st.firstName} ${st.lastName}`}</TableCell>
                      <TableCell>{st.gender}</TableCell>
                      <TableCell>{st.classId?.name}</TableCell>
                      <TableCell>{st.sectionId?.name}</TableCell>
                      <TableCell>{st.parentId ? `${st.parentId.firstName} ${st.parentId.lastName}` : '-'}</TableCell>
                      {canManageStudent && (
                        <TableCell align="right">
                          <IconButton aria-label="Edit student" color="primary" onClick={() => handleOpenEdit(st)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton aria-label="Delete student" color="error" onClick={() => setStudentToDelete(st)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                {(!studentsData?.getStudents || studentsData.getStudents.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={canManageStudent ? 9 : 8} align="center">No data</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {studentsData?.getStudents?.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10]}
              component="div"
              count={studentsData.getStudents.length}
              rowsPerPage={10}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
            />
          )}
        </>
      )}

      {/* Admission Dialog Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth fullScreen={false}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {selectedStudent ? 'Edit Student Details' : 'Student Admission Intake Form'}
        </DialogTitle>
        <form onSubmit={handleAdmissionSubmit}>
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
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  required 
                  type="email" 
                  label="Student Login Email" 
                  value={email} 
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }} 
                  error={Boolean(errors.email)}
                  helperText={errors.email || "Unique login email for the student (e.g. st1212@school.com)"}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  required 
                  label="Admission Number" 
                  value={admissionNo} 
                  onChange={(e) => {
                    setAdmissionNo(e.target.value);
                    if (errors.admissionNo) setErrors(prev => ({ ...prev, admissionNo: '' }));
                  }} 
                  error={Boolean(errors.admissionNo)}
                  helperText={errors.admissionNo}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Roll Number" value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
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
                  fullWidth required select label="Select Class"
                  value={formClassId}
                  onChange={(e) => {
                    setFormClassId(e.target.value);
                    setFormSectionId('');
                    if (errors.formClassId) setErrors(prev => ({ ...prev, formClassId: '' }));
                  }}
                  error={Boolean(errors.formClassId)}
                  helperText={errors.formClassId}
                >
                  {classesData?.getClasses?.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                  ))}
                  {selectedStudent && formClassId && !classesData?.getClasses?.some(cls => cls.id === formClassId) && (
                    <MenuItem key={formClassId} value={formClassId}>
                      {selectedStudent.classId?.name || 'Loading Class...'}
                    </MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth required select label="Select Section"
                  value={formSectionId}
                  disabled={!formClassId}
                  onChange={(e) => {
                    setFormSectionId(e.target.value);
                    if (errors.formSectionId) setErrors(prev => ({ ...prev, formSectionId: '' }));
                  }}
                  error={Boolean(errors.formSectionId)}
                  helperText={errors.formSectionId}
                >
                  {formSectionsData?.getSections?.map((sec) => (
                    <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                  ))}
                  {selectedStudent && formSectionId && !formSectionsData?.getSections?.some(sec => sec.id === formSectionId) && (
                    <MenuItem key={formSectionId} value={formSectionId}>
                      {selectedStudent.sectionId?.name || 'Loading Section...'}
                    </MenuItem>
                  )}
                </TextField>
              </Grid>
              {!selectedStudent ? (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mt: 1, mb: 0.5 }}>
                      Parent / Guardian Configuration
                    </Typography>
                    <TextField
                      fullWidth
                      select
                      label="Parent Information Mode"
                      value={parentMode}
                      onChange={(e) => setParentMode(e.target.value)}
                    >
                      <MenuItem value="EXISTING">Assign Existing Parent Profile</MenuItem>
                      <MenuItem value="NEW">Create & Link New Parent Credentials</MenuItem>
                    </TextField>
                  </Grid>

                  {parentMode === 'EXISTING' ? (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth select label="Assign Existing Parent (Optional)"
                        value={formParentId}
                        onChange={(e) => setFormParentId(e.target.value)}
                      >
                        <MenuItem value="">None / No Parent Profile</MenuItem>
                        {parentsData?.getParents?.map((parent) => (
                          <MenuItem key={parent.id} value={parent.id}>
                            {parent.firstName} {parent.lastName} ({parent.relation})
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  ) : (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          fullWidth 
                          required 
                          label="Parent First Name" 
                          value={parentFirstName} 
                          onChange={(e) => {
                            setParentFirstName(e.target.value);
                            if (errors.parentFirstName) setErrors(prev => ({ ...prev, parentFirstName: '' }));
                          }} 
                          error={Boolean(errors.parentFirstName)}
                          helperText={errors.parentFirstName}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          fullWidth 
                          required 
                          label="Parent Last Name" 
                          value={parentLastName} 
                          onChange={(e) => {
                            setParentLastName(e.target.value);
                            if (errors.parentLastName) setErrors(prev => ({ ...prev, parentLastName: '' }));
                          }} 
                          error={Boolean(errors.parentLastName)}
                          helperText={errors.parentLastName}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth required select label="Relationship to Student" value={parentRelation} onChange={(e) => setParentRelation(e.target.value)}>
                          <MenuItem value="FATHER">Father</MenuItem>
                          <MenuItem value="MOTHER">Mother</MenuItem>
                          <MenuItem value="GUARDIAN">Guardian</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          fullWidth 
                          required 
                          label="Parent Phone Number" 
                          value={parentPhone} 
                          onChange={(e) => {
                            setParentPhone(e.target.value);
                            if (errors.parentPhone) setErrors(prev => ({ ...prev, parentPhone: '' }));
                          }} 
                          error={Boolean(errors.parentPhone)}
                          helperText={errors.parentPhone}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          fullWidth 
                          required 
                          type="email" 
                          label="Parent Login Email" 
                          value={parentEmail} 
                          onChange={(e) => {
                            setParentEmail(e.target.value);
                            if (errors.parentEmail) setErrors(prev => ({ ...prev, parentEmail: '' }));
                          }} 
                          error={Boolean(errors.parentEmail)}
                          helperText={errors.parentEmail || "Unique login email for the parent (e.g. parent@gmail.com)"}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type={showParentPassword ? 'text' : 'password'}
                          label="Parent Login Password (Optional)"
                          helperText="Defaults to standard password or phone number if blank"
                          value={parentPassword}
                          onChange={(e) => setParentPassword(e.target.value)}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowParentPassword(!showParentPassword)} edge="end">
                                  {showParentPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                    </>
                  )}
                </>
              ) : (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth select label="Assign Parent (Optional)"
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                  >
                    <MenuItem value="">None / No Parent Profile</MenuItem>
                    {parentsData?.getParents?.map((parent) => (
                      <MenuItem key={parent.id} value={parent.id}>
                        {parent.firstName} {parent.lastName} ({parent.relation})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Button onClick={handleCloseModal} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addLoading || updateLoading}>
              {addLoading || updateLoading ? 'Saving...' : selectedStudent ? 'Save Changes' : 'Admit Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(studentToDelete)} onClose={() => setStudentToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Student</DialogTitle>
        <DialogContent>
          <Typography>
            Delete {studentToDelete ? `${studentToDelete.firstName} ${studentToDelete.lastName}` : 'this student'} from the student register?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setStudentToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StudentList;
