import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSelector } from 'react-redux';
import { 
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, 
  DialogTitle, Grid, TextField, MenuItem, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, 
  Alert, IconButton, TablePagination
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, AssignmentTurnedIn as ChecklistIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import { 
  GET_HOMEWORK, GET_CLASSES, GET_SECTIONS, GET_SUBJECTS, CREATE_HOMEWORK, 
  GET_TEACHERS, UPDATE_HOMEWORK, DELETE_HOMEWORK, GET_STUDENTS,
  GET_HOMEWORK_SUBMISSIONS, SUBMIT_HOMEWORK, GRADE_HOMEWORK 
} from '../graphql/operations';
import CustomDatePicker from '../components/CustomDatePicker';

function HomeworkList() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // States
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [homeworkToDelete, setHomeworkToDelete] = useState(null);
  const [page, setPage] = useState(0);

  // Homework Submissions Grading States
  const [openSubmissionsModal, setOpenSubmissionsModal] = useState(false);
  const [activeHomeworkForSubmissions, setActiveHomeworkForSubmissions] = useState(null);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [gradePoints, setGradePoints] = useState('');
  const [feedback, setFeedback] = useState('');

  // Reset page when class or section selection changes
  useEffect(() => {
    setPage(0);
  }, [classId, sectionId]);

  // Form States for creation
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');

  // Queries
  const { data: classesData } = useQuery(GET_CLASSES);
  
  const { data: sectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: classId || undefined }
  });

  const { data: subjectsData } = useQuery(GET_SUBJECTS, {
    variables: { classId: classId || undefined }
  });

  const { data: teachersData } = useQuery(GET_TEACHERS);

  const { loading: hwLoading, error: hwError, data: hwData, refetch } = useQuery(GET_HOMEWORK, {
    skip: !classId || !sectionId,
    variables: { classId, sectionId }
  });

  // Submissions Query
  const { data: submissionsData, refetch: refetchSubmissions, loading: submissionsLoading } = useQuery(GET_HOMEWORK_SUBMISSIONS, {
    variables: { homeworkId: activeHomeworkForSubmissions?.id },
    skip: !activeHomeworkForSubmissions
  });

  // Students Query for the class & section of the active homework
  const { data: studentsData, loading: studentsLoading } = useQuery(GET_STUDENTS, {
    variables: { 
      classId: activeHomeworkForSubmissions?.classId?.id, 
      sectionId: activeHomeworkForSubmissions?.sectionId?.id 
    },
    skip: !activeHomeworkForSubmissions
  });

  // Mutations
  const [createHomeworkMutation, { loading: addLoading }] = useMutation(CREATE_HOMEWORK, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Homework assigned successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateHomeworkMutation, { loading: updateLoading }] = useMutation(UPDATE_HOMEWORK, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Homework updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteHomeworkMutation, { loading: deleteLoading }] = useMutation(DELETE_HOMEWORK, {
    onCompleted: () => {
      setHomeworkToDelete(null);
      refetch();
      dispatch(showToast({ message: 'Homework deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [submitHomeworkMutation, { loading: submitHomeworkLoading }] = useMutation(SUBMIT_HOMEWORK, {
    onCompleted: () => {
      refetchSubmissions();
      dispatch(showToast({ message: 'Homework marked as completed for student!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [gradeHomeworkMutation, { loading: gradeHomeworkLoading }] = useMutation(GRADE_HOMEWORK, {
    onCompleted: () => {
      setEditingSubmission(null);
      refetchSubmissions();
      dispatch(showToast({ message: 'Grade and feedback saved successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearForm = () => {
    setTitle('');
    setDescription('');
    setFormSubjectId('');
    setDueDate('');
    setFormTeacherId('');
    setFormError('');
    setSelectedHomework(null);
  };

  const handleOpenAssign = () => {
    clearForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (hw) => {
    setSelectedHomework(hw);
    setTitle(hw.title || '');
    setDescription(hw.description || '');
    setFormSubjectId(hw.subjectId?.id || '');
    setDueDate(hw.dueDate ? hw.dueDate.slice(0, 10) : '');
    setFormTeacherId(hw.teacherId?.id || '');
    setFormError('');
    setOpenModal(true);
  };

  const handleConfirmDelete = () => {
    if (!homeworkToDelete) return;
    deleteHomeworkMutation({ variables: { id: homeworkToDelete.id } });
  };

  const handleOpenSubmissions = (hw) => {
    setActiveHomeworkForSubmissions(hw);
    setOpenSubmissionsModal(true);
    setEditingSubmission(null);
  };

  const handleCloseSubmissions = () => {
    setOpenSubmissionsModal(false);
    setActiveHomeworkForSubmissions(null);
    setEditingSubmission(null);
  };

  const handleMarkCompleted = (studentId) => {
    if (!activeHomeworkForSubmissions) return;
    submitHomeworkMutation({
      variables: {
        homeworkId: activeHomeworkForSubmissions.id,
        studentId,
        submissionText: 'Marked as completed by teacher'
      }
    });
  };

  const handleStartGrading = (sub) => {
    setEditingSubmission(sub);
    setGradePoints(sub.gradePoints !== undefined && sub.gradePoints !== null ? sub.gradePoints.toString() : '100');
    setFeedback(sub.feedback || '');
  };

  const handleSaveGrade = (e) => {
    e.preventDefault();
    if (!editingSubmission) return;
    const pts = parseFloat(gradePoints);
    if (isNaN(pts) || pts < 0 || pts > 100) {
      dispatch(showToast({ message: 'Grade points must be a number between 0 and 100.', severity: 'warning' }));
      return;
    }
    gradeHomeworkMutation({
      variables: {
        submissionId: editingSubmission.id,
        gradePoints: pts,
        feedback: feedback || ''
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!title || !description || !formSubjectId || !dueDate) {
      setFormError('Please fill in all fields.');
      return;
    }

    // If the requester is an admin, require selecting a teacher
    if (['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user?.role) && !formTeacherId) {
      setFormError('Please select a Teacher to assign this homework.');
      return;
    }

    const variables = {
      title,
      description,
      classId,
      sectionId,
      subjectId: formSubjectId,
      dueDate: new Date(dueDate)
    };

    if (formTeacherId) variables.teacherId = formTeacherId;

    if (selectedHomework) {
      updateHomeworkMutation({
        variables: {
          id: selectedHomework.id,
          ...variables
        }
      });
      return;
    }

    createHomeworkMutation({ variables });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Homework Board
        </Typography>
        {['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'CLASS_TEACHER'].includes(user?.role) && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            disabled={!classId || !sectionId}
            onClick={handleOpenAssign}
            sx={{ width: { xs: '100%', sm: 'auto' }, background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF' }}
          >
            Assign Homework
          </Button>
        )}
      </Box>

      {/* Selectors */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Select Class"
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSectionId('');
                }}
              >
                {classesData?.getClasses.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Select Section"
                value={sectionId}
                disabled={!classId}
                onChange={(e) => setSectionId(e.target.value)}
              >
                {sectionsData?.getSections.map((sec) => (
                  <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      {!classId || !sectionId ? (
        <Alert severity="info">Please select a Class and Section to load assignments.</Alert>
      ) : hwLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : hwError ? (
        <Alert severity="error">{hwError.message}</Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 780 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Homework Title</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Assigned Task Description</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Assigned By</TableCell>
                  {['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'CLASS_TEACHER'].includes(user?.role) && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {(hwData?.getHomework || [])
                  .slice(page * 10, (page + 1) * 10)
                  .map((hw) => (
                    <TableRow key={hw.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{hw.title}</TableCell>
                      <TableCell>{hw.subjectId?.name}</TableCell>
                      <TableCell>{hw.description}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>{new Date(hw.dueDate).toISOString().split('T')[0]}</TableCell>
                      <TableCell>{hw.teacherId ? `Prof. ${hw.teacherId.firstName} ${hw.teacherId.lastName}` : '-'}</TableCell>
                      {['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'CLASS_TEACHER'].includes(user?.role) && (
                        <TableCell align="right">
                          <IconButton aria-label="Grade homework submissions" color="success" onClick={() => handleOpenSubmissions(hw)}>
                            <ChecklistIcon />
                          </IconButton>
                          <IconButton aria-label="Edit homework" color="primary" onClick={() => handleOpenEdit(hw)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton aria-label="Delete homework" color="error" onClick={() => setHomeworkToDelete(hw)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                {(!hwData?.getHomework || hwData.getHomework.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'CLASS_TEACHER'].includes(user?.role) ? 6 : 5} align="center">No data</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {hwData?.getHomework?.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10]}
              component="div"
              count={hwData.getHomework.length}
              rowsPerPage={10}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
            />
          )}
        </>
      )}

      {/* Assign/Edit Homework Dialog */}
      <Dialog open={openModal} onClose={clearForm} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedHomework ? 'Edit Class Homework' : 'Assign Class Homework'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth required label="Homework Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required multiline rows={3} label="Task Instructions / Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth required select label="Select Subject" 
                  value={formSubjectId} 
                  onChange={(e) => setFormSubjectId(e.target.value)}
                >
                  {subjectsData?.getSubjects.map((sub) => (
                    <MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              {['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user?.role) && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Assign Teacher"
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                  >
                    <MenuItem value="">Select a Teacher</MenuItem>
                    {teachersData?.getTeachers?.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{`${t.firstName} ${t.lastName}`}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <CustomDatePicker fullWidth required label="Due Date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Button onClick={clearForm} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addLoading || updateLoading}>
              {addLoading || updateLoading ? 'Saving...' : selectedHomework ? 'Save Changes' : 'Assign Homework'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Homework Dialog */}
      <Dialog open={Boolean(homeworkToDelete)} onClose={() => setHomeworkToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Homework</DialogTitle>
        <DialogContent>
          <Typography>
            Delete homework task "{homeworkToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setHomeworkToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submissions & Grading Dialog */}
      <Dialog open={openSubmissionsModal} onClose={handleCloseSubmissions} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {editingSubmission ? 'Grade Submission' : 'Submissions & Homework Completion'}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {activeHomeworkForSubmissions?.title}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {submissionsLoading || studentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : editingSubmission ? (
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
                Student: {editingSubmission.studentId?.firstName} {editingSubmission.studentId?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Submission Date: {new Date(editingSubmission.submissionDate).toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Submitted Text:</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', mb: 3 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                  {editingSubmission.submissionText || '(No submission text provided)'}
                </Typography>
              </Paper>
              
              <form onSubmit={handleSaveGrade}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Grade Points (0-100)"
                      value={gradePoints}
                      onChange={(e) => setGradePoints(e.target.value)}
                      inputProps={{ min: 0, max: 100, step: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                  <Button variant="outlined" onClick={() => setEditingSubmission(null)}>
                    Back to List
                  </Button>
                  <Button variant="contained" type="submit" disabled={gradeHomeworkLoading}>
                    {gradeHomeworkLoading ? 'Saving...' : 'Save Grade'}
                  </Button>
                </Box>
              </form>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 450 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Completion Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const students = studentsData?.getStudents || [];
                    const submissions = submissionsData?.getHomeworkSubmissions || [];
                    const merged = students.map(student => {
                      const sub = submissions.find(s => s.studentId?.id === student.id);
                      return { student, sub };
                    });

                    if (merged.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            No students found in this class & section.
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return merged.map(({ student, sub }) => (
                      <TableRow key={student.id} hover>
                        <TableCell>{student.rollNo || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>
                          {!sub ? (
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                              Pending
                            </Typography>
                          ) : sub.status === 'GRADED' ? (
                            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>
                              Graded ({sub.gradePoints}/100)
                            </Typography>
                          ) : (
                            <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 700 }}>
                              Submitted (Pending Grade)
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {!sub ? (
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="success"
                              disabled={submitHomeworkLoading}
                              onClick={() => handleMarkCompleted(student.id)}
                              sx={{ textTransform: 'none' }}
                            >
                              Mark Completed
                            </Button>
                          ) : (
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="primary"
                              onClick={() => handleStartGrading(sub)}
                              sx={{ textTransform: 'none' }}
                            >
                              {sub.status === 'GRADED' ? 'Edit Grade' : 'Grade'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseSubmissions} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default HomeworkList;
