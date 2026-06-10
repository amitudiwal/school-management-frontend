import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  Box, Button, Card, CardContent, Grid, TextField, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, CircularProgress, Alert, ToggleButton, ToggleButtonGroup 
} from '@mui/material';
import { GET_CLASSES, GET_SECTIONS, GET_STUDENTS, MARK_BULK_ATTENDANCE } from '../graphql/operations';

function AttendanceMark() {
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [remarksRecords, setRemarksRecords] = useState({});
  const [saveStatus, setSaveStatus] = useState('');

  // Queries
  const { data: classesData } = useQuery(GET_CLASSES);
  
  const { data: sectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: classId || undefined }
  });

  const { loading: studentsLoading, error: studentsError, data: studentsData } = useQuery(GET_STUDENTS, {
    skip: !classId || !sectionId,
    variables: { classId, sectionId },
    onCompleted: (data) => {
      // Pre-populate all students as PRESENT by default
      const initialAttendance = {};
      const initialRemarks = {};
      data.getStudents.forEach(st => {
        initialAttendance[st.id] = 'PRESENT';
        initialRemarks[st.id] = '';
      });
      setAttendanceRecords(initialAttendance);
      setRemarksRecords(initialRemarks);
    }
  });

  // Mutation
  const [markAttendanceMutation, { loading: saveLoading }] = useMutation(MARK_BULK_ATTENDANCE, {
    onCompleted: () => {
      setSaveStatus('Attendance saved successfully!');
      setTimeout(() => setSaveStatus(''), 4000);
    },
    onError: (err) => {
      setSaveStatus('Error saving: ' + err.message);
    }
  });

  const handleStatusChange = (studentId, nextStatus) => {
    if (!nextStatus) return; // Enforce selection
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: nextStatus
    }));
  };

  const handleRemarkChange = (studentId, text) => {
    setRemarksRecords(prev => ({
      ...prev,
      [studentId]: text
    }));
  };

  const handleSave = () => {
    if (!classId || !sectionId || !date) return;
    
    const records = Object.keys(attendanceRecords).map(studentId => ({
      studentId,
      status: attendanceRecords[studentId],
      remarks: remarksRecords[studentId] || ''
    }));

    markAttendanceMutation({
      variables: {
        classId,
        sectionId,
        date: new Date(date),
        records
      }
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 3, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
        Daily Class Attendance
      </Typography>

      {/* Selectors */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
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
                type="date"
                label="Attendance Date"
                InputLabelProps={{ shrink: true }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {saveStatus && (
        <Alert severity={saveStatus.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {saveStatus}
        </Alert>
      )}

      {/* Students list for marking */}
      {!classId || !sectionId ? (
        <Alert severity="info">Please select a Class and a Section to load the student attendance roster.</Alert>
      ) : studentsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : studentsError ? (
        <Alert severity="error">{studentsError.message}</Alert>
      ) : (
        <Box>
          <TableContainer component={Paper} sx={{ mb: 3, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Roll No</TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell align="center">Attendance Status</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentsData?.getStudents.map((st) => (
                  <TableRow key={st.id} hover>
                    <TableCell>{st.rollNo || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{`${st.firstName} ${st.lastName}`}</TableCell>
                    <TableCell align="center">
                      <ToggleButtonGroup
                        value={attendanceRecords[st.id] || 'PRESENT'}
                        exclusive
                        onChange={(_, value) => handleStatusChange(st.id, value)}
                        size="small"
                        sx={{ flexWrap: 'nowrap' }}
                      >
                        <ToggleButton value="PRESENT" color="success" sx={{ px: 2, fontWeight: 700 }}>
                          Present
                        </ToggleButton>
                        <ToggleButton value="LATE" color="warning" sx={{ px: 2, fontWeight: 700 }}>
                          Late
                        </ToggleButton>
                        <ToggleButton value="ABSENT" color="error" sx={{ px: 2, fontWeight: 700 }}>
                          Absent
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Add reason/note..."
                        value={remarksRecords[st.id] || ''}
                        onChange={(e) => handleRemarkChange(st.id, e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="contained" disabled={saveLoading} onClick={handleSave} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              {saveLoading ? 'Saving Register...' : 'Save Attendance'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default AttendanceMark;
