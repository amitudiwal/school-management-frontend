import React, { useMemo, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AppBar, Box, CssBaseline, IconButton, ThemeProvider, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
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

import ToastAlert from './components/ToastAlert';

function App() {
  const { themeMode } = useSelector((state) => state.ui);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const canViewDashboard = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role);

  // Generate MUI Theme dynamically based on dark/light setting
  const theme = useMemo(() => createMuiTheme(themeMode), [themeMode]);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
          <Routes>
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
                  ) : ['TEACHER', 'CLASS_TEACHER'].includes(user?.role) ? (
                    <Navigate to="/students" />
                  ) : user?.role === 'PARENT' ? (
                    <Navigate to="/parent-portal" />
                  ) : (
                    <Navigate to="/attendance" />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            
            <Route 
              path="/students" 
              element={isAuthenticated && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'].includes(user?.role) ? <StudentList /> : <Navigate to="/" />} 
            />

            <Route 
              path="/parents" 
              element={isAuthenticated && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'].includes(user?.role) ? <ParentList /> : <Navigate to="/" />} 
            />

            <Route 
              path="/parent-portal" 
              element={isAuthenticated && user?.role === 'PARENT' ? <ParentDashboard /> : <Navigate to="/" />} 
            />

            <Route
              path="/teachers"
              element={isAuthenticated && ['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) ? <TeacherList /> : <Navigate to="/" />}
            />

            <Route
              path="/classes"
              element={isAuthenticated && ['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) ? <ClassManagement /> : <Navigate to="/" />}
            />

            <Route 
              path="/timetable" 
              element={isAuthenticated && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'].includes(user?.role) ? <TimetableManagement /> : <Navigate to="/" />} 
            />

            <Route 
              path="/fees" 
              element={isAuthenticated ? <FeesList /> : <Navigate to="/login" />} 
            />

            <Route 
              path="/attendance" 
              element={isAuthenticated && ['TEACHER', 'CLASS_TEACHER'].includes(user?.role) ? <AttendanceMark /> : <Navigate to="/" />} 
            />

            <Route 
              path="/staff-attendance" 
              element={isAuthenticated && ['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) ? <StaffAttendance /> : <Navigate to="/" />} 
            />

            <Route 
              path="/homework" 
              element={isAuthenticated && ['TEACHER', 'CLASS_TEACHER'].includes(user?.role) ? <HomeworkList /> : <Navigate to="/login" />} 
            />

            <Route 
              path="/grades" 
              element={isAuthenticated && ['TEACHER', 'CLASS_TEACHER'].includes(user?.role) ? <GradesEntry /> : <Navigate to="/" />} 
            />

            <Route 
              path="/analytics" 
              element={isAuthenticated && ['TEACHER', 'CLASS_TEACHER'].includes(user?.role) ? <ClassAnalytics /> : <Navigate to="/" />} 
            />

            <Route 
              path="/exams" 
              element={isAuthenticated && ['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) ? <ExamManagement /> : <Navigate to="/" />} 
            />

            <Route 
              path="/leaves" 
              element={isAuthenticated && ['TEACHER', 'CLASS_TEACHER', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'HR_STAFF'].includes(user?.role) ? <LeaveManagement /> : <Navigate to="/" />} 
            />

            <Route 
              path="/payroll" 
              element={isAuthenticated && ['TEACHER', 'CLASS_TEACHER', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'HR_STAFF', 'ACCOUNTANT'].includes(user?.role) ? <PayrollManagement /> : <Navigate to="/" />} 
            />

            <Route 
              path="/schools" 
              element={isAuthenticated && user?.role === 'SUPER_ADMIN' ? <SchoolsList /> : <Navigate to="/" />} 
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Box>
      <ToastAlert />
    </ThemeProvider>
  );
}

export default App;
