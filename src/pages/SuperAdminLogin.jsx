import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useMutation, useApolloClient } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import vidyaflowLogo from '../assets/vidyaflowlogo.png';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, CircularProgress, Chip, Grid, FormControlLabel, Switch
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Shield, ArrowBack } from '@mui/icons-material';
import { LOGIN_WITH_PASSWORD } from '../graphql/operations';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';

function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [enable2FA, setEnable2FA] = useState(false);
  
  // 2FA step state: 'CREDENTIALS' or '2FA_VERIFY'
  const [step, setStep] = useState('CREDENTIALS');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [validationError, setValidationError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const client = useApolloClient();

  const [loginMutation, { loading, error }] = useMutation(LOGIN_WITH_PASSWORD, {
    onCompleted: async (data) => {
      try {
        await client.clearStore();
      } catch (e) {
        console.error('Error clearing apollo store on superadmin login:', e);
      }
      dispatch(loginSuccess({
        token: data.loginWithPassword.token,
        refreshToken: data.loginWithPassword.refreshToken,
        user: data.loginWithPassword.user
      }));
      navigate('/');
    },
    onError: (err) => {
      dispatch(loginFailure(err.message));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please fill in all credentials.');
      return;
    }

    if (enable2FA && step === 'CREDENTIALS') {
      // Go to 2FA screen
      setStep('2FA_VERIFY');
      return;
    }

    if (step === '2FA_VERIFY' && twoFactorCode !== '123456') {
      setValidationError('Invalid 2FA Verification Code. Use demo code 123456.');
      return;
    }

    dispatch(loginStart());
    loginMutation({
      variables: {
        email,
        password,
        schoolId: null // Super Admin is global
      }
    });
  };

  const handleQuickFill = () => {
    setEmail('superadmin@erp.com');
    setPassword('super_secure_pass');
  };

  const textFieldSx = {
    mb: 3,
    '& .MuiOutlinedInput-root': {
      color: '#E2E8F0',
      backgroundColor: 'rgba(15, 23, 42, 0.58)',
      borderRadius: 2,
      '& fieldset': {
        borderColor: 'rgba(148, 163, 184, 0.28)'
      },
      '&:hover fieldset': {
        borderColor: 'rgba(129, 140, 248, 0.7)'
      },
      '&.Mui-focused fieldset': {
        borderColor: '#818CF8'
      }
    },
    '& .MuiInputLabel-root': {
      color: '#94A3B8'
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#C4B5FD'
    },
    '& input::placeholder': {
      color: '#94A3B8',
      opacity: 0.75
    },
    '& input:-webkit-autofill': {
      WebkitBoxShadow: '0 0 0 100px #111827 inset',
      WebkitTextFillColor: '#E2E8F0',
      caretColor: '#E2E8F0',
      borderRadius: 'inherit'
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #020617 0%, #0F172A 50%, #1E1B4B 100%)',
      p: { xs: 2, sm: 4 }
    }}>
      <Card sx={{
        maxWidth: 450,
        width: '100%',
        borderRadius: 4,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.5)'
      }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              component="img"
              src={vidyaflowLogo}
              alt="VidyaFlow Logo"
              sx={{
                width: 72,
                height: 72,
                objectFit: 'contain',
                mb: 2,
                filter: 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.5))'
              }}
            />
            <Typography variant="h4" gutterBottom sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.025em' }}>
              Super Admin Portal
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
              VidyaFlow Global Management Console
            </Typography>
          </Box>

          {(error || validationError) && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {validationError || error?.message}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {step === 'CREDENTIALS' && (
              <>
                <TextField
                  fullWidth
                  label="Super Admin Email"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={textFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#818CF8' }} />
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
                  onChange={(e) => setPassword(e.target.value)}
                  sx={textFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#818CF8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#94A3B8' }}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={enable2FA} 
                        onChange={(e) => setEnable2FA(e.target.checked)} 
                        color="secondary"
                      />
                    }
                    label={
                      <Typography sx={{ color: '#E2E8F0', fontSize: '0.875rem', fontWeight: 600 }}>
                        Require 2-Factor Authentication (2FA)
                      </Typography>
                    }
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #4F46E5 0%, #8B5CF6 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: 3,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4338CA 0%, #7C3AED 100%)'
                    }
                  }}
                >
                  {enable2FA ? 'Continue to 2FA' : 'Sign In'}
                </Button>
              </>
            )}

            {step === '2FA_VERIFY' && (
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Box sx={{ bgcolor: 'rgba(139, 92, 246, 0.15)', p: 2, borderRadius: '50%', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                    <Shield sx={{ fontSize: 40, color: '#A78BFA' }} />
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 1 }}>
                  2-Factor Authentication
                </Typography>
                <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3 }}>
                  Enter the 6-digit authentication code from your authenticator app.
                </Typography>

                <TextField
                  fullWidth
                  label="Authentication Code"
                  placeholder="e.g. 123456"
                  variant="outlined"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  sx={textFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Shield sx={{ color: '#A78BFA' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: 3,
                    mb: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7C3AED 0%, #C084FC 100%)'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Log In'}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  onClick={() => {
                    setStep('CREDENTIALS');
                    setValidationError('');
                  }}
                  startIcon={<ArrowBack />}
                  sx={{ color: '#94A3B8', fontWeight: 600 }}
                >
                  Back to credentials
                </Button>
              </Box>
            )}
          </form>

          {/* Tester Helper */}
          {step === 'CREDENTIALS' && (
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
              <Typography variant="caption" display="block" sx={{ color: '#94A3B8', mb: 1.5, fontWeight: 600 }}>
                💡 QUICK DEMO ACCOUNTS (Click to autofill):
              </Typography>
              <Chip
                label="Super Admin: superadmin@erp.com"
                onClick={handleQuickFill}
                sx={{ cursor: 'pointer', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818CF8', border: '1px solid rgba(99, 102, 241, 0.3)' }}
              />
            </Box>
          )}

          {step === '2FA_VERIFY' && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#A78BFA', fontWeight: 700 }}>
                💡 Demo 2FA code is: 123456
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default SuperAdminLogin;
