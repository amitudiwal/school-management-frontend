import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  Box, Button, Card, CardContent, Grid, TextField, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, CircularProgress, Alert, ToggleButton, ToggleButtonGroup,
  Tabs, Tab
} from '@mui/material';
import { 
  GET_TEACHERS, 
  GET_STAFF, 
  GET_TEACHER_ATTENDANCE, 
  GET_STAFF_ATTENDANCE, 
  MARK_BULK_TEACHER_ATTENDANCE, 
  MARK_BULK_STAFF_ATTENDANCE 
} from '../graphql/operations';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import { People as StaffIcon, PersonAdd as TeacherIcon } from '@mui/icons-material';

function StaffAttendance() {
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Attendance states
  const [teacherAttendance, setTeacherAttendance] = useState({});
  const [teacherRemarks, setTeacherRemarks] = useState({});
  const [staffAttendance, setStaffAttendance] = useState({});
  const [staffRemarks, setStaffRemarks] = useState({});

  // Queries
  const { loading: teachersLoading, error: teachersError, data: teachersData } = useQuery(GET_TEACHERS);
  const { loading: staffLoading, error: staffError, data: staffData } = useQuery(GET_STAFF);

  const { loading: teacherAttLoading } = useQuery(GET_TEACHER_ATTENDANCE, {
    variables: { date: new Date(date) },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const att = {};
      const rem = {};
      // First default everyone to PRESENT
      teachersData?.getTeachers.forEach(t => {
        att[t.id] = 'PRESENT';
        rem[t.id] = '';
      });
      // Then overlay actual database records
      data.getTeacherAttendance.forEach(rec => {
        if (rec.teacherId?.id) {
          att[rec.teacherId.id] = rec.status;
          rem[rec.teacherId.id] = rec.remarks || '';
        }
      });
      setTeacherAttendance(att);
      setTeacherRemarks(rem);
    }
  });

  const { loading: staffAttLoading } = useQuery(GET_STAFF_ATTENDANCE, {
    variables: { date: new Date(date) },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const att = {};
      const rem = {};
      // First default everyone to PRESENT
      staffData?.getStaff.forEach(s => {
        att[s.id] = 'PRESENT';
        rem[s.id] = '';
      });
      // Then overlay actual database records
      data.getStaffAttendance.forEach(rec => {
        if (rec.staffId?.id) {
          att[rec.staffId.id] = rec.status;
          rem[rec.staffId.id] = rec.remarks || '';
        }
      });
      setStaffAttendance(att);
      setStaffRemarks(rem);
    }
  });

  // Mutations
  const [markTeacherAttendanceMutation, { loading: saveTeacherLoading }] = useMutation(MARK_BULK_TEACHER_ATTENDANCE, {
    onCompleted: () => {
      dispatch(showToast({ message: 'Teacher attendance saved successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: 'Error saving: ' + err.message, severity: 'error' }));
    }
  });

  const [markStaffAttendanceMutation, { loading: saveStaffLoading }] = useMutation(MARK_BULK_STAFF_ATTENDANCE, {
    onCompleted: () => {
      dispatch(showToast({ message: 'Staff attendance saved successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: 'Error saving: ' + err.message, severity: 'error' }));
    }
  });

  const handleTeacherStatusChange = (teacherId, nextStatus) => {
    if (!nextStatus) return;
    setTeacherAttendance(prev => ({ ...prev, [teacherId]: nextStatus }));
  };

  const handleTeacherRemarkChange = (teacherId, text) => {
    setTeacherRemarks(prev => ({ ...prev, [teacherId]: text }));
  };

  const handleStaffStatusChange = (staffId, nextStatus) => {
    if (!nextStatus) return;
    setStaffAttendance(prev => ({ ...prev, [staffId]: nextStatus }));
  };

  const handleStaffRemarkChange = (staffId, text) => {
    setStaffRemarks(prev => ({ ...prev, [staffId]: text }));
  };

  const handleSaveTeacher = () => {
    const records = Object.keys(teacherAttendance).map(teacherId => ({
      teacherId,
      status: teacherAttendance[teacherId],
      remarks: teacherRemarks[teacherId] || ''
    }));

    markTeacherAttendanceMutation({
      variables: {
        date: new Date(date),
        records
      }
    });
  };

  const handleSaveStaff = () => {
    const records = Object.keys(staffAttendance).map(staffId => ({
      staffId,
      status: staffAttendance[staffId],
      remarks: staffRemarks[staffId] || ''
    }));

    markStaffAttendanceMutation({
      variables: {
        date: new Date(date),
        records
      }
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Staff Attendance Manager
        </Typography>
        <TextField
          type="date"
          label="Attendance Date"
          InputLabelProps={{ shrink: true }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          sx={{ width: { xs: '100%', sm: 220 } }}
        />
      </Box>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab icon={<TeacherIcon />} iconPosition="start" label="Teachers / Faculty" sx={{ fontWeight: 700 }} />
        <Tab icon={<StaffIcon />} iconPosition="start" label="General Staff" sx={{ fontWeight: 700 }} />
      </Tabs>

      {/* TEACHERS TAB */}
      {tabValue === 0 && (
        <Box>
          {teachersLoading || teacherAttLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : teachersError ? (
            <Alert severity="error">{teachersError.message}</Alert>
          ) : (
            <Box>
              <TableContainer component={Paper} sx={{ mb: 3, overflowX: 'auto' }}>
                <Table sx={{ minWidth: 780 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Faculty Member</TableCell>
                      <TableCell>Phone / Contact</TableCell>
                      <TableCell align="center">Attendance Status</TableCell>
                      <TableCell>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teachersData?.getTeachers.map((teach) => (
                      <TableRow key={teach.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {`Prof. ${teach.firstName} ${teach.lastName}`}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {teach.designation || 'Faculty'}
                          </Typography>
                        </TableCell>
                        <TableCell>{teach.phone || '-'}</TableCell>
                        <TableCell align="center">
                          <ToggleButtonGroup
                            value={teacherAttendance[teach.id] || 'PRESENT'}
                            exclusive
                            onChange={(_, val) => handleTeacherStatusChange(teach.id, val)}
                            size="small"
                          >
                            <ToggleButton value="PRESENT" color="success" sx={{ px: 2, fontWeight: 700 }}>Present</ToggleButton>
                            <ToggleButton value="HALF_DAY" color="warning" sx={{ px: 2, fontWeight: 700 }}>Half Day</ToggleButton>
                            <ToggleButton value="LEAVE" color="info" sx={{ px: 2, fontWeight: 700 }}>Leave</ToggleButton>
                            <ToggleButton value="ABSENT" color="error" sx={{ px: 2, fontWeight: 700 }}>Absent</ToggleButton>
                          </ToggleButtonGroup>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Add reason/note..."
                            value={teacherRemarks[teach.id] || ''}
                            onChange={(e) => handleTeacherRemarkChange(teach.id, e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {teachersData?.getTeachers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No faculty members registered.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" disabled={saveTeacherLoading} onClick={handleSaveTeacher} sx={{ background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF', px: 4, width: { xs: '100%', sm: 'auto' } }}>
                  {saveTeacherLoading ? 'Saving...' : 'Save Teacher Attendance'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* GENERAL STAFF TAB */}
      {tabValue === 1 && (
        <Box>
          {staffLoading || staffAttLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : staffError ? (
            <Alert severity="error">{staffError.message}</Alert>
          ) : (
            <Box>
              <TableContainer component={Paper} sx={{ mb: 3, overflowX: 'auto' }}>
                <Table sx={{ minWidth: 780 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Staff Member</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell align="center">Attendance Status</TableCell>
                      <TableCell>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {staffData?.getStaff.map((st) => (
                      <TableRow key={st.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {`${st.firstName} ${st.lastName}`}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {st.designation || 'Staff'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{st.department}</TableCell>
                        <TableCell align="center">
                          <ToggleButtonGroup
                            value={staffAttendance[st.id] || 'PRESENT'}
                            exclusive
                            onChange={(_, val) => handleStaffStatusChange(st.id, val)}
                            size="small"
                          >
                            <ToggleButton value="PRESENT" color="success" sx={{ px: 2, fontWeight: 700 }}>Present</ToggleButton>
                            <ToggleButton value="HALF_DAY" color="warning" sx={{ px: 2, fontWeight: 700 }}>Half Day</ToggleButton>
                            <ToggleButton value="LEAVE" color="info" sx={{ px: 2, fontWeight: 700 }}>Leave</ToggleButton>
                            <ToggleButton value="ABSENT" color="error" sx={{ px: 2, fontWeight: 700 }}>Absent</ToggleButton>
                          </ToggleButtonGroup>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Add reason/note..."
                            value={staffRemarks[st.id] || ''}
                            onChange={(e) => handleStaffRemarkChange(st.id, e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {staffData?.getStaff.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No staff members registered.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" disabled={saveStaffLoading} onClick={handleSaveStaff} sx={{ background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF', px: 4, width: { xs: '100%', sm: 'auto' } }}>
                  {saveStaffLoading ? 'Saving...' : 'Save Staff Attendance'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default StaffAttendance;
