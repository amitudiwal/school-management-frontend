import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  Box, Button, Card, CardContent, Grid, TextField, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, CircularProgress, Alert, IconButton, TablePagination
} from '@mui/material';
import { Save as SaveIcon, CheckCircle as SuccessIcon } from '@mui/icons-material';
import { 
  GET_CLASSES, GET_SECTIONS, GET_STUDENTS, GET_EXAMS, GET_SUBJECTS, 
  ENTER_STUDENT_MARKS, GET_EXAM_SCHEDULES
} from '../graphql/operations';

const GRADE_OPTIONS = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];

function GradesEntry() {
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  
  const [marksData, setMarksData] = useState({}); // { [studentId]: marks }
  const [gradesData, setGradesData] = useState({}); // { [studentId]: grade }
  const [remarksData, setRemarksData] = useState({}); // { [studentId]: remarks }
  
  const [rowStatus, setRowStatus] = useState({}); // { [studentId]: 'idle' | 'loading' | 'success' | 'error' }
  const [alertMsg, setAlertMsg] = useState('');
  const [page, setPage] = useState(0);

  // Queries
  const { data: classesData } = useQuery(GET_CLASSES);
  const { data: examsData } = useQuery(GET_EXAMS);
  
  const { data: sectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: classId || undefined }
  });

  const { data: schedulesData } = useQuery(GET_EXAM_SCHEDULES, {
    skip: !examId || !classId,
    variables: { examId, classId }
  });

  const scheduledSubjects = React.useMemo(() => {
    if (!schedulesData?.getExamSchedules) return [];
    
    // Extract subjectId objects and filter out duplicates
    const subjectsMap = {};
    schedulesData.getExamSchedules.forEach(schedule => {
      if (schedule.subjectId) {
        subjectsMap[schedule.subjectId.id] = schedule.subjectId;
      }
    });
    
    return Object.values(subjectsMap);
  }, [schedulesData]);

  const { loading: studentsLoading, error: studentsError, data: studentsData } = useQuery(GET_STUDENTS, {
    skip: !classId || !sectionId,
    variables: { classId, sectionId },
    onCompleted: (data) => {
      const initialMarks = {};
      const initialGrades = {};
      const initialRemarks = {};
      const initialStatuses = {};
      
      data.getStudents.forEach(st => {
        initialMarks[st.id] = '';
        initialGrades[st.id] = 'A';
        initialRemarks[st.id] = '';
        initialStatuses[st.id] = 'idle';
      });
      
      setMarksData(initialMarks);
      setGradesData(initialGrades);
      setRemarksData(initialRemarks);
      setRowStatus(initialStatuses);
    }
  });

  // Reset student states when filters change
  React.useEffect(() => {
    setPage(0);
    if (studentsData?.getStudents) {
      const initialMarks = {};
      const initialGrades = {};
      const initialRemarks = {};
      const initialStatuses = {};
      
      studentsData.getStudents.forEach(st => {
        initialMarks[st.id] = '';
        initialGrades[st.id] = 'A';
        initialRemarks[st.id] = '';
        initialStatuses[st.id] = 'idle';
      });
      
      setMarksData(initialMarks);
      setGradesData(initialGrades);
      setRemarksData(initialRemarks);
      setRowStatus(initialStatuses);
    } else {
      setMarksData({});
      setGradesData({});
      setRemarksData({});
      setRowStatus({});
    }
  }, [examId, subjectId, classId, sectionId, studentsData]);

  // Mutation
  const [enterMarksMutation] = useMutation(ENTER_STUDENT_MARKS);

  const handleFieldChange = (studentId, field, value) => {
    if (field === 'marks') {
      setMarksData(prev => ({ ...prev, [studentId]: value }));
    } else if (field === 'grade') {
      setGradesData(prev => ({ ...prev, [studentId]: value }));
    } else if (field === 'remarks') {
      setRemarksData(prev => ({ ...prev, [studentId]: value }));
    }
    // Reset status back to idle if changed
    setRowStatus(prev => ({ ...prev, [studentId]: 'idle' }));
  };

  const handleSaveRow = async (studentId) => {
    if (!examId || !subjectId) {
      setAlertMsg('Please select both Exam and Subject before saving.');
      return;
    }
    
    const marksObtained = parseFloat(marksData[studentId]);
    if (isNaN(marksObtained) || marksObtained < 0) {
      setRowStatus(prev => ({ ...prev, [studentId]: 'error' }));
      return;
    }

    setRowStatus(prev => ({ ...prev, [studentId]: 'loading' }));
    
    try {
      await enterMarksMutation({
        variables: {
          studentId,
          examId,
          subjectId,
          marksObtained,
          grade: gradesData[studentId],
          remarks: remarksData[studentId] || ''
        }
      });
      setRowStatus(prev => ({ ...prev, [studentId]: 'success' }));
    } catch (err) {
      console.error(err);
      setRowStatus(prev => ({ ...prev, [studentId]: 'error' }));
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 3, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
        Student Grades & Marks Entry
      </Typography>

      {/* Selectors */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                select
                label="Select Exam"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
              >
                {examsData?.getExams?.map((ex) => (
                  <MenuItem key={ex.id} value={ex.id}>{ex.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
 
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                select
                label="Select Class"
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSectionId('');
                  setSubjectId('');
                }}
              >
                {classesData?.getClasses?.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
 
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                select
                label="Select Section"
                value={sectionId}
                disabled={!classId}
                onChange={(e) => setSectionId(e.target.value)}
              >
                {sectionsData?.getSections?.map((sec) => (
                  <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
 
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                select
                label="Select Subject"
                value={subjectId}
                disabled={!classId || !examId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                {scheduledSubjects.length === 0 ? (
                  <MenuItem disabled value="">
                    {(!examId || !classId) ? 'Select Exam & Class first' : 'No scheduled subjects'}
                  </MenuItem>
                ) : (
                  scheduledSubjects.map((sub) => (
                    <MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {alertMsg && (
        <Alert severity="warning" onClose={() => setAlertMsg('')} sx={{ mb: 2 }}>
          {alertMsg}
        </Alert>
      )}

      {/* Students list for marking */}
      {!classId || !sectionId || !examId || !subjectId ? (
        <Alert severity="info">Please select Exam, Class, Section, and Subject to load the student list.</Alert>
      ) : studentsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : studentsError ? (
        <Alert severity="error">{studentsError.message}</Alert>
      ) : (
        <Box>
          <TableContainer component={Paper} sx={{ mb: 3, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell width="12%">Roll No</TableCell>
                  <TableCell width="25%">Student Name</TableCell>
                  <TableCell width="18%">Marks Obtained</TableCell>
                  <TableCell width="15%">Grade</TableCell>
                  <TableCell width="22%">Remarks</TableCell>
                  <TableCell width="8%" align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(studentsData?.getStudents || [])
                  .slice(page * 10, (page + 1) * 10)
                  .map((st) => {
                    const status = rowStatus[st.id] || 'idle';
                    return (
                      <TableRow key={st.id} hover>
                        <TableCell>{st.rollNo || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{`${st.firstName} ${st.lastName}`}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            placeholder="e.g. 85"
                            value={marksData[st.id] ?? ''}
                            error={status === 'error'}
                            onChange={(e) => handleFieldChange(st.id, 'marks', e.target.value)}
                            inputProps={{ min: 0, max: 100, step: "0.5" }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            select
                            fullWidth
                            value={gradesData[st.id] || 'A'}
                            onChange={(e) => handleFieldChange(st.id, 'grade', e.target.value)}
                          >
                            {GRADE_OPTIONS.map((g) => (
                              <MenuItem key={g} value={g}>{g}</MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Feedback..."
                            value={remarksData[st.id] || ''}
                            onChange={(e) => handleFieldChange(st.id, 'remarks', e.target.value)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {status === 'loading' ? (
                            <Button
                              variant="contained"
                              disabled
                              size="small"
                              sx={{ borderRadius: 2, textTransform: 'none', minWidth: 100 }}
                            >
                              <CircularProgress size={16} sx={{ mr: 1 }} /> Saving
                            </Button>
                          ) : status === 'success' ? (
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<SuccessIcon />}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, minWidth: 100 }}
                            >
                              Saved
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<SaveIcon />}
                              onClick={() => handleSaveRow(st.id)}
                              disabled={marksData[st.id] === ''}
                              sx={{ 
                                borderRadius: 2, 
                                textTransform: 'none', 
                                fontWeight: 700,
                                minWidth: 100,
                                background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', 
                                color: '#FFFFFF',
                                '&:hover': {
                                  opacity: 0.9,
                                  background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)'
                                },
                                '&.Mui-disabled': {
                                  background: 'action.disabledBackground',
                                  color: 'action.disabled'
                                }
                              }}
                            >
                              Save
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {(!studentsData?.getStudents || studentsData.getStudents.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No data</TableCell>
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
        </Box>
      )}
    </Box>
  );
}

export default GradesEntry;
