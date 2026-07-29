import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Card, CardContent, Typography, Button, Switch, Tabs, Tab,
  Grid, CircularProgress, Alert, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, useTheme, Divider, Checkbox
} from '@mui/material';
import {
  Security as SecurityIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  CheckCircle as CheckedIcon,
  Cancel as UncheckedIcon
} from '@mui/icons-material';
import { GET_SCHOOL, UPDATE_SCHOOL_PERMISSIONS } from '../graphql/operations';
import { showToast } from '../store/slices/uiSlice';

const ROLE_FEATURES = {
  PRINCIPAL: [
    { key: 'dashboard', label: 'Dashboard View', desc: 'Allows access to the business/school metrics dashboard.' },
    { key: 'super-teachers', label: 'Academics Management Register', desc: 'Allows registering and managing academic coordinators.' },
    { key: 'accountants', label: 'Accountant Register', desc: 'Allows registering and managing school accountants.' },
    { key: 'teachers', label: 'Teacher Registration', desc: 'Allows registering new teachers and updating details.' },
    { key: 'students', label: 'Student Registration', desc: 'Allows onboarding new students and modifying records.' },
    { key: 'alumni', label: 'Alumni Directory', desc: 'Access and review historical alumni directories.' },
    { key: 'classes', label: 'Class Management', desc: 'Enables managing class groups and student sections.' },
    { key: 'shifts', label: 'Shift Management', desc: 'Provides capability to schedule staff shifts.' },
    { key: 'timetable', label: 'Weekly Timetable', desc: 'Allows scheduling and viewing timetables.' },
    { key: 'exams', label: 'Exam Schedule', desc: 'Allows managing examination schedules.' },
    { key: 'attendance', label: 'Daily Attendance', desc: 'Allows tracking and marking student daily attendance rolls.' },
    { key: 'staff-attendance', label: 'Staff Attendance', desc: 'Allows tracking teacher and staff attendance logs.' },
    { key: 'self-attendance', label: 'Mark Attendance', desc: 'Enables staff to check-in/check-out.' },
    { key: 'leaves', label: 'Leave Management', desc: 'Allows managing employee leaves of absence.' },
    { key: 'pending-jobs', label: 'Pending Jobs', desc: 'Enables submitting and tracking backend operations.' },
    { key: 'homework', label: 'Homework Board', desc: 'Enables assigning homework assignments to classes.' },
    { key: 'copy-submission', label: 'Copy Submission', desc: 'Enables teachers to track fair copy submission for students.' },
    { key: 'grades', label: 'Grades Entry', desc: 'Allows inputting marks and grades for exams.' },
    { key: 'analytics', label: 'Performance Analytics', desc: 'Provides analytical graphs of student grade trends.' },
    { key: 'fees', label: 'Fees Accounting', desc: 'Enables managing fee structures, invoicing, and receipts.' },
    { key: 'payroll', label: 'Payroll & Payslips', desc: 'Allows processing employee salaries.' },
    { key: 'bus-tracker', label: 'Bus Tracker', desc: 'Provides real-time GPS school bus location tracking.' },
    { key: 'events', label: 'Events & Holidays', desc: 'Allows managing school events and holidays.' },
    { key: 'inventory', label: 'School Inventory', desc: 'Allows tracking school assets and stock.' },
    { key: 'library', label: 'Library Bookshelf', desc: 'Allows managing library catalogs and returns.' },
    { key: 'announcements', label: 'Circular Portal', desc: 'Allows broadcasting notice board updates and circulars.' },
    { key: 'settings', label: 'Settings', desc: 'Access general school settings and configuration.' }
  ],
  SUPER_TEACHER: [
    { key: 'teachers', label: 'Teacher Registration', desc: 'Allows registering new teachers and updating their details.' },
    { key: 'classes', label: 'Class Management', desc: 'Enables managing class groups and student sections.' },
    { key: 'timetable', label: 'Weekly Timetable', desc: 'Provides capability to schedule and assign lessons.' },
    { key: 'exams', label: 'Exam Schedule', desc: 'Allows creating and managing school examination plans.' },
    { key: 'staff-attendance', label: 'Staff Attendance', desc: 'Allows marking and monitoring teacher and staff logs.' },
    { key: 'leaves', label: 'Leave Management', desc: 'Allows approving or requesting teacher leave of absence.' },
    { key: 'copy-submission', label: 'Copy Submission', desc: 'Enables teachers to track fair copy submission for students.' },
    { key: 'events', label: 'Events & Holidays', desc: 'Allows managing and adding school events and holidays.' },
    { key: 'inventory', label: 'School Inventory', desc: 'Allows managing and adding school assets like sports kits and furniture.' },
    { key: 'library', label: 'Library Bookshelf', desc: 'Allows managing library catalogs, search tags, checkout lists, and returns.' },
    { key: 'announcements', label: 'Circular Portal', desc: 'Allows broadcasting notice board updates, announcements, and SMS alerts.' }
  ],
  ACCOUNTANT: [
    { key: 'students', label: 'Student Registration', desc: 'Allows onboarding new students and modifying records.' },
    { key: 'fees', label: 'Fees Accounting', desc: 'Enables managing fee structures, invoicing, and receipts.' },
    { key: 'payroll', label: 'Payroll & Payslips', desc: 'Allows viewing and processing employee salaries.' }
  ],
  TEACHER: [
    { key: 'pending-jobs', label: 'Pending Jobs', desc: 'Enables submitting and tracking backend operations.' },
    { key: 'timetable', label: 'Weekly Timetable', desc: 'Provides view access to teacher daily and weekly timetable.' },
    { key: 'bus-tracker', label: 'Bus Tracker', desc: 'Allows real-time checking of transport status.' },
    { key: 'attendance', label: 'Daily Attendance', desc: 'Enables marking student daily attendance rolls.' },
    { key: 'copy-submission', label: 'Copy Submission', desc: 'Enables teachers to track fair copy submission for students.' },
    { key: 'leaves', label: 'Leave Management', desc: 'Allows faculty to request leaves and review statuses.' },
    { key: 'homework', label: 'Homework Board', desc: 'Enables assigning homework assignments to classes.' },
    { key: 'grades', label: 'Grades Entry', desc: 'Allows inputting marks and grades for exams.' },
    { key: 'analytics', label: 'Performance Analytics', desc: 'Provides analytical graphs of student grade trends.' },
    { key: 'payroll', label: 'Payroll & Payslips', desc: 'Provides view access to teacher salary payslips.' },
    { key: 'library', label: 'Library Bookshelf', desc: 'Allows managing library catalogs, search tags, checkout lists, and returns.' },
    { key: 'announcements', label: 'Circular Portal', desc: 'Allows broadcasting notice board updates, announcements, and SMS alerts.' }
  ],
  PARENT: [
    { key: 'parent-portal', label: 'Parent Portal', desc: 'Dashboard with kid reports, grades, and fee records.' },
    { key: 'bus-tracker', label: 'Bus Tracker', desc: 'Provides real-time GPS school bus location tracking.' },
    { key: 'announcements', label: 'Circular Portal', desc: 'Allows viewing notice board updates, announcements, and SMS alerts.' }
  ]
};

const DEFAULT_PERMISSIONS = {
  SUPER_TEACHER: ['teachers', 'classes', 'timetable', 'exams', 'staff-attendance', 'leaves', 'copy-submission', 'events', 'inventory', 'library', 'announcements'],
  ACCOUNTANT: ['students', 'fees', 'payroll'],
  TEACHER: ['pending-jobs', 'timetable', 'bus-tracker', 'attendance', 'leaves', 'homework', 'grades', 'analytics', 'payroll', 'copy-submission', 'library', 'announcements'],
  PARENT: ['parent-portal', 'bus-tracker', 'announcements'],
  PRINCIPAL: [
    'dashboard', 'super-teachers', 'accountants', 'teachers', 'students', 'alumni', 'classes',
    'shifts', 'timetable', 'exams', 'attendance', 'staff-attendance', 'self-attendance',
    'leaves', 'pending-jobs', 'homework', 'copy-submission', 'grades', 'analytics',
    'fees', 'payroll', 'bus-tracker', 'events', 'inventory', 'library', 'announcements', 'settings'
  ]
};

function FeaturePermissions() {
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  
  // Local state for modified permissions
  const [localPermissions, setLocalPermissions] = useState({
    SUPER_TEACHER: [],
    ACCOUNTANT: [],
    TEACHER: [],
    PARENT: [],
    PRINCIPAL: []
  });

  const { loading, error, data } = useQuery(GET_SCHOOL, {
    variables: { id: user?.schoolId },
    skip: !user?.schoolId,
    fetchPolicy: 'network-only'
  });

  const [updateSchoolPermissions, { loading: saving }] = useMutation(UPDATE_SCHOOL_PERMISSIONS, {
    onCompleted: () => {
      dispatch(showToast({ message: 'Permissions saved successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: `Error saving permissions: ${err.message}`, severity: 'error' }));
    }
  });

  // Sync query data to local state when query completes
  useEffect(() => {
    if (data?.getSchool?.settings?.featurePermissions) {
      const perms = data.getSchool.settings.featurePermissions;
      setLocalPermissions({
        SUPER_TEACHER: perms.SUPER_TEACHER || [],
        ACCOUNTANT: perms.ACCOUNTANT || [],
        TEACHER: perms.TEACHER || [],
        PARENT: perms.PARENT || [],
        PRINCIPAL: perms.PRINCIPAL || []
      });
    }
  }, [data]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading school settings: {error.message}</Alert>
      </Box>
    );
  }

  const roleKeys = Object.keys(ROLE_FEATURES);
  const currentRole = roleKeys[activeTab];
  const featuresForCurrentRole = ROLE_FEATURES[currentRole] || [];

  const handleToggleFeature = (role, featureKey) => {
    setLocalPermissions((prev) => {
      const currentList = prev[role] || [];
      let newList;
      if (currentList.includes(featureKey)) {
        newList = currentList.filter(k => k !== featureKey);
      } else {
        newList = [...currentList, featureKey];
      }
      return {
        ...prev,
        [role]: newList
      };
    });
  };

  const handleSave = () => {
    updateSchoolPermissions({
      variables: {
        schoolId: user?.schoolId,
        permissions: {
          SUPER_TEACHER: localPermissions.SUPER_TEACHER,
          ACCOUNTANT: localPermissions.ACCOUNTANT,
          TEACHER: localPermissions.TEACHER,
          PARENT: localPermissions.PARENT,
          PRINCIPAL: localPermissions.PRINCIPAL
        }
      }
    });
  };

  const handleResetToDefault = () => {
    setLocalPermissions({
      SUPER_TEACHER: [...DEFAULT_PERMISSIONS.SUPER_TEACHER],
      ACCOUNTANT: [...DEFAULT_PERMISSIONS.ACCOUNTANT],
      TEACHER: [...DEFAULT_PERMISSIONS.TEACHER],
      PARENT: [...DEFAULT_PERMISSIONS.PARENT],
      PRINCIPAL: [...DEFAULT_PERMISSIONS.PRINCIPAL]
    });
    dispatch(showToast({ message: 'Reset local state to defaults. Remember to Save!', severity: 'info' }));
  };

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 1, color: 'text.primary' }}>
          Role-Based Feature Permissions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure features and pages available to each user role. Unchecking a feature will instantly hide it from their sidebar navigation and block access.
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newTab) => setActiveTab(newTab)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              textTransform: 'none',
              minWidth: 120,
              py: 2
            }
          }}
        >
          <Tab label="Principal" />
          <Tab label="Academics Management" />
          <Tab label="Accountant" />
          <Tab label="Faculty Teacher" />
          <Tab label="Parent" />
        </Tabs>
      </Box>

      {/* Main Grid content */}
      <Grid container spacing={4}>
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              borderRadius: 4,
              border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
              background: isDark ? 'rgba(17, 24, 39, 0.7)' : '#ffffff',
              backdropFilter: 'blur(10px)',
              boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)' : '0 8px 32px 0 rgba(99, 102, 241, 0.04)'
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <TableContainer component={Paper} sx={{ boxShadow: 'none', background: 'transparent' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif", width: '50%' }}>Feature / Module</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif", width: '30%', textAlign: 'center' }}>Permission Node</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif", width: '20%', textAlign: 'center' }}>Enabled</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {featuresForCurrentRole.map((feature) => {
                      const isEnabled = (localPermissions[currentRole] || []).includes(feature.key);
                      return (
                        <TableRow
                          key={feature.key}
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                              {feature.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {feature.desc}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: 'inline-block',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1.5,
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                fontFamily: 'monospace'
                              }}
                            >
                              {feature.key}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={isEnabled}
                              onChange={() => handleToggleFeature(currentRole, feature.key)}
                              color="primary"
                              sx={{
                                '& .MuiSvgIcon-root': { fontSize: 28 },
                                transition: 'all 0.2s',
                                '&:hover': { transform: 'scale(1.1)' }
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              borderRadius: 4,
              border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
              background: isDark ? 'rgba(17, 24, 39, 0.7)' : '#ffffff',
              p: 1
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <SecurityIcon color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                  Settings Actions
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Review changes carefully. Denying feature access will immediately revoke pages and hide UI options for active logins next time they reload or navigate.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                  onClick={handleSave}
                  sx={{
                    py: 1.5,
                    fontWeight: 700,
                    borderRadius: 3,
                    boxShadow: '0px 4px 14px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  startIcon={<RestoreIcon />}
                  disabled={saving}
                  onClick={handleResetToDefault}
                  sx={{
                    py: 1.2,
                    fontWeight: 600,
                    borderRadius: 3
                  }}
                >
                  Reset to Defaults
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default FeaturePermissions;
