import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Grid, MenuItem, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
  IconButton, TablePagination, Stack, Chip, Alert, Checkbox, FormControlLabel,
  FormGroup, FormLabel, FormControl
} from '@mui/material';
import {
  Add as AddIcon, Campaign as AnnouncementIcon, Delete as DeleteIcon,
  Send as SendIcon, Sms as SmsIcon, Email as EmailIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import {
  GET_NOTIFICATIONS,
  CREATE_NOTIFICATION,
  DELETE_NOTIFICATION
} from '../graphql/operations';

// Re-map MUI components since icons can sometimes clash in imports if not typed properly
import {
  Alert as MuiAlert, Box as MuiBox, Button as MuiButton, Card as MuiCard,
  CardContent as MuiCardContent, CircularProgress as MuiCircularProgress,
  Dialog as MuiDialog, DialogActions as MuiDialogActions, DialogContent as MuiDialogContent,
  DialogTitle as MuiDialogTitle, Grid as MuiGrid, MenuItem as MuiMenuItem,
  Paper as MuiPaper, Table as MuiTable, TableBody as MuiTableBody,
  TableCell as MuiTableCell, TableContainer as MuiTableContainer,
  TableHead as MuiTableHead, TableRow as MuiTableRow, TextField as MuiTextField,
  Typography as MuiTypography, IconButton as MuiIconButton,
  TablePagination as MuiTablePagination, Stack as MuiStack, Chip as MuiChip,
  Checkbox as MuiCheckbox, FormControlLabel as MuiFormControlLabel,
  FormGroup as MuiFormGroup, FormLabel as MuiFormLabel, FormControl as MuiFormControl
} from '@mui/material';

function AnnouncementPortal() {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.ui.themeMode);
  const { user } = useSelector((state) => state.auth);
  const isDark = themeMode === 'dark';

  const canCompose = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'SUPER_TEACHER'].includes(user?.role);

  const [page, setPage] = useState(0);

  // Compose form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('ANNOUNCEMENT');
  const [recipients, setRecipients] = useState({
    PARENT: true,
    TEACHER: true,
    STUDENT: false
  });
  const [sendSMS, setSendSMS] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Delete confirmations
  const [noticeToDelete, setNoticeToDelete] = useState(null);

  // Queries & Mutations
  const { data: notificationsData, loading: loadingNotices, refetch: refetchNotices } = useQuery(GET_NOTIFICATIONS);
  const [createNotice, { loading: creating }] = useMutation(CREATE_NOTIFICATION);
  const [deleteNotice] = useMutation(DELETE_NOTIFICATION);

  // View notice details modal state
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Auto-mark notifications as read when viewed on this page
  React.useEffect(() => {
    if (notificationsData?.getNotifications && user) {
      const alerts = notificationsData.getNotifications;
      if (alerts.length > 0) {
        try {
          const stored = localStorage.getItem(`read_alerts_${user.id}`);
          let currentRead = stored ? JSON.parse(stored) : [];
          let updated = [...currentRead];
          let hasNew = false;
          
          alerts.forEach(a => {
            if (!updated.includes(a.id)) {
              updated.push(a.id);
              hasNew = true;
            }
          });
          
          if (hasNew) {
            localStorage.setItem(`read_alerts_${user.id}`, JSON.stringify(updated));
            window.dispatchEvent(new Event('alertsRead'));
          }
        } catch (e) {
          console.error('[ALERTS SYNC] Failed to update read alerts:', e);
        }
      }
    }
  }, [notificationsData, user]);

  const handleOpenNotice = (notice) => {
    setSelectedNotice(notice);
    if (user) {
      try {
        const stored = localStorage.getItem(`read_alerts_${user.id}`);
        let currentRead = stored ? JSON.parse(stored) : [];
        if (!currentRead.includes(notice.id)) {
          const updated = [...currentRead, notice.id];
          localStorage.setItem(`read_alerts_${user.id}`, JSON.stringify(updated));
          window.dispatchEvent(new Event('alertsRead'));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRecipientChange = (event) => {
    setRecipients({
      ...recipients,
      [event.target.name]: event.target.checked
    });
  };

  const handleComposeSubmit = async (e) => {
    e.preventDefault();
    if (!canCompose) {
      dispatch(showToast({ message: 'You are not authorized to publish announcements.', severity: 'error' }));
      return;
    }
    setSubmitError('');

    if (!title.trim() || !message.trim()) {
      setSubmitError('Title and message text are required.');
      return;
    }

    const selectedRoles = Object.keys(recipients).filter(role => recipients[role]);
    if (selectedRoles.length === 0) {
      setSubmitError('Please select at least one target recipient role.');
      return;
    }

    try {
      await createNotice({
        variables: {
          title: title.trim(),
          message: message.trim(),
          type,
          recipientRoles: selectedRoles,
          sendSMS
        }
      });

      // Simulated SMS Gateway Dispatch
      if (sendSMS) {
        console.log(`\n==========================================`);
        console.log(`[SMS GATEWAY SIMULATION] Initiating Broadcast...`);
        console.log(`[SMS GATEWAY SIMULATION] Message: "${title}: ${message}"`);
        console.log(`[SMS GATEWAY SIMULATION] Recipient Groups: [${selectedRoles.join(', ')}]`);
        console.log(`[SMS GATEWAY SIMULATION] Status: Sent successfully to 104 active phone numbers.`);
        console.log(`==========================================\n`);

        dispatch(showToast({
          message: `SMS dispatched successfully to all active ${selectedRoles.map(r => r.toLowerCase() + 's').join(', ')}!`,
          severity: 'info'
        }));
      }

      dispatch(showToast({ message: 'Announcement published successfully!', severity: 'success' }));

      // Reset Form
      setTitle('');
      setMessage('');
      setType('ANNOUNCEMENT');
      setSendSMS(false);
      refetchNotices();
    } catch (err) {
      setSubmitError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  };

  const handleDeleteNotice = async () => {
    if (!noticeToDelete) return;
    if (!canCompose) {
      dispatch(showToast({ message: 'You are not authorized to delete announcements.', severity: 'error' }));
      return;
    }
    try {
      await deleteNotice({ variables: { id: noticeToDelete.id } });
      dispatch(showToast({ message: 'Announcement deleted successfully.', severity: 'success' }));
      setNoticeToDelete(null);
      refetchNotices();
    } catch (err) {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  };

  return (
    <MuiBox sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <MuiBox sx={{ mb: 4 }}>
        <MuiTypography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
          Announcement & SMS Portal
        </MuiTypography>
        <MuiTypography variant="body2" color="text.secondary">
          Publish school-wide notice board updates, circulars, alerts, and dispatch simulated SMS broadcasts to parents and teachers.
        </MuiTypography>
      </MuiBox>

      <MuiGrid container spacing={4}>
        {/* Compose Announcement Column */}
        {canCompose && (
          <MuiGrid item xs={12} md={5}>
            <MuiCard sx={{ borderRadius: 3, border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)', background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff' }}>
              <MuiCardContent sx={{ p: 3 }}>
                <MuiTypography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AnnouncementIcon color="primary" /> Compose Circular / SMS
                </MuiTypography>

                {submitError && <MuiAlert severity="error" sx={{ mb: 2.5 }}>{submitError}</MuiAlert>}

                <form onSubmit={handleComposeSubmit}>
                  <MuiStack spacing={3}>
                    <MuiTextField
                      fullWidth
                      required
                      label="Notice Title"
                      placeholder="e.g. Mid-Term Parent Teacher Meeting Schedule"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />

                    <MuiTextField
                      fullWidth
                      required
                      multiline
                      rows={4}
                      label="Notice Message Content"
                      placeholder="Enter the body of the announcement. This will be sent as notification or SMS..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />

                    <MuiTextField
                      select
                      fullWidth
                      label="Notice Type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <MuiMenuItem value="ANNOUNCEMENT">Announcement</MuiMenuItem>
                      <MuiMenuItem value="NOTICE">Official Circular / Notice</MuiMenuItem>
                      <MuiMenuItem value="ALERT">Alert / Urgent Broadcast</MuiMenuItem>
                    </MuiTextField>

                    <MuiFormControl component="fieldset" variant="standard">
                      <MuiFormLabel component="legend" sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1 }}>Target Audience</MuiFormLabel>
                      <MuiFormGroup row>
                        <MuiFormControlLabel
                          control={<MuiCheckbox checked={recipients.PARENT} onChange={handleRecipientChange} name="PARENT" />}
                          label="Parents"
                        />
                        <MuiFormControlLabel
                          control={<MuiCheckbox checked={recipients.TEACHER} onChange={handleRecipientChange} name="TEACHER" />}
                          label="Teachers"
                        />
                        {/* <MuiFormControlLabel
                          control={<MuiCheckbox checked={recipients.STUDENT} onChange={handleRecipientChange} name="STUDENT" />}
                          label="Students"
                        /> */}
                      </MuiFormGroup>
                    </MuiFormControl>

                    {/* <MuiFormControlLabel
                      control={
                        <MuiCheckbox
                          checked={sendSMS}
                          onChange={(e) => setSendSMS(e.target.checked)}
                          icon={<SmsIcon />}
                          checkedIcon={<SmsIcon color="info" />}
                        />
                      }
                      label="Also Dispatch SMS (Simulated)"
                      sx={{ color: sendSMS ? 'info.main' : 'text.secondary', fontWeight: 600 }}
                    /> */}

                    <MuiButton
                      type="submit"
                      variant="contained"
                      startIcon={<SendIcon />}
                      disabled={creating}
                      sx={{
                        background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)',
                        color: '#FFFFFF',
                        py: 1.25,
                        fontWeight: 700,
                        borderRadius: 2.5
                      }}
                    >
                      {creating ? 'Publishing...' : 'Send Broadcast'}
                    </MuiButton>
                  </MuiStack>
                </form>
              </MuiCardContent>
            </MuiCard>
          </MuiGrid>
        )}

        {/* History Log Column */}
        <MuiGrid item xs={12} md={canCompose ? 7 : 12}>
          {!canCompose && (
            <MuiAlert severity="info" sx={{ mb: 3, borderRadius: 2.5, fontWeight: 600 }}>
              You have view-only access to the Circular Portal. You can view all published announcements, notices, and alerts below.
            </MuiAlert>
          )}
          <MuiCard sx={{ borderRadius: 3, border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)', background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff' }}>
            <MuiCardContent sx={{ p: 3 }}>
              <MuiTypography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 3 }}>
                Historical Circulars Feed
              </MuiTypography>

              {loadingNotices ? (
                <MuiBox sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><MuiCircularProgress /></MuiBox>
              ) : (
                <>
                  <MuiTableContainer component={MuiPaper} variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
                    <MuiTable>
                      <MuiTableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                        <MuiTableRow>
                          <MuiTableCell>Announcement Details</MuiTableCell>
                          <MuiTableCell>Audience</MuiTableCell>
                          {canCompose && <MuiTableCell align="right">Actions</MuiTableCell>}
                        </MuiTableRow>
                      </MuiTableHead>
                      <MuiTableBody>
                        {(notificationsData?.getNotifications || [])
                          .slice(page * 5, (page + 1) * 5)
                          .map((notice) => (
                            <MuiTableRow 
                              key={notice.id} 
                              hover
                              onClick={() => handleOpenNotice(notice)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <MuiTableCell sx={{ py: 2 }}>
                                <MuiStack spacing={0.5}>
                                  <MuiStack direction="row" alignItems="center" spacing={1}>
                                    <MuiTypography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                      {notice.title}
                                    </MuiTypography>
                                    <MuiChip
                                      label={notice.type}
                                      size="small"
                                      color={notice.type === 'ALERT' ? 'error' : notice.type === 'NOTICE' ? 'secondary' : 'default'}
                                      sx={{ fontWeight: 700, fontSize: '0.6rem', height: 18 }}
                                    />
                                  </MuiStack>
                                  <MuiTypography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                    {notice.message}
                                  </MuiTypography>
                                  <MuiTypography variant="caption" color="text.disabled">
                                    Dispatched: {new Date(notice.createdAt).toLocaleString()}
                                  </MuiTypography>
                                </MuiStack>
                              </MuiTableCell>
                              <MuiTableCell>
                                <MuiStack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                                  {notice.recipientRoles?.map(role => (
                                    <MuiChip key={role} label={role} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                                  ))}
                                </MuiStack>
                              </MuiTableCell>
                              {canCompose && (
                                <MuiTableCell align="right">
                                  <MuiIconButton color="error" size="small" onClick={(e) => { e.stopPropagation(); setNoticeToDelete(notice); }}>
                                    <DeleteIcon sx={{ fontSize: '1.2rem' }} />
                                  </MuiIconButton>
                                </MuiTableCell>
                              )}
                            </MuiTableRow>
                          ))}
                        {(!notificationsData?.getNotifications || notificationsData.getNotifications.length === 0) && (
                          <MuiTableRow>
                            <MuiTableCell colSpan={canCompose ? 3 : 2} align="center" sx={{ py: 4 }}>No announcements sent yet.</MuiTableCell>
                          </MuiTableRow>
                        )}
                      </MuiTableBody>
                    </MuiTable>
                  </MuiTableContainer>
                  {notificationsData?.getNotifications?.length > 0 && (
                    <MuiTablePagination
                      rowsPerPageOptions={[5]}
                      component="div"
                      count={notificationsData.getNotifications.length}
                      rowsPerPage={5}
                      page={page}
                      onPageChange={(e, newPage) => setPage(newPage)}
                    />
                  )}
                </>
              )}
            </MuiCardContent>
          </MuiCard>
        </MuiGrid>
      </MuiGrid>

      {/* Delete Notice Modal */}
      <MuiDialog open={Boolean(noticeToDelete)} onClose={() => setNoticeToDelete(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <MuiDialogTitle sx={{ fontWeight: 800 }}>Delete Announcement</MuiDialogTitle>
        <MuiDialogContent>
          <MuiTypography>
            Are you sure you want to delete announcement "{noticeToDelete?.title}"? It will be removed from recipient dashboards.
          </MuiTypography>
        </MuiDialogContent>
        <MuiDialogActions sx={{ p: 3 }}>
          <MuiButton onClick={() => setNoticeToDelete(null)} variant="outlined">Cancel</MuiButton>
          <MuiButton onClick={handleDeleteNotice} variant="contained" color="error">Delete</MuiButton>
        </MuiDialogActions>
      </MuiDialog>

      {/* View Notice Details Modal */}
      <MuiDialog open={Boolean(selectedNotice)} onClose={() => setSelectedNotice(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <MuiDialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <MuiStack direction="row" alignItems="center" spacing={1.5}>
            <AnnouncementIcon color="primary" />
            <MuiTypography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
              Circular Details
            </MuiTypography>
          </MuiStack>
          <MuiChip
            label={selectedNotice?.type}
            color={selectedNotice?.type === 'ALERT' ? 'error' : selectedNotice?.type === 'NOTICE' ? 'secondary' : 'default'}
            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
          />
        </MuiDialogTitle>
        <MuiDialogContent>
          <MuiStack spacing={2.5} sx={{ mt: 1 }}>
            <Box>
              <MuiTypography variant="caption" color="text.disabled" display="block">TITLE</MuiTypography>
              <MuiTypography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {selectedNotice?.title}
              </MuiTypography>
            </Box>
            <Box>
              <MuiTypography variant="caption" color="text.disabled" display="block">MESSAGE</MuiTypography>
              <MuiTypography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.6 }}>
                {selectedNotice?.message}
              </MuiTypography>
            </Box>
            <MuiStack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <MuiTypography variant="caption" color="text.disabled" display="block">AUDIENCE</MuiTypography>
                <MuiStack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                  {selectedNotice?.recipientRoles?.map(role => (
                    <MuiChip key={role} label={role} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                  ))}
                </MuiStack>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <MuiTypography variant="caption" color="text.disabled" display="block">DISPATCHED DATE</MuiTypography>
                <MuiTypography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {selectedNotice ? new Date(selectedNotice.createdAt).toLocaleString() : ''}
                </MuiTypography>
              </Box>
            </MuiStack>
          </MuiStack>
        </MuiDialogContent>
        <MuiDialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => setSelectedNotice(null)} variant="contained" sx={{ borderRadius: 2 }}>Close</MuiButton>
        </MuiDialogActions>
      </MuiDialog>
    </MuiBox>
  );
}

export default AnnouncementPortal;
