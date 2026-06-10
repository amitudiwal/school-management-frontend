import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, Tab, Tabs, IconButton
} from '@mui/material';
import { Add as AddIcon, Class as ClassIcon, ViewList as SectionIcon, MenuBook as BookIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import {
  GET_CLASSES,
  GET_SECTIONS,
  GET_TEACHERS,
  CREATE_CLASS,
  CREATE_SECTION,
  GET_SUBJECTS,
  CREATE_SUBJECT,
  UPDATE_CLASS,
  DELETE_CLASS,
  UPDATE_SECTION,
  DELETE_SECTION,
  UPDATE_SUBJECT,
  DELETE_SUBJECT
} from '../graphql/operations';

function ClassManagement() {
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);

  // Class Form States
  const [openClassModal, setOpenClassModal] = useState(false);
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [classDesc, setClassDesc] = useState('');
  const [classError, setClassError] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);

  // Section Form States
  const [openSectionModal, setOpenSectionModal] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [secClassId, setSecClassId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionToDelete, setSectionToDelete] = useState(null);

  // Subject Form States
  const [openSubjectModal, setOpenSubjectModal] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectType, setSubjectType] = useState('THEORY');
  const [subClassId, setSubClassId] = useState('');
  const [subjectError, setSubjectError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  // Queries
  const { loading: classLoading, error: classQueryError, data: classesData, refetch: refetchClasses } = useQuery(GET_CLASSES);
  const { loading: sectionLoading, error: sectionQueryError, data: sectionsData, refetch: refetchSections } = useQuery(GET_SECTIONS);
  const { loading: subjectLoading, error: subjectQueryError, data: subjectsData, refetch: refetchSubjects } = useQuery(GET_SUBJECTS);
  const { data: teachersData } = useQuery(GET_TEACHERS);

  // Mutations
  const [createClassMutation, { loading: addClassLoading }] = useMutation(CREATE_CLASS, {
    onCompleted: () => {
      setOpenClassModal(false);
      clearClassForm();
      refetchClasses();
      dispatch(showToast({ message: 'Class created successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setClassError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateClassMutation, { loading: updateClassLoading }] = useMutation(UPDATE_CLASS, {
    onCompleted: () => {
      setOpenClassModal(false);
      clearClassForm();
      refetchClasses();
      dispatch(showToast({ message: 'Class details updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setClassError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteClassMutation] = useMutation(DELETE_CLASS, {
    onCompleted: () => {
      setClassToDelete(null);
      refetchClasses();
      dispatch(showToast({ message: 'Class deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [createSectionMutation, { loading: addSecLoading }] = useMutation(CREATE_SECTION, {
    onCompleted: () => {
      setOpenSectionModal(false);
      clearSectionForm();
      refetchSections();
      dispatch(showToast({ message: 'Section created successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setSectionError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateSectionMutation, { loading: updateSecLoading }] = useMutation(UPDATE_SECTION, {
    onCompleted: () => {
      setOpenSectionModal(false);
      clearSectionForm();
      refetchSections();
      dispatch(showToast({ message: 'Section details updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setSectionError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteSectionMutation] = useMutation(DELETE_SECTION, {
    onCompleted: () => {
      setSectionToDelete(null);
      refetchSections();
      dispatch(showToast({ message: 'Section deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [createSubjectMutation, { loading: addSubLoading }] = useMutation(CREATE_SUBJECT, {
    onCompleted: () => {
      setOpenSubjectModal(false);
      clearSubjectForm();
      refetchSubjects();
      dispatch(showToast({ message: 'Subject configured successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setSubjectError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateSubjectMutation, { loading: updateSubLoading }] = useMutation(UPDATE_SUBJECT, {
    onCompleted: () => {
      setOpenSubjectModal(false);
      clearSubjectForm();
      refetchSubjects();
      dispatch(showToast({ message: 'Subject details updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setSubjectError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteSubjectMutation] = useMutation(DELETE_SUBJECT, {
    onCompleted: () => {
      setSubjectToDelete(null);
      refetchSubjects();
      dispatch(showToast({ message: 'Subject deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearClassForm = () => {
    setClassName('');
    setClassCode('');
    setClassDesc('');
    setClassError('');
    setSelectedClass(null);
  };

  const clearSectionForm = () => {
    setSectionName('');
    setSecClassId('');
    setRoomNumber('');
    setCapacity('');
    setClassTeacherId('');
    setSectionError('');
    setSelectedSection(null);
  };

  const clearSubjectForm = () => {
    setSubjectName('');
    setSubjectCode('');
    setSubjectType('THEORY');
    setSubClassId('');
    setSubjectError('');
    setSelectedSubject(null);
  };

  const handleClassSubmit = (e) => {
    e.preventDefault();
    setClassError('');

    if (!className || !classCode) {
      setClassError('Please fill in all required fields.');
      return;
    }

    if (selectedClass) {
      updateClassMutation({
        variables: {
          id: selectedClass.id,
          name: className,
          code: classCode,
          description: classDesc
        }
      });
    } else {
      createClassMutation({
        variables: {
          name: className,
          code: classCode,
          description: classDesc
        }
      });
    }
  };

  const handleSectionSubmit = (e) => {
    e.preventDefault();
    setSectionError('');

    if (!sectionName || !secClassId) {
      setSectionError('Section name and Class selections are required.');
      return;
    }

    const vars = {
      classId: secClassId,
      name: sectionName,
      roomNumber: roomNumber || undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      classTeacherId: classTeacherId || undefined
    };

    if (selectedSection) {
      updateSectionMutation({
        variables: {
          id: selectedSection.id,
          ...vars
        }
      });
    } else {
      createSectionMutation({ variables: vars });
    }
  };

  const handleSubjectSubmit = (e) => {
    e.preventDefault();
    setSubjectError('');

    if (!subjectName || !subjectCode || !subClassId || !subjectType) {
      setSubjectError('Subject name, code, class and type are required.');
      return;
    }

    const vars = {
      classId: subClassId,
      name: subjectName,
      code: subjectCode,
      type: subjectType
    };

    if (selectedSubject) {
      updateSubjectMutation({
        variables: {
          id: selectedSubject.id,
          ...vars
        }
      });
    } else {
      createSubjectMutation({ variables: vars });
    }
  };

  const handleEditClass = (cls) => {
    setSelectedClass(cls);
    setClassName(cls.name);
    setClassCode(cls.code);
    setClassDesc(cls.description || '');
    setOpenClassModal(true);
  };

  const handleConfirmDeleteClass = () => {
    if (!classToDelete) return;
    deleteClassMutation({ variables: { id: classToDelete.id } });
  };

  const handleEditSection = (sec) => {
    setSelectedSection(sec);
    setSectionName(sec.name);
    setSecClassId(sec.classId?.id || '');
    setRoomNumber(sec.roomNumber || '');
    setCapacity(sec.capacity || '');
    setClassTeacherId(sec.classTeacherId?.id || '');
    setOpenSectionModal(true);
  };

  const handleConfirmDeleteSection = () => {
    if (!sectionToDelete) return;
    deleteSectionMutation({ variables: { id: sectionToDelete.id } });
  };

  const handleEditSubject = (sub) => {
    setSelectedSubject(sub);
    setSubjectName(sub.name);
    setSubjectCode(sub.code);
    setSubjectType(sub.type);
    setSubClassId(sub.classId?.id || '');
    setOpenSubjectModal(true);
  };

  const handleConfirmDeleteSubject = () => {
    if (!subjectToDelete) return;
    deleteSubjectMutation({ variables: { id: subjectToDelete.id } });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Class Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => { clearClassForm(); setOpenClassModal(true); }}
            sx={{ border: '1.5px solid #6366F1', color: '#6366F1', fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
          >
            Add Class
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { clearSectionForm(); setOpenSectionModal(true); }}
            sx={{ background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF', width: { xs: '100%', sm: 'auto' } }}
          >
            Add Section
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => { clearSubjectForm(); setOpenSubjectModal(true); }}
            sx={{ border: '1.5px solid #D946EF', color: '#D946EF', fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
          >
            Add Subject
          </Button>
        </Box>
      </Box>

      {/* Tabs Menu */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab icon={<ClassIcon />} iconPosition="start" label="Classes / Grades" sx={{ fontWeight: 700 }} />
        <Tab icon={<SectionIcon />} iconPosition="start" label="Sections & Classrooms" sx={{ fontWeight: 700 }} />
        <Tab icon={<BookIcon />} iconPosition="start" label="Subjects Configuration" sx={{ fontWeight: 700 }} />
      </Tabs>

      {/* CLASS DIRECTORY TAB */}
      {tabValue === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                View and configure all active educational grades/classes inside your school. Classes act as the parent container for sections and subjects.
              </Typography>
            </CardContent>
          </Card>

          {classLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : classQueryError ? (
            <Alert severity="error">{classQueryError.message}</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Grade/Class Name</TableCell>
                    <TableCell>Class Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classesData?.getClasses.map((cls) => (
                    <TableRow key={cls.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{cls.name}</TableCell>
                      <TableCell>{cls.code}</TableCell>
                      <TableCell>{cls.description || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleEditClass(cls)}><EditIcon /></IconButton>
                        <IconButton color="error" onClick={() => setClassToDelete(cls)}><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {classesData?.getClasses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No classes registered yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* SECTION DIRECTORY TAB */}
      {tabValue === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Configure classroom sections, specify seat capacity limits, assign classroom room numbers, and link class teachers for daily attendance.
              </Typography>
            </CardContent>
          </Card>

          {sectionLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : sectionQueryError ? (
            <Alert severity="error">{sectionQueryError.message}</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Section Name</TableCell>
                    <TableCell>Associated Class</TableCell>
                    <TableCell>Room Number</TableCell>
                    <TableCell>Seat Capacity</TableCell>
                    <TableCell>Class Teacher</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sectionsData?.getSections.map((sec) => (
                    <TableRow key={sec.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{sec.name}</TableCell>
                      <TableCell>{sec.classId?.name || '-'}</TableCell>
                      <TableCell>{sec.roomNumber || '-'}</TableCell>
                      <TableCell>{sec.capacity || '-'}</TableCell>
                      <TableCell>{sec.classTeacherId ? `${sec.classTeacherId.firstName} ${sec.classTeacherId.lastName}` : 'Not Assigned'}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleEditSection(sec)}><EditIcon /></IconButton>
                        <IconButton color="error" onClick={() => setSectionToDelete(sec)}><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sectionsData?.getSections.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No sections registered yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* SUBJECT DIRECTORY TAB */}
      {tabValue === 2 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                View and configure all educational subjects mapped under specific Grade/Class definitions.
              </Typography>
            </CardContent>
          </Card>

          {subjectLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : subjectQueryError ? (
            <Alert severity="error">{subjectQueryError.message}</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject Name</TableCell>
                    <TableCell>Subject Code</TableCell>
                    <TableCell>Subject Type</TableCell>
                    <TableCell>Target Class</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subjectsData?.getSubjects.map((sub) => (
                    <TableRow key={sub.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{sub.name}</TableCell>
                      <TableCell>{sub.code}</TableCell>
                      <TableCell>{sub.type}</TableCell>
                      <TableCell>{sub.classId?.name || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleEditSubject(sub)}><EditIcon /></IconButton>
                        <IconButton color="error" onClick={() => setSubjectToDelete(sub)}><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {subjectsData?.getSubjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No subjects configured yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* ADD CLASS MODAL DIALOG */}
      <Dialog open={openClassModal} onClose={() => setOpenClassModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedClass ? 'Update Class' : 'Create New Class'}</DialogTitle>
        <form onSubmit={handleClassSubmit}>
          <DialogContent>
            {classError && <Alert severity="error" sx={{ mb: 2 }}>{classError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth required label="Class/Grade Name (e.g. Grade 10)" value={className} onChange={(e) => setClassName(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required label="Short Code (e.g. G10)" value={classCode} onChange={(e) => setClassCode(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} label="Description (Optional)" value={classDesc} onChange={(e) => setClassDesc(e.target.value)} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenClassModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addClassLoading || updateClassLoading}>
              {addClassLoading || updateClassLoading ? 'Saving...' : selectedClass ? 'Update Class' : 'Create Class'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ADD SECTION MODAL DIALOG */}
      <Dialog open={openSectionModal} onClose={() => setOpenSectionModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedSection ? 'Update Section' : 'Create New Section'}</DialogTitle>
        <form onSubmit={handleSectionSubmit}>
          <DialogContent>
            {sectionError && <Alert severity="error" sx={{ mb: 2 }}>{sectionError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required select label="Select Class" value={secClassId} onChange={(e) => setSecClassId(e.target.value)}>
                  {classesData?.getClasses.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Section Name (e.g. Section A)" value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Room Number (e.g. Room 204)" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="number" label="Seat Capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth select label="Assign Class Teacher (Optional)" value={classTeacherId} onChange={(e) => setClassTeacherId(e.target.value)}>
                  <MenuItem value="">Do Not Assign Teacher</MenuItem>
                  {teachersData?.getTeachers.map((teach) => (
                    <MenuItem key={teach.id} value={teach.id}>
                      {teach.firstName} {teach.lastName} ({teach.qualification})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenSectionModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addSecLoading || updateSecLoading}>
              {addSecLoading || updateSecLoading ? 'Saving...' : selectedSection ? 'Update Section' : 'Create Section'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ADD SUBJECT MODAL DIALOG */}
      <Dialog open={openSubjectModal} onClose={() => setOpenSubjectModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedSubject ? 'Update Subject' : 'Create New Subject'}</DialogTitle>
        <form onSubmit={handleSubjectSubmit}>
          <DialogContent>
            {subjectError && <Alert severity="error" sx={{ mb: 2 }}>{subjectError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required select label="Select Class/Grade" value={subClassId} onChange={(e) => setSubClassId(e.target.value)}>
                  {classesData?.getClasses.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Subject Name (e.g. Mathematics)" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Subject Code (e.g. MATH101)" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required select label="Subject Type" value={subjectType} onChange={(e) => setSubjectType(e.target.value)}>
                  <MenuItem value="THEORY">Theory</MenuItem>
                  <MenuItem value="PRACTICAL">Practical</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenSubjectModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addSubLoading || updateSubLoading}>
              {addSubLoading || updateSubLoading ? 'Saving...' : selectedSubject ? 'Update Subject' : 'Create Subject'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Class Confirmation Dialog */}
      <Dialog open={Boolean(classToDelete)} onClose={() => setClassToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Class/Grade</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete class "{classToDelete?.name}"? All associated sections and subjects will be affected.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setClassToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDeleteClass} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Section Confirmation Dialog */}
      <Dialog open={Boolean(sectionToDelete)} onClose={() => setSectionToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Section</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete section "{sectionToDelete?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setSectionToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDeleteSection} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Subject Confirmation Dialog */}
      <Dialog open={Boolean(subjectToDelete)} onClose={() => setSubjectToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Subject</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete subject "{subjectToDelete?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setSubjectToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDeleteSubject} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ClassManagement;
