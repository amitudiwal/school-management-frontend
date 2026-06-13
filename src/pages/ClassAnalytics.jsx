import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  Box, Button, Card, CardContent, Grid, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, CircularProgress, Alert, IconButton, Tooltip,
  Stack, Chip, Divider, useTheme, Avatar, LinearProgress
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  People as GroupIcon,
  EmojiEvents as TrophyIcon,
  Assessment as AnalyticsIcon,
  CheckCircle as SuccessIcon,
  HelpOutline as HelpIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  GET_CLASSES, GET_SECTIONS, GET_EXAMS,
  GET_CLASS_PERFORMANCE_ANALYTICS
} from '../graphql/operations';
import { BACKEND_URL } from '../graphql/client';

function ClassAnalytics() {
  const theme = useTheme();
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [examId, setExamId] = useState('');

  // Dropdown Queries
  const { data: classesData } = useQuery(GET_CLASSES);
  const { data: examsData } = useQuery(GET_EXAMS);
  const { data: sectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: classId || undefined }
  });

  // Analytics Query
  const { loading: analyticsLoading, error: analyticsError, data: analyticsData } = useQuery(
    GET_CLASS_PERFORMANCE_ANALYTICS,
    {
      skip: !classId || !examId,
      variables: { classId, examId }
    }
  );

  const handleDownloadReportCard = (studentId) => {
    const token = localStorage.getItem('token');
    const downloadUrl = `${BACKEND_URL}/api/report-cards/student/${studentId}/exam/${examId}?token=${token}`;
    window.open(downloadUrl, '_blank');
  };

  const handleDownloadAllClassReportCards = () => {
    const token = localStorage.getItem('token');
    const downloadUrl = `${BACKEND_URL}/api/report-cards/class/${classId}/exam/${examId}?token=${token}`;
    window.open(downloadUrl, '_blank');
  };

  const analytics = analyticsData?.getClassPerformanceAnalytics;

  // Grade color map for distribution chart rendering
  const gradeColors = {
    'A+': '#10B981',
    'A': '#34D399',
    'B+': '#3B82F6',
    'B': '#60A5FA',
    'C+': '#F59E0B',
    'C': '#FBBF24',
    'D': '#A78BFA',
    'F': '#EF4444'
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 3, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
        Class Performance & Report Analytics
      </Typography>

      {/* Selectors Bar */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Select Exam Term"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
              >
                {examsData?.getExams.map((ex) => (
                  <MenuItem key={ex.id} value={ex.id}>{ex.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Select Class"
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSectionId('');
                }}
              >
                {classesData?.getClasses.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Select Section"
                value={sectionId}
                disabled={!classId}
                onChange={(e) => setSectionId(e.target.value)}
              >
                {sectionsData?.getSections.map((sec) => (
                  <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Selection prompt */}
      {!classId || !examId ? (
        <Alert severity="info" sx={{ borderRadius: 3, p: 2, fontSize: '1rem' }}>
          Please select both the **Exam Term** and the **Class** above to calculate and display class-wide grades, distributions, and report cards.
        </Alert>
      ) : analyticsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress size={50} thickness={4.5} />
        </Box>
      ) : analyticsError ? (
        <Alert severity="error" sx={{ borderRadius: 3 }}>{analyticsError.message}</Alert>
      ) : (
        <Box>
          {/* KPI Dashboard Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Card 1: Class Average */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 52, height: 52 }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>
                      Class Average Percentage
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {analytics?.classAverage?.toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 2: Total Students */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#10B98115', color: '#10B981', width: 52, height: 52 }}>
                    <GroupIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>
                      Total Assessed Students
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {analytics?.totalStudents} Students
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 3: Struggling Students */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: 3, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                border: analytics?.strugglingCount > 0 ? `1px solid ${theme.palette.error.light}` : 'none'
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: analytics?.strugglingCount > 0 ? `${theme.palette.error.main}15` : '#64748B15', 
                    color: analytics?.strugglingCount > 0 ? theme.palette.error.main : '#64748B', 
                    width: 52, 
                    height: 52 
                  }}>
                    <WarningIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>
                      Struggling Students (&lt;40%)
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: analytics?.strugglingCount > 0 ? theme.palette.error.main : 'inherit' }}>
                      {analytics?.strugglingCount} Students
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 4: Highest score */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#F59E0B15', color: '#F59E0B', width: 52, height: 52 }}>
                    <TrophyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>
                      Class Top Percentage
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706' }}>
                      {analytics?.highestScore?.toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Graphical Distributions Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Grade Distribution BarChart */}
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 2.5, borderRadius: 3, height: 380, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AnalyticsIcon color="primary" /> Academic Grade Distributions
                </Typography>
                <Box sx={{ width: '100%', height: 280, flexGrow: 1 }}>
                  <ResponsiveContainer>
                    <BarChart data={analytics?.gradeDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="grade" stroke={theme.palette.text.secondary} />
                      <YAxis stroke={theme.palette.text.secondary} allowDecimals={false} />
                      <ChartTooltip formatter={(value) => [`${value} Students`, 'Total']} />
                      <Bar dataKey="count" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]}>
                        {analytics?.gradeDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={gradeColors[entry.grade] || theme.palette.primary.main} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>

            {/* Subject Averages Panel */}
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 2.5, borderRadius: 3, height: 380, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Subject Performance Breakdown
                </Typography>
                <Stack spacing={2}>
                  {analytics?.subjectAnalytics.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 5 }}>
                      No subject schedules recorded.
                    </Typography>
                  ) : (
                    analytics?.subjectAnalytics.map((sub, idx) => {
                      const totalTests = sub.passCount + sub.failCount;
                      const passRate = totalTests > 0 ? (sub.passCount / totalTests) * 100 : 0;
                      return (
                        <Box key={idx}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {sub.subjectName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Avg: {sub.averagePercentage.toFixed(1)}% | Pass: {passRate.toFixed(0)}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={sub.averagePercentage} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: sub.averagePercentage >= 75 ? '#10B981' : sub.averagePercentage >= 40 ? '#3B82F6' : '#EF4444'
                              }
                            }} 
                          />
                        </Box>
                      );
                    })
                  )}
                </Stack>
              </Card>
            </Grid>
          </Grid>

          {/* Struggling Students Alerts Registry */}
          {analytics?.strugglingCount > 0 && (
            <Card sx={{ mb: 4, borderRadius: 3, border: `1px solid ${theme.palette.error.light}`, bgcolor: theme.palette.mode === 'dark' ? '#2F1E1E' : '#FFF5F5' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" color="error.main" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon /> Academic Intervention Registry (Struggling Students)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  The following students have an aggregate exam average **below 40%**. They require immediate attention, reviews, or academic guidance.
                </Typography>
                <Grid container spacing={2}>
                  {analytics?.studentAnalytics.filter(st => st.isStruggling).map((st) => (
                    <Grid item xs={12} sm={6} md={4} key={st.studentId}>
                      <Paper sx={{ p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${theme.palette.error.light}40` }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {st.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Roll No: {st.rollNo || '-'} | Average: **{st.percentage.toFixed(1)}%**
                          </Typography>
                        </Box>
                        <Button 
                          size="small" 
                          color="error" 
                          variant="outlined" 
                          sx={{ textTransform: 'none', borderRadius: 1.5 }}
                          onClick={() => handleDownloadReportCard(st.studentId)}
                        >
                          Report Card
                        </Button>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Complete Student Performance Roster */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${theme.palette.primary.main}10`, color: theme.palette.primary.main }}>
                    <AnalyticsIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Student Marks & Grading Ledger
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Comprehensive class academic listing, averages, and report generation.
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadAllClassReportCards}
                  sx={{ 
                    fontFamily: "'Outfit', sans-serif", 
                    fontWeight: 700, 
                    borderRadius: 2.5, 
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)'
                  }}
                >
                  Download All Report Cards
                </Button>
              </Box>

              <Divider />

              <TableContainer>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="10%">Roll No</TableCell>
                      <TableCell width="25%">Student Name</TableCell>
                      <TableCell width="12%" align="right">Exam Total</TableCell>
                      <TableCell width="12%" align="right">Percentage</TableCell>
                      <TableCell width="10%" align="center">Exam Grade</TableCell>
                      <TableCell width="15%" align="center">Homework Avg</TableCell>
                      <TableCell width="16%" align="center">Report Card</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics?.studentAnalytics.map((st) => (
                      <TableRow 
                        key={st.studentId} 
                        hover
                        sx={{ 
                          bgcolor: st.isStruggling ? `${theme.palette.error.light}08` : 'inherit',
                          '&:last-child td, &:last-child th': { border: 0 }
                        }}
                      >
                        <TableCell>{st.rollNo || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {st.name}
                          {st.isStruggling && (
                            <Chip 
                              size="small" 
                              label="Struggling" 
                              color="error" 
                              sx={{ ml: 1, height: 18, fontSize: '0.65rem', fontWeight: 800 }} 
                            />
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {st.totalObtained} / {st.totalMax}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: st.isStruggling ? theme.palette.error.main : 'inherit' }}>
                          {st.percentage.toFixed(1)}%
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            size="small" 
                            label={st.grade} 
                            sx={{ 
                              fontWeight: 800, 
                              bgcolor: `${gradeColors[st.grade]}15` || 'action.selected',
                              color: gradeColors[st.grade] || 'text.primary',
                              border: `1px solid ${gradeColors[st.grade]}40`
                            }} 
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ color: st.homeworkAverage === null ? 'text.secondary' : 'inherit' }}>
                          {st.homeworkAverage !== null ? `${st.homeworkAverage.toFixed(1)} / 100` : 'N/A'}
                          <Typography variant="caption" display="block" color="text.secondary">
                            Completion: {st.homeworkCompletionRate.toFixed(0)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Download PDF Report Card">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleDownloadReportCard(st.studentId)}
                              sx={{ 
                                bgcolor: `${theme.palette.primary.main}08`,
                                '&:hover': { bgcolor: `${theme.palette.primary.main}15` }
                              }}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}

export default ClassAnalytics;
