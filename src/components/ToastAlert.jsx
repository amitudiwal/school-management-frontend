import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { hideToast } from '../store/slices/uiSlice';

function ToastAlert() {
  const dispatch = useDispatch();
  const { toast } = useSelector((state) => state.ui);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    dispatch(hideToast());
  };

  return (
    <Snackbar
      open={toast?.open || false}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={toast?.severity || 'success'}
        variant="filled"
        sx={{
          width: '100%',
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          borderRadius: '12px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          backgroundColor:
            toast?.severity === 'success'
              ? '#10B981' // Vibrant Emerald Green
              : toast?.severity === 'error'
              ? '#EF4444' // Vibrant Crimson Red
              : undefined,
        }}
      >
        {toast?.message}
      </Alert>
    </Snackbar>
  );
}

export default ToastAlert;
