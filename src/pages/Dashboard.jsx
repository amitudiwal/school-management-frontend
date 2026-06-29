import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useQuery, useLazyQuery } from '@apollo/client';
import { 
  Box, Grid, Card, CardContent, Typography, Avatar, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, CircularProgress, Alert, Button, useTheme, LinearProgress, Chip,
  Tabs, Tab, TextField, TablePagination, Stack, MenuItem
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  School as SchoolIcon, People as PeopleIcon, LocalLibrary as LibraryIcon, 
  AttachMoney as FeesIcon, AssignmentTurnedIn as AttendanceIcon, 
  Warning as AlertIcon, Security as AuditIcon, DateRange as LeaveIcon,
  Assignment as HomeworkIcon, CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { GET_SUPER_ADMIN_DASHBOARD, GET_SCHOOL_ADMIN_DASHBOARD, GET_AUDIT_LOGS, GET_PENDING_JOBS, GET_EVENTS, GET_CLASSES, GET_SECTIONS, GET_GRADE_DISTRIBUTION, GET_COPY_SUBMISSION_ANALYTICS } from '../graphql/operations';
import CustomDatePicker from '../components/CustomDatePicker';

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
    }
  }, [isSuperAdmin, startDate, endDate, refetchSuperDashboard, refetchSchoolDashboard, refetchJobs, refetchEvents]);

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
      { title: 'Total Schools Onboarded', value: stats?.totalSchools ?? 0, icon: <SchoolIcon />, color: '#6366F1' },
      { title: 'Total Students Globally', value: stats?.totalStudents ?? 0, icon: <PeopleIcon />, color: '#D946EF' },
      { title: 'Total Active Teachers', value: stats?.totalTeachers ?? 0, icon: <LibraryIcon />, color: '#10B981' },
      { title: 'Monthly Revenue', value: `₹${(stats?.monthlyRevenue ?? 0).toLocaleString()}`, icon: <FeesIcon />, color: '#F59E0B' },
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
              <Card>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: `${card.color}20`, color: card.color, width: 56, height: 56 }}>
                    {card.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {card.value}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Revenue Analytics Graph */}
        <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
          <Grid item xs={12} md={8} component={motion.div} variants={itemVariants}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                SaaS Monthly Subscription Revenue
              </Typography>
              <Box sx={{ width: '100%', height: { xs: 240, sm: 300 } }}>
                <ResponsiveContainer>
                  <AreaChart data={stats?.monthlyRevenueSeries || []}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider }} />
                    <Area type="monotone" dataKey="revenue" stroke="#6366F1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>

          {/* Subscriptions breakdown */}
          <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
            <Card sx={{ height: '100%', p: 2 }}>
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
    { title: 'Total Enrolled Students', value: stats?.studentCount, icon: <PeopleIcon />, color: '#6366F1' },
    { title: 'Academic Faculty Teachers', value: stats?.teacherCount, icon: <LibraryIcon />, color: '#D946EF' },
    { title: 'Operational Staff Members', value: stats?.staffCount, icon: <SchoolIcon />, color: '#10B981' },
    { title: 'Upcoming Examinations', value: stats?.upcomingExamsCount, icon: <AlertIcon />, color: '#F59E0B' },
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
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${card.color}20`, color: card.color, width: 56, height: 56 }}>
                  {card.icon}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {card.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* School Administration Overview Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
        {/* Library Stats Card */}
        <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
          <Card sx={{ height: '100%' }}>
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
          <Card sx={{ height: '100%' }}>
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
          <Card sx={{ height: '100%' }}>
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
          <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 420 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Fee Collection Status
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={feeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 0, 0]}>
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                Total School Term Expected Dues: ₹${(stats?.feeCollectionSummary?.totalExpected ?? 0).toLocaleString()}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Attendance Pie Chart with Tabs */}
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 420 }}>
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
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={currentAttendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {currentAttendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
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
          <Card sx={{ p: 2, height: 380, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AlertIcon color="warning" /> Absent / On-Leave Faculty
            </Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {(!stats?.absentTeachers || stats.absentTeachers.length === 0) ? (
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
      </Grid>

      {/* Faculty Attendance Trend Chart */}
      {trendData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
          <Grid item xs={12} component={motion.div} variants={itemVariants}>
            <Card sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Faculty & Staff Attendance Trend (Last 7 Days)
              </Typography>
              <Box sx={{ width: '100%', height: { xs: 260, sm: 320 } }}>
                <ResponsiveContainer>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorPresentTeachers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPresentStaff" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider }} />
                    <Legend />
                    <Area type="monotone" name="Present Teachers" dataKey="presentTeachers" stroke="#10B981" fillOpacity={1} fill="url(#colorPresentTeachers)" strokeWidth={3} />
                    <Area type="monotone" name="Present Staff" dataKey="presentStaff" stroke="#6366F1" fillOpacity={1} fill="url(#colorPresentStaff)" strokeWidth={3} />
                    <Area type="monotone" name="Absent Teachers" dataKey="absentTeachers" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                    <Area type="monotone" name="Absent Staff" dataKey="absentStaff" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
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
              <Card sx={{ p: 2, height: 420, display: 'flex', flexDirection: 'column' }}>
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
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
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
              <Card sx={{ p: 2, height: 420, display: 'flex', flexDirection: 'column' }}>
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
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                          <XAxis dataKey="name" stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem', fontWeight: 600 }} />
                          <YAxis stroke={theme.palette.text.secondary} allowDecimals={false} style={{ fontSize: '0.75rem' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: theme.palette.background.paper, 
                              borderColor: theme.palette.divider,
                              borderRadius: 8,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36} 
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '0.75rem', fontWeight: 600, paddingBottom: '10px' }} 
                          />
                          <Bar dataKey="Running" name="Running" fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Complete" name="Completed" fill="#6366F1" stackId="a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
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
            <Card sx={{ p: 2, height: 380, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Class-wise Student Enrollment
              </Typography>
              <Box sx={{ width: '100%', height: 280, flexGrow: 1 }}>
                <ResponsiveContainer>
                  <BarChart data={classEnrollmentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${value} Students`, 'Count']} />
                    <Bar dataKey="students" fill="#6366F1" radius={[6, 6, 0, 0]}>
                      {classEnrollmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#6366F1" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>
        )}

        {/* Academic Grade Distribution */}
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <Card sx={{ p: 2, height: 420, display: 'flex', flexDirection: 'column' }}>
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
                <ResponsiveContainer>
                  <BarChart data={gradeDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${value} Students`, 'Count']} />
                    <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]}>
                      {gradeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#10B981" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Fair Copy Completion Rates Row */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
        {/* Right Column: Copy Completion Analytics */}
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <Card sx={{ p: 2, height: 420, display: 'flex', flexDirection: 'column' }}>
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
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={persistentCopyData.map(item => ({
                    name: `${item.subjectName} (${item.className})`,
                    rate: item.completionRate
                  }))} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem', fontWeight: 600 }} />
                    <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem' }} domain={[0, 100]} unit="%" />
                    <Tooltip formatter={(value) => [`${value}% Completed`, 'Rate']} />
                    <Bar dataKey="rate" fill="#D946EF" radius={[6, 6, 0, 0]}>
                      {persistentCopyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#D946EF" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Events & Holidays Row */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
        <Grid item xs={12} component={motion.div} variants={itemVariants}>
          <Card 
            sx={{ 
              p: 3,
              borderRadius: 4,
              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
              background: theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.7)' : '#ffffff',
              backdropFilter: 'blur(10px)',
              boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)' : '0 8px 32px 0 rgba(99, 102, 241, 0.04)'
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
                  const accentColor = isHoliday ? '#EF4444' : '#6366F1';
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
    </Box>
  );
}

export default Dashboard;
