import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useMutation, useLazyQuery, useApolloClient } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, CircularProgress, Link, Chip, Grid,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  Tabs, Tab, ThemeProvider, createTheme,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Visibility, VisibilityOff, Email, Lock, ArrowBack,
  School as SchoolIcon, Smartphone, VpnKey, Business,
  AdminPanelSettings, Person, SupervisorAccount, AttachMoney as AccountantIcon,
  Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon, DirectionsBus as BusIcon
} from '@mui/icons-material';
import { GET_SCHOOL_BY_CODE, LOGIN_WITH_PASSWORD, SEND_OTP, VERIFY_OTP, FORGOT_PASSWORD } from '../graphql/operations';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';

import { showToast, toggleTheme } from '../store/slices/uiSlice';
import { BACKEND_URL } from '../graphql/client';
import vidyaflowLogo from '../assets/vidyaflowlogo.png';
import darkModeBg from '../assets/Dark_mode_bg.png';
import lightModeBg from '../assets/Light_mode_bg.png';

function Login() {
  const globalTheme = useTheme();
  const dispatch = useDispatch();
  const client = useApolloClient();

  // Multi-step steps: 'SCHOOL_CODE' | 'SELECT_ROLE' | 'ADMIN_LOGIN' | 'TEACHER_LOGIN' | 'PARENT_LOGIN' | 'OTP_VERIFICATION' | 'FORGOT_PASSWORD'
  const [step, setStep] = useState('SCHOOL_CODE');

  // Auth state
  const [schoolCode, setSchoolCode] = useState('');
  const [school, setSchool] = useState(null); // Stores school information
  const [selectedRole, setSelectedRole] = useState('SCHOOL_ADMIN');

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [teacherMethod, setTeacherMethod] = useState(0); // 0 = Mobile/OTP, 1 = Email/Password
  const [parentMethod, setParentMethod] = useState(0); // 0 = Mobile/OTP, 1 = Email/Password

  // UI UX helper states
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [otpTimer, setOtpTimer] = useState(300);
  const [trialExpiredOpen, setTrialExpiredOpen] = useState(false);
  const [trialExpiredMessage, setTrialExpiredMessage] = useState('');

  // Dynamic Theme Mode detection from globalTheme
  const themeMode = globalTheme.palette.mode;

  // School Code lazy query
  const [fetchSchool, { loading: schoolLoading }] = useLazyQuery(GET_SCHOOL_BY_CODE, {
    fetchPolicy: 'no-cache',
    onCompleted: (data) => {
      if (data?.getSchoolByCode) {
        setSchool(data.getSchoolByCode);
        setStep('SELECT_ROLE');
        dispatch(showToast({ message: 'School identified successfully!', severity: 'success' }));
      }
    },
    onError: (err) => {
      setValidationError(err.message || 'School Code Not Found');
      dispatch(showToast({ message: err.message || 'School Code Not Found', severity: 'error' }));
    }
  });

  // Password login mutation
  const [loginWithPasswordMutation, { loading: pwLoading }] = useMutation(LOGIN_WITH_PASSWORD, {
    onCompleted: async (data) => {
      const user = data.loginWithPassword.user;

      if (selectedRole === 'TEACHER' && !['TEACHER', 'CLASS_TEACHER'].includes(user.role)) {
        dispatch(loginFailure('Access denied: You are not registered as a Faculty Teacher.'));
        setValidationError('Access denied: You are not registered as a Faculty Teacher.');
        dispatch(showToast({ message: 'Access denied: You are not registered as a Faculty Teacher.', severity: 'error' }));
        return;
      }
      if (selectedRole === 'PARENT' && user.role !== 'PARENT') {
        dispatch(loginFailure('Access denied: You are not registered as a Parent.'));
        setValidationError('Access denied: You are not registered as a Parent.');
        dispatch(showToast({ message: 'Access denied: You are not registered as a Parent.', severity: 'error' }));
        return;
      }
      if (selectedRole === 'SUPER_TEACHER' && user.role !== 'SUPER_TEACHER') {
        dispatch(loginFailure('Access denied: You are not registered as Academics Management.'));
        setValidationError('Access denied: You are not registered as Academics Management.');
        dispatch(showToast({ message: 'Access denied: You are not registered as Academics Management.', severity: 'error' }));
        return;
      }
      if (selectedRole === 'ACCOUNTANT' && user.role !== 'ACCOUNTANT') {
        dispatch(loginFailure('Access denied: You are not registered as a School Accountant.'));
        setValidationError('Access denied: You are not registered as a School Accountant.');
        dispatch(showToast({ message: 'Access denied: You are not registered as a School Accountant.', severity: 'error' }));
        return;
      }
      if (selectedRole === 'DRIVER' && user.role !== 'DRIVER') {
        dispatch(loginFailure('Access denied: You are not registered as a Bus Driver.'));
        setValidationError('Access denied: You are not registered as a Bus Driver.');
        dispatch(showToast({ message: 'Access denied: You are not registered as a Bus Driver.', severity: 'error' }));
        return;
      }
      if (selectedRole === 'SCHOOL_ADMIN' && !['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user.role)) {
        dispatch(loginFailure('Access denied: You do not have School Admin/Management permissions.'));
        setValidationError('Access denied: You do not have School Admin/Management permissions.');
        dispatch(showToast({ message: 'Access denied: You do not have School Admin/Management permissions.', severity: 'error' }));
        return;
      }

      try {
        await client.clearStore();
      } catch (e) {
        console.error('Error clearing apollo store on login:', e);
      }
      dispatch(loginSuccess({
        token: data.loginWithPassword.token,
        refreshToken: data.loginWithPassword.refreshToken,
        user
      }));
      dispatch(showToast({ message: 'Login successful!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(loginFailure(err.message));
      if (err.message && err.message.includes('trial period has expired')) {
        setTrialExpiredMessage(err.message);
        setTrialExpiredOpen(true);
      } else {
        dispatch(showToast({ message: err.message, severity: 'error' }));
      }
    }
  });

  // Send OTP mutation
  const [sendOTPMutation, { loading: sendOTPLoading }] = useMutation(SEND_OTP, {
    onCompleted: () => {
      setOtpTimer(300); // 5 minutes
      setStep('OTP_VERIFICATION');
      setSuccessMessage('OTP sent successfully. Check the server console logs!');
      dispatch(showToast({ message: 'OTP verification code sent successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setValidationError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  // Verify OTP mutation
  const [verifyOTPMutation, { loading: verifyOTPLoading }] = useMutation(VERIFY_OTP, {
    onCompleted: async (data) => {
      const user = data.verifyOTP.user;

      if (selectedRole === 'TEACHER' && !['TEACHER', 'CLASS_TEACHER'].includes(user.role)) {
        dispatch(loginFailure('Access denied: You are not registered as a Faculty Teacher.'));
        setValidationError('Access denied: You are not registered as a Faculty Teacher.');
        dispatch(showToast({ message: 'Access denied: You are not registered as a Faculty Teacher.', severity: 'error' }));
        return;
      }
      if (selectedRole === 'PARENT' && user.role !== 'PARENT') {
        dispatch(loginFailure('Access denied: You are not registered as a Parent.'));
        setValidationError('Access denied: You are not registered as a Parent.');
        dispatch(showToast({ message: 'Access denied: You are not registered as a Parent.', severity: 'error' }));
        return;
      }
      if (selectedRole === 'SUPER_TEACHER' && user.role !== 'SUPER_TEACHER') {
        dispatch(loginFailure('Access denied: You are not registered as Academics Management.'));
        setValidationError('Access denied: You are not registered as Academics Management.');
        dispatch(showToast({ message: 'Access denied: You are not registered as Academics Management.', severity: 'error' }));
        return;
      }
      if (selectedRole === 'ACCOUNTANT' && user.role !== 'ACCOUNTANT') {
        dispatch(loginFailure('Access denied: You are not registered as a School Accountant.'));
        setValidationError('Access denied: You are not registered as a School Accountant.');
        dispatch(showToast({ message: 'Access denied: You are not registered as a School Accountant.', severity: 'error' }));
        return;
      }
      if (selectedRole === 'DRIVER' && user.role !== 'DRIVER') {
        dispatch(loginFailure('Access denied: You are not registered as a Bus Driver.'));
        setValidationError('Access denied: You are not registered as a Bus Driver.');
        dispatch(showToast({ message: 'Access denied: You are not registered as a Bus Driver.', severity: 'error' }));
        return;
      }
      if (selectedRole === 'SCHOOL_ADMIN' && !['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user.role)) {
        dispatch(loginFailure('Access denied: You do not have School Admin/Management permissions.'));
        setValidationError('Access denied: You do not have School Admin/Management permissions.');
        dispatch(showToast({ message: 'Access denied: You do not have School Admin/Management permissions.', severity: 'error' }));
        return;
      }

      try {
        await client.clearStore();
      } catch (e) {
        console.error('Error clearing apollo store on OTP login:', e);
      }
      dispatch(loginSuccess({
        token: data.verifyOTP.token,
        refreshToken: data.verifyOTP.refreshToken,
        user
      }));
      dispatch(showToast({ message: 'Login successful via OTP!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(loginFailure(err.message));
      if (err.message && err.message.includes('trial period has expired')) {
        setTrialExpiredMessage(err.message);
        setTrialExpiredOpen(true);
      } else {
        dispatch(showToast({ message: err.message, severity: 'error' }));
      }
    }
  });

  // Forgot password mutation
  const [forgotPasswordMutation, { loading: forgotLoading }] = useMutation(FORGOT_PASSWORD, {
    onCompleted: (data) => {
      if (data.forgotPassword) {
        setSuccessMessage('Instructions to reset password have been sent to your email.');
      } else {
        setValidationError('Failed to send reset link.');
      }
    },
    onError: (err) => {
      setValidationError(err.message);
    }
  });

  // Countdown timer for OTP
  useEffect(() => {
    let interval = null;
    if (step === 'OTP_VERIFICATION' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Dynamic School branded theme config
  const schoolTheme = useMemo(() => {
    if (school?.themeColor) {
      return createTheme({
        palette: {
          mode: themeMode,
          primary: {
            main: school.themeColor,
          },
          background: {
            default: themeMode === 'dark' ? '#0B0F19' : '#F8FAFC',
            paper: themeMode === 'dark' ? '#111827' : '#FFFFFF',
          },
          text: {
            primary: themeMode === 'dark' ? '#F8FAFC' : '#0F172A',
            secondary: themeMode === 'dark' ? '#94A3B8' : '#475569',
          },
          divider: themeMode === 'dark' ? '#374151' : '#E2E8F0',
        },
        typography: {
          fontFamily: "'Inter', 'Outfit', sans-serif",
          button: {
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 600,
            textTransform: 'none',
          },
        },
        shape: {
          borderRadius: 16,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: '12px',
                padding: '10px 20px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0px 6px 18px ${school.themeColor}3a`,
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: '16px',
                border: themeMode === 'dark' ? '1px solid #1F2937' : '1px solid #E2E8F0',
              }
            }
          }
        }
      });
    }
    return globalTheme;
  }, [school, themeMode, globalTheme]);

  const handleSchoolCodeSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    setValidationError('');
    if (!schoolCode.trim()) {
      setErrors({ schoolCode: 'School Code is required.' });
      return;
    }
    fetchSchool({ variables: { code: schoolCode.trim().toUpperCase() } });
  };

  const handleRoleSelectionSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    setValidationError('');
    if (selectedRole === 'SCHOOL_ADMIN') {
      setStep('ADMIN_LOGIN');
    } else if (selectedRole === 'SUPER_TEACHER') {
      setStep('SUPER_TEACHER_LOGIN');
    } else if (selectedRole === 'ACCOUNTANT') {
      setStep('ACCOUNTANT_LOGIN');
    } else if (selectedRole === 'DRIVER') {
      setStep('DRIVER_LOGIN');
    } else if (selectedRole === 'TEACHER') {
      setStep('TEACHER_LOGIN');
    } else if (selectedRole === 'PARENT') {
      setStep('PARENT_LOGIN');
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    setValidationError('');
    
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    dispatch(loginStart());

    loginWithPasswordMutation({
      variables: {
        email: email.trim(),
        password,
        schoolId: school?.id
      }
    });
  };

  const handleSendOTP = (e) => {
    if (e) e.preventDefault();
    setErrors({});
    setValidationError('');
    
    const newErrors = {};
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required.';
    } else if (!/^\d{10}$/.test(mobile.trim())) {
      newErrors.mobile = 'Mobile number must be exactly 10 digits.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    sendOTPMutation({
      variables: {
        mobile: mobile.trim(),
        schoolId: school?.id
      }
    });
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    setErrors({});
    setValidationError('');
    
    const newErrors = {};
    if (!otp.trim()) {
      newErrors.otp = 'Verification OTP is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    dispatch(loginStart());
    verifyOTPMutation({
      variables: {
        mobile: mobile.trim(),
        otp: otp.trim(),
        schoolId: school?.id
      }
    });
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    setValidationError('');
    setSuccessMessage('');
    
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    forgotPasswordMutation({ variables: { email: email.trim() } });
  };

  // Helper autofills
  const handleQuickFillCode = (code) => {
    setSchoolCode(code);
    fetchSchool({ variables: { code } });
  };

  const handleQuickFillUser = (roleType, methodType) => {
    if (roleType === 'ADMIN') {
      setEmail(school?.schoolCode === 'SUNRISE001' ? 'admin@sunrise.com' : 'admin@greenwood.com');
      setPassword('admin_password');
    } else if (roleType === 'SUPER_TEACHER') {
      setEmail('superteacher@greenwood.com');
      setPassword('superteacher_password');
    } else if (roleType === 'ACCOUNTANT') {
      setEmail('accountant@greenwood.com');
      setPassword('accountant_password');
    } else if (roleType === 'DRIVER') {
      setEmail('driver@greenwood.com');
      setPassword('driver_password');
    } else if (roleType === 'TEACHER') {
      if (methodType === 'OTP') {
        setMobile(school?.schoolCode === 'SUNRISE001' ? '1234567890' : '1122334455');
      } else {
        setEmail(school?.schoolCode === 'SUNRISE001' ? 'teacher@sunrise.com' : 'teacher.oppenheimer@greenwood.com');
        setPassword('teacher_password');
      }
    } else if (roleType === 'PARENT') {
      if (methodType === 'OTP') {
        setMobile(school?.schoolCode === 'SUNRISE001' ? '9876543210' : '9988776655');
      } else {
        setEmail(school?.schoolCode === 'SUNRISE001' ? 'parent@sunrise.com' : 'parent@greenwood.com');
        setPassword('parent_password');
      }
    }
  };

  const activeColor = school?.themeColor || '#6366F1';

  const textFieldSx = {
    mb: 3,
    '& .MuiOutlinedInput-root': {
      color: themeMode === 'dark' ? '#E2E8F0' : '#0F172A',
      backgroundColor: themeMode === 'dark' ? 'rgba(9, 15, 33, 0.65)' : 'rgba(241, 245, 249, 0.8)',
      borderRadius: 2,
      '& fieldset': {
        borderColor: themeMode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(71, 85, 105, 0.2)'
      },
      '&:hover fieldset': {
        borderColor: `${activeColor}aa`
      },
      '&.Mui-focused fieldset': {
        borderColor: activeColor
      }
    },
    '& .MuiInputLabel-root': {
      color: themeMode === 'dark' ? '#94A3B8' : '#475569'
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: activeColor
    },
    '& input::placeholder': {
      color: '#94A3B8',
      opacity: 0.75
    }
  };

  return (
    <ThemeProvider theme={schoolTheme}>
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        p: { xs: 2, sm: 4 },
        backgroundImage: `url(${themeMode === 'dark' ? darkModeBg : lightModeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
        {/* Floating Theme Toggle */}
        <IconButton
          onClick={() => dispatch(toggleTheme())}
          sx={{
            position: 'absolute',
            top: 24,
            right: 24,
            bgcolor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(8px)',
            border: themeMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            color: themeMode === 'dark' ? '#F59E0B' : '#6366F1',
            '&:hover': {
              bgcolor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

        <Card sx={{
          maxWidth: 450,
          width: '100%',
          borderRadius: 4,
          background: themeMode === 'dark' ? 'rgba(10, 18, 36, 0.72)' : '#FFFFFF',
          backdropFilter: 'blur(20px)',
          boxShadow: themeMode === 'dark' 
            ? '0 12px 40px 0 rgba(0, 0, 0, 0.5), 0 0 24px rgba(99, 102, 241, 0.15)' 
            : '0 12px 40px 0 rgba(99, 102, 241, 0.08)',
          border: themeMode === 'dark' ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(0, 0, 0, 0.05)',
        }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>

            {/* GO BACK ACTION (if not on step 1) */}
            {step !== 'SCHOOL_CODE' && (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setValidationError('');
                  setSuccessMessage('');
                  if (step === 'SELECT_ROLE') {
                    setStep('SCHOOL_CODE');
                    setSchool(null);
                  } else if (step === 'OTP_VERIFICATION') {
                    setStep(selectedRole === 'TEACHER' ? 'TEACHER_LOGIN' : 'PARENT_LOGIN');
                  } else if (step === 'FORGOT_PASSWORD') {
                    setStep('ADMIN_LOGIN');
                  } else {
                    setStep('SELECT_ROLE');
                  }
                }}
                startIcon={<ArrowBack />}
                sx={{ color: 'text.secondary', mb: 2, fontWeight: 700 }}
              >
                Back
              </Button>
            )}

            {/* HEADER BRANDING */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              {step === 'SCHOOL_CODE' ? (
                <>
                  <Box
                    component="img"
                    src={vidyaflowLogo}
                    alt="VidhyaFlowAI Logo"
                    sx={{ width: 72, height: 72, objectFit: 'contain', mb: 2 }}
                  />
                  <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.025em' }}>
                    VidhyaFlowAI
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                    School ERP Platform
                  </Typography>
                </>
              ) : (
                <>
                  <Box
                    component="img"
                    src={school?.schoolLogo ? (school.schoolLogo.startsWith('http') ? school.schoolLogo : `${BACKEND_URL}${school.schoolLogo}`) : vidyaflowLogo}
                    alt="School Logo"
                    sx={{
                      width: 64,
                      height: 64,
                      objectFit: 'contain',
                      mb: 1.5,
                      borderRadius: 2,
                      border: `2px solid ${activeColor}30`,
                      p: 0.5,
                      backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                    }}
                  />
                  <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: 'text.primary' }}>
                    {school?.schoolName || 'Sunrise Public School'}
                  </Typography>
                  <Chip
                    label={`Code: ${school?.schoolCode}`}
                    size="small"
                    sx={{
                      mt: 1,
                      fontWeight: 700,
                      backgroundColor: `${activeColor}15`,
                      color: activeColor,
                      border: `1px solid ${activeColor}35`
                    }}
                  />
                </>
              )}
            </Box>

            {/* ERROR / SUCCESS ALERTS */}
            {(validationError) && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {validationError}
              </Alert>
            )}
            {(successMessage) && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {successMessage}
              </Alert>
            )}

            {/* STEP 1: ENTER SCHOOL CODE */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%' }}
              >
                {step === 'SCHOOL_CODE' && (
              <form onSubmit={handleSchoolCodeSubmit}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                  Identify Your School
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  Please enter the unique code assigned to your school.
                </Typography>

                <TextField
                  fullWidth
                  label="School Code"
                  placeholder="e.g. SUNRISE001"
                  variant="outlined"
                  value={schoolCode}
                  onChange={(e) => {
                    setSchoolCode(e.target.value);
                    if (errors.schoolCode) setErrors(prev => ({ ...prev, schoolCode: '' }));
                  }}
                  error={Boolean(errors.schoolCode)}
                  helperText={errors.schoolCode}
                  sx={textFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Business sx={{ color: activeColor }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={schoolLoading}
                  sx={{
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {schoolLoading ? <CircularProgress size={24} color="inherit" /> : 'Continue'}
                </Button>

                {/* DEMO SCHOOL CODES HELP */}
                <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${schoolTheme.palette.divider}` }}>
                  <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mb: 1.5, fontWeight: 700 }}>
                    💡 DEMO SCHOOL CODES (Click to test):
                  </Typography>
                  <Grid container spacing={1}>
                    {['GREENVALLEY', 'SUNRISE001', 'VIDYAPUBLIC', 'SCHOLARACADEMY'].map((code) => (
                      <Grid item xs={6} key={code}>
                        <Chip
                          component={motion.div}
                          whileHover={{ scale: 1.04, translateY: -2 }}
                          whileTap={{ scale: 0.96 }}
                          label={code}
                          onClick={() => handleQuickFillCode(code)}
                          sx={{
                            cursor: 'pointer',
                            width: '100%',
                            backgroundColor: 'action.hover',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              borderColor: activeColor,
                              color: activeColor
                            }
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Link href="/superadmin" sx={{ fontSize: '0.8rem', fontWeight: 700, color: activeColor }}>
                      Access Global Super Admin Portal →
                    </Link>
                  </Box>
                </Box>
              </form>
            )}

            {/* STEP 2: SELECT LOGIN TYPE */}
            {step === 'SELECT_ROLE' && (
              <form onSubmit={handleRoleSelectionSubmit}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                  Select Login Type
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  How are you logging into the portal today?
                </Typography>

                <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
                  <RadioGroup
                    aria-label="login-role"
                    name="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    {[
                      { value: 'SCHOOL_ADMIN', label: 'School Admin', icon: <AdminPanelSettings /> },
                      { value: 'SUPER_TEACHER', label: 'Academics Management', icon: <SupervisorAccount /> },
                      { value: 'ACCOUNTANT', label: 'School Accountant', icon: <AccountantIcon /> },
                      { value: 'DRIVER', label: 'Bus Driver', icon: <BusIcon /> },
                      { value: 'TEACHER', label: 'Faculty Teacher', icon: <Person /> },
                      { value: 'PARENT', label: 'Parent / Guardian', icon: <SupervisorAccount /> }
                    ].map((opt) => (
                      <Box
                        component={motion.div}
                        whileHover={{ scale: 1.02, translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                        key={opt.value}
                        onClick={() => setSelectedRole(opt.value)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 2,
                          mb: 1.5,
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: selectedRole === opt.value ? activeColor : 'divider',
                          backgroundColor: selectedRole === opt.value ? `${activeColor}08` : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: activeColor
                          }
                        }}
                      >
                        <Radio
                          value={opt.value}
                          checked={selectedRole === opt.value}
                          color="primary"
                          sx={{ p: 0, mr: 2 }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: selectedRole === opt.value ? 'primary.main' : 'text.primary' }}>
                          {opt.icon}
                          <Typography sx={{ fontWeight: 700 }}>{opt.label}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </RadioGroup>
                </FormControl>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  Continue
                </Button>
              </form>
            )}

            {/* STEP 3A: SCHOOL ADMIN LOGIN (EMAIL + PASSWORD) */}
            {step === 'ADMIN_LOGIN' && (
              <form onSubmit={handleLoginSubmit}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                  School Admin Sign In
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  Enter your administrative credentials to log in.
                </Typography>

                <TextField
                  fullWidth
                  label="Email Address"
                  variant="outlined"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  sx={textFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: activeColor }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                  sx={textFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: activeColor }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Remember me (Mock)
                  </Typography>
                  <Link
                    onClick={() => setStep('FORGOT_PASSWORD')}
                    sx={{ color: activeColor, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}
                  >
                    Forgot Password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={pwLoading}
                  sx={{ py: 1.5, fontWeight: 700 }}
                >
                  {pwLoading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                </Button>

                {/* QUICK FILL DEMO HELPER */}
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                  <Chip
                    label="Autofill Demo School Admin"
                    onClick={() => handleQuickFillUser('ADMIN')}
                    sx={{ cursor: 'pointer', backgroundColor: `${activeColor}15`, color: activeColor, border: `1px solid ${activeColor}30` }}
                  />
                </Box>
              </form>
            )}

            {/* STEP 3B: TEACHER LOGIN */}
            {step === 'TEACHER_LOGIN' && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                  Faculty Teacher Sign In
                </Typography>

                <form onSubmit={handleLoginSubmit}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                    Enter your teacher credentials to log in.
                  </Typography>

                  <TextField
                    fullWidth
                    label="Email Address"
                    variant="outlined"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: activeColor }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    error={Boolean(errors.password)}
                    helperText={errors.password}
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: activeColor }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={pwLoading}
                    sx={{ py: 1.5, fontWeight: 700 }}
                  >
                    {pwLoading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                  </Button>

                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                    <Chip
                      label="Autofill Demo Teacher Password"
                      onClick={() => handleQuickFillUser('TEACHER', 'PW')}
                      sx={{ cursor: 'pointer', backgroundColor: `${activeColor}15`, color: activeColor, border: `1px solid ${activeColor}30` }}
                    />
                  </Box>
                </form>
              </Box>
            )}

            {/* STEP 3D: SUPER TEACHER LOGIN */}
            {step === 'SUPER_TEACHER_LOGIN' && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                  Academics Management Sign In
                </Typography>
                <form onSubmit={handleLoginSubmit}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                    Enter your Academics Management credentials to log in.
                  </Typography>

                  <TextField
                    fullWidth
                    label="Email Address"
                    variant="outlined"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: activeColor }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    error={Boolean(errors.password)}
                    helperText={errors.password}
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: activeColor }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={pwLoading}
                    sx={{ py: 1.5, fontWeight: 700 }}
                  >
                    {pwLoading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                  </Button>

                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                    <Chip
                      label="Autofill Demo Academics Management"
                      onClick={() => handleQuickFillUser('SUPER_TEACHER')}
                      sx={{ cursor: 'pointer', backgroundColor: `${activeColor}15`, color: activeColor, border: `1px solid ${activeColor}30` }}
                    />
                  </Box>
                </form>
              </Box>
            )}

            {/* STEP 3E: ACCOUNTANT LOGIN */}
            {step === 'ACCOUNTANT_LOGIN' && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                  School Accountant Sign In
                </Typography>
                <form onSubmit={handleLoginSubmit}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                    Enter your Accountant credentials to log in.
                  </Typography>

                  <TextField
                    fullWidth
                    label="Email Address"
                    variant="outlined"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: activeColor }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    error={Boolean(errors.password)}
                    helperText={errors.password}
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: activeColor }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={pwLoading}
                    sx={{ py: 1.5, fontWeight: 700 }}
                  >
                    {pwLoading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                  </Button>

                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                    <Chip
                      label="Autofill Demo Accountant"
                      onClick={() => handleQuickFillUser('ACCOUNTANT')}
                      sx={{ cursor: 'pointer', backgroundColor: `${activeColor}15`, color: activeColor, border: `1px solid ${activeColor}30` }}
                    />
                  </Box>
                </form>
              </Box>
            )}

            {/* STEP 3C: PARENT LOGIN (EMAIL + PASSWORD ONLY) */}
            {step === 'PARENT_LOGIN' && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                  Parent / Guardian Sign In
                </Typography>

                <form onSubmit={handleLoginSubmit}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                    Enter your parent credentials to log in.
                  </Typography>

                  <TextField
                    fullWidth
                    label="Email Address"
                    variant="outlined"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: activeColor }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    error={Boolean(errors.password)}
                    helperText={errors.password}
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: activeColor }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={pwLoading}
                    sx={{ py: 1.5, fontWeight: 700 }}
                  >
                    {pwLoading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                  </Button>

                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                    <Chip
                      label="Autofill Demo Parent Password"
                      onClick={() => handleQuickFillUser('PARENT', 'PW')}
                      sx={{ cursor: 'pointer', backgroundColor: `${activeColor}15`, color: activeColor, border: `1px solid ${activeColor}30` }}
                    />
                  </Box>
                </form>
              </Box>
            )}

            {/* STEP 3F: DRIVER LOGIN */}
            {step === 'DRIVER_LOGIN' && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                  Bus Driver Sign In
                </Typography>
                <form onSubmit={handleLoginSubmit}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                    Enter your driver credentials to log in.
                  </Typography>

                  <TextField
                    fullWidth
                    label="Email Address"
                    variant="outlined"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: activeColor }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    error={Boolean(errors.password)}
                    helperText={errors.password}
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: activeColor }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={pwLoading}
                    sx={{ py: 1.5, fontWeight: 700 }}
                  >
                    {pwLoading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                  </Button>

                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                    <Chip
                      label="Autofill Demo Driver"
                      onClick={() => handleQuickFillUser('DRIVER')}
                      sx={{ cursor: 'pointer', backgroundColor: `${activeColor}15`, color: activeColor, border: `1px solid ${activeColor}30` }}
                    />
                  </Box>
                </form>
              </Box>
            )}

            {/* STEP 4: OTP VERIFICATION SCREEN */}
            {step === 'OTP_VERIFICATION' && (
              <form onSubmit={handleVerifyOTP}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                  Verification Code
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  An OTP has been dispatched to <b>{mobile}</b>. Enter it below to authorize.
                </Typography>

                <TextField
                  fullWidth
                  label="Verification OTP"
                  placeholder="Enter 6-digit code"
                  variant="outlined"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    if (errors.otp) setErrors(prev => ({ ...prev, otp: '' }));
                  }}
                  error={Boolean(errors.otp)}
                  helperText={errors.otp}
                  sx={textFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKey sx={{ color: activeColor }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color={otpTimer > 0 ? 'text.secondary' : 'error'} sx={{ fontWeight: 700 }}>
                    {otpTimer > 0 ? `Code expires in: ${formatTimer(otpTimer)}` : 'Code expired!'}
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    disabled={otpTimer > 270} // Can resend after 30 seconds
                    onClick={handleSendOTP}
                    sx={{ fontWeight: 700, color: activeColor }}
                  >
                    Resend Code
                  </Button>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={verifyOTPLoading}
                  sx={{ py: 1.5, fontWeight: 700 }}
                >
                  {verifyOTPLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Log In'}
                </Button>

                {/* DEMO OTP NOTES */}
                <Box sx={{ mt: 4, p: 2, borderRadius: 2, bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="caption" display="block" sx={{ color: activeColor, fontWeight: 700, mb: 0.5 }}>
                    💡 DEMO OTP INFO:
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    1. Check Node/Nodemon terminal logs for generated random OTP.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    2. Or use the master fallback code: <b>123456</b>
                  </Typography>
                </Box>
              </form>
            )}

            {/* STEP 5: FORGOT PASSWORD SCREEN */}
            {step === 'FORGOT_PASSWORD' && (
              <form onSubmit={handleForgotPasswordSubmit}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                  Reset Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  Provide your registered administrative email. We will email instructions to reset your password.
                </Typography>

                <TextField
                  fullWidth
                  label="Email Address"
                  variant="outlined"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  sx={textFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: activeColor }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={forgotLoading}
                  sx={{ py: 1.5, fontWeight: 700 }}
                >
                  {forgotLoading ? <CircularProgress size={24} color="inherit" /> : 'Send Instructions'}
                </Button>
              </form>
            )}
              </motion.div>
            </AnimatePresence>

          </CardContent>
        </Card>
      <Dialog
        open={trialExpiredOpen}
        onClose={() => setTrialExpiredOpen(false)}
        aria-labelledby="trial-expired-dialog-title"
        aria-describedby="trial-expired-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            background: themeMode === 'dark' 
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
              : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
            border: '1px solid',
            borderColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }
        }}
      >
        <DialogTitle 
          id="trial-expired-dialog-title"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            fontWeight: 800,
            fontSize: '1.25rem',
            color: '#ef5350',
            fontFamily: "'Outfit', sans-serif"
          }}
        >
          <SchoolIcon sx={{ fontSize: 32 }} />
          Trial Period Expired
        </DialogTitle>
        <DialogContent>
          <DialogContentText 
            id="trial-expired-dialog-description"
            sx={{ 
              fontWeight: 500, 
              color: themeMode === 'dark' ? '#cbd5e1' : '#475569',
              fontSize: '1rem',
              mt: 1,
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            {trialExpiredMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setTrialExpiredOpen(false)} 
            variant="contained"
            color="error"
            autoFocus
            sx={{
              fontWeight: 700,
              px: 3,
              borderRadius: 2,
              textTransform: 'none',
              fontFamily: "'Outfit', sans-serif",
              backgroundColor: '#ef5350',
              '&:hover': {
                backgroundColor: '#d32f2f'
              }
            }}
          >
            Acknowledge
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default Login;
