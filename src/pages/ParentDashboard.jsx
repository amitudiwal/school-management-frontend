import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, Button, useTheme, LinearProgress, Chip,
  Divider, List, ListItem, ListItemText, ListItemIcon, Stack, TablePagination
} from '@mui/material';
import {
  School as SchoolIcon,
  AssignmentTurnedIn as AttendanceIcon,
  Assignment as HomeworkIcon,
  Assessment as AcademicsIcon,
  AttachMoney as FeesIcon,
  DirectionsBus as TransportIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  MailOutline as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Cake as CakeIcon,
  Transgender as GenderIcon,
  FamilyRestroom as ParentIcon,
  AccountBox as ProfileIcon
} from '@mui/icons-material';
import {
  GET_PARENT_PROFILE,
  GET_STUDENT_ATTENDANCE_SUMMARY,
  GET_STUDENT_MARKS,
  GET_HOMEWORK,
  GET_STUDENT_FEE_STATUS,
  GET_TRANSPORT_ROUTES
} from '../graphql/operations';

function ParentDashboard() {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);

  // Active child index state
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  
  // Dashboard navigation tab state
  const [activeTab, setActiveTab] = useState(0);

  const [pageMarks, setPageMarks] = useState(0);
  const [pageFees, setPageFees] = useState(0);

  // Query: Get parent profile & children
  const { data: parentData, loading: parentLoading, error: parentError } = useQuery(GET_PARENT_PROFILE);

  const parentProfile = parentData?.getParentProfile;
  const children = parentProfile?.children || [];
  const activeChild = children[selectedChildIndex];

  // Fetch sub-data based on active child
  const { data: attendanceData, loading: attendanceLoading, error: attendanceError } = useQuery(GET_STUDENT_ATTENDANCE_SUMMARY, {
    variables: { studentId: activeChild?.id },
    skip: !activeChild?.id
  });

  const { data: marksData, loading: marksLoading, error: marksError } = useQuery(GET_STUDENT_MARKS, {
    variables: { studentId: activeChild?.id },
    skip: !activeChild?.id
  });

  const { data: homeworkData, loading: homeworkLoading, error: homeworkError } = useQuery(GET_HOMEWORK, {
    variables: { classId: activeChild?.classId?.id, sectionId: activeChild?.sectionId?.id },
    skip: !activeChild?.classId?.id || !activeChild?.sectionId?.id
  });

  const { data: feesData, loading: feesLoading, error: feesError } = useQuery(GET_STUDENT_FEE_STATUS, {
    variables: { studentId: activeChild?.id },
    skip: !activeChild?.id
  });

  const { data: transportData, loading: transportLoading, error: transportError } = useQuery(GET_TRANSPORT_ROUTES, {
    skip: !activeChild?.id
  });

  // Handle Tab Switch
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Reset tab index on child switch
  useEffect(() => {
    setActiveTab(0);
    setPageMarks(0);
    setPageFees(0);
  }, [selectedChildIndex]);

  if (parentLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (parentError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading profile: {parentError.message}
      </Alert>
    );
  }

  if (!parentProfile) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Parent profile details could not be found. Please check with the system administrator.
      </Alert>
    );
  }

  return (
    <Box sx={{ pb: 5 }}>
      {/* Header Banner */}
      <Card sx={{
        mb: 4,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: '#fff',
        borderRadius: 3,
        boxShadow: 3
      }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  width: 64,
                  height: 64,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  border: '2px solid rgba(255, 255, 255, 0.4)'
                }}>
                  {parentProfile.firstName?.charAt(0) || 'P'}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 855 }}>
                    Welcome, {parentProfile.firstName} {parentProfile.lastName}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.8, fontWeight: 500 }}>
                    Parent Portal Dashboard
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                p: 2,
                borderRadius: 2,
                backdropFilter: 'blur(10px)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" sx={{ opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{parentProfile.phone}</Typography>
                </Box>
                {parentProfile.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" sx={{ opacity: 0.8 }} />
                    <Typography variant="body2" sx={{ wordBreak: 'break-all', fontWeight: 600 }}>{parentProfile.email}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ParentIcon fontSize="small" sx={{ opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                    Relation: {parentProfile.relation}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Children Selector */}
      {children.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          No registered student accounts are linked to your profile. Please contact the school registrar.
        </Alert>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
            Select Student Profile
          </Typography>
          <Grid container spacing={2}>
            {children.map((child, idx) => {
              const isSelected = idx === selectedChildIndex;
              return (
                <Grid item xs={12} sm={6} md={4} key={child.id}>
                  <Card
                    component={motion.div}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedChildIndex(idx)}
                    sx={{
                      cursor: 'pointer',
                      border: isSelected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                      boxShadow: isSelected ? 4 : 1,
                      transition: 'border 0.3s ease, box-shadow 0.3s ease'
                    }}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{
                        bgcolor: isSelected ? theme.palette.primary.main : theme.palette.grey[300],
                        color: isSelected ? '#fff' : theme.palette.text.secondary,
                        width: 48,
                        height: 48
                      }}>
                        <PersonIcon />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {child.firstName} {child.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Class: {child.classId?.name} | Section: {child.sectionId?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Admission No: {child.admissionNo} {child.rollNo ? `| Roll No: ${child.rollNo}` : ''}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Active Student Insights Panel */}
      {activeChild && (
        <Box>
          {/* Main Navigation Tabs */}
          <Paper sx={{ mb: 4, borderRadius: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 600,
                  py: 2
                }
              }}
            >
              <Tab icon={<ProfileIcon />} iconPosition="start" label="Overview & Attendance" />
              <Tab icon={<AcademicsIcon />} iconPosition="start" label="Academic Progress" />
              <Tab icon={<HomeworkIcon />} iconPosition="start" label="Homework Board" />
              <Tab icon={<FeesIcon />} iconPosition="start" label="Fees Directory" />
              <Tab icon={<TransportIcon />} iconPosition="start" label="School Transport" />
            </Tabs>

            {/* Tab Contents */}
            <Box sx={{ p: 3 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Tab 0: Overview & Attendance */}
                  {activeTab === 0 && (
                <Box>
                  <Grid container spacing={3}>
                    {/* Basic Profile Details */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                            Student Profile Details
                          </Typography>
                          <List>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon><BadgeIcon color="primary" /></ListItemIcon>
                              <ListItemText
                                primary="Full Name"
                                secondary={`${activeChild.firstName} ${activeChild.lastName}`}
                              />
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon><SchoolIcon color="primary" /></ListItemIcon>
                              <ListItemText
                                primary="Academic Class / Section"
                                secondary={`${activeChild.classId?.name || 'N/A'} - ${activeChild.sectionId?.name || 'N/A'}`}
                              />
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon><CakeIcon color="primary" /></ListItemIcon>
                              <ListItemText
                                primary="Admission Number"
                                secondary={activeChild.admissionNo}
                              />
                            </ListItem>
                            {activeChild.rollNo && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                                <ListItemText
                                  primary="Roll Number"
                                  secondary={activeChild.rollNo}
                                />
                              </ListItem>
                            )}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Attendance summary card */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                            Attendance Performance
                          </Typography>
                          {attendanceLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                              <CircularProgress />
                            </Box>
                          ) : attendanceError ? (
                            <Alert severity="error">Unable to load attendance: {attendanceError.message}</Alert>
                          ) : (
                            <Box>
                              {/* Stat widgets */}
                              <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={4}>
                                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#10B98115', borderRadius: 2 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#10B981' }}>
                                      {attendanceData?.getStudentAttendanceSummary?.presentPercent?.toFixed(1) || '0.0'}%
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }} color="text.secondary">Present</Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={4}>
                                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#F59E0B15', borderRadius: 2 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#F59E0B' }}>
                                      {attendanceData?.getStudentAttendanceSummary?.latePercent?.toFixed(1) || '0.0'}%
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }} color="text.secondary">Late</Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={4}>
                                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#EF444415', borderRadius: 2 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#EF4444' }}>
                                      {attendanceData?.getStudentAttendanceSummary?.absentPercent?.toFixed(1) || '0.0'}%
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }} color="text.secondary">Absent</Typography>
                                  </Box>
                                </Grid>
                              </Grid>

                              {/* Progress bar */}
                              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Attendance Ratio Progress Bar</Typography>
                              <Box sx={{ display: 'flex', borderRadius: 4, overflow: 'hidden', height: 16, bgcolor: '#E5E7EB' }}>
                                <Box sx={{
                                  width: `${attendanceData?.getStudentAttendanceSummary?.presentPercent || 0}%`,
                                  bgcolor: '#10B981',
                                  transition: 'width 0.5s ease'
                                }} />
                                <Box sx={{
                                  width: `${attendanceData?.getStudentAttendanceSummary?.latePercent || 0}%`,
                                  bgcolor: '#F59E0B',
                                  transition: 'width 0.5s ease'
                                }} />
                                <Box sx={{
                                  width: `${attendanceData?.getStudentAttendanceSummary?.absentPercent || 0}%`,
                                  bgcolor: '#EF4444',
                                  transition: 'width 0.5s ease'
                                }} />
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>● Present</Typography>
                                <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 600 }}>● Late</Typography>
                                <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600 }}>● Absent</Typography>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 1: Academic Progress */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                    Report Card & Subject Marks
                  </Typography>
                  {marksLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : marksError ? (
                    <Alert severity="error">Unable to load marks: {marksError.message}</Alert>
                  ) : !marksData?.getStudentMarks || marksData.getStudentMarks.length === 0 ? (
                    <Alert severity="info">No grades or exam marks found for this student.</Alert>
                  ) : (
                    <>
                      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                        <Table>
                          <TableHead sx={{ bgcolor: theme.palette.background.neutral || (theme.palette.mode === 'dark' ? '#1F2937' : '#F1F5F9') }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Exam</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Marks Obtained</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>Grade</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(marksData.getStudentMarks || [])
                              .slice(pageMarks * 10, (pageMarks + 1) * 10)
                              .map((mark) => (
                                <TableRow key={mark.id} hover>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    {mark.examId?.name} ({mark.examId?.academicYear})
                                  </TableCell>
                                  <TableCell>{mark.subjectId?.name} ({mark.subjectId?.code})</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                    {mark.marksObtained}
                                  </TableCell>
                                  <TableCell align="center">
                                    <Chip
                                      label={mark.grade || 'N/A'}
                                      color={['A+', 'A', 'B+', 'B'].includes(mark.grade) ? 'success' : 'primary'}
                                      size="small"
                                      sx={{ fontWeight: 700 }}
                                    />
                                  </TableCell>
                                  <TableCell>{mark.remarks || '—'}</TableCell>
                                </TableRow>
                              ))}
                            {(!marksData.getStudentMarks || marksData.getStudentMarks.length === 0) && (
                              <TableRow>
                                <TableCell colSpan={5} align="center">No data</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {marksData.getStudentMarks?.length > 0 && (
                        <TablePagination
                          rowsPerPageOptions={[10]}
                          component="div"
                          count={marksData.getStudentMarks.length}
                          rowsPerPage={10}
                          page={pageMarks}
                          onPageChange={(e, newPage) => setPageMarks(newPage)}
                        />
                      )}
                    </>
                  )}
                </Box>
              )}

              {/* Tab 2: Homework Board */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                    Homework Assignments
                  </Typography>
                  {homeworkLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : homeworkError ? (
                    <Alert severity="error">Unable to load homework: {homeworkError.message}</Alert>
                  ) : !homeworkData?.getHomework || homeworkData.getHomework.length === 0 ? (
                    <Alert severity="info">No active homework assignments for this student's class.</Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {homeworkData.getHomework.map((hw) => {
                        const isOverdue = new Date(hw.dueDate) < new Date();
                        return (
                          <Grid item xs={12} sm={6} key={hw.id}>
                            <Card variant="outlined" sx={{
                              borderLeft: `4px solid ${isOverdue ? theme.palette.error.main : theme.palette.success.main}`
                            }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    {hw.title}
                                  </Typography>
                                  <Chip
                                    label={isOverdue ? 'Overdue' : 'Active'}
                                    color={isOverdue ? 'error' : 'success'}
                                    size="small"
                                    sx={{ fontWeight: 700 }}
                                  />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                                  Subject: {hw.subjectId?.name} | Teacher: {hw.teacherId ? `${hw.teacherId.firstName} ${hw.teacherId.lastName}` : 'N/A'}
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                                  {hw.description}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <DateIcon fontSize="small" color="action" />
                                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                    Due Date: {new Date(hw.dueDate).toLocaleDateString(undefined, {
                                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Box>
              )}

              {/* Tab 3: Fees Directory */}
              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                    Fees Statements & Invoices
                  </Typography>
                  {feesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : feesError ? (
                    <Alert severity="error">Unable to load fees status: {feesError.message}</Alert>
                  ) : !feesData?.getStudentFeeStatus || feesData.getStudentFeeStatus.length === 0 ? (
                    <Alert severity="info">No fee records found for this student.</Alert>
                  ) : (
                    <>
                      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                        <Table>
                          <TableHead sx={{ bgcolor: theme.palette.background.neutral || (theme.palette.mode === 'dark' ? '#1F2937' : '#F1F5F9') }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Title / Category</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Fee Amount</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Paid Amount</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>Payment Status</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Payment Info</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(feesData.getStudentFeeStatus || [])
                              .slice(pageFees * 10, (pageFees + 1) * 10)
                              .map((feePay) => {
                                const isPaid = feePay.status === 'PAID';
                                const isPartial = feePay.status === 'PARTIAL';
                                return (
                                  <TableRow key={feePay.id} hover>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {feePay.feeId?.title}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Category: {feePay.feeId?.category || 'N/A'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      {feePay.feeId?.dueDate ? new Date(feePay.feeId.dueDate).toLocaleDateString() : '—'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                                      ₹{feePay.feeId?.amount?.toFixed(2) || '0.00'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: isPaid ? 'success.main' : 'inherit' }}>
                                      ₹{feePay.amountPaid?.toFixed(2) || '0.00'}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={feePay.status}
                                        color={isPaid ? 'success' : isPartial ? 'warning' : 'error'}
                                        size="small"
                                        sx={{ fontWeight: 700 }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      {isPaid || isPartial ? (
                                        <Box>
                                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                                            Receipt: {feePay.receiptNo}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Method: {feePay.paymentMethod} | Ref: {feePay.referenceNo || '—'}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            Date: {new Date(feePay.paymentDate).toLocaleDateString()}
                                          </Typography>
                                        </Box>
                                      ) : (
                                        <Typography variant="caption" color="text.secondary">No payment recorded</Typography>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            {(!feesData.getStudentFeeStatus || feesData.getStudentFeeStatus.length === 0) && (
                              <TableRow>
                                <TableCell colSpan={6} align="center">No data</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {feesData.getStudentFeeStatus?.length > 0 && (
                        <TablePagination
                          rowsPerPageOptions={[10]}
                          component="div"
                          count={feesData.getStudentFeeStatus.length}
                          rowsPerPage={10}
                          page={pageFees}
                          onPageChange={(e, newPage) => setPageFees(newPage)}
                        />
                      )}
                    </>
                  )}
                </Box>
              )}

              {/* Tab 4: School Transport */}
              {activeTab === 4 && (
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                    School Bus Routes & Schedules
                  </Typography>
                  {transportLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : transportError ? (
                    <Alert severity="error">Unable to load transport: {transportError.message}</Alert>
                  ) : !transportData?.getTransportRoutes || transportData.getTransportRoutes.length === 0 ? (
                    <Alert severity="info">No active bus transport routes are registered.</Alert>
                  ) : (
                    <Grid container spacing={3}>
                      {transportData.getTransportRoutes.map((route) => (
                        <Grid item xs={12} md={6} key={route.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <TransportIcon color="primary" />
                                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    {route.routeName}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={`Fee: ₹${route.routeFee}`}
                                  color="secondary"
                                  sx={{ fontWeight: 700 }}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Start Location:</strong> {route.startLocation}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                <strong>End Location:</strong> {route.endLocation}
                              </Typography>
                              
                              <Divider sx={{ my: 1 }} />
                              
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                Stopping Stations & Schedules:
                              </Typography>
                              {route.stops && route.stops.length > 0 ? (
                                <List dense sx={{ bgcolor: theme.palette.background.neutral || (theme.palette.mode === 'dark' ? '#1F2937' : '#F1F5F9'), borderRadius: 1 }}>
                                  {route.stops.map((stop, sIdx) => (
                                    <ListItem key={sIdx}>
                                      <ListItemIcon><TimeIcon fontSize="small" /></ListItemIcon>
                                      <ListItemText
                                        primary={stop.stopName}
                                        secondary={`Estimated Arrival: ${stop.arrivalTime}`}
                                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              ) : (
                                <Typography variant="caption" color="text.secondary">No stops defined for this route.</Typography>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}
                </motion.div>
              </AnimatePresence>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default ParentDashboard;
