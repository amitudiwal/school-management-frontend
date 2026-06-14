import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@apollo/client';
import { 
  Box, Grid, Card, CardContent, Typography, Avatar, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, CircularProgress, Alert, Button, useTheme, LinearProgress, Chip,
  Tabs, Tab, TextField, TablePagination
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  School as SchoolIcon, People as PeopleIcon, LocalLibrary as LibraryIcon, 
  AttachMoney as FeesIcon, AssignmentTurnedIn as AttendanceIcon, 
  Warning as AlertIcon, Security as AuditIcon 
} from '@mui/icons-material';
import { GET_SUPER_ADMIN_DASHBOARD, GET_SCHOOL_ADMIN_DASHBOARD, GET_AUDIT_LOGS } from '../graphql/operations';
import CustomDatePicker from '../components/CustomDatePicker';

function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const [activeAttendanceTab, setActiveAttendanceTab] = useState(0);
  const [dashboardDate, setDashboardDate] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(0);

  // Load appropriate dashboard queries based on user role
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  const { loading: saLoading, error: saError, data: saData, refetch: refetchSuperDashboard } = useQuery(GET_SUPER_ADMIN_DASHBOARD, {
    skip: !isSuperAdmin
  });
  
  const { loading: schoolLoading, error: schoolError, data: schoolData, refetch: refetchSchoolDashboard } = useQuery(GET_SCHOOL_ADMIN_DASHBOARD, {
    skip: isSuperAdmin,
    variables: { date: new Date(dashboardDate) },
    fetchPolicy: 'network-only'
  });

  React.useEffect(() => {
    if (isSuperAdmin) {
      refetchSuperDashboard?.();
    } else {
      refetchSchoolDashboard?.({ date: new Date(dashboardDate) });
    }
  }, [isSuperAdmin, dashboardDate, refetchSuperDashboard, refetchSchoolDashboard]);

  const { loading: logsLoading, data: logsData } = useQuery(GET_AUDIT_LOGS, {
    skip: !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user?.role)
  });

  if (saLoading || schoolLoading) {
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
      { title: 'Total Schools Onboarded', value: stats?.totalSchools, icon: <SchoolIcon />, color: '#6366F1' },
      { title: 'Total Students Globally', value: stats?.totalStudents, icon: <PeopleIcon />, color: '#D946EF' },
      { title: 'Total Active Teachers', value: stats?.totalTeachers, icon: <LibraryIcon />, color: '#10B981' },
      { title: 'Monthly Revenue', value: `$${stats?.monthlyRevenue?.toLocaleString()}`, icon: <FeesIcon />, color: '#F59E0B' },
    ];

    console.log('Global Audit Logs:', logsData?.getGlobalAuditLogs);

    return (
      <Box>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 3, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Global Operations Dashboard
        </Typography>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {cards.map((card, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
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
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
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
          <Grid item xs={12} md={4}>
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
      </Box>
    );
  }

  // --- RENDERING TENANT SCHOOL ADMIN PORTAL ---
  const stats = schoolData?.getSchoolAdminDashboard;
  const cards = [
    { title: 'Total Enrolled Students', value: stats?.studentCount, icon: <PeopleIcon />, color: '#6366F1' },
    { title: 'Academic Faculty Teachers', value: stats?.teacherCount, icon: <LibraryIcon />, color: '#D946EF' },
    { title: 'Operational Staff Members', value: stats?.staffCount, icon: <SchoolIcon />, color: '#10B981' },
    { title: 'Upcoming Examinations', value: stats?.upcomingExamsCount, icon: <AlertIcon />, color: '#F59E0B' },
  ];

  // Attendance Data Formats
  const studentAttendanceData = [
    { name: 'Present', value: stats?.attendanceSummary?.presentPercent ?? 95.0, color: '#10B981' },
    { name: 'Late', value: stats?.attendanceSummary?.latePercent ?? 2.0, color: '#F59E0B' },
    { name: 'Absent', value: stats?.attendanceSummary?.absentPercent ?? 3.0, color: '#EF4444' },
  ];

  const teacherAttendanceData = [
    { name: 'Present', value: stats?.teacherAttendanceSummary?.presentPercent ?? 98.0, color: '#10B981' },
    { name: 'Late', value: stats?.teacherAttendanceSummary?.latePercent ?? 1.0, color: '#F59E0B' },
    { name: 'Absent', value: stats?.teacherAttendanceSummary?.absentPercent ?? 1.0, color: '#EF4444' },
  ];

  const staffAttendanceData = [
    { name: 'Present', value: stats?.staffAttendanceSummary?.presentPercent ?? 96.0, color: '#10B981' },
    { name: 'Late', value: stats?.staffAttendanceSummary?.latePercent ?? 2.0, color: '#F59E0B' },
    { name: 'Absent', value: stats?.staffAttendanceSummary?.absentPercent ?? 2.0, color: '#EF4444' },
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
    { name: 'Collected', value: stats?.feeCollectionSummary?.totalCollected || 32000 },
    { name: 'Outstanding', value: stats?.feeCollectionSummary?.totalOutstanding || 18000 },
  ];

  // Class Enrollment Data Formatting
  const classEnrollmentData = stats?.classEnrollmentSummary?.map(c => ({
    name: c.className,
    students: c.studentCount
  })) || [];

  // Grade Distribution Data Formatting
  const gradeDistributionData = stats?.gradeDistribution?.map(g => ({
    name: g.grade,
    count: g.count
  })) || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          School Overview Portal
        </Typography>
        <CustomDatePicker
          label="Attendance & Metrics Date"
          value={dashboardDate}
          onChange={(e) => setDashboardDate(e.target.value)}
          sx={{ width: { xs: '100%', sm: 240 } }}
        />
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
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

      {/* Analytics charts for School Admins */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Attendance Pie Chart with Tabs */}
        <Grid item xs={12} md={6}>
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
            
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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

        {/* Fees Collection chart */}
        <Grid item xs={12} md={6}>
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
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 0, 0]}>
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                Total School Term Expected Dues: ${stats?.feeCollectionSummary?.totalExpected?.toLocaleString()}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Demographic & Performance Distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Class-wise Enrollment Distribution */}
        {classEnrollmentData.length > 0 && (
          <Grid item xs={12} md={6}>
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
        {gradeDistributionData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2, height: 380, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Academic Grade Distribution
              </Typography>
              <Box sx={{ width: '100%', height: 280, flexGrow: 1 }}>
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
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default Dashboard;
