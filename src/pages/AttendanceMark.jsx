import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  Box, Button, Card, CardContent, Grid, TextField, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, CircularProgress, Alert, ToggleButton, ToggleButtonGroup,
  TablePagination
} from '@mui/material';
import { useSelector } from 'react-redux';
import { GET_CLASSES, GET_SECTIONS, GET_STUDENTS, MARK_BULK_ATTENDANCE, GET_SCHOOL_ADMIN_DASHBOARD, GET_SHIFTS } from '../graphql/operations';
import CustomDatePicker from '../components/CustomDatePicker';

function AttendanceMark() {
  const { user } = useSelector((state) => state.auth);
  const isAdminOrPrincipal = ['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [remarksRecords, setRemarksRecords] = useState({});
  const [saveStatus, setSaveStatus] = useState('');
  const [page, setPage] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState('');

  useEffect(() => {
    if (classId && sectionId && date) {
      const stored = localStorage.getItem(`last_attendance_${classId}_${sectionId}_${date}`);
      setLastSavedTime(stored || '');
    } else {
      setLastSavedTime('');
    }
  }, [classId, sectionId, date]);

  useEffect(() => {
    setPage(0);
  }, [classId, sectionId, date]);

  // Queries
  const { data: classesData } = useQuery(GET_CLASSES);
  const { data: shiftsData } = useQuery(GET_SHIFTS);
  
  const { data: sectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: classId || undefined }
  });

  const filteredSections = (sectionsData?.getSections || []).filter(
    (sec) => !selectedShiftId || sec.shiftId?.id === selectedShiftId
  );

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
    refetchQueries: isAdminOrPrincipal ? ['GetSchoolAdminDashboard'] : [],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setSaveStatus('Attendance saved successfully!');
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const dateStr = `${day}/${month}/${year}`;
      
      const infoStr = `${timeStr} on ${dateStr}`;
      localStorage.setItem(`last_attendance_${classId}_${sectionId}_${date}`, infoStr);
      setLastSavedTime(infoStr);

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
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                select
                label="Select Shift (Optional)"
                value={selectedShiftId}
                onChange={(e) => {
                  setSelectedShiftId(e.target.value);
                  setSectionId('');
                }}
              >
                <MenuItem value="">All Shifts</MenuItem>
                {shiftsData?.getShifts?.map((shift) => (
                  <MenuItem key={shift.id} value={shift.id}>
                    {shift.name} ({shift.startTime} - {shift.endTime})
                  </MenuItem>
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
                {filteredSections.map((sec) => (
                  <MenuItem key={sec.id} value={sec.id}>
                    {sec.name} {sec.shiftId ? `(${sec.shiftId.name})` : '(Default)'}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3}>
              <CustomDatePicker
                fullWidth
                label="Attendance Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Grid>
          </Grid>

          {sectionId && (
            (() => {
              const selectedSecObj = sectionsData?.getSections?.find(sec => sec.id === sectionId);
              if (selectedSecObj?.shiftId) {
                return (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                      Selected Shift:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedSecObj.shiftId.name} ({selectedSecObj.shiftId.startTime} - {selectedSecObj.shiftId.endTime})
                    </Typography>
                  </Box>
                );
              }
              return (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Selected Shift: Default Shift
                  </Typography>
                </Box>
              );
            })()
          )}
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
                {(studentsData?.getStudents || [])
                  .slice(page * 10, (page + 1) * 10)
                  .map((st) => (
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
                {(!studentsData?.getStudents || studentsData.getStudents.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No data</TableCell>
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

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, mt: 2 }}>
            <Button variant="contained" disabled={saveLoading} onClick={handleSave} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              {saveLoading ? 'Saving Register...' : 'Save Attendance'}
            </Button>
            {lastSavedTime && (
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  fontStyle: 'italic', 
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                Last attendance taken on {lastSavedTime}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default AttendanceMark;
