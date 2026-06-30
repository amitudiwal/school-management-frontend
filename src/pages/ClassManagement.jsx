import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, Tab, Tabs, IconButton, TablePagination, Stack, Chip
} from '@mui/material';
import {
  Add as AddIcon, Class as ClassIcon, ViewList as SectionIcon,
  MenuBook as BookIcon, Edit as EditIcon, Delete as DeleteIcon
} from '@mui/icons-material';
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
  const [pageClasses, setPageClasses] = useState(0);
  const [pageSubjects, setPageSubjects] = useState(0);

  // Unified Form Mode & State
  const [formMode, setFormMode] = useState('CREATE_NEW'); // 'CREATE_NEW', 'SELECT_EXISTING', 'EDIT_CLASS', 'EDIT_SECTION'
  const [openClassModal, setOpenClassModal] = useState(false);
  
  // Class Form Fields
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [classDesc, setClassDesc] = useState('');
  const [classError, setClassError] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);

  // Section Form Fields
  const [sectionName, setSectionName] = useState('');
  const [secClassId, setSecClassId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionToDelete, setSectionToDelete] = useState(null);

  // Subject Form Fields
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
  const [createClassMutation, { loading: addClassLoading }] = useMutation(CREATE_CLASS);
  const [updateClassMutation, { loading: updateClassLoading }] = useMutation(UPDATE_CLASS);
  const [deleteClassMutation] = useMutation(DELETE_CLASS);

  const [createSectionMutation, { loading: addSecLoading }] = useMutation(CREATE_SECTION);
  const [updateSectionMutation, { loading: updateSecLoading }] = useMutation(UPDATE_SECTION);
  const [deleteSectionMutation] = useMutation(DELETE_SECTION);

  const [createSubjectMutation, { loading: addSubLoading }] = useMutation(CREATE_SUBJECT);
  const [updateSubjectMutation, { loading: updateSubLoading }] = useMutation(UPDATE_SUBJECT);
  const [deleteSubjectMutation] = useMutation(DELETE_SUBJECT);

  // Form Reset Helpers
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

  // Click Handlers for opening the Unified Dialog
  const handleOpenAddClassAndSection = () => {
    clearClassForm();
    clearSectionForm();
    setFormMode('CREATE_NEW');
    setOpenClassModal(true);
  };

  const handleEditClass = (cls) => {
    setSelectedClass(cls);
    setClassName(cls.name);
    setClassCode(cls.code);
    setClassDesc(cls.description || '');
    setFormMode('EDIT_CLASS');
    setOpenClassModal(true);
  };

  const handleEditSection = (sec) => {
    setSelectedSection(sec);
    setSectionName(sec.name);
    setSecClassId(sec.classId?.id || '');
    setRoomNumber(sec.roomNumber || '');
    setCapacity(sec.capacity || '');
    setClassTeacherId(sec.classTeacherId?.id || '');
    setFormMode('EDIT_SECTION');
    setOpenClassModal(true);
  };

  const handleAddSectionToClass = (cls) => {
    clearClassForm();
    clearSectionForm();
    setSecClassId(cls.id);
    setFormMode('SELECT_EXISTING');
    setOpenClassModal(true);
  };

  // Unified Submit Handler for Class & Section Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setClassError('');
    setSectionError('');

    if (formMode === 'EDIT_CLASS') {
      if (!className || !classCode) {
        setClassError('Class Name and Code are required.');
        return;
      }
      try {
        await updateClassMutation({
          variables: {
            id: selectedClass.id,
            name: className,
            code: classCode,
            description: classDesc || null
          }
        });
        setOpenClassModal(false);
        clearClassForm();
        refetchClasses();
        dispatch(showToast({ message: 'Class updated successfully!', severity: 'success' }));
      } catch (err) {
        setClassError(err.message);
        dispatch(showToast({ message: err.message, severity: 'error' }));
      }
      return;
    }

    if (formMode === 'EDIT_SECTION') {
      if (!sectionName) {
        setSectionError('Section name is required.');
        return;
      }
      try {
        await updateSectionMutation({
          variables: {
            id: selectedSection.id,
            classId: secClassId || undefined,
            name: sectionName,
            roomNumber: roomNumber || null,
            capacity: capacity ? parseInt(capacity, 10) : 30,
            classTeacherId: classTeacherId || null
          }
        });
        setOpenClassModal(false);
        clearSectionForm();
        refetchSections();
        dispatch(showToast({ message: 'Section updated successfully!', severity: 'success' }));
      } catch (err) {
        setSectionError(err.message);
        dispatch(showToast({ message: err.message, severity: 'error' }));
      }
      return;
    }

    if (formMode === 'CREATE_NEW') {
      if (!className || !classCode || !sectionName) {
        setClassError('Class Name, Code, and Section Name are required.');
        return;
      }
      try {
        // Create Class First
        const classRes = await createClassMutation({
          variables: {
            name: className,
            code: classCode,
            description: classDesc || null
          }
        });
        const newClassId = classRes.data.createClass.id;

        // Create Section Second
        await createSectionMutation({
          variables: {
            classId: newClassId,
            name: sectionName,
            roomNumber: roomNumber || null,
            capacity: capacity ? parseInt(capacity, 10) : 30,
            classTeacherId: classTeacherId || null
          }
        });

        setOpenClassModal(false);
        clearClassForm();
        clearSectionForm();
        refetchClasses();
        refetchSections();
        dispatch(showToast({ message: 'Class and Section created successfully!', severity: 'success' }));
      } catch (err) {
        setClassError(err.message);
        dispatch(showToast({ message: err.message, severity: 'error' }));
      }
      return;
    }

    if (formMode === 'SELECT_EXISTING') {
      if (!secClassId || !sectionName) {
        setSectionError('Please select a class and enter a section name.');
        return;
      }
      try {
        await createSectionMutation({
          variables: {
            classId: secClassId,
            name: sectionName,
            roomNumber: roomNumber || null,
            capacity: capacity ? parseInt(capacity, 10) : 30,
            classTeacherId: classTeacherId || null
          }
        });

        setOpenClassModal(false);
        clearClassForm();
        clearSectionForm();
        refetchClasses();
        refetchSections();
        dispatch(showToast({ message: 'Section added successfully!', severity: 'success' }));
      } catch (err) {
        setSectionError(err.message);
        dispatch(showToast({ message: err.message, severity: 'error' }));
      }
      return;
    }
  };

  // Subject Submit Handler
  const handleSubjectSubmit = async (e) => {
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

    try {
      if (selectedSubject) {
        await updateSubjectMutation({
          variables: {
            id: selectedSubject.id,
            ...vars
          }
        });
        dispatch(showToast({ message: 'Subject updated successfully!', severity: 'success' }));
      } else {
        await createSubjectMutation({ variables: vars });
        dispatch(showToast({ message: 'Subject configured successfully!', severity: 'success' }));
      }
      setOpenSubjectModal(false);
      clearSubjectForm();
      refetchSubjects();
    } catch (err) {
      setSubjectError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  };

  // Delete Handlers
  const handleConfirmDeleteClass = async () => {
    if (!classToDelete) return;
    try {
      await deleteClassMutation({ variables: { id: classToDelete.id } });
      setClassToDelete(null);
      refetchClasses();
      refetchSections();
      dispatch(showToast({ message: 'Class deleted successfully!', severity: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  };

  const handleConfirmDeleteSection = async () => {
    if (!sectionToDelete) return;
    try {
      await deleteSectionMutation({ variables: { id: sectionToDelete.id } });
      setSectionToDelete(null);
      refetchSections();
      dispatch(showToast({ message: 'Section deleted successfully!', severity: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  };

  const handleEditSubject = (sub) => {
    setSelectedSubject(sub);
    setSubjectName(sub.name);
    setSubjectCode(sub.code);
    setSubjectType(sub.type);
    setSubClassId(sub.classId?.id || '');
    setOpenSubjectModal(true);
  };

  const handleConfirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    try {
      await deleteSubjectMutation({ variables: { id: subjectToDelete.id } });
      setSubjectToDelete(null);
      refetchSubjects();
      dispatch(showToast({ message: 'Subject deleted successfully!', severity: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header Panel */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
            Class Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage school academic classes, classroom sections, and course subjects.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddClassAndSection}
            sx={{
              background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              borderRadius: 2.5,
              py: 1.25,
              px: 3,
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
            }}
          >
            Add Class & Section
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => { clearSubjectForm(); setOpenSubjectModal(true); }}
            sx={{
              border: '1.5px solid #D946EF',
              color: '#D946EF',
              fontWeight: 700,
              borderRadius: 2.5,
              py: 1.25,
              px: 3,
              '&:hover': { border: '1.5px solid #C084FC' }
            }}
          >
            Add Subject
          </Button>
        </Box>
      </Box>

      {/* Tabs Menu (Only 2 Tabs) */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab icon={<ClassIcon />} iconPosition="start" label="Classes & Sections" sx={{ fontWeight: 700 }} />
        <Tab icon={<BookIcon />} iconPosition="start" label="Subjects Configuration" sx={{ fontWeight: 700 }} />
      </Tabs>

      {/* TABS CONTENT */}
      {/* 1st Tab: Classes & Sections */}
      {tabValue === 0 && (
        <Box>
          <Card sx={{ mb: 3, borderRadius: 3, border: theme => `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                View and configure all active educational classes and their classroom sections. A single entry displays the class and section details, including room number and assigned class teacher.
              </Typography>
            </CardContent>
          </Card>

          {classLoading || sectionLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : classQueryError || sectionQueryError ? (
            <Alert severity="error">{classQueryError?.message || sectionQueryError?.message}</Alert>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 3 }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Class Name</TableCell>
                      <TableCell>Class Code</TableCell>
                      <TableCell>Section Name</TableCell>
                      <TableCell>Room Number</TableCell>
                      <TableCell>Seat Capacity</TableCell>
                      <TableCell>Class Teacher</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const classes = classesData?.getClasses || [];
                      const sections = sectionsData?.getSections || [];
                      const combined = [];

                      classes.forEach((cls) => {
                        const classSecs = sections.filter((sec) => sec.classId?.id === cls.id);
                        if (classSecs.length === 0) {
                          combined.push({
                            id: `class-${cls.id}`,
                            classObj: cls,
                            sectionObj: null
                          });
                        } else {
                          classSecs.forEach((sec) => {
                            combined.push({
                              id: `sec-${sec.id}`,
                              classObj: cls,
                              sectionObj: sec
                            });
                          });
                        }
                      });

                      const slicedData = combined.slice(pageClasses * 10, (pageClasses + 1) * 10);

                      if (combined.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} align="center">No data available. Add a Class & Section to get started.</TableCell>
                          </TableRow>
                        );
                      }

                      return slicedData.map((row) => {
                        const cls = row.classObj;
                        const sec = row.sectionObj;

                        return (
                          <TableRow key={row.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{cls.name}</TableCell>
                            <TableCell>{cls.code}</TableCell>
                            <TableCell>
                              {sec ? (
                                <Chip label={sec.name} size="small" color="primary" sx={{ fontWeight: 700 }} />
                              ) : (
                                <Chip label="No Sections" size="small" color="warning" variant="outlined" sx={{ fontWeight: 600 }} />
                              )}
                            </TableCell>
                            <TableCell>{sec?.roomNumber || '-'}</TableCell>
                            <TableCell>{sec?.capacity || '-'}</TableCell>
                            <TableCell>
                              {sec?.classTeacherId ? (
                                `${sec.classTeacherId.firstName} ${sec.classTeacherId.lastName}`
                              ) : sec ? (
                                <Typography variant="caption" color="text.secondary">Not Assigned</Typography>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="primary" 
                                  startIcon={<EditIcon sx={{ fontSize: '0.9rem !important' }} />}
                                  onClick={() => handleEditClass(cls)}
                                  sx={{ py: 0.25, px: 1, textTransform: 'none', fontSize: '0.75rem', borderRadius: 2 }}
                                >
                                  Class
                                </Button>
                                {sec ? (
                                  <>
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      color="secondary" 
                                      startIcon={<EditIcon sx={{ fontSize: '0.9rem !important' }} />}
                                      onClick={() => handleEditSection(sec)}
                                      sx={{ py: 0.25, px: 1, textTransform: 'none', fontSize: '0.75rem', borderRadius: 2 }}
                                    >
                                      Section
                                    </Button>
                                    <IconButton 
                                      size="small" 
                                      color="error" 
                                      onClick={() => setSectionToDelete(sec)}
                                      title="Delete Section"
                                    >
                                      <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                                    </IconButton>
                                  </>
                                ) : (
                                  <>
                                    <Button 
                                      size="small" 
                                      variant="contained" 
                                      color="success" 
                                      startIcon={<AddIcon sx={{ fontSize: '0.9rem !important' }} />}
                                      onClick={() => handleAddSectionToClass(cls)}
                                      sx={{ py: 0.25, px: 1, textTransform: 'none', fontSize: '0.75rem', borderRadius: 2 }}
                                    >
                                      Add Sec
                                    </Button>
                                    <IconButton 
                                      size="small" 
                                      color="error" 
                                      onClick={() => setClassToDelete(cls)}
                                      title="Delete Class"
                                    >
                                      <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                                    </IconButton>
                                  </>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
              {(() => {
                const classes = classesData?.getClasses || [];
                const sections = sectionsData?.getSections || [];
                let totalCount = 0;
                classes.forEach((cls) => {
                  const classSecs = sections.filter((sec) => sec.classId?.id === cls.id);
                  totalCount += classSecs.length === 0 ? 1 : classSecs.length;
                });

                return totalCount > 0 && (
                  <TablePagination
                    rowsPerPageOptions={[10]}
                    component="div"
                    count={totalCount}
                    rowsPerPage={10}
                    page={pageClasses}
                    onPageChange={(e, newPage) => setPageClasses(newPage)}
                  />
                );
              })()}
            </>
          )}
        </Box>
      )}

      {/* 2nd Tab: Subjects Configuration */}
      {tabValue === 1 && (
        <Box>
          <Card sx={{ mb: 3, borderRadius: 3, border: theme => `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                View and configure all educational subjects mapped under specific Class definitions.
              </Typography>
            </CardContent>
          </Card>

          {subjectLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : subjectQueryError ? (
            <Alert severity="error">{subjectQueryError.message}</Alert>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 3 }}>
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
                    {(subjectsData?.getSubjects || [])
                      .slice(pageSubjects * 10, (pageSubjects + 1) * 10)
                      .map((sub) => (
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
                    {(!subjectsData?.getSubjects || subjectsData.getSubjects.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No subjects configured. Click Add Subject to get started.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {subjectsData?.getSubjects?.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[10]}
                  component="div"
                  count={subjectsData.getSubjects.length}
                  rowsPerPage={10}
                  page={pageSubjects}
                  onPageChange={(e, newPage) => setPageSubjects(newPage)}
                />
              )}
            </>
          )}
        </Box>
      )}

      {/* UNIFIED CLASS & SECTION DIALOG */}
      <Dialog
        open={openClassModal}
        onClose={() => setOpenClassModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {formMode === 'CREATE_NEW' && 'Create Class & Section'}
          {formMode === 'SELECT_EXISTING' && 'Add Section to Class'}
          {formMode === 'EDIT_CLASS' && 'Update Class Details'}
          {formMode === 'EDIT_SECTION' && 'Update Section Details'}
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {classError && <Alert severity="error" sx={{ mb: 2 }}>{classError}</Alert>}
            {sectionError && <Alert severity="error" sx={{ mb: 2 }}>{sectionError}</Alert>}
            
            <Grid container spacing={2.5}>
              {/* Add mode toggle if creating or adding section */}
              {(formMode === 'CREATE_NEW' || (formMode === 'SELECT_EXISTING' && !selectedSection)) && !secClassId && (
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Choose Operation"
                    value={formMode}
                    onChange={(e) => {
                      setFormMode(e.target.value);
                      clearClassForm();
                      clearSectionForm();
                    }}
                    variant="outlined"
                  >
                    <MenuItem value="CREATE_NEW">Create New Class (with its first section)</MenuItem>
                    <MenuItem value="SELECT_EXISTING">Add Section to an Existing Class</MenuItem>
                  </TextField>
                </Grid>
              )}

              {/* CLASS FIELDS */}
              {(formMode === 'CREATE_NEW' || formMode === 'EDIT_CLASS') && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Class Name (e.g. Class 10)"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Class Code (e.g. C10)"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Class Description (Optional)"
                      value={classDesc}
                      onChange={(e) => setClassDesc(e.target.value)}
                    />
                  </Grid>
                </>
              )}

              {/* SECTION CLASS SELECT (if adding section to existing class) */}
              {formMode === 'SELECT_EXISTING' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    select
                    label="Select Class"
                    value={secClassId}
                    onChange={(e) => setSecClassId(e.target.value)}
                    disabled={Boolean(classesData?.getClasses?.find(c => c.id === secClassId))}
                  >
                    {classesData?.getClasses.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}

              {/* SECTION FIELDS */}
              {(formMode === 'CREATE_NEW' || formMode === 'SELECT_EXISTING' || formMode === 'EDIT_SECTION') && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Section Name (e.g. Section A)"
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Room Number (e.g. Room 204)"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Seat Capacity"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Assign Class Teacher (Optional)"
                      value={classTeacherId}
                      onChange={(e) => setClassTeacherId(e.target.value)}
                    >
                      <MenuItem value="">Do Not Assign Teacher</MenuItem>
                      {teachersData?.getTeachers.map((teach) => (
                        <MenuItem key={teach.id} value={teach.id}>
                          {teach.firstName} {teach.lastName} ({teach.qualification})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenClassModal(false)} variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={addClassLoading || updateClassLoading || addSecLoading || updateSecLoading}
            >
              {addClassLoading || updateClassLoading || addSecLoading || updateSecLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ADD SUBJECT MODAL DIALOG */}
      <Dialog open={openSubjectModal} onClose={() => setOpenSubjectModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedSubject ? 'Update Subject' : 'Create New Subject'}</DialogTitle>
        <form onSubmit={handleSubjectSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {subjectError && <Alert severity="error" sx={{ mb: 2 }}>{subjectError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required select label="Select Class" value={subClassId} onChange={(e) => setSubClassId(e.target.value)}>
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
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenSubjectModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addSubLoading || updateSubLoading}>
              {addSubLoading || updateSubLoading ? 'Saving...' : selectedSubject ? 'Update Subject' : 'Create Subject'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Class Confirmation Dialog */}
      <Dialog open={Boolean(classToDelete)} onClose={() => setClassToDelete(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Class</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete class "{classToDelete?.name}"? All associated sections and subjects will be affected.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 1 }}>
          <Button onClick={() => setClassToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDeleteClass} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Section Confirmation Dialog */}
      <Dialog open={Boolean(sectionToDelete)} onClose={() => setSectionToDelete(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Section</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete section "{sectionToDelete?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 1 }}>
          <Button onClick={() => setSectionToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDeleteSection} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Subject Confirmation Dialog */}
      <Dialog open={Boolean(subjectToDelete)} onClose={() => setSubjectToDelete(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Subject</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete subject "{subjectToDelete?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 1 }}>
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
