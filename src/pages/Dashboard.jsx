import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client';
import {
  Box, Grid, Card, CardContent, Typography, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, Button, useTheme, LinearProgress, Chip,
  Tabs, Tab, TextField, TablePagination, Stack, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip
} from '@mui/material';
import {
  Users, GraduationCap, UserCheck, Calendar, Wallet, TrendingUp, AlertTriangle,
  BookOpen, Clock, FileCheck, UserPlus, Sparkles, CheckCircle2,
  FileText, CreditCard, MessageSquare, Zap, Activity
} from 'lucide-react';
import AmAreaChart from '../components/charts/AmAreaChart';
import AmDonutChart from '../components/charts/AmDonutChart';
import {
  GET_SUPER_ADMIN_DASHBOARD, GET_SCHOOL_ADMIN_DASHBOARD, GET_AUDIT_LOGS, GET_PENDING_JOBS,
  GET_EVENTS, GET_CLASSES, GET_SECTIONS, GET_GRADE_DISTRIBUTION, GET_COPY_SUBMISSION_ANALYTICS,
  GET_INVENTORY_LIST, GET_COMPLAINTS, RESOLVE_COMPLAINT, DELETE_COMPLAINT
} from '../graphql/operations';
import CustomDatePicker from '../components/CustomDatePicker';
import { showToast } from '../store/slices/uiSlice';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 22 }
  }
};

/* Isolated Academic Grade Distribution Block */
const AcademicGradeDistributionBlock = React.memo(({ classesData, cardStyle, isSuperAdmin }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [gradeClassId, setGradeClassId] = useState('');
  const [gradeSectionId, setGradeSectionId] = useState('');
  const [persistentGradeData, setPersistentGradeData] = useState([]);

  const [getGradeSections, { data: gradeSectionsData }] = useLazyQuery(GET_SECTIONS);

  React.useEffect(() => {
    if (gradeClassId) {
      getGradeSections({ variables: { classId: gradeClassId } });
    }
    setGradeSectionId('');
  }, [gradeClassId]);

  const { loading: gradeLoading, data: gradeData } = useQuery(GET_GRADE_DISTRIBUTION, {
    skip: isSuperAdmin,
    variables: {
      classId: gradeClassId || undefined,
      sectionId: gradeSectionId || undefined
    },
    fetchPolicy: 'network-only'
  });

  React.useEffect(() => {
    if (gradeData?.getGradeDistribution) {
      setPersistentGradeData(gradeData.getGradeDistribution);
    }
  }, [gradeData]);

  const gradeDistributionData = (persistentGradeData || []).map(g => ({
    name: g.grade,
    count: g.count
  }));

  return (
    <Card sx={{ ...cardStyle, p: 3, height: 420, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)', color: '#3B82F6', display: 'flex' }}>
            <TrendingUp size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: theme.palette.text.primary }}>
              Academic Grade Distribution
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Overall student performance line telemetry across subjects
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            select
            size="small"
            label="Class"
            value={gradeClassId}
            onChange={(e) => setGradeClassId(e.target.value)}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="">All</MenuItem>
            {classesData?.getClasses?.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Section"
            value={gradeSectionId}
            disabled={!gradeClassId}
            onChange={(e) => setGradeSectionId(e.target.value)}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="">All</MenuItem>
            {gradeSectionsData?.getSections?.map((sec) => (
              <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      <Box sx={{ width: '100%', height: 280, flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {gradeLoading && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: isDark ? 'rgba(17, 24, 38, 0.65)' : 'rgba(255, 255, 255, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, backdropFilter: 'blur(4px)', borderRadius: 2 }}>
            <CircularProgress size={36} color="primary" />
          </Box>
        )}
        {gradeDistributionData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              No grading data logged for the selected filters.
            </Typography>
          </Box>
        ) : (
          <AmAreaChart
            categories={gradeDistributionData.map(g => g.name)}
            series={[{ name: 'Students', data: gradeDistributionData.map(g => g.count), color: '#3B82F6', fillOpacity: 0.25 }]}
            height={280}
            valueSuffix=" Students"
          />
        )}
      </Box>
    </Card>
  );
});

/* Isolated Fair Copy Completion Block */
const FairCopyCompletionBlock = React.memo(({ classesData, cardStyle, isSuperAdmin }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [copyClassId, setCopyClassId] = useState('');
  const [copySectionId, setCopySectionId] = useState('');
  const [persistentCopyData, setPersistentCopyData] = useState([]);

  const [getCopySections, { data: copySectionsData }] = useLazyQuery(GET_SECTIONS);

  React.useEffect(() => {
    if (copyClassId) {
      getCopySections({ variables: { classId: copyClassId } });
    }
    setCopySectionId('');
  }, [copyClassId]);

  const { loading: copyLoading, data: copyData } = useQuery(GET_COPY_SUBMISSION_ANALYTICS, {
    skip: isSuperAdmin,
    variables: {
      classId: copyClassId || undefined,
      sectionId: copySectionId || undefined
    },
    fetchPolicy: 'network-only'
  });

  React.useEffect(() => {
    if (copyData?.getCopySubmissionAnalytics) {
      setPersistentCopyData(copyData.getCopySubmissionAnalytics);
    }
  }, [copyData]);

  return (
    <Card sx={{ ...cardStyle, p: 3, height: 420, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(217, 70, 239, 0.12)' : 'rgba(217, 70, 239, 0.08)', color: '#D946EF', display: 'flex' }}>
            <FileCheck size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: theme.palette.text.primary }}>
              Fair Copy Completion Rates (%)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Class notebook inspection & submission telemetry line
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            select
            size="small"
            label="Class"
            value={copyClassId}
            onChange={(e) => setCopyClassId(e.target.value)}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="">All</MenuItem>
            {classesData?.getClasses?.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Section"
            value={copySectionId}
            disabled={!copyClassId}
            onChange={(e) => setCopySectionId(e.target.value)}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="">All</MenuItem>
            {copySectionsData?.getSections?.map((sec) => (
              <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      <Box sx={{ width: '100%', height: 280, flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {copyLoading && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: isDark ? 'rgba(17, 24, 38, 0.65)' : 'rgba(255, 255, 255, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, backdropFilter: 'blur(4px)', borderRadius: 2 }}>
            <CircularProgress size={36} color="secondary" />
          </Box>
        )}
        {(!persistentCopyData || persistentCopyData.length === 0) ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              No copy submission records found for selected filters.
            </Typography>
          </Box>
        ) : (
          <AmAreaChart
            categories={persistentCopyData.map(item => `${item.subjectName} (${item.className})`)}
            series={[{ name: 'Completion Rate', data: persistentCopyData.map(item => item.completionRate), color: '#D946EF', fillOpacity: 0.25 }]}
            height={280}
            valueSuffix="%"
          />
        )}
      </Box>
    </Card>
  );
});

/* Isolated Attendance Ratios Block */
const AttendanceRatiosBlock = React.memo(({ stats, cardStyle }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeAttendanceTab, setActiveAttendanceTab] = useState(0);

  const studentAttendanceData = [
    { name: 'Present', value: stats?.attendanceSummary?.presentPercent ?? 0.0, color: '#10B981' },
    { name: 'Late', value: stats?.attendanceSummary?.latePercent ?? 0.0, color: '#F59E0B' },
    { name: 'Absent', value: stats?.attendanceSummary?.absentPercent ?? 0.0, color: '#EF4444' },
  ];

  const teacherAttendanceData = [
    { name: 'Present', value: stats?.teacherAttendanceSummary?.presentPercent ?? 0.0, color: '#10B981' },
    { name: 'Late', value: stats?.teacherAttendanceSummary?.latePercent ?? 0.0, color: '#F59E0B' },
    { name: 'Absent', value: stats?.teacherAttendanceSummary?.absentPercent ?? 0.0, color: '#EF4444' },
  ];

  const staffAttendanceData = [
    { name: 'Present', value: stats?.staffAttendanceSummary?.presentPercent ?? 0.0, color: '#10B981' },
    { name: 'Late', value: stats?.staffAttendanceSummary?.latePercent ?? 0.0, color: '#F59E0B' },
    { name: 'Absent', value: stats?.staffAttendanceSummary?.absentPercent ?? 0.0, color: '#EF4444' },
  ];

  const getActiveAttendanceData = () => {
    switch (activeAttendanceTab) {
      case 0:
        return studentAttendanceData;
      case 1:
        return teacherAttendanceData;
      case 2:
        return staffAttendanceData;
      default:
        return studentAttendanceData;
    }
  };

  const currentAttendanceData = getActiveAttendanceData();

  return (
    <Card sx={{ ...cardStyle, p: 3, display: 'flex', flexDirection: 'column', height: 420 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', color: '#10B981', display: 'flex' }}>
            <UserCheck size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: theme.palette.text.primary }}>
              Attendance Ratios (Today)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Real-time check-in distribution
            </Typography>
          </Box>
        </Box>
        <Tabs
          value={activeAttendanceTab}
          onChange={(e, val) => setActiveAttendanceTab(val)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 'auto', '.MuiTab-root': { py: 0.5, px: 2, minHeight: 'auto', fontSize: '0.8rem', fontWeight: 700, borderRadius: 2 } }}
        >
          <Tab label="Students" />
          <Tab label="Teachers" />
          <Tab label="Staff" />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 250 }}>
        {currentAttendanceData.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 750, mb: 0.5 }}>
              No Attendance Logged Today
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Attendance records have not been submitted for this category.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <AmDonutChart
              data={currentAttendanceData.map(d => ({ name: d.name, value: d.value, color: d.color }))}
              innerRadius={72}
              height={250}
              centerLabel="Attendance"
              centerValue={`${((currentAttendanceData[0]?.value || 0) + (currentAttendanceData[1]?.value || 0)).toFixed(1)}%`}
              valueSuffix="%"
            />
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, flexWrap: 'wrap', mt: 1 }}>
        {currentAttendanceData.map((e, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: e.color }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              {e.name}: <span style={{ color: theme.palette.text.primary, fontWeight: 800 }}>{e.value.toFixed(1)}%</span>
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
});

/* Isolated Parent Complaints Block */
const ParentComplaintsBlock = React.memo(({ isSuperAdmin, userRole, cardStyle }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [openComplaintDialog, setOpenComplaintDialog] = useState(false);

  const { data: complaintsData, refetch: refetchComplaints } = useQuery(GET_COMPLAINTS, {
    skip: isSuperAdmin || !['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(userRole),
    fetchPolicy: 'network-only'
  });

  const [resolveComplaintMutation, { loading: resolvingComplaint }] = useMutation(RESOLVE_COMPLAINT, {
    onCompleted: () => {
      refetchComplaints();
      setOpenComplaintDialog(false);
      setFeedbackText('');
      dispatch(showToast({ message: 'Complaint resolved successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteComplaintMutation, { loading: deletingComplaint }] = useMutation(DELETE_COMPLAINT, {
    onCompleted: () => {
      refetchComplaints();
      dispatch(showToast({ message: 'Complaint deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const handleDeleteComplaint = (id) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      deleteComplaintMutation({ variables: { id } });
    }
  };

  if (isSuperAdmin || !['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(userRole)) {
    return null;
  }

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
        <Grid item xs={12} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)', color: '#EF4444', display: 'flex' }}>
                  <MessageSquare size={22} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: theme.palette.text.primary }}>
                    Parent Complaints & Resolutions Portal
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Parental grievances needing review, administrative feedback, and resolution.
                  </Typography>
                </Box>
              </Box>
            </Box>

            {(!complaintsData?.getComplaints || complaintsData.getComplaints.length === 0) ? (
              <Box sx={{ py: 6, textAlign: 'center', border: `1px dashed ${theme.palette.divider}`, borderRadius: 3 }}>
                <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
                  No complaints registered by parents. All clear! 🎉
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}>
                <Table>
                  <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Parent</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Student</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Title & Description</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {complaintsData.getComplaints.map((c) => {
                      const isResolved = c.complaintStatus === 'RESOLVED';
                      return (
                        <TableRow key={c.id} hover>
                          <TableCell sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary }}>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                              {c.parentId ? `${c.parentId.firstName} ${c.parentId.lastName}` : 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {c.parentId?.phone}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: theme.palette.text.primary }}>
                            {c.studentId ? `${c.studentId.firstName} ${c.studentId.lastName}` : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip label={c.category} size="small" variant="outlined" sx={{ borderColor: theme.palette.divider, color: theme.palette.text.secondary, fontWeight: 600 }} />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 320 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>{c.title}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                              {c.description}
                            </Typography>
                            {c.feedback && (
                              <Box sx={{ mt: 1, p: 1.2, bgcolor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)', borderRadius: 2, borderLeft: '3px solid #10B981' }}>
                                <Typography variant="caption" color="#10B981" sx={{ fontWeight: 800, display: 'block' }}>Resolution Reply:</Typography>
                                <Typography variant="caption" color={theme.palette.text.primary}>{c.feedback}</Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={c.complaintStatus}
                              size="small"
                              color={isResolved ? 'success' : 'warning'}
                              sx={{ fontWeight: 800, borderRadius: 1.5 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                              {!isResolved && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => {
                                    setSelectedComplaint(c);
                                    setFeedbackText('');
                                    setOpenComplaintDialog(true);
                                  }}
                                  sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 2 }}
                                >
                                  Resolve
                                </Button>
                              )}
                              <Tooltip title="Delete Complaint">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteComplaint(c.id)}
                                  disabled={deletingComplaint}
                                >
                                  <AlertTriangle size={18} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Response Modal Dialog */}
      <Dialog open={openComplaintDialog} onClose={() => setOpenComplaintDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: theme.palette.text.primary }}>Respond to Parent Complaint</DialogTitle>
        <DialogContent>
          {selectedComplaint && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>
                Category: {selectedComplaint.category}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 1, color: theme.palette.text.primary }}>
                {selectedComplaint.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, p: 2, bgcolor: theme.palette.action.hover, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                {selectedComplaint.description}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Admin Feedback / Resolution Reply"
                type="text"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                sx={{ mt: 3 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenComplaintDialog(false)} variant="outlined">Cancel</Button>
          <Button
            onClick={() => {
              if (selectedComplaint) {
                resolveComplaintMutation({
                  variables: {
                    id: selectedComplaint.id,
                    feedback: feedbackText
                  }
                });
              }
            }}
            variant="contained"
            disabled={resolvingComplaint || !feedbackText.trim()}
          >
            {resolvingComplaint ? 'Resolving...' : 'Submit Resolution'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  /* Theme-aware 2026 Enterprise Glassmorphic / Clean Card Styling */
  const cardStyle = {
    borderRadius: '20px',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
    background: isDark ? '#161E2E' : '#FFFFFF',
    boxShadow: isDark
      ? '0 10px 30px 0 rgba(0, 0, 0, 0.25)'
      : '0 4px 20px 0 rgba(99, 102, 241, 0.05)',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: isDark
        ? '0 20px 40px -10px rgba(0, 0, 0, 0.45)'
        : '0 12px 28px 0 rgba(99, 102, 241, 0.12)',
      borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#3B82F6'
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [page, setPage] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const dispatch = useDispatch();

  // Queries
  const { loading: saLoading, error: saError, data: saData } = useQuery(GET_SUPER_ADMIN_DASHBOARD, {
    skip: !isSuperAdmin
  });

  const { loading: schoolLoading, error: schoolError, data: schoolData } = useQuery(GET_SCHOOL_ADMIN_DASHBOARD, {
    skip: isSuperAdmin,
    variables: {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    },
    fetchPolicy: 'network-only'
  });

  const { loading: inventoryLoading, data: inventoryData } = useQuery(GET_INVENTORY_LIST, {
    skip: isSuperAdmin,
    fetchPolicy: 'network-only'
  });

  React.useEffect(() => {
    if (schoolData?.getSchoolAdminDashboard) {
      setDashboardData(schoolData.getSchoolAdminDashboard);
    }
  }, [schoolData]);

  const { data: jobsData } = useQuery(GET_PENDING_JOBS, {
    skip: isSuperAdmin || !['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role)
  });

  const { loading: eventsLoading, data: eventsData } = useQuery(GET_EVENTS, {
    skip: isSuperAdmin,
    fetchPolicy: 'network-only'
  });

  const { loading: logsLoading, data: logsData } = useQuery(GET_AUDIT_LOGS, {
    skip: !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user?.role)
  });

  const { data: classesData } = useQuery(GET_CLASSES, {
    skip: isSuperAdmin
  });

  if ((saLoading && !saData) || (schoolLoading && !dashboardData && !schoolData)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} color="primary" />
      </Box>
    );
  }

  if (saError || schoolError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {saError?.message || schoolError?.message}
      </Alert>
    );
  }

  // --- RENDERING SUPER ADMIN PORTAL ---
  if (isSuperAdmin) {
    const stats = saData?.getSuperAdminDashboard;
    const cards = [
      { title: 'Total Schools Onboarded', value: stats?.totalSchools ?? 0, trend: '+4 this month', icon: <Users size={24} />, gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', path: '/schools' },
      { title: 'Total Students Globally', value: (stats?.totalStudents ?? 0).toLocaleString(), trend: '↑ 14% growth', icon: <GraduationCap size={24} />, gradient: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)' },
      { title: 'Total Active Teachers', value: (stats?.totalTeachers ?? 0).toLocaleString(), trend: 'Active faculty', icon: <UserCheck size={24} />, gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)' },
      { title: 'Monthly Revenue', value: `₹${(stats?.monthlyRevenue ?? 0).toLocaleString()}`, trend: '+18.4% MRR', icon: <Wallet size={24} />, gradient: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)' },
    ];

    return (
      <Box sx={{ pb: 6 }}>
        {/* Welcome Hero Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 4,
            background: isDark
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.14) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(22, 30, 46, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.04) 50%, #FFFFFF 100%)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Chip icon={<Zap size={14} color="#3B82F6" />} label="Super Admin Central Control" size="small" sx={{ bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', fontWeight: 800, fontSize: '0.72rem' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: theme.palette.text.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
                Global Multi-Tenant SaaS Command Center
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 650 }}>
                Real-time tenant performance metrics, worldwide student telemetry, and SaaS revenue analytics.
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Enterprise KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          {cards.map((card, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx} component={motion.div} variants={itemVariants}>
              <Card
                component={motion.div}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => card.path && navigate(card.path)}
                sx={{
                  ...cardStyle,
                  cursor: card.path ? 'pointer' : 'default',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem' }}>
                      {card.title}
                    </Typography>
                    <Box sx={{ p: 1.2, borderRadius: 2.5, background: card.gradient, color: '#fff', display: 'flex' }}>
                      {card.icon}
                    </Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em', color: theme.palette.text.primary }}>
                    {card.value}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={card.trend} size="small" sx={{ bgcolor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.1)', color: '#10B981', fontWeight: 800, fontSize: '0.7rem', height: 22 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Global Revenue Graph & Subscriptions breakdown */}
        <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <Grid item xs={12} md={8} component={motion.div} variants={itemVariants}>
            <Card sx={{ ...cardStyle, p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                    SaaS Monthly Subscription Revenue (MRR)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Recurring ARR/MRR income stream breakdown across onboarded schools
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ width: '100%' }}>
                <AmAreaChart
                  categories={(stats?.monthlyRevenueSeries || []).map(x => x.month)}
                  series={[{
                    name: 'Revenue',
                    data: (stats?.monthlyRevenueSeries || []).map(x => x.revenue),
                    color: '#3B82F6'
                  }]}
                  height={300}
                  valuePrefix="₹"
                />
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
            <Card sx={{ ...cardStyle, height: '100%', p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary, mb: 3 }}>
                Tenancy Subscription Health
              </Typography>
              <Box sx={{ mb: 3.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Active Tenancies</Typography>
                  <Typography variant="body2" color="#3B82F6" sx={{ fontWeight: 800 }}>{stats?.activeSchools}</Typography>
                </Box>
                <LinearProgress variant="determinate" value={((stats?.activeSchools || 1) / (stats?.totalSchools || 1)) * 100} sx={{ height: 8, borderRadius: 4, bgcolor: theme.palette.divider }} />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Expired / Inactive</Typography>
                  <Typography variant="body2" color="#EF4444" sx={{ fontWeight: 800 }}>{stats?.expiredSubscriptions}</Typography>
                </Box>
                <LinearProgress variant="determinate" value={((stats?.expiredSubscriptions || 0) / (stats?.totalSchools || 1)) * 100} color="error" sx={{ height: 8, borderRadius: 4, bgcolor: theme.palette.divider }} />
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Global Security Audit Logs */}
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: theme.palette.text.primary }}>
          Security Telemetry & Audit Logs
        </Typography>
        <Paper sx={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 4, overflow: 'hidden' }}>
          <TableContainer>
            <Table sx={{ minWidth: 760 }}>
              <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
                <TableRow>
                  <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>Audit User</TableCell>
                  <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>Event Action</TableCell>
                  <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>Details</TableCell>
                  <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(logsData?.getGlobalAuditLogs || [])
                  .slice(page * 10, (page + 1) * 10)
                  .map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#3B82F6' }}>
                            {log.userId?.name?.charAt(0) || 'A'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>{log.userId?.name || 'System / Suspended User'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={log.action} color={log.action.includes('FAIL') ? 'error' : 'secondary'} sx={{ fontWeight: 800, borderRadius: 1.5 }} />
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary }}>{log.details}</TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary }}>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          {logsData?.getGlobalAuditLogs?.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10]}
              component="div"
              count={logsData.getGlobalAuditLogs.length}
              rowsPerPage={10}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              sx={{ color: theme.palette.text.secondary }}
            />
          )}
        </Paper>
      </Box>
    );
  }

  // --- RENDERING TENANT SCHOOL ADMIN PORTAL ---
  const stats = dashboardData || schoolData?.getSchoolAdminDashboard;

  // Enterprise Linear/Vercel Style KPI Cards
  const cards = [
    { title: 'Total Enrolled Students', value: stats?.studentCount, trend: '+12 this month', icon: <Users size={22} />, color: '#3B82F6', path: '/students' },
    { title: 'Academic Faculty', value: stats?.teacherCount, trend: 'Active teachers', icon: <GraduationCap size={22} />, color: '#6366F1', path: '/teachers' },
    { title: 'Operational Staff', value: stats?.staffCount, trend: 'Support staff', icon: <UserCheck size={22} />, color: '#10B981', path: '/teachers?tab=staff' },
    { title: 'Upcoming Exams', value: stats?.upcomingExamsCount, trend: 'Scheduled tests', icon: <Calendar size={22} />, color: '#F59E0B', path: '/exams' },
  ];

  // Financial Summary Cards
  const financialCards = [
    { title: 'Total Fee Collected', value: `₹${(stats?.schoolIncome ?? 0).toLocaleString()}`, icon: <Wallet size={20} />, color: '#10B981', badge: 'Collected' },
    { title: 'Outstanding Dues', value: `₹${(stats?.pendingFees ?? 0).toLocaleString()}`, icon: <AlertTriangle size={20} />, color: '#EF4444', badge: 'Pending' },
    { title: 'Salary Expenses', value: `₹${(stats?.salaryExpenses ?? 0).toLocaleString()}`, icon: <TrendingUp size={20} />, color: '#F59E0B', badge: 'Payroll' },
    { title: 'Net School Income', value: `₹${((stats?.schoolIncome ?? 0) - (stats?.salaryExpenses ?? 0)).toLocaleString()}`, icon: <Zap size={20} />, color: '#3B82F6', badge: 'Net Margin' },
  ];

  // Class Enrollment Data
  const classEnrollmentData = stats?.classEnrollmentSummary?.map(c => ({
    name: c.className,
    students: c.studentCount
  })) || [];

  // Action Shortcuts Toolbar
  const quickActions = [
    { label: 'Add Student', icon: <UserPlus size={16} />, path: '/students?tab=form', color: '#3B82F6' },
    { label: 'Collect Fees', icon: <CreditCard size={16} />, path: '/fees', color: '#10B981' },
    { label: 'Take Attendance', icon: <CheckCircle2 size={16} />, path: '/attendance', color: '#6366F1' },
    { label: 'Add Teacher', icon: <GraduationCap size={16} />, path: '/teachers?tab=register', color: '#8B5CF6' },
    { label: 'Homework Board', icon: <FileText size={16} />, path: '/academics', color: '#EC4899' },
    { label: 'Schedule Exam', icon: <Calendar size={16} />, path: '/exams', color: '#F59E0B' },
  ];

  return (
    <Box sx={{ pb: 6 }}>
      {/* 2026 Enterprise Hero Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: 4,
          background: isDark
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.14) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(22, 30, 46, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.04) 50%, #FFFFFF 100%)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<Sparkles size={14} color="#3B82F6" />}
                label="Enterprise School Operating System"
                size="small"
                sx={{ bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', fontWeight: 800, fontSize: '0.72rem' }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 900, color: theme.palette.text.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
              Good Morning 👋 {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'School Administrator'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 680 }}>
              Here is your daily operational telemetry, financial stats, attendance ratios, and upcoming academic events.
            </Typography>

            {/* Micro Stats Pills */}
            <Stack direction="row" spacing={1.5} sx={{ mt: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Chip label={`Students Enrolled: ${stats?.studentCount || 0}`} size="small" sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)', color: theme.palette.text.primary, fontWeight: 700 }} />
              <Chip label={`Teacher Attendance: ${(stats?.teacherAttendanceRate ?? 0).toFixed(1)}%`} size="small" sx={{ bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontWeight: 800 }} />
              <Chip label={`Pending Dues: ₹${(stats?.pendingFees ?? 0).toLocaleString()}`} size="small" sx={{ bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontWeight: 800 }} />
            </Stack>
          </Box>

          {/* Date Picker Controls */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', bgcolor: isDark ? 'rgba(17, 24, 38, 0.6)' : 'rgba(255, 255, 255, 0.8)', p: 1.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
            <CustomDatePicker
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={{ width: 160 }}
            />
            <CustomDatePicker
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{ width: 160 }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Quick Actions Bar */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', mb: 1.5 }}>
          Quick Action Shortcuts
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action, idx) => (
            <Grid item xs={6} sm={4} md={2} key={idx}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate(action.path)}
                startIcon={action.icon}
                sx={{
                  py: 1.2,
                  px: 1.5,
                  borderRadius: 3,
                  borderColor: theme.palette.divider,
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: action.color,
                    background: `${action.color}12`,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Linear / Vercel Style Enterprise KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx} component={motion.div} variants={itemVariants}>
            <Card
              component={motion.div}
              whileHover={{ y: -5, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => card.path && navigate(card.path)}
              sx={{
                ...cardStyle,
                cursor: card.path ? 'pointer' : 'default',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  borderColor: `${card.color}80`
                }
              }}
            >
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem' }}>
                    {card.title}
                  </Typography>
                  <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: `${card.color}15`, color: card.color, display: 'flex' }}>
                    {card.icon}
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em', color: theme.palette.text.primary }}>
                  {card.value ?? 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={card.trend} size="small" sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)', color: theme.palette.text.secondary, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Financial Insights Dashboard */}
      {!isSuperAdmin && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: theme.palette.text.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Wallet size={20} color="#3B82F6" /> Financial Insights Telemetry
          </Typography>
          <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
            {financialCards.map((fin, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx} component={motion.div} variants={itemVariants}>
                <Card sx={{ ...cardStyle, p: 2.5, borderLeft: `4px solid ${fin.color}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {fin.title}
                    </Typography>
                    <Box sx={{ color: fin.color, display: 'flex' }}>
                      {fin.icon}
                    </Box>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: theme.palette.text.primary, mb: 1 }}>
                    {fin.value}
                  </Typography>
                  <Chip label={fin.badge} size="small" sx={{ bgcolor: `${fin.color}15`, color: fin.color, fontWeight: 800, fontSize: '0.68rem', height: 20 }} />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* School Administration & Operations Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
        {/* Library Checkouts Widget */}
        <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, height: '100%', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)', color: '#3B82F6', display: 'flex' }}>
                <BookOpen size={22} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                  Library Checkouts
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total catalog books vs active loans
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Total Books: {stats?.libraryStats?.totalBooks || 0}</Typography>
              <Typography variant="body2" color="#3B82F6" sx={{ fontWeight: 700 }}>Issued: {stats?.libraryStats?.totalIssuedBooks || 0}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">Available Copies</Typography>
              <Typography variant="body2" color="#10B981" sx={{ fontWeight: 800 }}>
                {stats?.libraryStats ? (stats.libraryStats.totalBooks - stats.libraryStats.totalIssuedBooks) : 0}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats?.libraryStats?.totalBooks > 0 ? ((stats.libraryStats.totalBooks - stats.libraryStats.totalIssuedBooks) / stats.libraryStats.totalBooks) * 100 : 100}
              sx={{ height: 8, borderRadius: 4, bgcolor: theme.palette.divider, '& .MuiLinearProgress-bar': { bgcolor: '#10B981' } }}
            />
          </Card>
        </Grid>

        {/* Leave Requests Widget */}
        <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, height: '100%', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', color: '#F59E0B', display: 'flex' }}>
                <Clock size={22} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                  Faculty Leaves Queue
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Approval status overview
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1.5} justifyContent="space-between" sx={{ mt: 1 }}>
              <Box sx={{ textAlign: 'center', flexGrow: 1, p: 1.5, borderRadius: 2.5, bgcolor: theme.palette.action.hover, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h5" color="#F59E0B" sx={{ fontWeight: 900 }}>
                  {stats?.leaveStats?.pendingCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Pending</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flexGrow: 1, p: 1.5, borderRadius: 2.5, bgcolor: theme.palette.action.hover, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h5" color="#10B981" sx={{ fontWeight: 900 }}>
                  {stats?.leaveStats?.approvedCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Approved</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flexGrow: 1, p: 1.5, borderRadius: 2.5, bgcolor: theme.palette.action.hover, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h5" color="#EF4444" sx={{ fontWeight: 900 }}>
                  {stats?.leaveStats?.rejectedCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Rejected</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Homework Board Analytics Card */}
        <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, height: '100%', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(217, 70, 239, 0.12)' : 'rgba(217, 70, 239, 0.08)', color: '#D946EF', display: 'flex' }}>
                <FileText size={22} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                  Homework Board
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Assignments and submission tracking
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Assigned: {stats?.homeworkStats?.totalHomework || 0}</Typography>
              <Typography variant="body2" color="#D946EF" sx={{ fontWeight: 700 }}>Submissions: {stats?.homeworkStats?.totalSubmissions || 0}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">Completion Rate</Typography>
              <Typography variant="body2" color="#D946EF" sx={{ fontWeight: 800 }}>
                {stats?.homeworkStats?.totalHomework > 0 ? Math.round((stats.homeworkStats.totalSubmissions / (stats.homeworkStats.totalHomework * 20)) * 100) : 0}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats?.homeworkStats?.totalHomework > 0 ? Math.min(100, Math.round((stats.homeworkStats.totalSubmissions / (stats.homeworkStats.totalHomework * 20)) * 100)) : 0}
              sx={{ height: 8, borderRadius: 4, bgcolor: theme.palette.divider, '& .MuiLinearProgress-bar': { bgcolor: '#D946EF' } }}
            />
          </Card>
        </Grid>
      </Grid>

      {/* Demographics & Performance Analytics */}
      {!isSuperAdmin && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: theme.palette.text.primary }}>
            Demographics & Performance Analytics
          </Typography>
          <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
            {/* Student Gender Strength */}
            <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
              <Card sx={{ ...cardStyle, p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: theme.palette.text.primary }}>
                  Student Gender Distribution
                </Typography>
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <AmDonutChart
                    data={[
                      { name: 'Boys', value: stats?.totalBoys ?? 0, color: '#3B82F6' },
                      { name: 'Girls', value: stats?.totalGirls ?? 0, color: '#EC4899' }
                    ]}
                    innerRadius={0}
                    height={220}
                    showLegend={true}
                    valueSuffix=""
                  />
                </Box>
              </Card>
            </Grid>

            {/* Section-wise Strength */}
            <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
              <Card sx={{ ...cardStyle, p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: theme.palette.text.primary }}>
                  Section-wise Student Strength
                </Typography>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 220 }}>
                  {(!stats?.sectionStrength || stats.sectionStrength.length === 0) ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                      No section strength records found.
                    </Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Class & Section</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.sectionStrength.map((ss, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>{`${ss.className} - ${ss.sectionName}`}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: '#3B82F6' }}>{ss.strength}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Box>
              </Card>
            </Grid>

            {/* Teacher Performance */}
            <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
              <Card sx={{ ...cardStyle, p: 3, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: theme.palette.text.primary }}>
                  Teacher & Academic Performance
                </Typography>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Teacher Attendance %</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#10B981' }}>{(stats?.teacherAttendanceRate ?? 0.0).toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={stats?.teacherAttendanceRate ?? 0} sx={{ height: 6, borderRadius: 3, bgcolor: theme.palette.divider, '& .MuiLinearProgress-bar': { bgcolor: '#10B981' } }} />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Homework Completion Rate</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#D946EF' }}>{(stats?.homeworkCompletionRate ?? 0.0).toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={stats?.homeworkCompletionRate ?? 0} sx={{ height: 6, borderRadius: 3, bgcolor: theme.palette.divider, '& .MuiLinearProgress-bar': { bgcolor: '#D946EF' } }} />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Average Student Marks %</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#3B82F6' }}>{(stats?.studentPerformanceAvg ?? 0.0).toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={stats?.studentPerformanceAvg ?? 0} sx={{ height: 6, borderRadius: 3, bgcolor: theme.palette.divider, '& .MuiLinearProgress-bar': { bgcolor: '#3B82F6' } }} />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Analytics charts for Fee Collection & Attendance Ratios */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
        {/* Fees Collection Line/Area chart */}
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, p: 3, display: 'flex', flexDirection: 'column', height: 420 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: theme.palette.text.primary }}>
              Fee Collection Status
            </Typography>
            <Box sx={{ flexGrow: 1, width: '100%' }}>
              <AmAreaChart
                categories={['Collected', 'Outstanding']}
                series={[{
                  name: 'Amount',
                  data: [stats?.feeCollectionSummary?.totalCollected || 0, stats?.feeCollectionSummary?.totalOutstanding || 0],
                  color: '#10B981',
                  fillOpacity: 0.25
                }]}
                height={280}
                valuePrefix="₹"
              />
            </Box>
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>
                Total Expected Dues: <span style={{ color: theme.palette.text.primary }}>₹{(stats?.feeCollectionSummary?.totalExpected ?? 0).toLocaleString()}</span>
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Attendance Pie Chart with Tabs */}
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <AttendanceRatiosBlock stats={stats} cardStyle={cardStyle} />
        </Grid>
      </Grid>

      {/* Absent / On-Leave Faculty Row & School Inventory Analytics */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, p: 3, height: 380, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, color: theme.palette.text.primary }}>
              <AlertTriangle color="#F59E0B" size={20} /> Absent / On-Leave Faculty
            </Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {!stats?.isTeacherAttendanceTaken ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>
                    📋 Attendance for teachers is yet to be taken today.
                  </Typography>
                </Box>
              ) : stats?.teacherCount === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>
                    No teachers registered in this school yet.
                  </Typography>
                </Box>
              ) : (!stats?.absentTeachers || stats.absentTeachers.length === 0) ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: '#10B981', fontWeight: 700 }}>
                    🎉 All faculty members are present today!
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 270, background: 'transparent' }}>
                  <Table stickyHeader size="small">
                    <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Teacher Name</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.absentTeachers.map((teacher) => (
                        <TableRow key={teacher.id} hover>
                          <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                            {`Prof. ${teacher.firstName} ${teacher.lastName}`}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={teacher.status === 'LEAVE' ? 'ON LEAVE' : 'ABSENT'}
                              color={teacher.status === 'LEAVE' ? 'info' : 'error'}
                              sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
                            {teacher.remarks || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Card>
        </Grid>

        {/* School Inventory Analytics Line Chart */}
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, p: 3, height: 380, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, color: theme.palette.text.primary }}>
              <Sparkles color="#3B82F6" size={20} /> School Inventory Asset Telemetry
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              {(() => {
                const inventoryItems = inventoryData?.getInventoryList || [];
                const categoryLabels = {
                  STATIONERY: 'Stationery',
                  FURNITURE: 'Furniture',
                  LAB_EQUIPMENT: 'Lab Equipment',
                  SPORTS: 'Sports & Gym',
                  CLASSROOM: 'Classroom Supplies',
                  COMPUTERS: 'Computers & IT',
                  OTHER: 'Other Assets'
                };
                const inventoryByCategory = {};
                inventoryItems.forEach(item => {
                  const cat = item.category || 'OTHER';
                  if (!inventoryByCategory[cat]) {
                    inventoryByCategory[cat] = 0;
                  }
                  inventoryByCategory[cat] += item.quantity;
                });
                const inventoryChartData = Object.keys(inventoryByCategory).map(cat => ({
                  category: categoryLabels[cat] || cat,
                  quantity: inventoryByCategory[cat]
                }));

                if (inventoryLoading) {
                  return <CircularProgress size={32} color="primary" />;
                }

                if (inventoryItems.length === 0) {
                  return (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
                        No inventory records found in database.
                      </Typography>
                    </Box>
                  );
                }

                return (
                  <AmAreaChart
                    categories={inventoryChartData.map(d => d.category)}
                    series={[{ name: 'Asset Stock', data: inventoryChartData.map(d => d.quantity), color: '#10B981', fillOpacity: 0.25 }]}
                    height={270}
                    valueSuffix=" units"
                  />
                );
              })()}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Live Class Activity & Lecture Tracker */}
      {['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: theme.palette.text.primary, letterSpacing: '-0.01em' }}>
            Live Class Activity & Lecture Telemetry
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
            {/* Activity Chart breakdown */}
            <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
              <Card sx={{ ...cardStyle, p: 3, height: 420, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: theme.palette.text.primary }}>
                  Activity Type Breakdown
                </Typography>

                {(() => {
                  const jobsList = jobsData?.getPendingJobs || [];
                  const studyCount = jobsList.filter(j => j.jobType === 'Study').length;
                  const othersCount = jobsList.filter(j => j.jobType === 'Others').length;
                  const runningCount = jobsList.filter(j => j.status === 'Running').length;

                  if (jobsList.length === 0) {
                    return (
                      <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                        <Typography color="text.secondary" variant="body2">No active sessions logged today.</Typography>
                      </Box>
                    );
                  }

                  return (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Box sx={{ height: 210, position: 'relative' }}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                          <AmDonutChart
                            data={[
                              { name: 'Lectures / Study', value: studyCount, color: '#3B82F6' },
                              { name: 'Other Activities', value: othersCount, color: '#F59E0B' }
                            ]}
                            innerRadius={70}
                            height={200}
                            centerLabel="Total Active"
                            centerValue={`${studyCount + othersCount}`}
                            valueSuffix=""
                          />
                        </Box>
                      </Box>

                      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#3B82F6' }}>{studyCount}</Typography>
                          <Typography variant="caption" color="text.secondary">Study / Lectures</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#F59E0B' }}>{othersCount}</Typography>
                          <Typography variant="caption" color="text.secondary">Others</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#10B981' }}>{runningCount}</Typography>
                          <Typography variant="caption" color="text.secondary">Live Now</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })()}
              </Card>
            </Grid>

            {/* Subject Line Tracker Graph */}
            <Grid item xs={12} md={8} component={motion.div} variants={itemVariants}>
              <Card sx={{ ...cardStyle, p: 3, height: 420, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: theme.palette.text.primary }}>
                  Subject & Activity Telemetry Line Graph
                </Typography>

                {(() => {
                  const jobsList = jobsData?.getPendingJobs || [];
                  if (jobsList.length === 0) {
                    return (
                      <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                        <Typography color="text.secondary" variant="body2">No active sessions logged today.</Typography>
                      </Box>
                    );
                  }

                  const aggregatedMap = {};
                  jobsList.forEach(job => {
                    const name = job.jobType === 'Study'
                      ? job.subjectName
                      : (job.remarks ? (job.remarks.length > 20 ? job.remarks.substring(0, 17) + '...' : job.remarks) : 'Others');
                    if (!aggregatedMap[name]) {
                      aggregatedMap[name] = { name, Running: 0, Complete: 0, Total: 0 };
                    }
                    if (job.status === 'Running') {
                      aggregatedMap[name].Running += 1;
                    } else if (job.status === 'Complete') {
                      aggregatedMap[name].Complete += 1;
                    }
                    aggregatedMap[name].Total += 1;
                  });

                  const chartData = Object.values(aggregatedMap).sort((a, b) => b.Total - a.Total);

                  return (
                    <Box sx={{ flexGrow: 1, width: '100%', height: 320 }}>
                      <AmAreaChart
                        categories={chartData.map(c => c.name)}
                        series={[
                          { name: 'Running', data: chartData.map(c => c.Running), color: '#10B981', fillOpacity: 0.2 },
                          { name: 'Completed', data: chartData.map(c => c.Complete), color: '#3B82F6', fillOpacity: 0.2 }
                        ]}
                        height={280}
                      />
                    </Box>
                  );
                })()}
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Demographic & Performance Distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
        {/* Class-wise Student Enrollment Line Chart */}
        {classEnrollmentData.length > 0 && (
          <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
            <Card sx={{ ...cardStyle, p: 3, height: 420, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: theme.palette.text.primary }}>
                Class-wise Student Enrollment Telemetry
              </Typography>
              <Box sx={{ width: '100%', height: 280, flexGrow: 1 }}>
                <AmAreaChart
                  categories={classEnrollmentData.map(c => c.name)}
                  series={[{ name: 'Students', data: classEnrollmentData.map(c => c.students), color: '#6366F1', fillOpacity: 0.25 }]}
                  height={280}
                  valueSuffix=" Students"
                />
              </Box>
            </Card>
          </Grid>
        )}

        {/* Academic Grade Distribution */}
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <AcademicGradeDistributionBlock classesData={classesData} cardStyle={cardStyle} isSuperAdmin={isSuperAdmin} />
        </Grid>
      </Grid>

      {/* Fair Copy Completion Rates Row */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <FairCopyCompletionBlock classesData={classesData} cardStyle={cardStyle} isSuperAdmin={isSuperAdmin} />
        </Grid>

        {/* Upcoming Events Timeline */}
        <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
          <Card sx={{ ...cardStyle, p: 3, height: 420, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)', color: '#3B82F6', display: 'flex' }}>
                  <Calendar size={20} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary, fontSize: '1.05rem' }}>
                  Upcoming Events & Holidays
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/events')}
                sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700, fontSize: '0.78rem' }}
              >
                Manage Events
              </Button>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {eventsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={30} /></Box>
              ) : !eventsData?.getEvents || eventsData.getEvents.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', border: `1px dashed ${theme.palette.divider}`, borderRadius: 3 }}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
                    No upcoming events or holidays scheduled.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {eventsData.getEvents.slice(0, 4).map((evt) => {
                    const evtDate = new Date(evt.date);
                    const isHoliday = evt.type === 'HOLIDAY';
                    const accentColor = isHoliday ? '#D946EF' : '#3B82F6';
                    return (
                      <Paper
                        key={evt.id}
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: theme.palette.action.hover,
                          border: `1px solid ${theme.palette.divider}`,
                          borderLeft: `4px solid ${accentColor}`
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip label={evt.type} size="small" sx={{ bgcolor: `${accentColor}15`, color: accentColor, fontWeight: 800, fontSize: '0.68rem', height: 20 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {evtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.text.primary, mt: 1 }}>
                          {evt.title}
                        </Typography>
                        {evt.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {evt.description}
                          </Typography>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Parent Complaints & Resolutions Portal */}
      <ParentComplaintsBlock isSuperAdmin={isSuperAdmin} userRole={user?.role} cardStyle={cardStyle} />
    </Box>
  );
}

export default Dashboard;
