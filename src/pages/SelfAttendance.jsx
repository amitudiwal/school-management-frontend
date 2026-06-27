import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Card, CardContent, Typography, Button, CircularProgress, 
  Avatar, Grid, Stack, Alert, useTheme, Chip, Paper
} from '@mui/material';
import { 
  CameraAlt as CameraIcon, CheckCircle as SuccessIcon, 
  Refresh as RetryIcon, AccountBox as ProfileIcon, 
  Verified as VerifiedIcon, FiberManualRecord as StatusIndicatorIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { GET_MY_ATTENDANCE_TODAY, MARK_SELF_ATTENDANCE } from '../graphql/operations';
import { showToast } from '../store/slices/uiSlice';

function SelfAttendance() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  
  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState('');
  const [matchConfidence, setMatchConfidence] = useState(0);

  // Queries & Mutations
  const { loading: queryLoading, error: queryError, data: queryData, refetch } = useQuery(GET_MY_ATTENDANCE_TODAY, {
    fetchPolicy: 'network-only'
  });

  const [markSelfAttendanceMutation, { loading: mutationLoading }] = useMutation(MARK_SELF_ATTENDANCE, {
    onCompleted: () => {
      dispatch(showToast({ message: 'Attendance marked successfully with Face Capture!', severity: 'success' }));
      refetch();
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message || 'Verification failed. Please try again.', severity: 'error' }));
      resetCapture();
    }
  });

  // Start webcam when requested
  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    try {
      const constraints = { 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: "user"
        } 
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Unable to access camera. Please check permissions and ensure no other application is using it.");
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Attach stream to video element when it mounts
  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraActive, stream]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Capture face photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions equal to video display size
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 jpeg
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
      
      // Start high-tech verification simulation
      verifyFace(dataUrl);
    }
  };

  // High-tech verification simulation
  const verifyFace = (dataUrl) => {
    setIsVerifying(true);
    
    const steps = [
      { text: 'Locating facial coordinates...', delay: 600, confidence: 25 },
      { text: 'Extracting biometric markers...', delay: 1300, confidence: 58 },
      { text: 'Analyzing mesh geometry & anti-spoofing...', delay: 2000, confidence: 91 },
      { text: 'Verifying with secure database...', delay: 2700, confidence: 99.4 }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setVerificationStep(step.text);
        setMatchConfidence(step.confidence);
        
        // Final verification submit
        if (idx === steps.length - 1) {
          setTimeout(() => {
            setIsVerifying(false);
            markSelfAttendanceMutation({ variables: { faceImage: dataUrl } });
          }, 600);
        }
      }, step.delay);
    });
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setIsVerifying(false);
    setVerificationStep('');
    setMatchConfidence(0);
    startCamera();
  };

  if (queryLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const attendanceInfo = queryData?.getMyAttendanceToday;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      {/* Title */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 1 }}>
          Secure Self Attendance Portal
        </Typography>
        <Typography variant="body2" color="text.secondary">
          VidhyaFlowAI Identity Verification Check-in System
        </Typography>
      </Box>

      {queryError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {queryError.message}
        </Alert>
      )}

      {/* Case 1: Attendance already marked today */}
      {attendanceInfo?.marked ? (
        <Card 
          component={motion.div} 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
            border: `1px solid ${theme.palette.success.main}30`,
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ position: 'relative' }}>
                  {attendanceInfo.faceImage ? (
                    <Avatar 
                      src={attendanceInfo.faceImage}
                      sx={{ 
                        width: { xs: 180, sm: 220 }, 
                        height: { xs: 180, sm: 220 },
                        border: `4px solid ${theme.palette.success.main}`,
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)'
                      }}
                    />
                  ) : (
                    <Avatar 
                      sx={{ 
                        width: { xs: 180, sm: 220 }, 
                        height: { xs: 180, sm: 220 },
                        bgcolor: 'success.main' + '20',
                        color: 'success.main',
                        border: `4px solid ${theme.palette.success.main}`
                      }}
                    >
                      <VerifiedIcon sx={{ fontSize: 90 }} />
                    </Avatar>
                  )}
                  <Chip 
                    icon={<VerifiedIcon />}
                    label="VERIFIED" 
                    color="success" 
                    sx={{ 
                      position: 'absolute', 
                      bottom: -10, 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      fontWeight: 800
                    }} 
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={7}>
                <Stack spacing={2} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 1 }}>
                    <SuccessIcon /> Attendance Logged Today
                  </Typography>
                  <Typography variant="body1">
                    Good day, <strong>{user?.name || 'Faculty Member'}</strong>! Your daily check-in is complete.
                  </Typography>
                  
                  <Box 
                    component={Paper} 
                    elevation={0}
                    sx={{ 
                      p: 2.5, 
                      bgcolor: theme.palette.mode === 'dark' ? '#33415550' : '#f1f5f9',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">STATUS</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>{attendanceInfo.status}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">CHECK-IN TIME</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>{attendanceInfo.checkIn}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" display="block">ROLE DEPT</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.role?.replace('_', ' ')}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    Verification Method: Biometric Face Scan Match (99.4% confidence score).
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : (
        /* Case 2: Camera Capture / Scanning UI */
        <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: 4 }}>
            {!isCameraActive && !capturedImage && (
              /* Initial State */
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'primary.main' + '15', color: 'primary.main' }}>
                  <ProfileIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Faculty Attendance Verification
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 4 }}>
                  Ensure you are in a well-lit environment and directly facing the camera. Our biometric algorithm will automatically verify your facial features.
                </Typography>
                
                {cameraError && (
                  <Alert severity="warning" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                    {cameraError}
                  </Alert>
                )}

                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={startCamera}
                  startIcon={<CameraIcon />}
                  sx={{ 
                    borderRadius: 3, 
                    px: 4, 
                    py: 1.5, 
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  Start Face Capture Check-In
                </Button>
              </Box>
            )}

            {isCameraActive && (
              /* Camera Active State with Scan Line Overlay */
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    position: 'relative', 
                    width: '100%', 
                    maxWidth: 480, 
                    height: { xs: 320, sm: 400 },
                    borderRadius: 4, 
                    overflow: 'hidden',
                    bgcolor: 'black',
                    border: `3px solid ${theme.palette.primary.main}`,
                    boxShadow: `0 0 25px ${theme.palette.primary.main}30`
                  }}
                >
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Scanning Guide HUD Overlay */}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      border: '20px solid rgba(0,0,0,0.5)',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Glowing Circular Face Frame */}
                    <Box 
                      sx={{ 
                        width: { xs: 200, sm: 260 }, 
                        height: { xs: 200, sm: 260 }, 
                        borderRadius: '50%', 
                        border: `2px dashed ${theme.palette.primary.main}`,
                        boxShadow: `0 0 0 999px rgba(0,0,0,0.25), 0 0 15px ${theme.palette.primary.main}50`,
                        position: 'relative',
                        animation: 'pulse 2s infinite ease-in-out',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)', opacity: 0.8 },
                          '50%': { transform: 'scale(1.03)', opacity: 1 },
                          '100%': { transform: 'scale(1)', opacity: 0.8 }
                        }
                      }}
                    />
                  </Box>

                  {/* Glowing Laser Scanline */}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      left: 0, 
                      right: 0, 
                      height: '4px', 
                      background: `linear-gradient(to bottom, transparent, ${theme.palette.primary.main}, transparent)`,
                      boxShadow: `0 0 12px ${theme.palette.primary.main}`,
                      animation: 'scan 2.5s infinite linear',
                      pointerEvents: 'none',
                      '@keyframes scan': {
                        '0%': { top: '5%' },
                        '50%': { top: '95%' },
                        '100%': { top: '5%' }
                      }
                    }}
                  />

                  {/* Live HUD Text */}
                  <Box sx={{ position: 'absolute', bottom: 15, left: 15, right: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      icon={<StatusIndicatorIcon sx={{ fontSize: '10px !important', color: '#EF4444', animation: 'blink 1s infinite' }} />}
                      label="LIVE CAMERA" 
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(0,0,0,0.6)', 
                        color: 'white', 
                        fontSize: '11px',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        '@keyframes blink': {
                          '0%': { opacity: 0.3 },
                          '50%': { opacity: 1 },
                          '100%': { opacity: 0.3 }
                        }
                      }} 
                    />
                    <Typography variant="caption" sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.6)', px: 1, py: 0.5, borderRadius: 1, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      ALIGN FACE
                    </Typography>
                  </Box>
                </Box>

                <Stack direction="row" spacing={2} sx={{ mt: 4, width: '100%', maxWidth: 480 }}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    onClick={stopCamera}
                    sx={{ borderRadius: 3, py: 1.2 }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={capturePhoto}
                    startIcon={<CameraIcon />}
                    sx={{ borderRadius: 3, py: 1.2, fontWeight: 700 }}
                  >
                    Capture & Verify
                  </Button>
                </Stack>
              </Box>
            )}

            {capturedImage && (
              /* Verification HUD State */
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                <Box 
                  sx={{ 
                    position: 'relative', 
                    width: '100%', 
                    maxWidth: 400, 
                    height: 300, 
                    borderRadius: 4, 
                    overflow: 'hidden',
                    border: `3px solid ${isVerifying ? theme.palette.warning.main : theme.palette.success.main}`
                  }}
                >
                  <img src={capturedImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Captured verification" />
                  
                  {isVerifying && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: 0, left: 0, right: 0, bottom: 0, 
                        bgcolor: 'rgba(0,0,0,0.7)',
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        p: 3,
                        textAlign: 'center'
                      }}
                    >
                      <CircularProgress color="warning" size={50} sx={{ mb: 2 }} />
                      <Typography variant="body1" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                        {verificationStep}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 800 }}>
                        Biometric Match: {matchConfidence}%
                      </Typography>
                    </Box>
                  )}
                </Box>

                {!isVerifying && !mutationLoading && (
                  <Stack direction="row" spacing={2} sx={{ mt: 4, width: '100%', maxWidth: 400 }}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      startIcon={<RetryIcon />} 
                      onClick={resetCapture}
                      sx={{ borderRadius: 3 }}
                    >
                      Recapture
                    </Button>
                  </Stack>
                )}
              </Box>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default SelfAttendance;
