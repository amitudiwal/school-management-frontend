import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client';
import {
  Box, Grid, Card, CardContent, Typography, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, Button, useTheme, LinearProgress, Chip,
  Tabs, Tab, TextField, TablePagination, Stack, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip
} from '@mui/material';
import AmAreaChart from '../components/charts/AmAreaChart';
import AmColumnChart from '../components/charts/AmColumnChart';
import AmBarChartHorizontal from '../components/charts/AmBarChartHorizontal';
import AmDonutChart from '../components/charts/AmDonutChart';
import {
  School as SchoolIcon, People as PeopleIcon, LocalLibrary as LibraryIcon,
  AttachMoney as FeesIcon, AssignmentTurnedIn as AttendanceIcon,
  Warning as AlertIcon, Security as AuditIcon, DateRange as LeaveIcon,
  Assignment as HomeworkIcon, CalendarMonth as CalendarIcon, RateReview as ComplaintIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { GET_SUPER_ADMIN_DASHBOARD, GET_SCHOOL_ADMIN_DASHBOARD, GET_AUDIT_LOGS, GET_PENDING_JOBS, GET_EVENTS, GET_CLASSES, GET_SECTIONS, GET_GRADE_DISTRIBUTION, GET_COPY_SUBMISSION_ANALYTICS, GET_INVENTORY_LIST, GET_COMPLAINTS, RESOLVE_COMPLAINT, DELETE_COMPLAINT } from '../graphql/operations';
import CustomDatePicker from '../components/CustomDatePicker';
import { showToast } from '../store/slices/uiSlice';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeAttendanceTab, setActiveAttendanceTab] = useState(0);

  const cardStyle = {
    borderRadius: '24px',
    border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.04)',
    background: theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.65)' : '#ffffff',
    boxShadow: theme.palette.mode === 'dark' ? '0 10px 30px rgba(0, 0, 0, 0.3)' : '0 10px 30px rgba(99, 102, 241, 0.03)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.palette.mode === 'dark' ? '0 18px 40px rgba(0, 0, 0, 0.55)' : '0 18px 40px rgba(99, 102, 241, 0.08)',
      borderColor: theme.palette.primary.main
    }
  };
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [page, setPage] = useState(0);

  // Filter States for dashboard blocks
  const [gradeClassId, setGradeClassId] = useState('');
  const [gradeSectionId, setGradeSectionId] = useState('');
  const [copyClassId, setCopyClassId] = useState('');
  const [copySectionId, setCopySectionId] = useState('');
  const [dashboardData, setDashboardData] = useState(null);

  // Load appropriate dashboard queries based on user role
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const dispatch = useDispatch();
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [openComplaintDialog, setOpenComplaintDialog] = useState(false);

  const { data: complaintsData, refetch: refetchComplaints } = useQuery(GET_COMPLAINTS, {
    skip: isSuperAdmin || !['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role),
    fetchPolicy: 'network-only'
  });

  const [resolveComplaintMutation, { loading: resolvingComplaint }] = useMutation(RESOLVE_COMPLAINT, {
    onCompleted: () => {
      refetchComplaints();
      setOpenComplaintDialog(false);
      setFeedbackText('');
      dispatch(showToast({ message: 'Complaint resolved successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteComplaintMutation, { loading: deletingComplaint }] = useMutation(DELETE_COMPLAINT, {
    onCompleted: () => {
      refetchComplaints();
      dispatch(showToast({ message: 'Complaint deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const handleDeleteComplaint = (id) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      deleteComplaintMutation({ variables: { id } });
    }
  };

  const { data: classesData } = useQuery(GET_CLASSES, { skip: isSuperAdmin });
  const [getGradeSections, { data: gradeSectionsData }] = useLazyQuery(GET_SECTIONS);
  const [getCopySections, { data: copySectionsData }] = useLazyQuery(GET_SECTIONS);

  React.useEffect(() => {
    if (gradeClassId) {
      getGradeSections({ variables: { classId: gradeClassId } });
    }
    setGradeSectionId('');
  }, [gradeClassId, getGradeSections]);

  React.useEffect(() => {
    if (copyClassId) {
      getCopySections({ variables: { classId: copyClassId } });
    }
    setCopySectionId('');
  }, [copyClassId, getCopySections]);

  const { loading: saLoading, error: saError, data: saData, refetch: refetchSuperDashboard } = useQuery(GET_SUPER_ADMIN_DASHBOARD, {
    skip: !isSuperAdmin
  });

  const { loading: schoolLoading, error: schoolError, data: schoolData, refetch: refetchSchoolDashboard } = useQuery(GET_SCHOOL_ADMIN_DASHBOARD, {
    skip: isSuperAdmin,
    variables: {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    },
    fetchPolicy: 'network-only'
  });

  const { loading: gradeLoading, data: gradeData } = useQuery(GET_GRADE_DISTRIBUTION, {
    skip: isSuperAdmin,
    variables: {
      classId: gradeClassId || undefined,
      sectionId: gradeSectionId || undefined
    },
    fetchPolicy: 'network-only'
  });

  const { loading: copyLoading, data: copyData } = useQuery(GET_COPY_SUBMISSION_ANALYTICS, {
    skip: isSuperAdmin,
    variables: {
      classId: copyClassId || undefined,
      sectionId: copySectionId || undefined
    },
    fetchPolicy: 'network-only'
  });

  const { loading: inventoryLoading, data: inventoryData } = useQuery(GET_INVENTORY_LIST, {
    skip: isSuperAdmin,
    fetchPolicy: 'network-only'
  });

  const [persistentGradeData, setPersistentGradeData] = useState([]);
  const [persistentCopyData, setPersistentCopyData] = useState([]);

  React.useEffect(() => {
    if (gradeData?.getGradeDistribution) {
      setPersistentGradeData(gradeData.getGradeDistribution);
    }
  }, [gradeData]);

  React.useEffect(() => {
    if (copyData?.getCopySubmissionAnalytics) {
      setPersistentCopyData(copyData.getCopySubmissionAnalytics);
    }
  }, [copyData]);

  React.useEffect(() => {
    if (schoolData?.getSchoolAdminDashboard) {
      setDashboardData(schoolData.getSchoolAdminDashboard);
    }
  }, [schoolData]);

  const { data: jobsData, refetch: refetchJobs } = useQuery(GET_PENDING_JOBS, {
    skip: isSuperAdmin || !['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role)
  });

  const { loading: eventsLoading, data: eventsData, refetch: refetchEvents } = useQuery(GET_EVENTS, {
    skip: isSuperAdmin,
    fetchPolicy: 'network-only'
  });

  React.useEffect(() => {
    if (isSuperAdmin) {
      refetchSuperDashboard?.();
    } else {
      refetchSchoolDashboard?.({
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      refetchJobs?.();
      refetchEvents?.();
      refetchComplaints?.();
    }
  }, [isSuperAdmin, startDate, endDate, refetchSuperDashboard, refetchSchoolDashboard, refetchJobs, refetchEvents, refetchComplaints]);

  const { loading: logsLoading, data: logsData } = useQuery(GET_AUDIT_LOGS, {
    skip: !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user?.role)
  });

  if ((saLoading && !saData) || (schoolLoading && !dashboardData && !schoolData)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (saError || schoolError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {saError?.message || schoolError?.message}
      </Alert>
    );
  }

  // --- RENDERING SUPER ADMIN PORTAL ---
  if (isSuperAdmin) {
    const stats = saData?.getSuperAdminDashboard;
    const cards = [
      { title: 'Total Schools Onboarded', value: stats?.totalSchools ?? 0, icon: <SchoolIcon />, gradient: 'linear-gradient(135deg, #FF9F59 0%, #FF7043 100%)', shadowColor: 'rgba(255, 112, 67, 0.4)', path: '/schools' },
      { title: 'Total Students Globally', value: stats?.totalStudents ?? 0, icon: <PeopleIcon />, gradient: 'linear-gradient(135deg, #7F56D9 0%, #6130C3 100%)', shadowColor: 'rgba(97, 48, 195, 0.4)' },
      { title: 'Total Active Teachers', value: stats?.totalTeachers ?? 0, icon: <LibraryIcon />, gradient: 'linear-gradient(135deg, #06AED5 0%, #0086C4 100%)', shadowColor: 'rgba(0, 134, 196, 0.4)' },
      { title: 'Monthly Revenue', value: `₹${(stats?.monthlyRevenue ?? 0).toLocaleString()}`, icon: <FeesIcon />, gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', shadowColor: 'rgba(217, 119, 6, 0.4)' },
    ];

    console.log('Global Audit Logs:', logsData?.getGlobalAuditLogs);

    return (
      <Box>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 3, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Global Operations Dashboard
        </Typography>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
          {cards.map((card, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx} component={motion.div} variants={itemVariants}>
              <Card
                onClick={() => card.path && navigate(card.path)}
                sx={{
                  cursor: card.path ? 'pointer' : 'default',
                  background: card.gradient,
                  color: '#fff',
                  borderRadius: '24px',
                  boxShadow: `0 12px 28px -5px ${card.shadowColor}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: 'none',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  '&:hover': card.path ? {
                    transform: 'translateY(-6px) scale(1.02)',
                    boxShadow: `0 20px 40px -5px ${card.shadowColor}`
                  } : {}
                }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, p: 3, '&:last-child': { pb: 3 }, flexGrow: 1 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 850, mt: 0.5, fontFamily: "'Outfit', sans-serif" }}>
                      {card.value ?? 0}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.22)', color: '#fff', width: 56, height: 56, boxShadow: 'inset 0 1.5px 3px rgba(255, 255, 255, 0.1)' }}>
                    {card.icon}
                  </Avatar>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Revenue Analytics Graph */}
        <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
          <Grid item xs={12} md={8} component={motion.div} variants={itemVariants}>
            <Card sx={{ ...cardStyle, p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                SaaS Monthly Subscription Revenue
              </Typography>
              <Box sx={{ width: '100%' }}>
                <AmAreaChart
                  categories={(stats?.monthlyRevenueSeries || []).map(x => x.month)}
                  series={[{
                    name: 'Revenue',
                    data: (stats?.monthlyRevenueSeries || []).map(x => x.revenue),
                    color: '#6366F1'
                  }]}
                  height={300}
                  valuePrefix="₹"
                />
              </Box>
            </Card>
          </Grid>

          {/* Subscriptions breakdown */}
          <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
            <Card sx={{ ...cardStyle, height: '100%', p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Subscription Health
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Active Tenancies</Typography>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>{stats?.activeSchools}</Typography>
                </Box>
                <LinearProgress variant="determinate" value={((stats?.activeSchools || 1) / (stats?.totalSchools || 1)) * 100} sx={{ height: 8, borderRadius: 4 }} />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Expired / Inactive</Typography>
                  <Typography variant="body2" color="error" sx={{ fontWeight: 700 }}>{stats?.expiredSubscriptions}</Typography>
                </Box>
                <LinearProgress variant="determinate" value={((stats?.expiredSubscriptions || 0) / (stats?.totalSchools || 1)) * 100} color="error" sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Global Security Audit Logs */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Security Log & Audit Trail
        </Typography>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Audit User</TableCell>
                  <TableCell>Event Action</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Date Logged</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(logsData?.getGlobalAuditLogs || [])
                  .slice(page * 10, (page + 1) * 10)
                  .map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar size="small" sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {log.userId?.name?.charAt(0) || 'A'}
                          </Avatar>
                          <Typography variant="body2">{log.userId?.name || 'System / Suspended User'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={log.action} color={log.action.includes('FAIL') ? 'error' : 'secondary'} sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>{log.details}</TableCell>
                      <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                {(!logsData?.getGlobalAuditLogs || logsData.getGlobalAuditLogs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No data</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {logsData?.getGlobalAuditLogs?.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10]}
              component="div"
              count={logsData.getGlobalAuditLogs.length}
              rowsPerPage={10}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
            />
          )}
        </motion.div>
      </Box>
    );
  }

  // --- RENDERING TENANT SCHOOL ADMIN PORTAL ---
  const stats = dashboardData || schoolData?.getSchoolAdminDashboard;
  const cards = [
    { title: 'Total Enrolled Students', value: stats?.studentCount, icon: <PeopleIcon />, gradient: 'linear-gradient(135deg, #FF9F59 0%, #FF7043 100%)', shadowColor: 'rgba(255, 112, 67, 0.4)', path: '/students' },
    { title: 'Academic Faculty Teachers', value: stats?.teacherCount, icon: <LibraryIcon />, gradient: 'linear-gradient(135deg, #7F56D9 0%, #6130C3 100%)', shadowColor: 'rgba(97, 48, 195, 0.4)', path: '/teachers' },
    { title: 'Operational Staff Members', value: stats?.staffCount, icon: <SchoolIcon />, gradient: 'linear-gradient(135deg, #06AED5 0%, #0086C4 100%)', shadowColor: 'rgba(0, 134, 196, 0.4)', path: '/teachers?tab=staff' },
    { title: 'Upcoming Examinations', value: stats?.upcomingExamsCount, icon: <AlertIcon />, gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', shadowColor: 'rgba(217, 119, 6, 0.4)', path: '/exams' },
  ];

  // Attendance Data Formats
  const studentAttendanceData = [
    { name: 'Present', value: stats?.attendanceSummary?.presentPercent ?? 0.0, color: '#10B981' },
    { name: 'Late', value: stats?.attendanceSummary?.latePercent ?? 0.0, color: '#F59E0B' },
    { name: 'Absent', value: stats?.attendanceSummary?.absentPercent ?? 0.0, color: '#EF4444' },
  ];

  const teacherAttendanceData = [
    { name: 'Present', value: stats?.teacherAttendanceSummary?.presentPercent ?? 0.0, color: '#10B981' },
    { name: 'Late', value: stats?.teacherAttendanceSummary?.latePercent ?? 0.0, color: '#F59E0B' },
    { name: 'Absent', value: stats?.teacherAttendanceSummary?.absentPercent ?? 0.0, color: '#EF4444' },
  ];

  const staffAttendanceData = [
    { name: 'Present', value: stats?.staffAttendanceSummary?.presentPercent ?? 0.0, color: '#10B981' },
    { name: 'Late', value: stats?.staffAttendanceSummary?.latePercent ?? 0.0, color: '#F59E0B' },
    { name: 'Absent', value: stats?.staffAttendanceSummary?.absentPercent ?? 0.0, color: '#EF4444' },
  ];

  const getActiveAttendanceData = () => {
    switch (activeAttendanceTab) {
      case 0:
        return studentAttendanceData;
      case 1:
        return teacherAttendanceData;
      case 2:
        return staffAttendanceData;
      default:
        return studentAttendanceData;
    }
  };

  const currentAttendanceData = getActiveAttendanceData();

  // Fees Data Formatting
  const feeData = [
    { name: 'Collected', value: stats?.feeCollectionSummary?.totalCollected ?? 0 },
    { name: 'Outstanding', value: stats?.feeCollectionSummary?.totalOutstanding ?? 0 },
  ];

  // Class Enrollment Data Formatting
  const classEnrollmentData = stats?.classEnrollmentSummary?.map(c => ({
    name: c.className,
    students: c.studentCount
  })) || [];

  // Grade Distribution Data Formatting
  const gradeDistributionData = (persistentGradeData || []).map(g => ({
    name: g.grade,
    count: g.count
  }));

  const trendData = stats?.facultyAttendanceTrend || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          School Overview Portal
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
          <CustomDatePicker
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            sx={{ width: { xs: '100%', sm: 180 } }}
          />
          <CustomDatePicker
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            sx={{ width: { xs: '100%', sm: 180 } }}
          />
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx} component={motion.div} variants={itemVariants}>
            <Card
              onClick={() => card.path && navigate(card.path)}
              sx={{
                cursor: card.path ? 'pointer' : 'default',
                background: card.gradient,
                color: '#fff',
                borderRadius: '24px',
                boxShadow: `0 12px 28px -5px ${card.shadowColor}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: 'none',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                '&:hover': card.path ? {
                  transform: 'translateY(-6px) scale(1.02)',
                  boxShadow: `0 20px 40px -5px ${card.shadowColor}`
                } : {}
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, p: 3, '&:last-child': { pb: 3 }, flexGrow: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 850, mt: 0.5, fontFamily: "'Outfit', sans-serif" }}>
                    {card.value ?? 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.22)', color: '#fff', width: 56, height: 56, boxShadow: 'inset 0 1.5px 3px rgba(255, 255, 255, 0.1)' }}>
                  {card.icon}
                </Avatar>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Financial Insights (Admin View) */}
      {!isSuperAdmin && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 2 }}>
            Financial Insights Dashboard (Admin view)
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ ...cardStyle, bgcolor: 'success.main' + '10' }}>
                <CardContent>
                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Fee Collected
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 850, mt: 1, color: 'success.main' }}>
                    ₹{(stats?.schoolIncome ?? 0).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ ...cardStyle, bgcolor: 'error.main' + '10' }}>
                <CardContent>
                  <Typography variant="caption" color="error.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Pending Fees
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 850, mt: 1, color: 'error.main' }}>
                    ₹{(stats?.pendingFees ?? 0).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ ...cardStyle, bgcolor: 'warning.main' + '10' }}>
                <CardContent>
                  <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Salary Expenses
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 850, mt: 1, color: 'warning.main' }}>
                    ₹{(stats?.salaryExpenses ?? 0).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ ...cardStyle, bgcolor: 'primary.main' + '10' }}>
                <CardContent>
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Net School Income
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 850, mt: 1, color: 'primary.main' }}>
                    ₹{((stats?.schoolIncome ?? 0) - (stats?.salaryExpenses ?? 0)).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Teacher Performance & Student Strength */}
      {!isSuperAdmin && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 2 }}>
            Demographics & Performance Analytics
          </Typography>
          <Grid container spacing={3}>
            {/* Student Strength Analytics */}
            <Grid item xs={12} md={4}>
              <Card sx={{ ...cardStyle, p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                  Student Gender Strength
                </Typography>
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <AmDonutChart
                    data={[
                      { name: 'Boys', value: stats?.totalBoys ?? 0, color: '#3B82F6' },
                      { name: 'Girls', value: stats?.totalGirls ?? 0, color: '#EC4899' }
                    ]}
                    innerRadius={0}
                    height={220}
                    showLegend={true}
                    valueSuffix=""
                  />
                </Box>
              </Card>
            </Grid>

            {/* Section wise strength */}
            <Grid item xs={12} md={4}>
              <Card sx={{ ...cardStyle, p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                  Section-wise Strength
                </Typography>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 220 }}>
                  {(!stats?.sectionStrength || stats.sectionStrength.length === 0) ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                      No section strength records found.
                    </Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Class & Section</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.sectionStrength.map((ss, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{`${ss.className} - ${ss.sectionName}`}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{ss.strength}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Box>
              </Card>
            </Grid>

            {/* Teacher Performance */}
            <Grid item xs={12} md={4}>
              <Card sx={{ ...cardStyle, p: 2, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                  Teacher & Academic Performance
                </Typography>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Teacher Attendance %</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{(stats?.teacherAttendanceRate ?? 0.0).toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={stats?.teacherAttendanceRate ?? 0} color="success" sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Homework Completion Rate</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{(stats?.homeworkCompletionRate ?? 0.0).toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={stats?.homeworkCompletionRate ?? 0} color="secondary" sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Average Student Performance</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{(stats?.studentPerformanceAvg ?? 0.0).toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={stats?.studentPerformanceAvg ?? 0} color="primary" sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* School Administration Overview Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
        {/* Library Stats Card */}
        <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' + '20', color: 'info.main', width: 44, height: 44 }}>
                  <LibraryIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Library Checkouts
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total books vs. active issues
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Total Books: {stats?.libraryStats?.totalBooks}</Typography>
                <Typography variant="body2" color="info.main" sx={{ fontWeight: 700 }}>Issued: {stats?.libraryStats?.totalIssuedBooks}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">Available Copies</Typography>
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                  {stats?.libraryStats ? (stats.libraryStats.totalBooks - stats.libraryStats.totalIssuedBooks) : 0}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats?.libraryStats?.totalBooks > 0 ? ((stats.libraryStats.totalBooks - stats.libraryStats.totalIssuedBooks) / stats.libraryStats.totalBooks) * 100 : 100}
                color="success"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Leave Requests Summary Card */}
        <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' + '20', color: 'warning.main', width: 44, height: 44 }}>
                  <LeaveIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Faculty Leaves
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Leave request approval queue
                  </Typography>
                </Box>
              </Box>
              <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ mt: 2 }}>
                <Box sx={{ textAlign: 'center', flexGrow: 1, p: 1, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#F1F5F9' }}>
                  <Typography variant="h6" color="warning.main" sx={{ fontWeight: 800 }}>
                    {stats?.leaveStats?.pendingCount || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Pending</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', flexGrow: 1, p: 1, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#F1F5F9' }}>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 800 }}>
                    {stats?.leaveStats?.approvedCount || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Approved</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', flexGrow: 1, p: 1, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#F1F5F9' }}>
                  <Typography variant="h6" color="error.main" sx={{ fontWeight: 800 }}>
                    {stats?.leaveStats?.rejectedCount || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Rejected</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Homework Board Analytics Card */}
        <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main' + '20', color: 'secondary.main', width: 44, height: 44 }}>
                  <HomeworkIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Homework Board
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total assignments and submission rate
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Assigned: {stats?.homeworkStats?.totalHomework || 0}</Typography>
                <Typography variant="body2" color="secondary.main" sx={{ fontWeight: 700 }}>Submissions: {stats?.homeworkStats?.totalSubmissions || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">Completion Rate</Typography>
                <Typography variant="body2" color="secondary.main" sx={{ fontWeight: 800 }}>
                  {stats?.homeworkStats?.totalHomework > 0 ? Math.round((stats.homeworkStats.totalSubmissions / (stats.homeworkStats.totalHomework * 20)) * 100) : 0}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats?.homeworkStats?.totalHomework > 0 ? Math.min(100, Math.round((stats.homeworkStats.totalSubmissions / (stats.homeworkStats.totalHomework * 20)) * 100)) : 0}
                color="secondary"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics charts for School Admins */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
        {/* Fees Collection chart */}
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, p: 2, display: 'flex', flexDirection: 'column', height: 420 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Fee Collection Status
            </Typography>
            <Box sx={{ flexGrow: 1, width: '100%' }}>
              <AmColumnChart
                categories={['Collected', 'Outstanding']}
                series={[{
                  name: 'Amount',
                  data: [stats?.feeCollectionSummary?.totalCollected || 0, stats?.feeCollectionSummary?.totalOutstanding || 0]
                }]}
                colors={['#10B981', '#EF4444']}
                height={280}
                valuePrefix="₹"
              />
            </Box>
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                Total School Term Expected Dues: ₹{(stats?.feeCollectionSummary?.totalExpected ?? 0).toLocaleString()}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Attendance Pie Chart with Tabs */}
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, p: 2, display: 'flex', flexDirection: 'column', height: 420 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Attendance Ratios (Today)
              </Typography>
              <Tabs
                value={activeAttendanceTab}
                onChange={(e, val) => setActiveAttendanceTab(val)}
                textColor="primary"
                indicatorColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                sx={{ minHeight: 'auto', '.MuiTab-root': { py: 0.5, minHeight: 'auto', fontSize: '0.8rem', fontWeight: 700 } }}
              >
                <Tab label="Students" />
                <Tab label="Teachers" />
                <Tab label="Staff" />
              </Tabs>
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 260 }}>
              {currentAttendanceData.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 750, mb: 0.5 }}>
                    No Attendance Logged
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    There are no attendance records for the selected date.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <AmDonutChart
                    data={currentAttendanceData.map(d => ({ name: d.name, value: d.value, color: d.color }))}
                    innerRadius={70}
                    height={260}
                    centerLabel="Attendance"
                    centerValue={`${((currentAttendanceData[0]?.value || 0) + (currentAttendanceData[1]?.value || 0)).toFixed(1)}%`}
                    valueSuffix="%"
                  />
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              {currentAttendanceData.map((e, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: e.color }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {e.name}: {e.value.toFixed(1)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Absent / On-Leave Faculty Row */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, p: 2, height: 380, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AlertIcon color="warning" /> Absent / On-Leave Faculty
            </Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {!stats?.isTeacherAttendanceTaken ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    📋 Attendance for the teachers is yet to be taken today.
                  </Typography>
                </Box>
              ) : stats?.teacherCount === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    No teachers registered in this school yet.
                  </Typography>
                </Box>
              ) : (!stats?.absentTeachers || stats.absentTeachers.length === 0) ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 700 }}>
                    🎉 All teachers are present today!
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 280 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Teacher Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.absentTeachers.map((teacher) => (
                        <TableRow key={teacher.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {`Prof. ${teacher.firstName} ${teacher.lastName}`}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={teacher.status === 'LEAVE' ? 'ON LEAVE' : 'ABSENT'}
                              color={teacher.status === 'LEAVE' ? 'info' : 'error'}
                              sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                            {teacher.remarks || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Card>
        </Grid>

        {/* School Inventory Analytics Card */}
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, p: 2, height: 380, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon color="primary" /> School Inventory Analytics
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              {(() => {
                const inventoryItems = inventoryData?.getInventoryList || [];
                const categoryLabels = {
                  STATIONERY: 'Stationery',
                  FURNITURE: 'Furniture',
                  LAB_EQUIPMENT: 'Lab Equipment',
                  SPORTS: 'Sports & Gym',
                  CLASSROOM: 'Classroom Supplies',
                  COMPUTERS: 'Computers & IT',
                  OTHER: 'Other Assets'
                };
                const inventoryByCategory = {};
                inventoryItems.forEach(item => {
                  const cat = item.category || 'OTHER';
                  if (!inventoryByCategory[cat]) {
                    inventoryByCategory[cat] = 0;
                  }
                  inventoryByCategory[cat] += item.quantity;
                });
                const inventoryChartData = Object.keys(inventoryByCategory).map(cat => ({
                  category: categoryLabels[cat] || cat,
                  quantity: inventoryByCategory[cat]
                }));

                if (inventoryLoading) {
                  return <CircularProgress size={30} />;
                }

                if (inventoryItems.length === 0) {
                  return (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
                        No inventory records found.
                      </Typography>
                    </Box>
                  );
                }

                return (
                  <AmBarChartHorizontal
                    categories={inventoryChartData.map(d => d.category)}
                    series={[{ name: 'Quantity', data: inventoryChartData.map(d => d.quantity) }]}
                    height={280}
                    valueSuffix=" items"
                  />
                );
              })()}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Faculty Attendance Trend Chart */}
      {trendData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
          <Grid item xs={12} component={motion.div} variants={itemVariants}>
            <Card sx={{ ...cardStyle, p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Faculty & Staff Attendance Trend (Last 7 Days)
              </Typography>
              <Box sx={{ width: '100%', height: { xs: 260, sm: 320 } }}>
                <AmAreaChart
                  categories={trendData.map(d => d.date)}
                  series={[
                    { name: 'Present Teachers', data: trendData.map(d => d.presentTeachers), color: '#10B981' },
                    { name: 'Present Staff', data: trendData.map(d => d.presentStaff), color: '#6366F1' },
                    { name: 'Absent Teachers', data: trendData.map(d => d.absentTeachers), color: '#EF4444', dashed: true },
                    { name: 'Absent Staff', data: trendData.map(d => d.absentStaff), color: '#F59E0B', dashed: true }
                  ]}
                  height={280}
                />
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Live Class Activity Analytics (For Principal / Admin) */}
      {['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 3 }}>
            Live Class Activity & Lecture Tracker
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
            {/* Activity Chart breakdown */}
            <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
              <Card sx={{ ...cardStyle, p: 2, height: 420, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Activity Type Breakdown
                </Typography>

                {(() => {
                  const jobsList = jobsData?.getPendingJobs || [];
                  const studyCount = jobsList.filter(j => j.jobType === 'Study').length;
                  const othersCount = jobsList.filter(j => j.jobType === 'Others').length;
                  const runningCount = jobsList.filter(j => j.status === 'Running').length;

                  const chartData = [
                    { name: 'Lectures / Study', value: studyCount || 1, color: '#6366F1' },
                    { name: 'Other Activities', value: othersCount || 0, color: '#F59E0B' }
                  ];

                  if (jobsList.length === 0) {
                    return (
                      <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                        <Typography color="text.secondary" variant="body2">No active sessions logged today.</Typography>
                      </Box>
                    );
                  }

                  return (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Box sx={{ height: 220, position: 'relative' }}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                          <AmDonutChart
                            data={[
                              { name: 'Lectures / Study', value: studyCount, color: '#6366F1' },
                              { name: 'Other Activities', value: othersCount, color: '#F59E0B' }
                            ]}
                            innerRadius={70}
                            height={200}
                            centerLabel="Total Active"
                            centerValue={`${studyCount + othersCount}`}
                            valueSuffix=""
                          />
                        </Box>
                      </Box>

                      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#6366F1' }}>{studyCount}</Typography>
                          <Typography variant="caption" color="text.secondary">Study / Lectures</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#F59E0B' }}>{othersCount}</Typography>
                          <Typography variant="caption" color="text.secondary">Others</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981' }}>{runningCount}</Typography>
                          <Typography variant="caption" color="text.secondary">Live Now</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })()}
              </Card>
            </Grid>

            {/* Analytical Graph */}
            <Grid item xs={12} md={8} component={motion.div} variants={itemVariants}>
              <Card sx={{ ...cardStyle, p: 2, height: 420, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Subject & Activity Tracker Graph
                </Typography>

                {(() => {
                  const jobsList = jobsData?.getPendingJobs || [];
                  if (jobsList.length === 0) {
                    return (
                      <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                        <Typography color="text.secondary" variant="body2">No active sessions logged today.</Typography>
                      </Box>
                    );
                  }

                  // Aggregate jobs by subjectName or remarks (if jobType is Others)
                  const aggregatedMap = {};
                  jobsList.forEach(job => {
                    const name = job.jobType === 'Study'
                      ? job.subjectName
                      : (job.remarks ? (job.remarks.length > 20 ? job.remarks.substring(0, 17) + '...' : job.remarks) : 'Others');
                    if (!aggregatedMap[name]) {
                      aggregatedMap[name] = { name, Running: 0, Complete: 0, Total: 0 };
                    }
                    if (job.status === 'Running') {
                      aggregatedMap[name].Running += 1;
                    } else if (job.status === 'Complete') {
                      aggregatedMap[name].Complete += 1;
                    }
                    aggregatedMap[name].Total += 1;
                  });

                  const chartData = Object.values(aggregatedMap).sort((a, b) => b.Total - a.Total);

                  return (
                    <Box sx={{ flexGrow: 1, width: '100%', height: 320 }}>
                      <AmColumnChart
                        categories={chartData.map(c => c.name)}
                        series={[
                          { name: 'Running', data: chartData.map(c => c.Running), color: '#10B981' },
                          { name: 'Completed', data: chartData.map(c => c.Complete), color: '#6366F1' }
                        ]}
                        stacked={true}
                        height={280}
                      />
                    </Box>
                  );
                })()}
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Demographic & Performance Distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
        {/* Class-wise Student Enrollment */}
        {classEnrollmentData.length > 0 && (
          <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
            <Card sx={{ ...cardStyle, p: 2, height: 380, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Class-wise Student Enrollment
              </Typography>
              <Box sx={{ width: '100%', height: 280, flexGrow: 1 }}>
                <AmColumnChart
                  categories={classEnrollmentData.map(c => c.name)}
                  series={[{ name: 'Students', data: classEnrollmentData.map(c => c.students), color: '#6366F1' }]}
                  height={280}
                  valueSuffix=" Students"
                />
              </Box>
            </Card>
          </Grid>
        )}

        {/* Academic Grade Distribution */}
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, p: 2, height: 420, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Academic Grade Distribution
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  select
                  size="small"
                  label="Class"
                  value={gradeClassId}
                  onChange={(e) => setGradeClassId(e.target.value)}
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value="">All</MenuItem>
                  {classesData?.getClasses?.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Section"
                  value={gradeSectionId}
                  disabled={!gradeClassId}
                  onChange={(e) => setGradeSectionId(e.target.value)}
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value="">All</MenuItem>
                  {gradeSectionsData?.getSections?.map((sec) => (
                    <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
            <Box sx={{ width: '100%', height: 280, flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              {gradeLoading && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, backdropFilter: 'blur(2px)', borderRadius: 2 }}>
                  <CircularProgress size={40} />
                </Box>
              )}
              {gradeDistributionData.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No grading data found for the selected filters.
                </Typography>
              ) : (
                <AmColumnChart
                  categories={gradeDistributionData.map(g => g.name)}
                  series={[{ name: 'Students', data: gradeDistributionData.map(g => g.count), color: '#10B981' }]}
                  height={280}
                  valueSuffix=" Students"
                />
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Fair Copy Completion Rates Row */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
        {/* Right Column: Copy Completion Analytics */}
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, p: 2, height: 420, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Fair Copy Completion Rates (%)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  select
                  size="small"
                  label="Class"
                  value={copyClassId}
                  onChange={(e) => setCopyClassId(e.target.value)}
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value="">All</MenuItem>
                  {classesData?.getClasses?.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Section"
                  value={copySectionId}
                  disabled={!copyClassId}
                  onChange={(e) => setCopySectionId(e.target.value)}
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value="">All</MenuItem>
                  {copySectionsData?.getSections?.map((sec) => (
                    <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
            <Box sx={{ width: '100%', height: 280, flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              {copyLoading && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, backdropFilter: 'blur(2px)', borderRadius: 2 }}>
                  <CircularProgress size={40} />
                </Box>
              )}
              {(!persistentCopyData || persistentCopyData.length === 0) ? (
                <Typography variant="body2" color="text.secondary">
                  No copy records found for the selected filters.
                </Typography>
              ) : (
                <AmColumnChart
                  categories={persistentCopyData.map(item => `${item.subjectName} (${item.className})`)}
                  series={[{ name: 'Completion Rate', data: persistentCopyData.map(item => item.completionRate), color: '#D946EF' }]}
                  height={280}
                  valueSuffix="%"
                />
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Parent Complaints & Resolution Portal */}
      {!isSuperAdmin && ['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) && (
        <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
          <Grid item xs={12} component={motion.div} variants={itemVariants}>
            <Card sx={{ ...cardStyle, p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'error.main' + '20', color: 'error.main' }}>
                    <ComplaintIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
                      Parent Complaints & Resolutions
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Grievances and concerns raised by parents needing review and response.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {(!complaintsData?.getComplaints || complaintsData.getComplaints.length === 0) ? (
                <Box sx={{ py: 6, textAlign: 'center', border: `1px dashed ${theme.palette.divider}`, borderRadius: 3 }}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
                    No complaints registered by parents.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Parent</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Title & Description</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {complaintsData.getComplaints.map((c) => {
                        const isResolved = c.complaintStatus === 'RESOLVED';
                        return (
                          <TableRow key={c.id} hover>
                            <TableCell sx={{ fontSize: '0.85rem' }}>
                              {new Date(c.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {c.parentId ? `${c.parentId.firstName} ${c.parentId.lastName}` : 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {c.parentId?.phone}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {c.studentId ? `${c.studentId.firstName} ${c.studentId.lastName}` : '—'}
                            </TableCell>
                            <TableCell>
                              <Chip label={c.category} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 300 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{c.title}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                {c.description}
                              </Typography>
                              {c.feedback && (
                                <Box sx={{ mt: 1, p: 1, bgcolor: 'success.main' + '10', borderRadius: 1, borderLeft: '3px solid', borderColor: 'success.main' }}>
                                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 700, display: 'block' }}>Resolution Reply:</Typography>
                                  <Typography variant="caption" color="text.primary">{c.feedback}</Typography>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={c.complaintStatus}
                                size="small"
                                color={isResolved ? 'success' : 'warning'}
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                                {!isResolved && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => {
                                      setSelectedComplaint(c);
                                      setFeedbackText('');
                                      setOpenComplaintDialog(true);
                                    }}
                                    sx={{ textTransform: 'none', borderRadius: 2 }}
                                  >
                                    Resolve
                                  </Button>
                                )}
                                <Tooltip title="Delete Complaint">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteComplaint(c.id)}
                                    disabled={deletingComplaint}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Events & Holidays Row */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
        <Grid item xs={12} component={motion.div} variants={itemVariants}>
          <Card
            sx={{
              ...cardStyle,
              p: 3
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CalendarIcon color="primary" sx={{ fontSize: 28 }} /> Upcoming Events & Holidays
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Scheduled functions, parent-teacher meets, and festive holiday breaks.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/events')}
                sx={{
                  borderRadius: 3,
                  fontWeight: 700,
                  px: 2.5,
                  py: 0.8,
                  textTransform: 'none',
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                Manage Events
              </Button>
            </Box>

            {eventsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={30} /></Box>
            ) : !eventsData?.getEvents || eventsData.getEvents.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', border: `1px dashed ${theme.palette.divider}`, borderRadius: 3 }}>
                <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
                  No upcoming events or holidays scheduled.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2.5}>
                {eventsData.getEvents.slice(0, 4).map((evt) => {
                  const evtDate = new Date(evt.date);
                  const isHoliday = evt.type === 'HOLIDAY';
                  const accentColor = isHoliday ? theme.palette.secondary.main : theme.palette.primary.main;
                  const formattedDate = evtDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <Grid item xs={12} sm={6} md={3} key={evt.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 3.5,
                          border: `1px solid ${theme.palette.divider}`,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            borderColor: accentColor,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '4px',
                            width: '100%',
                            bgcolor: accentColor
                          }
                        }}
                      >
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Chip
                              label={evt.type}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.6rem',
                                height: 20,
                                bgcolor: `${accentColor}15`,
                                color: accentColor
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                              {formattedDate}
                            </Typography>
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, lineHeight: 1.3, fontFamily: "'Outfit', sans-serif" }}>
                            {evt.title}
                          </Typography>
                          {evt.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineBreak: 'anywhere' }}>
                              {evt.description}
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Parent Complaints Response Dialog */}
      <Dialog open={openComplaintDialog} onClose={() => setOpenComplaintDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Respond to Parent Complaint</DialogTitle>
        <DialogContent>
          {selectedComplaint && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Category: {selectedComplaint.category}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 1 }}>
                {selectedComplaint.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                {selectedComplaint.description}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Admin Feedback / Resolution Reply"
                type="text"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                sx={{ mt: 3 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenComplaintDialog(false)} variant="outlined">Cancel</Button>
          <Button
            onClick={() => {
              if (selectedComplaint) {
                resolveComplaintMutation({
                  variables: {
                    id: selectedComplaint.id,
                    feedback: feedbackText
                  }
                });
              }
            }}
            variant="contained"
            disabled={resolvingComplaint || !feedbackText.trim()}
          >
            {resolvingComplaint ? 'Resolving...' : 'Submit Resolution'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard;
