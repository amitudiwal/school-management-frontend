import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useApolloClient } from '@apollo/client';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Box, Typography, Divider, IconButton, Chip, useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  PersonAdd as TeacherIcon,
  AttachMoney as FeesIcon,
  EventAvailable as AttendanceIcon,
  MenuBook as HomeworkIcon,
  Domain as SchoolIcon,
  ExitToApp as LogoutIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Assignment as GradesIcon,
  DateRange as LeaveIcon,
  Receipt as PayrollIcon
} from '@mui/icons-material';
import { logout } from '../store/slices/authSlice';
import { toggleTheme } from '../store/slices/uiSlice';
import { GET_SCHOOL } from '../graphql/operations';
import { BACKEND_URL } from '../graphql/client';
import vidyaflowLogo from '../assets/vidyaflowlogo.png';

const DRAWER_WIDTH = 280;

function Sidebar({ mobileOpen = false, onMobileClose, isMobile = false }) {
  const { user } = useSelector((state) => state.auth);
  const { themeMode } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const client = useApolloClient();

  const { data: schoolData } = useQuery(GET_SCHOOL, {
    variables: { id: user?.schoolId },
    skip: !user?.schoolId || user?.role === 'SUPER_ADMIN',
  });

  const schoolLogo = schoolData?.getSchool?.schoolLogo || schoolData?.getSchool?.logo;
  const schoolName = schoolData?.getSchool?.schoolName || schoolData?.getSchool?.name;

  const handleLogout = async () => {
    dispatch(logout());
    onMobileClose?.();
    try {
      await client.clearStore();
    } catch (e) {
      console.error('Error clearing apollo store on logout:', e);
    }
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    onMobileClose?.();
  };

  // Determine active route
  const isActive = (path) => location.pathname === path;

  // Render navigation links based on user role permissions
  const menuItems = [
    // SUPER_ADMIN
    ...(user?.role === 'SUPER_ADMIN' ? [
      { text: 'Manage Schools', icon: <SchoolIcon />, path: '/schools' }
    ] : []),

    // SCHOOL_ADMIN / PRINCIPAL / VICE_PRINCIPAL
    ...((['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role)) ? [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
      { text: 'Super Teacher Register', icon: <PeopleIcon />, path: '/super-teachers' },
      { text: 'Accountant Register', icon: <PeopleIcon />, path: '/accountants' },
      { text: 'Leave Management', icon: <LeaveIcon />, path: '/leaves' },
      { text: 'Weekly Timetable', icon: <GradesIcon />, path: '/timetable' }
    ] : []),

    // SUPER_TEACHER
    ...(user?.role === 'SUPER_TEACHER' ? [
      { text: 'Teacher Registration', icon: <TeacherIcon />, path: '/teachers' },
      { text: 'Class Management', icon: <SchoolIcon />, path: '/classes' },
      { text: 'Weekly Timetable', icon: <GradesIcon />, path: '/timetable' },
      { text: 'Exam Schedule', icon: <GradesIcon />, path: '/exams' },
      { text: 'Staff Attendance', icon: <AttendanceIcon />, path: '/staff-attendance' }
    ] : []),

    // ACCOUNTANT
    ...(user?.role === 'ACCOUNTANT' ? [
      { text: 'Student Registration', icon: <PeopleIcon />, path: '/students' },
      { text: 'Fees Accounting', icon: <FeesIcon />, path: '/fees' },
      { text: 'Payroll & Payslips', icon: <PayrollIcon />, path: '/payroll' }
    ] : []),

    // TEACHER / CLASS_TEACHER
    ...((['TEACHER', 'CLASS_TEACHER'].includes(user?.role)) ? [
      { text: 'Weekly Timetable', icon: <GradesIcon />, path: '/timetable' },
      { text: 'Daily Attendance', icon: <AttendanceIcon />, path: '/attendance' },
      { text: 'Homework Board', icon: <HomeworkIcon />, path: '/homework' },
      { text: 'Grades Entry', icon: <GradesIcon />, path: '/grades' },
      { text: 'Performance Analytics', icon: <DashboardIcon />, path: '/analytics' },
      { text: 'Payroll & Payslips', icon: <PayrollIcon />, path: '/payroll' }
    ] : []),

    // PARENT
    ...(user?.role === 'PARENT' ? [
      { text: 'Parent Portal', icon: <DashboardIcon />, path: '/parent-portal' }
    ] : [])
  ];

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: { md: DRAWER_WIDTH },
        flexShrink: { md: 0 },
        [`& .MuiDrawer-paper`]: {
          width: { xs: '82vw', sm: DRAWER_WIDTH },
          maxWidth: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.15)' 
              : 'rgba(0, 0, 0, 0.12)',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.3)' 
              : 'rgba(0, 0, 0, 0.25)',
          }
        },
      }}
    >
      <Box>
        {/* Brand Header */}
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            variant="rounded"
            src={schoolLogo ? (schoolLogo.startsWith('http') ? schoolLogo : `${BACKEND_URL}${schoolLogo}`) : vidyaflowLogo}
            sx={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)' }}
          >
            {schoolName?.charAt(0) || ''}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, lineHeight: 1.2 }}>
              {schoolName || "VidyaFlow"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {schoolName ? "School ERP Portal" : "School ERP System"}
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* User Card */}
        <Box sx={{ p: 2, m: 2, borderRadius: 3, backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={user?.avatar}
              sx={{ width: 44, height: 44, bgcolor: theme.palette.primary.main, border: `2px solid ${theme.palette.primary.light}` }}
            >
              {user?.name?.charAt(0)}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user?.email}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={user?.role?.replace('_', ' ')}
            size="small"
            color="primary"
            variant="soft"
            sx={{ fontWeight: 700, fontSize: '0.65rem', alignSelf: 'flex-start' }}
          />
        </Box>

        {/* Navigation List */}
        <List sx={{ px: 2 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={motion.div}
                whileHover={{ scale: 1.02, x: 6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isActive(item.path) ? 'action.selected' : 'transparent',
                  color: isActive(item.path) ? theme.palette.primary.main : 'text.secondary',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: theme.palette.text.primary,
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive(item.path) ? 600 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Footer Controls */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </Typography>
          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.1, rotate: themeMode === 'dark' ? 15 : -15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => dispatch(toggleTheme())}
            color="inherit"
          >
            {themeMode === 'dark' ? <LightIcon /> : <DarkIcon />}
          </IconButton>
        </Box>
        <ListItemButton
          component={motion.div}
          whileHover={{ scale: 1.02, x: 6 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: 'error.main',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'error.lighter',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Log Out" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
