import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  Box, Button, Card, CardContent, Grid, TextField, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, CircularProgress, Alert, Checkbox,
  TablePagination
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import { 
  GET_CLASSES, 
  GET_SECTIONS, 
  GET_SUBJECTS, 
  GET_COPY_SUBMISSIONS, 
  SAVE_COPY_SUBMISSIONS 
} from '../graphql/operations';

function CopySubmission() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  
  const [completedMap, setCompletedMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
    setCompletedMap({});
    setRemarksMap({});
  }, [classId, sectionId, subjectId]);

  // Queries
  const { data: classesData } = useQuery(GET_CLASSES);
  
  const { data: sectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: classId || undefined },
    skip: !classId
  });

  const { data: subjectsData } = useQuery(GET_SUBJECTS, {
    variables: { classId: classId || undefined },
    skip: !classId
  });

  const { loading: submissionsLoading, error: submissionsError, data: submissionsData } = useQuery(GET_COPY_SUBMISSIONS, {
    skip: !classId || !sectionId || !subjectId,
    variables: { classId, sectionId, subjectId },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const cmp = {};
      const rem = {};
      data.getCopySubmissions.forEach(rec => {
        if (rec.studentId?.id) {
          cmp[rec.studentId.id] = rec.isCompleted;
          rem[rec.studentId.id] = rec.remarks || '';
        }
      });
      setCompletedMap(cmp);
      setRemarksMap(rem);
    }
  });

  // Mutation
  const [saveCopySubmissionsMutation, { loading: saveLoading }] = useMutation(SAVE_COPY_SUBMISSIONS, {
    onCompleted: () => {
      dispatch(showToast({ message: 'Copy submissions saved successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: 'Error saving: ' + err.message, severity: 'error' }));
    }
  });

  const handleCheckboxChange = (studentId, checked) => {
    setCompletedMap(prev => ({
      ...prev,
      [studentId]: checked
    }));
  };

  const handleRemarkChange = (studentId, text) => {
    setRemarksMap(prev => ({
      ...prev,
      [studentId]: text
    }));
  };

  const handleSave = () => {
    if (!classId || !sectionId || !subjectId) return;

    const submissions = Object.keys(completedMap).map(studentId => ({
      studentId,
      isCompleted: completedMap[studentId] || false,
      remarks: remarksMap[studentId] || ''
    }));

    saveCopySubmissionsMutation({
      variables: {
        classId,
        sectionId,
        subjectId,
        submissions
      }
    });
  };

  const studentsList = submissionsData?.getCopySubmissions || [];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 3, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
        Fair Copy Submission Module
      </Typography>

      {/* Selectors */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
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

            <Grid item xs={12} sm={4}>
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

            <Grid item xs={12} sm={4}>
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

      {/* Student List & Submissions */}
      {classId && sectionId && subjectId ? (
        <Box>
          {submissionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : submissionsError ? (
            <Alert severity="error">{submissionsError.message}</Alert>
          ) : (
            <Box>
              <TableContainer component={Paper} sx={{ mb: 3, overflowX: 'auto' }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Copy Completed</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Remarks / Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentsList
                      .slice(page * 10, (page + 1) * 10)
                      .map((record) => {
                        const student = record.studentId;
                        return (
                          <TableRow key={student.id} hover>
                            <TableCell>{student.rollNo || '-'}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{`${student.firstName} ${student.lastName}`}</TableCell>
                            <TableCell align="center">
                              <Checkbox
                                checked={!!completedMap[student.id]}
                                onChange={(e) => handleCheckboxChange(student.id, e.target.checked)}
                                color="success"
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="Add copy remarks..."
                                value={remarksMap[student.id] || ''}
                                onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {studentsList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No students enrolled in this class/section.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {studentsList.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[10]}
                  component="div"
                  count={studentsList.length}
                  rowsPerPage={10}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  sx={{ mb: 2 }}
                />
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  disabled={saveLoading} 
                  onClick={handleSave} 
                  sx={{ 
                    background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', 
                    color: '#FFFFFF', 
                    px: 4, 
                    fontWeight: 700,
                    width: { xs: '100%', sm: 'auto' } 
                  }}
                >
                  {saveLoading ? 'Saving...' : 'Save Submissions'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
              Please select Class, Section, and Subject to manage submissions.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default CopySubmission;
