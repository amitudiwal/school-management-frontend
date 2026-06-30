import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Button, Card, CardContent, Grid, TextField, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, CircularProgress, Alert, ToggleButton, ToggleButtonGroup,
  Tabs, Tab, TablePagination, Avatar, useTheme, Dialog, IconButton
} from '@mui/material';
import { 
  GET_TEACHERS, 
  GET_STAFF, 
  GET_TEACHER_ATTENDANCE, 
  GET_STAFF_ATTENDANCE, 
  MARK_BULK_TEACHER_ATTENDANCE, 
  MARK_BULK_STAFF_ATTENDANCE,
  GET_SCHOOL_ADMIN_DASHBOARD
} from '../graphql/operations';
import { useDispatch, useSelector } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import { People as StaffIcon, PersonAdd as TeacherIcon, Close as CloseIcon } from '@mui/icons-material';
import CustomDatePicker from '../components/CustomDatePicker';

function StaffAttendance() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isAdminOrPrincipal = ['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role);
  const [tabValue, setTabValue] = useState(0);
  const [pageTeachers, setPageTeachers] = useState(0);
  const [pageStaff, setPageStaff] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Attendance states
  const [teacherAttendance, setTeacherAttendance] = useState({});
  const [teacherRemarks, setTeacherRemarks] = useState({});
  const [teacherFaceImages, setTeacherFaceImages] = useState({});
  const [staffAttendance, setStaffAttendance] = useState({});
  const [staffRemarks, setStaffRemarks] = useState({});
  const [staffFaceImages, setStaffFaceImages] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [teacherLocations, setTeacherLocations] = useState({});
  const [staffLocations, setStaffLocations] = useState({});
  const [teacherCheckIns, setTeacherCheckIns] = useState({});
  const [staffCheckIns, setStaffCheckIns] = useState({});
  const [lastTeacherAttendanceTime, setLastTeacherAttendanceTime] = useState(null);
  const [lastStaffAttendanceTime, setLastStaffAttendanceTime] = useState(null);

  // Queries
  const { loading: teachersLoading, error: teachersError, data: teachersData } = useQuery(GET_TEACHERS);
  const { loading: staffLoading, error: staffError, data: staffData } = useQuery(GET_STAFF);

  const { loading: teacherAttLoading } = useQuery(GET_TEACHER_ATTENDANCE, {
    variables: { date: new Date(date) },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const att = {};
      const rem = {};
      const faces = {};
      const locations = {};
      const checkins = {};
      // First default everyone to ABSENT
      teachersData?.getTeachers.forEach(t => {
        att[t.id] = 'ABSENT';
        rem[t.id] = '';
      });
      // Then overlay actual database records
      data.getTeacherAttendance.forEach(rec => {
        if (rec.teacherId?.id) {
          att[rec.teacherId.id] = rec.status;
          rem[rec.teacherId.id] = rec.remarks || '';
          if (rec.faceImage) {
            faces[rec.teacherId.id] = rec.faceImage;
          }
          if (rec.location) {
            locations[rec.teacherId.id] = rec.location;
          }
          if (rec.checkIn) {
            checkins[rec.teacherId.id] = rec.checkIn;
          }
        }
      });
      setTeacherAttendance(att);
      setTeacherRemarks(rem);
      setTeacherFaceImages(faces);
      setTeacherLocations(locations);
      setTeacherCheckIns(checkins);
    }
  });

  const { loading: staffAttLoading } = useQuery(GET_STAFF_ATTENDANCE, {
    variables: { date: new Date(date) },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const att = {};
      const rem = {};
      const faces = {};
      const locations = {};
      const checkins = {};
      // First default everyone to ABSENT
      staffData?.getStaff.forEach(s => {
        att[s.id] = 'ABSENT';
        rem[s.id] = '';
      });
      // Then overlay actual database records
      data.getStaffAttendance.forEach(rec => {
        if (rec.staffId?.id) {
          att[rec.staffId.id] = rec.status;
          rem[rec.staffId.id] = rec.remarks || '';
          if (rec.faceImage) {
            faces[rec.staffId.id] = rec.faceImage;
          }
          if (rec.location) {
            locations[rec.staffId.id] = rec.location;
          }
          if (rec.checkIn) {
            checkins[rec.staffId.id] = rec.checkIn;
          }
        }
      });
      setStaffAttendance(att);
      setStaffRemarks(rem);
      setStaffFaceImages(faces);
      setStaffLocations(locations);
      setStaffCheckIns(checkins);
    }
  });

  // Mutations
  const [markTeacherAttendanceMutation, { loading: saveTeacherLoading }] = useMutation(MARK_BULK_TEACHER_ATTENDANCE, {
    refetchQueries: isAdminOrPrincipal ? ['GetSchoolAdminDashboard'] : [],
    awaitRefetchQueries: true,
    onCompleted: () => {
      dispatch(showToast({ message: 'Teacher attendance saved successfully!', severity: 'success' }));
      const now = new Date();
      setLastTeacherAttendanceTime(now);
      localStorage.setItem(`lastSaveTime_teacher_${date}`, now.toISOString());
    },
    onError: (err) => {
      dispatch(showToast({ message: 'Error saving: ' + err.message, severity: 'error' }));
    }
  });

  const [markStaffAttendanceMutation, { loading: saveStaffLoading }] = useMutation(MARK_BULK_STAFF_ATTENDANCE, {
    refetchQueries: isAdminOrPrincipal ? ['GetSchoolAdminDashboard'] : [],
    awaitRefetchQueries: true,
    onCompleted: () => {
      dispatch(showToast({ message: 'Staff attendance saved successfully!', severity: 'success' }));
      const now = new Date();
      setLastStaffAttendanceTime(now);
      localStorage.setItem(`lastSaveTime_staff_${date}`, now.toISOString());
    },
    onError: (err) => {
      dispatch(showToast({ message: 'Error saving: ' + err.message, severity: 'error' }));
    }
  });

  useEffect(() => {
    const savedTeacherTime = localStorage.getItem(`lastSaveTime_teacher_${date}`);
    if (savedTeacherTime) {
      setLastTeacherAttendanceTime(new Date(savedTeacherTime));
    } else {
      setLastTeacherAttendanceTime(null);
    }

    const savedStaffTime = localStorage.getItem(`lastSaveTime_staff_${date}`);
    if (savedStaffTime) {
      setLastStaffAttendanceTime(new Date(savedStaffTime));
    } else {
      setLastStaffAttendanceTime(null);
    }
  }, [date]);

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
        <CustomDatePicker
          label="Attendance Date"
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
      <AnimatePresence mode="wait">
        {tabValue === 0 ? (
          <motion.div
            key="teachers-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
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
                    {(teachersData?.getTeachers || [])
                      .slice(pageTeachers * 10, (pageTeachers + 1) * 10)
                      .map((teach) => (
                        <TableRow key={teach.id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {teacherFaceImages[teach.id] ? (
                                <Avatar 
                                  src={teacherFaceImages[teach.id]} 
                                  sx={{ 
                                    width: 44, 
                                    height: 44, 
                                    border: `2px solid ${theme.palette.success.main}`,
                                    boxShadow: `0 0 8px ${theme.palette.success.main}30`,
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => setPreviewImage(teacherFaceImages[teach.id])}
                                />
                              ) : (
                                <Avatar sx={{ width: 44, height: 44, bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0', color: theme.palette.mode === 'dark' ? '#f1f5f9' : '#475569' }}>
                                  {teach.firstName.charAt(0)}
                                </Avatar>
                              )}
                              <Box>
                                {`Prof. ${teach.firstName} ${teach.lastName}`}
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {teach.designation || 'Faculty'}
                                </Typography>
                                {(teacherCheckIns[teach.id] || teacherLocations[teach.id]) && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25 }}>
                                    {teacherCheckIns[teach.id] && (
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          color: 'text.secondary', 
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          fontWeight: 600
                                        }}
                                      >
                                        🕒 {teacherCheckIns[teach.id]}
                                      </Typography>
                                    )}
                                    {teacherCheckIns[teach.id] && teacherLocations[teach.id] && (
                                      <Typography variant="caption" color="text.secondary">|</Typography>
                                    )}
                                    {teacherLocations[teach.id] && (
                                      <Typography 
                                        variant="caption" 
                                        component="a"
                                        href={`https://www.google.com/maps?q=${teacherLocations[teach.id]}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ 
                                          color: 'primary.main', 
                                          textDecoration: 'none', 
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          fontWeight: 600,
                                          '&:hover': { textDecoration: 'underline' } 
                                        }}
                                      >
                                        📍 Location
                                      </Typography>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            </Box>
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
                    {(!teachersData?.getTeachers || teachersData.getTeachers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No data</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {teachersData?.getTeachers?.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[10]}
                  component="div"
                  count={teachersData.getTeachers.length}
                  rowsPerPage={10}
                  page={pageTeachers}
                  onPageChange={(e, newPage) => setPageTeachers(newPage)}
                  sx={{ mb: 2 }}
                />
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mt: 2 }}>
                <Button variant="contained" disabled={saveTeacherLoading} onClick={handleSaveTeacher} sx={{ background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF', px: 4, width: { xs: '100%', sm: 'auto' } }}>
                  {saveTeacherLoading ? 'Saving...' : 'Save Teacher Attendance'}
                </Button>
                {lastTeacherAttendanceTime && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                    Last attendance taken at {lastTeacherAttendanceTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {lastTeacherAttendanceTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
            </Box>
          </motion.div>
        ) : (
          <motion.div
            key="staff-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
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
                    {(staffData?.getStaff || [])
                      .slice(pageStaff * 10, (pageStaff + 1) * 10)
                      .map((st) => (
                        <TableRow key={st.id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {staffFaceImages[st.id] ? (
                                <Avatar 
                                  src={staffFaceImages[st.id]} 
                                  sx={{ 
                                    width: 44, 
                                    height: 44, 
                                    border: `2px solid ${theme.palette.success.main}`,
                                    boxShadow: `0 0 8px ${theme.palette.success.main}30`,
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => setPreviewImage(staffFaceImages[st.id])}
                                />
                              ) : (
                                <Avatar sx={{ width: 44, height: 44, bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0', color: theme.palette.mode === 'dark' ? '#f1f5f9' : '#475569' }}>
                                  {st.firstName.charAt(0)}
                                </Avatar>
                              )}
                              <Box>
                                {`${st.firstName} ${st.lastName}`}
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {st.designation || 'Staff'}
                                </Typography>
                                {(staffCheckIns[st.id] || staffLocations[st.id]) && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25 }}>
                                    {staffCheckIns[st.id] && (
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          color: 'text.secondary', 
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          fontWeight: 600
                                        }}
                                      >
                                        🕒 {staffCheckIns[st.id]}
                                      </Typography>
                                    )}
                                    {staffCheckIns[st.id] && staffLocations[st.id] && (
                                      <Typography variant="caption" color="text.secondary">|</Typography>
                                    )}
                                    {staffLocations[st.id] && (
                                      <Typography 
                                        variant="caption" 
                                        component="a"
                                        href={`https://www.google.com/maps?q=${staffLocations[st.id]}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ 
                                          color: 'primary.main', 
                                          textDecoration: 'none', 
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          fontWeight: 600,
                                          '&:hover': { textDecoration: 'underline' } 
                                        }}
                                      >
                                        📍 Location
                                      </Typography>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            </Box>
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
                    {(!staffData?.getStaff || staffData.getStaff.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No data</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {staffData?.getStaff?.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[10]}
                  component="div"
                  count={staffData.getStaff.length}
                  rowsPerPage={10}
                  page={pageStaff}
                  onPageChange={(e, newPage) => setPageStaff(newPage)}
                  sx={{ mb: 2 }}
                />
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mt: 2 }}>
                <Button variant="contained" disabled={saveStaffLoading} onClick={handleSaveStaff} sx={{ background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF', px: 4, width: { xs: '100%', sm: 'auto' } }}>
                  {saveStaffLoading ? 'Saving...' : 'Save Staff Attendance'}
                </Button>
                {lastStaffAttendanceTime && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                    Last attendance taken at {lastStaffAttendanceTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {lastStaffAttendanceTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Biometric Photo Fullscreen Modal */}
      <Dialog 
        open={Boolean(previewImage)} 
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.95)',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: 24,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            p: 1,
            position: 'relative'
          }
        }}
      >
        {previewImage && (
          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <IconButton 
              onClick={() => setPreviewImage(null)}
              sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 8, 
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
              }}
            >
              <CloseIcon />
            </IconButton>
            <img 
              src={previewImage} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '80vh', 
                objectFit: 'contain',
                borderRadius: '8px' 
              }} 
              alt="Biometric Preview" 
            />
          </Box>
        )}
      </Dialog>
    </Box>
  );
}

export default StaffAttendance;
