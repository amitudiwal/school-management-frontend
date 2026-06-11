import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSelector } from 'react-redux';
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, TextField, MenuItem, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress,
  Alert, IconButton, InputAdornment, Avatar
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, FileDownload as ExportIcon,
  Edit as EditIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import {
  GET_STUDENTS,
  GET_CLASSES,
  GET_SECTIONS,
  REGISTER_STUDENT,
  UPDATE_STUDENT,
  DELETE_STUDENT,
  GET_PARENTS
} from '../graphql/operations';

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  // return `http://localhost:5000${avatarPath}`;
  return `https://school-management-backend-izxj.onrender.com${avatarPath}`;
};

function StudentList() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const canAddStudent = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'].includes(user?.role);
  const canManageStudent = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'].includes(user?.role);

  // States
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

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
      // const response = await fetch('http://localhost:5000/api/upload', {
            const response = await fetch('https://school-management-backend-izxj.onrender.com/api/upload', {
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
    setSelectedStudent(null);
    setAvatar('');
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

    if (!firstName || !lastName || !email || !admissionNo || !dob) {
      setFormError('Please fill in all required fields (First Name, Last Name, Email, Admission Number, Date of Birth).');
      return;
    }

    if (!formClassId) {
      setFormError('Class selection is required. Please select a class.');
      return;
    }

    if (!formSectionId) {
      setFormError('Section selection is required. Please select a section.');
      return;
    }

    const variables = {
      firstName,
      lastName,
      email,
      admissionNo,
      rollNo,
      gender,
      dateOfBirth: new Date(dob),
      classId: formClassId,
      sectionId: formSectionId,
      parentId: formParentId || null
    };

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
              {studentsData?.getStudents?.map((st) => (
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
              {studentsData?.getStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManageStudent ? 9 : 8} align="center">No students found matching filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
                <TextField fullWidth required label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required type="email" label="Parent/Contact Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Admission Number" value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} />
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
                <TextField fullWidth required type="date" label="Date of Birth" InputLabelProps={{ shrink: true }} value={dob} onChange={(e) => setDob(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth required select label="Select Class"
                  value={formClassId}
                  onChange={(e) => {
                    setFormClassId(e.target.value);
                    setFormSectionId('');
                  }}
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
                  onChange={(e) => setFormSectionId(e.target.value)}
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
