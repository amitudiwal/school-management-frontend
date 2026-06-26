import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Button, Card, CardContent, Grid, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableRow, TableHead,
  Paper, Typography, CircularProgress, Alert, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, LinearProgress,
  IconButton, useTheme, Tooltip, FormControl, InputLabel, Select
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Add as AddIcon,
  CalendarToday as DateIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  GET_LEAVE_REQUESTS,
  REQUEST_LEAVE,
  UPDATE_LEAVE_STATUS,
  GET_TEACHER_LEAVE_BALANCE,
  GET_LEAVE_LIMIT,
  UPDATE_LEAVE_LIMIT
} from '../graphql/operations';
import { showToast } from '../store/slices/uiSlice';
import CustomDatePicker from '../components/CustomDatePicker';

function LeaveManagement() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Tabs: 0 = My Leaves & Balance (Staff/Teachers/Admins), 1 = Approvals Dashboard (Admins/Principals/HR), 2 = Configure Limits
  const isAdmin = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'HR_STAFF'].includes(user?.role);
  const [activeTab, setActiveTab] = useState(isAdmin ? 1 : 0);

  // Leave Limit Form States
  const [casualLimit, setCasualLimit] = useState(15);
  const [medicalLimit, setMedicalLimit] = useState(10);
  const [maternityLimit, setMaternityLimit] = useState(90);
  const [paternityLimit, setPaternityLimit] = useState(15);
  const [sabbaticalLimit, setSabbaticalLimit] = useState(30);

  // Leave Request Form Dialog State
  const [requestOpen, setRequestOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  // Review Dialog State (For Admin Approvals)
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [adminRemarks, setAdminRemarks] = useState('');

  // Queries
  const {
    loading: requestsLoading,
    error: requestsError,
    data: requestsData,
    refetch: refetchRequests
  } = useQuery(GET_LEAVE_REQUESTS, {
    fetchPolicy: 'network-only'
  });

  const {
    loading: balanceLoading,
    data: balanceData,
    refetch: refetchBalance
  } = useQuery(GET_TEACHER_LEAVE_BALANCE, {
    variables: { userId: user?.id },
    skip: !user?.id
  });

  const { loading: limitLoading } = useQuery(GET_LEAVE_LIMIT, {
    skip: !isAdmin,
    onCompleted: (data) => {
      if (data?.getLeaveLimit) {
        setCasualLimit(data.getLeaveLimit.casual);
        setMedicalLimit(data.getLeaveLimit.medical);
        setMaternityLimit(data.getLeaveLimit.maternity);
        setPaternityLimit(data.getLeaveLimit.paternity);
        setSabbaticalLimit(data.getLeaveLimit.sabbatical);
      }
    }
  });

  // Mutations
  const [requestLeaveMutation, { loading: requestSubmitting }] = useMutation(REQUEST_LEAVE, {
    onCompleted: () => {
      dispatch(showToast({ message: 'Leave request submitted successfully!', severity: 'success' }));
      setRequestOpen(false);
      setReason('');
      refetchRequests();
      refetchBalance();
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message || 'Error submitting leave request', severity: 'error' }));
    }
  });

  const [updateLeaveStatusMutation, { loading: statusSubmitting }] = useMutation(UPDATE_LEAVE_STATUS, {
    onCompleted: (data) => {
      const statusText = data.updateLeaveStatus.status.toLowerCase();
      dispatch(showToast({ message: `Leave request has been ${statusText}!`, severity: 'success' }));
      setReviewOpen(false);
      setAdminRemarks('');
      setSelectedLeave(null);
      refetchRequests();
      refetchBalance();
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message || 'Error updating leave status', severity: 'error' }));
    }
  });

  const [updateLeaveLimitMutation, { loading: limitSubmitting }] = useMutation(UPDATE_LEAVE_LIMIT, {
    onCompleted: () => {
      dispatch(showToast({ message: 'Annual leave allocations updated successfully!', severity: 'success' }));
      refetchBalance();
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message || 'Error updating allocations', severity: 'error' }));
    }
  });

  const handleLimitSubmit = (e) => {
    e.preventDefault();
    updateLeaveLimitMutation({
      variables: {
        casual: parseInt(casualLimit),
        medical: parseInt(medicalLimit),
        maternity: parseInt(maternityLimit),
        paternity: parseInt(paternityLimit),
        sabbatical: parseInt(sabbaticalLimit)
      }
    });
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (new Date(startDate) > new Date(endDate)) {
      dispatch(showToast({ message: 'Start date cannot be after end date', severity: 'warning' }));
      return;
    }
    requestLeaveMutation({
      variables: {
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason
      }
    });
  };

  const handleStatusUpdate = (status) => {
    if (!selectedLeave) return;
    updateLeaveStatusMutation({
      variables: {
        leaveId: selectedLeave.id,
        status,
        remarks: adminRemarks
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'warning';
    }
  };

  const formatLeaveTypeName = (type) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const getLeaveTypeProgressColor = (type) => {
    switch (type) {
      case 'CASUAL': return theme.palette.primary.main;
      case 'MEDICAL': return theme.palette.error.main;
      case 'MATERNITY': return theme.palette.secondary.main;
      case 'PATERNITY': return '#64748B';
      case 'SABBATICAL': return theme.palette.warning.main;
      default: return '#10B981';
    }
  };

  // Calculate days difference
  const calculateDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e - s);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <Box sx={{ pb: 5 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, background: 'linear-gradient(90deg, #6366F1 0%, #D946EF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            HR Leave Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage annual holiday allotments, leave requests, and administrative decisions.
          </Typography>
        </Box>
        {!isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setRequestOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              px: 3,
              py: 1.2,
              borderRadius: 3,
              boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #c084fc 100%)',
                boxShadow: '0 6px 20px 0 rgba(99, 102, 241, 0.6)',
              }
            }}
          >
            Apply for Leave
          </Button>
        )}
      </Box>

      {/* Tabs */}
      {isAdmin && (
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}
        >
          <Tab label="My Portal" sx={{ fontWeight: 700, px: 3 }} />
          <Tab label="Pending Approvals" sx={{ fontWeight: 700, px: 3 }} />
          <Tab label="Configure Allotments" sx={{ fontWeight: 700, px: 3 }} />
        </Tabs>
      )}

      {/* TAB 0: TEACHER PORTAL & BALANCES */}
      {activeTab === 0 && (
        <Box>
          {/* Leave Balances Grid */}
          <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
            Annual Leave Balances ({new Date().getFullYear()})
          </Typography>

          {balanceLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <Grid container spacing={3} sx={{ mb: 5 }}>
              {(balanceData?.getTeacherLeaveBalance || []).map((bal) => {
                const total = bal.allowed;
                const used = bal.used;
                const pct = total > 0 ? (used / total) * 100 : 0;
                const barColor = getLeaveTypeProgressColor(bal.leaveType);

                return (
                  <Grid item xs={12} sm={6} md={4} key={bal.leaveType}>
                    <Card sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', position: 'relative', overflow: 'hidden' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              {formatLeaveTypeName(bal.leaveType)}
                            </Typography>
                            <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mt: 0.5 }}>
                              {total === 0 ? used : total - used}
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 600 }}>
                                {total === 0 ? 'Days Used (Unpaid)' : `of ${total} Days Left`}
                              </Typography>
                            </Typography>
                          </Box>
                          {!isAdmin && (
                            <Chip
                              size="small"
                              label={`${used} Used`}
                              sx={{ fontWeight: 700, bgcolor: 'action.selected', color: 'text.primary' }}
                            />
                          )}
                        </Box>
                        {total > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Used Balance Progress
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {Math.round(pct)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(pct, 100)}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#F1F5F9',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: barColor,
                                  borderRadius: 4
                                }
                              }}
                            />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {/* Leave History Table */}
          <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
            Leave Application History
          </Typography>

          {requestsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : requestsError ? (
            <Alert severity="error">{requestsError.message}</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflowX: 'auto' }}>
              <Table sx={{ minWidth: 700 }}>
                <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Leave Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date Range</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Approval Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const myRequests = (requestsData?.getLeaveRequests || []).filter(
                      (req) => req.userId?.id === user?.id || req.userId === user?.id
                    );
                    if (myRequests.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            You have not submitted any leave applications yet.
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return myRequests.map((req) => {
                      const days = calculateDays(req.startDate, req.endDate);
                      return (
                        <TableRow key={req.id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{formatLeaveTypeName(req.leaveType)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DateIcon fontSize="small" color="disabled" />
                              <Typography variant="body2">
                                {new Date(req.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {' - '}
                                {new Date(req.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{days} {days === 1 ? 'day' : 'days'}</TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <Tooltip title={req.reason}>
                              <Typography variant="body2">{req.reason}</Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={req.status}
                              color={getStatusColor(req.status)}
                              size="small"
                              variant="soft"
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell>
                            {req.status !== 'PENDING' ? (
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {req.approvalRemarks || 'No remarks provided.'}
                                </Typography>
                                {req.approvedBy && (
                                  <Typography variant="caption" color="text.secondary">
                                    Reviewed by Admin
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Awaiting review
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* TAB 1: PRINCIPAL / APPROVAL PORTAL */}
      {activeTab === 1 && isAdmin && (
        <Box>
          <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
            Manage Staff Leave Applications
          </Typography>

          {requestsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : requestsError ? (
            <Alert severity="error">{requestsError.message}</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflowX: 'auto' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Leave Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date Range</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(requestsData?.getLeaveRequests || []).map((req) => {
                    const days = calculateDays(req.startDate, req.endDate);
                    const isPending = req.status === 'PENDING';

                    return (
                      <TableRow key={req.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {req.userId?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {req.userId?.role === 'SUPER_TEACHER' ? 'Academic Management' : req.userId?.role?.replace('_', ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{formatLeaveTypeName(req.leaveType)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DateIcon fontSize="small" color="disabled" />
                            <Typography variant="body2">
                              {new Date(req.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {' - '}
                              {new Date(req.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{days} {days === 1 ? 'day' : 'days'}</TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Tooltip title={req.reason}>
                            <Typography variant="body2">{req.reason}</Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={req.status}
                            color={getStatusColor(req.status)}
                            size="small"
                            variant="soft"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {isPending ? (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                setSelectedLeave(req);
                                setReviewOpen(true);
                              }}
                              sx={{ fontWeight: 700, borderRadius: 2 }}
                            >
                              Review
                            </Button>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Reviewed
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!requestsData?.getLeaveRequests || requestsData.getLeaveRequests.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No leave requests found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* TAB 2: CONFIGURE LIMITS */}
      {activeTab === 2 && isAdmin && (
        <Box component="form" onSubmit={handleLimitSubmit} sx={{ maxWidth: 600 }}>
          <Card sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                Configure Annual Leave Allotments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set the default number of paid leave days allocated to employees for each category per calendar year.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Casual Leave Days"
                    type="number"
                    value={casualLimit}
                    onChange={(e) => setCasualLimit(Math.max(0, parseInt(e.target.value) || 0))}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Medical Leave Days"
                    type="number"
                    value={medicalLimit}
                    onChange={(e) => setMedicalLimit(Math.max(0, parseInt(e.target.value) || 0))}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Maternity Leave Days"
                    type="number"
                    value={maternityLimit}
                    onChange={(e) => setMaternityLimit(Math.max(0, parseInt(e.target.value) || 0))}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Paternity Leave Days"
                    type="number"
                    value={paternityLimit}
                    onChange={(e) => setPaternityLimit(Math.max(0, parseInt(e.target.value) || 0))}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Sabbatical Leave Days"
                    type="number"
                    value={sabbaticalLimit}
                    onChange={(e) => setSabbaticalLimit(Math.max(0, parseInt(e.target.value) || 0))}
                    fullWidth
                    required
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  type="submit"
                  disabled={limitSubmitting}
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 4,
                    py: 1.2
                  }}
                >
                  {limitSubmitting ? 'Saving...' : 'Save Allotments'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* REQUEST LEAVE DIALOG */}
      <Dialog
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, width: '100%', maxWidth: 500 } }}
      >
        <form onSubmit={handleRequestSubmit}>
          <DialogTitle sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>Apply for Leave</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <FormControl variant="outlined" fullWidth required>
              <InputLabel id="leave-type-label">Leave Type</InputLabel>
              <Select
                labelId="leave-type-label"
                id="leave-type-select"
                value={leaveType}
                label="Leave Type"
                onChange={(e) => setLeaveType(e.target.value)}
              >
                <MenuItem value="CASUAL">Casual Leave</MenuItem>
                <MenuItem value="MEDICAL">Medical Leave</MenuItem>
                <MenuItem value="MATERNITY">Maternity Leave</MenuItem>
                <MenuItem value="PATERNITY">Paternity Leave</MenuItem>
                <MenuItem value="SABBATICAL">Sabbatical Leave</MenuItem>
                <MenuItem value="WITHOUT_PAY">Leave Without Pay (Unpaid)</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <CustomDatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomDatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            {startDate && endDate && (
              <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'action.selected', display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon color="primary" fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Total Requested Duration: {calculateDays(startDate, endDate)} days.
                </Typography>
              </Box>
            )}

            <TextField
              label="Reason for Leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              multiline
              rows={4}
              fullWidth
              required
              placeholder="Provide details about your leave request..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setRequestOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={requestSubmitting}
              sx={{
                background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: 2,
                px: 3
              }}
            >
              {requestSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* REVIEW LEAVE REQUEST DIALOG */}
      <Dialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, width: '100%', maxWidth: 500 } }}
      >
        <DialogTitle sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>Review Leave Application</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {selectedLeave && (
            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'action.selected', border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Employee Details
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                {selectedLeave.userId?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Role: {selectedLeave.userId?.role === 'SUPER_TEACHER' ? 'Academic Management' : selectedLeave.userId?.role?.replace('_', ' ')}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Request Details
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                Type: {formatLeaveTypeName(selectedLeave.leaveType)}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Duration: {calculateDays(selectedLeave.startDate, selectedLeave.endDate)} days
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Dates: {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Reason
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                "{selectedLeave.reason}"
              </Typography>
            </Box>
          )}

          <TextField
            label="Decision Remarks / Comments"
            value={adminRemarks}
            onChange={(e) => setAdminRemarks(e.target.value)}
            multiline
            rows={3}
            fullWidth
            required
            placeholder="Add comments explaining approval or rejection..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setReviewOpen(false)} sx={{ fontWeight: 700 }}>Close</Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<RejectIcon />}
            disabled={statusSubmitting}
            onClick={() => handleStatusUpdate('REJECTED')}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Reject Request
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<ApproveIcon />}
            disabled={statusSubmitting}
            onClick={() => handleStatusUpdate('APPROVED')}
            sx={{
              bgcolor: theme.palette.success.main,
              color: '#FFFFFF',
              fontWeight: 700,
              borderRadius: 2,
              '&:hover': {
                bgcolor: theme.palette.success.dark
              }
            }}
          >
            Approve Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LeaveManagement;
