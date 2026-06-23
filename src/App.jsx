import React, { useMemo, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AppBar, Box, CssBaseline, IconButton, ThemeProvider, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import createMuiTheme from './theme/themeConfig';

// Layout & Pages
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import SuperAdminLogin from './pages/SuperAdminLogin';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import TeacherList from './pages/TeacherList';
import FeesList from './pages/FeesList';
import SchoolsList from './pages/SchoolsList';
import AttendanceMark from './pages/AttendanceMark';
import HomeworkList from './pages/HomeworkList';
import ParentList from './pages/ParentList';
import ClassManagement from './pages/ClassManagement';
import ParentDashboard from './pages/ParentDashboard';
import StaffAttendance from './pages/StaffAttendance';
import GradesEntry from './pages/GradesEntry';
import ClassAnalytics from './pages/ClassAnalytics';
import TimetableManagement from './pages/TimetableManagement';
import ExamManagement from './pages/ExamManagement';
import LeaveManagement from './pages/LeaveManagement';
import PayrollManagement from './pages/PayrollManagement';
import SuperTeacherRegister from './pages/SuperTeacherRegister';
import AccountantRegister from './pages/AccountantRegister';
import PendingJobs from './pages/PendingJobs';
import BusTracker from './pages/BusTracker';
import FeaturePermissions from './pages/FeaturePermissions';
import { useQuery } from '@apollo/client';
import { GET_SCHOOL } from './graphql/operations';

import ToastAlert from './components/ToastAlert';

function App() {
  const { themeMode } = useSelector((state) => state.ui);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const canViewDashboard = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role);

  // Generate MUI Theme dynamically based on dark/light setting
  const theme = useMemo(() => createMuiTheme(themeMode), [themeMode]);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: schoolData } = useQuery(GET_SCHOOL, {
    variables: { id: user?.schoolId },
    skip: !user?.schoolId || user?.role === 'SUPER_ADMIN',
  });

  const getPermissionsForRole = (roleName) => {
    if (!schoolData?.getSchool?.settings?.featurePermissions) {
      // Default fallback
      return {
        SUPER_TEACHER: ['teachers', 'classes', 'timetable', 'exams', 'staff-attendance', 'leaves'],
        ACCOUNTANT: ['students', 'fees', 'payroll'],
        TEACHER: ['pending-jobs', 'timetable', 'bus-tracker', 'attendance', 'leaves', 'homework', 'grades', 'analytics', 'payroll'],
        PARENT: ['parent-portal', 'bus-tracker']
      }[roleName] || [];
    }
    const perms = schoolData.getSchool.settings.featurePermissions;
    return perms[roleName] || [];
  };

  const hasPermission = (roleName, feature) => {
    if (roleName === 'SUPER_ADMIN') return true;
    if (['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(roleName)) return true;
    
    let mappedRole = roleName;
    if (roleName === 'CLASS_TEACHER') mappedRole = 'TEACHER';
    
    const rolePerms = getPermissionsForRole(mappedRole);
    return rolePerms.includes(feature);
  };

  const handleDrawerToggle = () => {
    setMobileOpen((open) => !open);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        {isAuthenticated && isMobile && (
          <AppBar
            position="fixed"
            color="inherit"
            elevation={0}
            sx={{ borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}
          >
            <Toolbar>
              <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ fontWeight: 800 }}>
                VidyaFlow
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        {isAuthenticated && (
          <Sidebar
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
            isMobile={isMobile}
          />
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            minWidth: 0,
            overflowX: 'hidden',
            px: isAuthenticated ? { xs: 2, sm: 3 } : 0,
            py: isAuthenticated ? { xs: 2, sm: 3 } : 0,
            pt: isAuthenticated && isMobile ? 10 : isAuthenticated ? 3 : 0
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ width: '100%' }}
            >
              <Routes location={location}>
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login /> : <Navigate to="/" />} 
            />

            <Route 
              path="/superadmin" 
              element={!isAuthenticated ? <SuperAdminLogin /> : <Navigate to="/" />} 
            />
            
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  canViewDashboard ? (
                    <Dashboard />
                  ) : user?.role === 'SUPER_TEACHER' ? (
                    <Navigate to="/teachers" />
                  ) : user?.role === 'ACCOUNTANT' ? (
                    <Navigate to="/students" />
                  ) : ['TEACHER', 'CLASS_TEACHER'].includes(user?.role) ? (
                    <Navigate to="/timetable" />
                  ) : user?.role === 'PARENT' ? (
                    <Navigate to="/parent-portal" />
                  ) : (
                    <Navigate to="/login" />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            
             <Route 
              path="/students" 
              element={isAuthenticated && (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) || (user?.role === 'ACCOUNTANT' && hasPermission('ACCOUNTANT', 'students'))) ? <StudentList /> : <Navigate to="/" />} 
            />

            <Route 
              path="/parents" 
              element={isAuthenticated && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'ACCOUNTANT'].includes(user?.role) ? <ParentList /> : <Navigate to="/" />} 
            />

            <Route 
              path="/parent-portal" 
              element={isAuthenticated && (user?.role === 'PARENT' && hasPermission('PARENT', 'parent-portal')) ? <ParentDashboard /> : <Navigate to="/" />} 
            />

            <Route
              path="/teachers"
              element={isAuthenticated && (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) || (user?.role === 'SUPER_TEACHER' && hasPermission('SUPER_TEACHER', 'teachers'))) ? <TeacherList /> : <Navigate to="/" />}
            />

            <Route
              path="/super-teachers"
              element={isAuthenticated && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) ? <SuperTeacherRegister /> : <Navigate to="/" />}
            />

            <Route
              path="/accountants"
              element={isAuthenticated && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) ? <AccountantRegister /> : <Navigate to="/" />}
            />

            <Route
              path="/classes"
              element={isAuthenticated && (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) || (user?.role === 'SUPER_TEACHER' && hasPermission('SUPER_TEACHER', 'classes'))) ? <ClassManagement /> : <Navigate to="/" />}
            />

            <Route 
              path="/timetable" 
              element={isAuthenticated && (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) || (user?.role === 'SUPER_TEACHER' && hasPermission('SUPER_TEACHER', 'timetable')) || (['TEACHER', 'CLASS_TEACHER'].includes(user?.role) && hasPermission(user.role, 'timetable'))) ? <TimetableManagement /> : <Navigate to="/" />} 
            />

            <Route 
              path="/fees" 
              element={isAuthenticated && (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) || (user?.role === 'ACCOUNTANT' && hasPermission('ACCOUNTANT', 'fees'))) ? <FeesList /> : <Navigate to="/" />} 
            />

            <Route 
              path="/attendance" 
              element={isAuthenticated && (['TEACHER', 'CLASS_TEACHER'].includes(user?.role) && hasPermission(user.role, 'attendance')) ? <AttendanceMark /> : <Navigate to="/" />} 
            />

            <Route 
              path="/staff-attendance" 
              element={isAuthenticated && (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) || (user?.role === 'SUPER_TEACHER' && hasPermission('SUPER_TEACHER', 'staff-attendance'))) ? <StaffAttendance /> : <Navigate to="/" />} 
            />

            <Route 
              path="/homework" 
              element={isAuthenticated && (['TEACHER', 'CLASS_TEACHER'].includes(user?.role) && hasPermission(user.role, 'homework')) ? <HomeworkList /> : <Navigate to="/login" />} 
            />

            <Route 
              path="/grades" 
              element={isAuthenticated && (['TEACHER', 'CLASS_TEACHER'].includes(user?.role) && hasPermission(user.role, 'grades')) ? <GradesEntry /> : <Navigate to="/" />} 
            />

            <Route 
              path="/analytics" 
              element={isAuthenticated && (['TEACHER', 'CLASS_TEACHER'].includes(user?.role) && hasPermission(user.role, 'analytics')) ? <ClassAnalytics /> : <Navigate to="/" />} 
            />

            <Route 
              path="/pending-jobs" 
              element={isAuthenticated && (['TEACHER', 'CLASS_TEACHER'].includes(user?.role) && hasPermission(user.role, 'pending-jobs')) ? <PendingJobs /> : <Navigate to="/" />} 
            />

            <Route 
              path="/bus-tracker" 
              element={isAuthenticated && (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) || (['TEACHER', 'CLASS_TEACHER'].includes(user?.role) && hasPermission(user.role, 'bus-tracker')) || (user?.role === 'PARENT' && hasPermission('PARENT', 'bus-tracker'))) ? <BusTracker /> : <Navigate to="/" />} 
            />

            <Route 
              path="/exams" 
              element={isAuthenticated && (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) || (user?.role === 'SUPER_TEACHER' && hasPermission('SUPER_TEACHER', 'exams'))) ? <ExamManagement /> : <Navigate to="/" />} 
            />

            <Route 
              path="/leaves" 
              element={isAuthenticated && (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) || (user?.role === 'SUPER_TEACHER' && hasPermission('SUPER_TEACHER', 'leaves')) || (['TEACHER', 'CLASS_TEACHER'].includes(user?.role) && hasPermission(user.role, 'leaves'))) ? <LeaveManagement /> : <Navigate to="/" />} 
            />

            <Route 
              path="/payroll" 
              element={isAuthenticated && (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) || (user?.role === 'ACCOUNTANT' && hasPermission('ACCOUNTANT', 'payroll')) || (['TEACHER', 'CLASS_TEACHER'].includes(user?.role) && hasPermission(user.role, 'payroll'))) ? <PayrollManagement /> : <Navigate to="/" />} 
            />

            <Route 
              path="/permissions" 
              element={isAuthenticated && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) ? <FeaturePermissions /> : <Navigate to="/" />} 
            />

            <Route 
              path="/schools" 
              element={isAuthenticated && user?.role === 'SUPER_ADMIN' ? <SchoolsList /> : <Navigate to="/" />} 
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Box>
      </Box>
      <ToastAlert />
    </ThemeProvider>
  );
}

export default App;
