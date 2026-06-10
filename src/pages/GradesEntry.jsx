import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  Box, Button, Card, CardContent, Grid, TextField, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, CircularProgress, Alert, IconButton
} from '@mui/material';
import { Save as SaveIcon, CheckCircle as SuccessIcon } from '@mui/icons-material';
import { 
  GET_CLASSES, GET_SECTIONS, GET_STUDENTS, GET_EXAMS, GET_SUBJECTS, 
  ENTER_STUDENT_MARKS 
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

  // Queries
  const { data: classesData } = useQuery(GET_CLASSES);
  const { data: examsData } = useQuery(GET_EXAMS);
  
  const { data: sectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: classId || undefined }
  });

  const { data: subjectsData } = useQuery(GET_SUBJECTS, {
    variables: { classId: classId || undefined }
  });

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
                {examsData?.getExams.map((ex) => (
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
                {classesData?.getClasses.map((cls) => (
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
                {sectionsData?.getSections.map((sec) => (
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
                disabled={!classId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                {subjectsData?.getSubjects.map((sub) => (
                  <MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>
                ))}
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
                {studentsData?.getStudents.map((st) => {
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
                          <CircularProgress size={24} />
                        ) : status === 'success' ? (
                          <SuccessIcon color="success" />
                        ) : (
                          <IconButton 
                            color="primary" 
                            onClick={() => handleSaveRow(st.id)}
                            disabled={marksData[st.id] === ''}
                          >
                            <SaveIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}

export default GradesEntry;
