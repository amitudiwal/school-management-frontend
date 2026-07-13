import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useApolloClient } from '@apollo/client';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Box, Typography, Divider, IconButton, Chip, useTheme, Tooltip, Badge
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
  Receipt as PayrollIcon,
  PendingActions as PendingJobsIcon,
  DirectionsBus as BusIcon,
  Security as SettingsIcon,
  EventNote as EventsIcon,
  Inventory as InventoryIcon,
  Book as LibraryIcon,
  Campaign as AnnouncementIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { logout } from '../store/slices/authSlice';
import { toggleTheme, toggleSidebar } from '../store/slices/uiSlice';
import { GET_SCHOOL, GET_NOTIFICATIONS } from '../graphql/operations';
import { BACKEND_URL } from '../graphql/client';
import vidyaflowLogo from '../assets/vidyaflowlogo.png';

const DRAWER_WIDTH = 280;

function Sidebar({ mobileOpen = false, onMobileClose, isMobile = false }) {
  const { user } = useSelector((state) => state.auth);
  const { themeMode, sidebarOpen } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const client = useApolloClient();

  const { data: schoolData } = useQuery(GET_SCHOOL, {
    variables: { id: user?.schoolId },
    skip: !user?.schoolId || user?.role === 'SUPER_ADMIN',
  });

  // Query to get circular notifications for badge status
  const { data: notificationsData } = useQuery(GET_NOTIFICATIONS, {
    skip: !user || ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role),
    pollInterval: 10000, // Poll every 10 seconds for real-time notification badging
  });

  const [readAlerts, setReadAlerts] = React.useState(() => {
    try {
      const stored = localStorage.getItem(`read_alerts_${user?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    const handleAlertsRead = () => {
      try {
        const stored = localStorage.getItem(`read_alerts_${user?.id}`);
        setReadAlerts(stored ? JSON.parse(stored) : []);
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('alertsRead', handleAlertsRead);
    return () => window.removeEventListener('alertsRead', handleAlertsRead);
  }, [user]);

  React.useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === `read_alerts_${user?.id}`) {
        try {
          setReadAlerts(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const unreadCounts = React.useMemo(() => {
    if (!notificationsData?.getNotifications) {
      return { alerts: 0, notices: 0, announcements: 0, total: 0 };
    }
    const unreadList = notificationsData.getNotifications.filter(n => !readAlerts.includes(n.id));
    const alerts = unreadList.filter(n => n.type === 'ALERT').length;
    const notices = unreadList.filter(n => n.type === 'NOTICE').length;
    const announcements = unreadList.filter(n => n.type === 'ANNOUNCEMENT').length;
    return {
      alerts,
      notices,
      announcements,
      total: unreadList.length
    };
  }, [notificationsData, readAlerts]);

  const badgeColor = React.useMemo(() => {
    if (unreadCounts.alerts > 0) return 'error'; // Red for Alerts
    if (unreadCounts.notices > 0) return 'secondary'; // Purple for Notices
    return 'primary'; // Blue for Announcements
  }, [unreadCounts]);


  const schoolLogo = schoolData?.getSchool?.schoolLogo || schoolData?.getSchool?.logo;
  const schoolName = schoolData?.getSchool?.schoolName || schoolData?.getSchool?.name;
  
  const drawerWidth = sidebarOpen ? 280 : 88;

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

  const getPermissionsForRole = (roleName) => {
    if (!schoolData?.getSchool?.settings?.featurePermissions) {
      // Default fallback
      return {
        SUPER_TEACHER: ['teachers', 'classes', 'timetable', 'exams', 'staff-attendance', 'leaves', 'copy-submission', 'events', 'inventory', 'library', 'announcements'],
        ACCOUNTANT: ['students', 'fees', 'payroll'],
        TEACHER: ['pending-jobs', 'timetable', 'bus-tracker', 'attendance', 'leaves', 'homework', 'grades', 'analytics', 'payroll', 'copy-submission', 'library', 'announcements'],
        PARENT: ['parent-portal', 'bus-tracker', 'announcements']
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

  // Render navigation links based on user role permissions
  const menuItems = [
    // SUPER_ADMIN
    ...(user?.role === 'SUPER_ADMIN' ? [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
      { text: 'Manage Schools', icon: <SchoolIcon />, path: '/schools' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
    ] : []),

    // SCHOOL_ADMIN / PRINCIPAL / VICE_PRINCIPAL
    ...((['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role)) ? [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
      { text: 'Feature Permissions', icon: <SettingsIcon />, path: '/permissions' },
      { text: 'Academics Management Register', icon: <PeopleIcon />, path: '/super-teachers' },
      { text: 'Accountant Register', icon: <PeopleIcon />, path: '/accountants' },
      { text: 'Teacher Registration', icon: <TeacherIcon />, path: '/teachers' },
      { text: 'Student Registration', icon: <PeopleIcon />, path: '/students' },
      { text: 'Alumni Directory', icon: <HistoryIcon />, path: '/alumni' },
      { text: 'Class Management', icon: <SchoolIcon />, path: '/classes' },
      { text: 'Shift Management', icon: <ScheduleIcon />, path: '/shifts' },
      { text: 'Weekly Timetable', icon: <GradesIcon />, path: '/timetable' },
      { text: 'Exam Schedule', icon: <GradesIcon />, path: '/exams' },
      { text: 'Daily Attendance', icon: <AttendanceIcon />, path: '/attendance' },
      { text: 'Staff Attendance', icon: <AttendanceIcon />, path: '/staff-attendance' },
      { text: 'Mark Attendance', icon: <AttendanceIcon />, path: '/self-attendance' },
      { text: 'Leave Management', icon: <LeaveIcon />, path: '/leaves' },
      { text: 'Pending jobs', icon: <PendingJobsIcon />, path: '/pending-jobs' },
      { text: 'Homework Board', icon: <HomeworkIcon />, path: '/homework' },
      { text: 'Copy Submission', icon: <HomeworkIcon />, path: '/copy-submission' },
      { text: 'Grades Entry', icon: <GradesIcon />, path: '/grades' },
      { text: 'Performance Analytics', icon: <DashboardIcon />, path: '/analytics' },
      { text: 'Fees Accounting', icon: <FeesIcon />, path: '/fees' },
      { text: 'Payroll & Payslips', icon: <PayrollIcon />, path: '/payroll' },
      { text: 'Bus Tracker', icon: <BusIcon />, path: '/bus-tracker' },
      { text: 'Events & Holidays', icon: <EventsIcon />, path: '/events' },
      { text: 'School Inventory', icon: <InventoryIcon />, path: '/inventory' },
      { text: 'Library Bookshelf', icon: <LibraryIcon />, path: '/library' },
      { text: 'Circular Portal', icon: <AnnouncementIcon />, path: '/announcements' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
    ] : []),

    // SUPER_TEACHER
    ...(user?.role === 'SUPER_TEACHER' ? [
      { text: 'Mark Attendance', icon: <AttendanceIcon />, path: '/self-attendance' },
      { text: 'Teacher Registration', icon: <TeacherIcon />, path: '/teachers', feature: 'teachers' },
      { text: 'Class Management', icon: <SchoolIcon />, path: '/classes', feature: 'classes' },
      { text: 'Weekly Timetable', icon: <GradesIcon />, path: '/timetable', feature: 'timetable' },
      { text: 'Exam Schedule', icon: <GradesIcon />, path: '/exams', feature: 'exams' },
      { text: 'Staff Attendance', icon: <AttendanceIcon />, path: '/staff-attendance', feature: 'staff-attendance' },
      { text: 'Leave Management', icon: <LeaveIcon />, path: '/leaves', feature: 'leaves' },
      { text: 'Events & Holidays', icon: <EventsIcon />, path: '/events', feature: 'events' },
      { text: 'School Inventory', icon: <InventoryIcon />, path: '/inventory', feature: 'inventory' },
      { text: 'Library Bookshelf', icon: <LibraryIcon />, path: '/library', feature: 'library' },
      { text: 'Circular Portal', icon: <AnnouncementIcon />, path: '/announcements', feature: 'announcements' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
    ].filter(item => !item.feature || hasPermission('SUPER_TEACHER', item.feature)) : []),

    // ACCOUNTANT
    ...(user?.role === 'ACCOUNTANT' ? [
      { text: 'Mark Attendance', icon: <AttendanceIcon />, path: '/self-attendance' },
      { text: 'Student Registration', icon: <PeopleIcon />, path: '/students', feature: 'students' },
      { text: 'Fees Accounting', icon: <FeesIcon />, path: '/fees', feature: 'fees' },
      { text: 'Payroll & Payslips', icon: <PayrollIcon />, path: '/payroll', feature: 'payroll' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
    ].filter(item => !item.feature || hasPermission('ACCOUNTANT', item.feature)) : []),

    // TEACHER / CLASS_TEACHER
    ...((['TEACHER', 'CLASS_TEACHER'].includes(user?.role)) ? [
      { text: 'Mark Attendance', icon: <AttendanceIcon />, path: '/self-attendance' },
      { text: 'Pending jobs', icon: <PendingJobsIcon />, path: '/pending-jobs', feature: 'pending-jobs' },
      { text: 'Weekly Timetable', icon: <GradesIcon />, path: '/timetable', feature: 'timetable' },
      { text: 'Bus Tracker', icon: <BusIcon />, path: '/bus-tracker', feature: 'bus-tracker' },
      { text: 'Daily Attendance', icon: <AttendanceIcon />, path: '/attendance', feature: 'attendance' },
      { text: 'Copy Submission', icon: <HomeworkIcon />, path: '/copy-submission', feature: 'copy-submission' },
      { text: 'Leave Management', icon: <LeaveIcon />, path: '/leaves', feature: 'leaves' },
      { text: 'Homework Board', icon: <HomeworkIcon />, path: '/homework', feature: 'homework' },
      { text: 'Grades Entry', icon: <GradesIcon />, path: '/grades', feature: 'grades' },
      { text: 'Performance Analytics', icon: <DashboardIcon />, path: '/analytics', feature: 'analytics' },
      { text: 'Payroll & Payslips', icon: <PayrollIcon />, path: '/payroll', feature: 'payroll' },
      { text: 'Library Bookshelf', icon: <LibraryIcon />, path: '/library', feature: 'library' },
      { text: 'Circular Portal', icon: <AnnouncementIcon />, path: '/announcements', feature: 'announcements' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
    ].filter(item => !item.feature || hasPermission(user.role, item.feature)) : []),

    // PARENT
    ...(user?.role === 'PARENT' ? [
      { text: 'Parent Portal', icon: <DashboardIcon />, path: '/parent-portal', feature: 'parent-portal' },
      { text: 'Bus Tracker', icon: <BusIcon />, path: '/bus-tracker', feature: 'bus-tracker' },
      { text: 'Circular Portal', icon: <AnnouncementIcon />, path: '/announcements', feature: 'announcements' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
    ].filter(item => hasPermission('PARENT', item.feature)) : []),

    // DRIVER
    ...(user?.role === 'DRIVER' ? [
      { text: 'Bus Tracker', icon: <BusIcon />, path: '/bus-tracker' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
    ] : [])
  ];

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: { md: drawerWidth },
        flexShrink: { md: 0 },
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.easeInOut,
          duration: sidebarOpen ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
        }),
        [`& .MuiDrawer-paper`]: {
          width: isMobile ? '82vw' : drawerWidth,
          maxWidth: isMobile ? 280 : drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowX: 'hidden',
          left: isMobile ? 'auto' : 0,
          transform: isMobile ? undefined : 'none !important',
          transition: theme.transitions.create(['width', 'max-width'], {
            easing: theme.transitions.easing.easeInOut,
            duration: sidebarOpen ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
          }),
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
      <Box sx={{ 
        width: '100%', 
        overflowY: 'auto', 
        overflowX: 'hidden', 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
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
      }}>
        {/* Brand Header */}
        <Box sx={{ 
          p: 2.5, 
          pl: sidebarOpen ? 2.5 : 3,
          pb: sidebarOpen ? 2.5 : 8.5,
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex', 
          alignItems: 'center', 
          position: 'relative',
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden', flexGrow: 1 }}>
            <Avatar
              variant="rounded"
              src={schoolLogo ? (schoolLogo.startsWith('http') ? schoolLogo : `${BACKEND_URL}${schoolLogo}`) : vidyaflowLogo}
              sx={{ width: 40, height: 40, flexShrink: 0, background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)' }}
            >
              {schoolName?.charAt(0) || ''}
            </Avatar>
            <Box sx={{ 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: sidebarOpen ? 1 : 0,
              width: sidebarOpen ? 'auto' : 0,
              maxWidth: '200px',
              visibility: sidebarOpen ? 'visible' : 'hidden',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}>
              <Typography variant="h6" noWrap sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>
                {schoolName || "VidhyaFlowAI"}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {schoolName ? "School ERP Portal" : "School ERP System"}
              </Typography>
            </Box>
          </Box>
          {!isMobile && (
            <IconButton 
              onClick={() => dispatch(toggleSidebar())} 
              size="small" 
              sx={{ 
                color: 'text.secondary',
                position: 'absolute',
                right: sidebarOpen ? 16 : 28,
                top: sidebarOpen ? 24 : 72,
                zIndex: 10,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          )}
        </Box>

        <Divider />

        {/* User Card */}
        <Box sx={{ 
          p: sidebarOpen ? 2 : 1, 
          m: sidebarOpen ? 2 : 1, 
          borderRadius: 3, 
          backgroundColor: sidebarOpen ? (theme.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC') : 'transparent', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: sidebarOpen ? 'stretch' : 'center',
          gap: 1,
          flexShrink: 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-start' : 'center', width: '100%', gap: 1.5, pl: sidebarOpen ? 0 : 0.5, transition: 'all 0.3s' }}>
            <Avatar
              src={user?.avatar}
              sx={{ width: 44, height: 44, bgcolor: theme.palette.primary.main, border: `2px solid ${theme.palette.primary.light}`, flexShrink: 0 }}
            >
              {user?.name?.charAt(0)}
            </Avatar>
            <Box sx={{ 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: sidebarOpen ? 1 : 0,
              width: sidebarOpen ? 'auto' : 0,
              maxWidth: sidebarOpen ? '150px' : 0,
              visibility: sidebarOpen ? 'visible' : 'hidden',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user?.email}
              </Typography>
            </Box>
          </Box>
          <Box sx={{
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: sidebarOpen ? 1 : 0,
            height: sidebarOpen ? 'auto' : 0,
            visibility: sidebarOpen ? 'visible' : 'hidden',
            overflow: 'hidden',
            mt: sidebarOpen ? 1 : 0
          }}>
            <Chip
              label={user?.role === 'SUPER_TEACHER' ? 'Academic Management' : user?.role?.replace('_', ' ')}
              size="small"
              color="primary"
              variant="soft"
              sx={{ fontWeight: 700, fontSize: '0.65rem', width: '100%' }}
            />
          </Box>
        </Box>

        {/* Navigation List */}
        <List sx={{ px: sidebarOpen ? 2 : 1, width: '100%' }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5, width: '100%', display: 'block' }}>
              <Tooltip title={!sidebarOpen ? item.text : ""} placement="right" arrow>
                <ListItemButton
                  component={motion.div}
                  whileHover={sidebarOpen ? { scale: 1.02, x: 6 } : { scale: 1.08 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    px: sidebarOpen ? 2 : 0,
                    py: 1.2,
                    backgroundColor: isActive(item.path) ? 'action.selected' : 'transparent',
                    color: isActive(item.path) ? theme.palette.primary.main : 'text.secondary',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: 'inherit', 
                    minWidth: sidebarOpen ? 40 : 0,
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.path === '/announcements' && unreadCounts.total > 0 ? (
                      <Badge badgeContent={unreadCounts.total} color={badgeColor}>
                        {item.icon}
                      </Badge>
                    ) : item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ 
                      fontSize: '0.875rem', 
                      fontWeight: isActive(item.path) ? 600 : 500,
                      noWrap: true
                    }}
                    sx={{
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: sidebarOpen ? 1 : 0,
                      width: sidebarOpen ? 'auto' : 0,
                      maxWidth: sidebarOpen ? '180px' : 0,
                      visibility: sidebarOpen ? 'visible' : 'hidden',
                      m: 0,
                      overflow: 'hidden'
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Footer Controls */}
      <Box sx={{ p: 2, width: '100%' }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: sidebarOpen ? 'space-between' : 'center', 
          mb: 2,
          overflow: 'hidden',
          px: sidebarOpen ? 0 : 1.5,
          transition: 'all 0.3s'
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: sidebarOpen ? 1 : 0,
              width: sidebarOpen ? 'auto' : 0,
              maxWidth: sidebarOpen ? '150px' : 0,
              visibility: sidebarOpen ? 'visible' : 'hidden',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}
          >
            {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </Typography>
          <Tooltip title={!sidebarOpen ? (themeMode === 'dark' ? 'Light Mode' : 'Dark Mode') : ""} placement="right" arrow>
            <IconButton
              component={motion.button}
              whileHover={{ scale: 1.1, rotate: themeMode === 'dark' ? 15 : -15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => dispatch(toggleTheme())}
              color="inherit"
              size="small"
              sx={{ flexShrink: 0 }}
            >
              {themeMode === 'dark' ? <LightIcon /> : <DarkIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        <Tooltip title={!sidebarOpen ? "Log Out" : ""} placement="right" arrow>
          <ListItemButton
            component={motion.div}
            whileHover={sidebarOpen ? { scale: 1.02, x: 6 } : { scale: 1.08 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              px: sidebarOpen ? 2 : 0,
              py: 1.2,
              color: 'error.main',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: 'error.lighter',
              },
            }}
          >
            <ListItemIcon sx={{ 
              color: 'inherit', 
              minWidth: sidebarOpen ? 40 : 0,
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Log Out" 
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600, noWrap: true }} 
              sx={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: sidebarOpen ? 1 : 0,
                width: sidebarOpen ? 'auto' : 0,
                maxWidth: sidebarOpen ? '180px' : 0,
                visibility: sidebarOpen ? 'visible' : 'hidden',
                m: 0,
                overflow: 'hidden'
              }}
            />
          </ListItemButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
