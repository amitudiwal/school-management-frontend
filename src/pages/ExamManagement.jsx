import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Button, Card, CardContent, Grid, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, CircularProgress, Alert, IconButton, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Assignment as ExamIcon,
  CalendarToday as ScheduleIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import CustomDatePicker from '../components/CustomDatePicker';
import {
  GET_EXAMS,
  CREATE_EXAM,
  DELETE_EXAM,
  GET_CLASSES,
  GET_SUBJECTS,
  GET_EXAM_SCHEDULES,
  CREATE_EXAM_SCHEDULE,
  DELETE_EXAM_SCHEDULE
} from '../graphql/operations';

function ExamManagement() {
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [pageExams, setPageExams] = useState(0);
  const [pageSchedules, setPageSchedules] = useState(0);

  // Exam Term States
  const [openExamModal, setOpenExamModal] = useState(false);
  const [examName, setExamName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [examError, setExamError] = useState('');
  const [examToDelete, setExamToDelete] = useState(null);

  // Exam Schedule States
  const [filterExamId, setFilterExamId] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [openScheduleModal, setOpenScheduleModal] = useState(false);
  const [schedSubjectId, setSchedSubjectId] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedStartTime, setSchedStartTime] = useState('');
  const [schedEndTime, setSchedEndTime] = useState('');
  const [schedMaxMarks, setSchedMaxMarks] = useState('100');
  const [schedPassMarks, setSchedPassMarks] = useState('40');
  const [schedRoomNo, setSchedRoomNo] = useState('');
  const [schedError, setSchedError] = useState('');
  const [schedToDelete, setSchedToDelete] = useState(null);

  // Reset pageSchedules when filters change
  React.useEffect(() => {
    setPageSchedules(0);
  }, [filterExamId, filterClassId]);

  // Dropdown Queries
  const { data: examsData, loading: examsLoading, refetch: refetchExams } = useQuery(GET_EXAMS);
  const { data: classesData } = useQuery(GET_CLASSES);
  const { data: subjectsData } = useQuery(GET_SUBJECTS, {
    variables: { classId: filterClassId || undefined },
    skip: !filterClassId
  });

  // Schedule Query
  const { data: schedulesData, loading: schedulesLoading, refetch: refetchSchedules } = useQuery(GET_EXAM_SCHEDULES, {
    variables: { examId: filterExamId || undefined, classId: filterClassId || undefined },
    skip: !filterExamId || !filterClassId
  });

  // Mutations
  const [createExam, { loading: createExamLoading }] = useMutation(CREATE_EXAM, {
    onCompleted: () => {
      setOpenExamModal(false);
      clearExamForm();
      refetchExams();
      dispatch(showToast({ message: 'Exam term created successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setExamError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteExamMutation] = useMutation(DELETE_EXAM, {
    onCompleted: () => {
      setExamToDelete(null);
      refetchExams();
      refetchSchedules();
      dispatch(showToast({ message: 'Exam term deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [createExamSchedule, { loading: createScheduleLoading }] = useMutation(CREATE_EXAM_SCHEDULE, {
    onCompleted: () => {
      setOpenScheduleModal(false);
      clearScheduleForm();
      refetchSchedules();
      dispatch(showToast({ message: 'Subject exam scheduled successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setSchedError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteExamScheduleMutation] = useMutation(DELETE_EXAM_SCHEDULE, {
    onCompleted: () => {
      setSchedToDelete(null);
      refetchSchedules();
      dispatch(showToast({ message: 'Exam schedule deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearExamForm = () => {
    setExamName('');
    setAcademicYear('');
    setStartDate('');
    setEndDate('');
    setExamDesc('');
    setExamError('');
  };

  const clearScheduleForm = () => {
    setSchedSubjectId('');
    setSchedDate('');
    setSchedStartTime('');
    setSchedEndTime('');
    setSchedMaxMarks('100');
    setSchedPassMarks('40');
    setSchedRoomNo('');
    setSchedError('');
  };

  const handleExamSubmit = (e) => {
    e.preventDefault();
    setExamError('');
    if (!examName || !academicYear) {
      setExamError('Exam term name and academic year are required.');
      return;
    }
    createExam({
      variables: {
        name: examName,
        academicYear,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        description: examDesc || undefined
      }
    });
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    setSchedError('');
    if (!schedSubjectId || !schedDate || !schedStartTime || !schedEndTime || !schedMaxMarks || !schedPassMarks) {
      setSchedError('Please fill in all required fields.');
      return;
    }
    const max = parseFloat(schedMaxMarks);
    const pass = parseFloat(schedPassMarks);
    if (pass > max) {
      setSchedError('Passing marks cannot exceed maximum marks.');
      return;
    }
    createExamSchedule({
      variables: {
        examId: filterExamId,
        classId: filterClassId,
        subjectId: schedSubjectId,
        date: new Date(schedDate),
        startTime: schedStartTime,
        endTime: schedEndTime,
        maxMarks: max,
        passMarks: pass,
        roomNo: schedRoomNo || undefined
      }
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Exam & Schedule Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
          {tabValue === 0 ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { clearExamForm(); setOpenExamModal(true); }}
              sx={{ background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF', fontWeight: 700 }}
            >
              Add Exam Term
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!filterExamId || !filterClassId}
              onClick={() => { clearScheduleForm(); setOpenScheduleModal(true); }}
              sx={{ background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF', fontWeight: 700 }}
            >
              Schedule Subject Exam
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab icon={<ExamIcon />} iconPosition="start" label="Exam Terms" sx={{ fontWeight: 700 }} />
        <Tab icon={<ScheduleIcon />} iconPosition="start" label="Exam Scheduling" sx={{ fontWeight: 700 }} />
      </Tabs>

      {/* EXAM TERMS TAB */}
      {tabValue === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Configure exam terms (e.g. Mid-Term, Final Exams) for each academic cycle. These terms are used to pool marks and print unified report cards.
              </Typography>
            </CardContent>
          </Card>

          {examsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Exam Term Name</TableCell>
                      <TableCell>Academic Year</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(examsData?.getExams || [])
                      .slice(pageExams * 10, (pageExams + 1) * 10)
                      .map((ex) => (
                        <TableRow key={ex.id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{ex.name}</TableCell>
                          <TableCell>{ex.academicYear}</TableCell>
                          <TableCell>{ex.startDate ? new Date(ex.startDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{ex.endDate ? new Date(ex.endDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{ex.description || '-'}</TableCell>
                          <TableCell align="right">
                            <IconButton color="error" onClick={() => setExamToDelete(ex)}><DeleteIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    {(!examsData?.getExams || examsData.getExams.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No data</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {examsData?.getExams?.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[10]}
                  component="div"
                  count={examsData.getExams.length}
                  rowsPerPage={10}
                  page={pageExams}
                  onPageChange={(e, newPage) => setPageExams(newPage)}
                />
              )}
            </>
          )}
        </Box>
      )}

      {/* EXAM SCHEDULING TAB */}
      {tabValue === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Select Exam Term"
                    value={filterExamId}
                    onChange={(e) => setFilterExamId(e.target.value)}
                  >
                    {examsData?.getExams.map((ex) => (
                      <MenuItem key={ex.id} value={ex.id}>{ex.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Select Class"
                    value={filterClassId}
                    onChange={(e) => setFilterClassId(e.target.value)}
                  >
                    {classesData?.getClasses.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {!filterExamId || !filterClassId ? (
            <Alert severity="info">Please select both an Exam Term and a Class to view and manage exam schedules.</Alert>
          ) : schedulesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject Name</TableCell>
                      <TableCell>Subject Code</TableCell>
                      <TableCell>Exam Date</TableCell>
                      <TableCell>Time Slot</TableCell>
                      <TableCell>Room No</TableCell>
                      <TableCell align="right">Max Marks</TableCell>
                      <TableCell align="right">Passing Marks</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(schedulesData?.getExamSchedules || [])
                      .slice(pageSchedules * 10, (pageSchedules + 1) * 10)
                      .map((sc) => (
                        <TableRow key={sc.id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{sc.subjectId?.name || '-'}</TableCell>
                          <TableCell>{sc.subjectId?.code || '-'}</TableCell>
                          <TableCell>{sc.date ? new Date(sc.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{`${sc.startTime} - ${sc.endTime}`}</TableCell>
                          <TableCell>{sc.roomNo || '-'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{sc.maxMarks}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{sc.passMarks}</TableCell>
                          <TableCell align="right">
                            <IconButton color="error" onClick={() => setSchedToDelete(sc)}><DeleteIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    {(!schedulesData?.getExamSchedules || schedulesData.getExamSchedules.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">No data</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {schedulesData?.getExamSchedules?.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[10]}
                  component="div"
                  count={schedulesData.getExamSchedules.length}
                  rowsPerPage={10}
                  page={pageSchedules}
                  onPageChange={(e, newPage) => setPageSchedules(newPage)}
                />
              )}
            </>
          )}
        </Box>
      )}

      {/* CREATE EXAM TERM DIALOG */}
      <Dialog open={openExamModal} onClose={() => setOpenExamModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create New Exam Term</DialogTitle>
        <form onSubmit={handleExamSubmit}>
          <DialogContent>
            {examError && <Alert severity="error" sx={{ mb: 2 }}>{examError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth required label="Exam Term Name (e.g. Mid-Term 2026)" value={examName} onChange={(e) => setExamName(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required label="Academic Year (e.g. 2026)" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <CustomDatePicker fullWidth label="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <CustomDatePicker fullWidth label="End Date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} label="Description (Optional)" value={examDesc} onChange={(e) => setExamDesc(e.target.value)} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenExamModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createExamLoading}>
              {createExamLoading ? 'Creating...' : 'Create Exam Term'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* SCHEDULE SUBJECT EXAM DIALOG */}
      <Dialog open={openScheduleModal} onClose={() => setOpenScheduleModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Schedule Subject Exam</DialogTitle>
        <form onSubmit={handleScheduleSubmit}>
          <DialogContent>
            {schedError && <Alert severity="error" sx={{ mb: 2 }}>{schedError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Select Subject"
                  value={schedSubjectId}
                  onChange={(e) => setSchedSubjectId(e.target.value)}
                >
                  {subjectsData?.getSubjects.map((sub) => (
                    <MenuItem key={sub.id} value={sub.id}>{sub.name} ({sub.code})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomDatePicker fullWidth required label="Exam Date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Room Number (Optional)" placeholder="e.g. Room 102" value={schedRoomNo} onChange={(e) => setSchedRoomNo(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Start Time" placeholder="e.g. 09:00 AM" value={schedStartTime} onChange={(e) => setSchedStartTime(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="End Time" placeholder="e.g. 12:00 PM" value={schedEndTime} onChange={(e) => setSchedEndTime(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required type="number" label="Max Marks" value={schedMaxMarks} onChange={(e) => setSchedMaxMarks(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required type="number" label="Passing Marks" value={schedPassMarks} onChange={(e) => setSchedPassMarks(e.target.value)} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenScheduleModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createScheduleLoading}>
              {createScheduleLoading ? 'Scheduling...' : 'Schedule Exam'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DELETE EXAM TERM CONFIRMATION */}
      <Dialog open={Boolean(examToDelete)} onClose={() => setExamToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Exam Term</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete exam term "{examToDelete?.name}"? 
          </Typography>
          <Typography color="error" variant="caption" display="block" sx={{ mt: 1, fontWeight: 700 }}>
            WARNING: This will permanently delete all subject schedules mapped to this exam term!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setExamToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={() => deleteExamMutation({ variables: { id: examToDelete.id } })} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE EXAM SCHEDULE CONFIRMATION */}
      <Dialog open={Boolean(schedToDelete)} onClose={() => setSchedToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Exam Schedule</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove the exam schedule for subject "{schedToDelete?.subjectId?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setSchedToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={() => deleteExamScheduleMutation({ variables: { id: schedToDelete.id } })} variant="contained" color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ExamManagement;
