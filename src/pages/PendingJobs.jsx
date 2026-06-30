import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Button, Card, CardContent, Grid, TextField, MenuItem,
  Paper, Typography, CircularProgress, Alert, Chip, Avatar,
  Collapse, Tooltip, IconButton, Stack, CardHeader, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Assignment as JobIcon,
  Book as StudyIcon,
  HelpOutline as OthersIcon,
  History as HistoryIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  MenuBook as ChapterIcon
} from '@mui/icons-material';
import {
  GET_PENDING_JOBS,
  CREATE_PENDING_JOB,
  UPDATE_PENDING_JOB_STATUS,
  GET_SUBJECTS,
  GET_CHAPTERS,
  CREATE_CHAPTER,
  DELETE_CHAPTER
} from '../graphql/operations';

function PendingJobs() {
  const { user } = useSelector((state) => state.auth);

  // Page Tab state (0 = Lecture Logs, 1 = Chapter Manager)
  const [activeTab, setActiveTab] = useState(0);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [jobType, setJobType] = useState(''); // 'Study' or 'Others'
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [topicName, setTopicName] = useState('');
  const [status, setStatus] = useState('Running'); // 'Running' or 'Complete'
  const [remarks, setRemarks] = useState('');

  // Chapter Manager State
  const [mgmtSubjectId, setMgmtSubjectId] = useState('');
  const [newChapterName, setNewChapterName] = useState('');

  const [toastMessage, setToastMessage] = useState({ text: '', type: 'success' });

  // Queries
  const { loading: jobsLoading, error: jobsError, data: jobsData, refetch: refetchJobs } = useQuery(GET_PENDING_JOBS);
  const { data: subjectsData } = useQuery(GET_SUBJECTS);

  // Form Chapters Query
  const { data: formChaptersData } = useQuery(GET_CHAPTERS, {
    variables: { subjectId: selectedSubjectId },
    skip: !selectedSubjectId,
    fetchPolicy: 'network-only'
  });

  // Chapter Manager Query
  const { data: mgmtChaptersData, refetch: refetchMgmtChapters } = useQuery(GET_CHAPTERS, {
    variables: { subjectId: mgmtSubjectId },
    skip: !mgmtSubjectId,
    fetchPolicy: 'network-only'
  });

  // Mutations
  const [createJob, { loading: submitLoading }] = useMutation(CREATE_PENDING_JOB, {
    onCompleted: () => {
      setToastMessage({ text: 'Job logged successfully!', type: 'success' });
      resetForm();
      refetchJobs();
      setTimeout(() => setToastMessage({ text: '', type: 'success' }), 4000);
    },
    onError: (err) => {
      setToastMessage({ text: 'Error logging job: ' + err.message, type: 'error' });
    }
  });

  const [updateJobStatus, { loading: updateLoading }] = useMutation(UPDATE_PENDING_JOB_STATUS, {
    onCompleted: () => {
      setToastMessage({ text: 'Job marked as complete!', type: 'success' });
      refetchJobs();
      setTimeout(() => setToastMessage({ text: '', type: 'success' }), 4000);
    },
    onError: (err) => {
      setToastMessage({ text: 'Error updating job: ' + err.message, type: 'error' });
    }
  });

  const [createChapter, { loading: addChapterLoading }] = useMutation(CREATE_CHAPTER, {
    onCompleted: () => {
      setToastMessage({ text: 'Chapter added successfully!', type: 'success' });
      setNewChapterName('');
      refetchMgmtChapters();
      setTimeout(() => setToastMessage({ text: '', type: 'success' }), 4000);
    },
    onError: (err) => {
      setToastMessage({ text: 'Error adding chapter: ' + err.message, type: 'error' });
    }
  });

  const [deleteChapter, { loading: deleteChapterLoading }] = useMutation(DELETE_CHAPTER, {
    onCompleted: () => {
      setToastMessage({ text: 'Chapter deleted successfully!', type: 'success' });
      refetchMgmtChapters();
      setTimeout(() => setToastMessage({ text: '', type: 'success' }), 4000);
    },
    onError: (err) => {
      setToastMessage({ text: 'Error deleting chapter: ' + err.message, type: 'error' });
    }
  });

  const resetForm = () => {
    setJobType('');
    setSelectedSubjectId('');
    setChapterId('');
    setTopicName('');
    setStatus('Running');
    setRemarks('');
    setIsFormOpen(false);
  };

  const handleJobSubmit = (e) => {
    e.preventDefault();
    if (!jobType) return;

    if (jobType === 'Study') {
      const selectedSubject = subjectsData?.getSubjects?.find(s => s.id === selectedSubjectId);
      if (!selectedSubjectId || !chapterId || !topicName) {
        setToastMessage({ text: 'Please select Subject, Chapter and fill Topic Name.', type: 'error' });
        return;
      }
      createJob({
        variables: {
          jobType,
          subjectName: selectedSubject?.name || '',
          chapterId,
          topicName,
          status,
          remarks: ''
        }
      });
    } else {
      if (!remarks.trim()) {
        setToastMessage({ text: 'Please fill in Remarks.', type: 'error' });
        return;
      }
      createJob({
        variables: {
          jobType,
          subjectName: '',
          chapterId: null,
          topicName: '',
          status: 'Complete',
          remarks
        }
      });
    }
  };

  const handleMarkComplete = (jobId) => {
    updateJobStatus({
      variables: {
        id: jobId,
        status: 'Complete'
      }
    });
  };

  const handleAddChapterSubmit = (e) => {
    e.preventDefault();
    const selectedSub = subjectsData?.getSubjects?.find(s => s.id === mgmtSubjectId);
    if (!mgmtSubjectId || !newChapterName.trim() || !selectedSub) {
      setToastMessage({ text: 'Please select a subject and enter chapter name.', type: 'error' });
      return;
    }
    createChapter({
      variables: {
        name: newChapterName.trim(),
        subjectId: mgmtSubjectId,
        classId: selectedSub.classId?.id || selectedSub.classId
      }
    });
  };

  const handleDeleteChapterClick = (id) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      deleteChapter({ variables: { id } });
    }
  };

  return (
    <Box>
      {/* Toast Alert */}
      {toastMessage.text && (
        <Alert
          severity={toastMessage.type}
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: toastMessage.type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
          }}
        >
          {toastMessage.text}
        </Alert>
      )}

      {/* Main Glassmorphism Header */}
      <Card
        sx={{
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(99, 102, 241, 0.35)'
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
            <Box>
              <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
                Pending Jobs
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.85, fontWeight: 500 }}>
                Track your active class lectures or manage your course syllabus chapters.
              </Typography>
            </Box>

            {activeTab === 1 && !isFormOpen && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<StartIcon />}
                  onClick={() => setIsFormOpen(true)}
                  sx={{
                    bgcolor: '#ffffff',
                    color: '#4f46e5',
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': { bgcolor: '#f3f4f6' }
                  }}
                >
                  Job Start
                </Button>
              </motion.div>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs Layout */}
      <Tabs
        value={activeTab}
        onChange={(e, val) => {
          setActiveTab(val);
          resetForm();
        }}
        sx={{
          mb: 4,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiTab-root': {
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '1rem'
          }
        }}
      >
        <Tab label="Chapter Manager" icon={<ChapterIcon />} iconPosition="start" />
        <Tab label="Lecture Logs" icon={<HistoryIcon />} iconPosition="start" />
      </Tabs>

      {/* TAB 1: LECTURE LOGS */}
      {activeTab === 1 && (
        <Box>
          {/* Log Job Form */}
          <Collapse in={isFormOpen}>
            <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'visible' }}>
              <CardHeader
                title="Start New Class Activity"
                titleTypographyProps={{ variant: 'h6', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}
                action={
                  <Button onClick={resetForm} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Cancel
                  </Button>
                }
                sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}
              />
              <CardContent sx={{ p: 3 }}>
                <form onSubmit={handleJobSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                        What activity are you starting?
                      </Typography>
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant={jobType === 'Study' ? 'contained' : 'outlined'}
                          startIcon={<StudyIcon />}
                          onClick={() => setJobType('Study')}
                          sx={{
                            flex: 1,
                            py: 2,
                            borderRadius: 3,
                            fontWeight: 700,
                            borderWidth: 2,
                            textTransform: 'none',
                            fontSize: '0.95rem'
                          }}
                        >
                          Study
                        </Button>
                        <Button
                          variant={jobType === 'Others' ? 'contained' : 'outlined'}
                          startIcon={<OthersIcon />}
                          onClick={() => setJobType('Others')}
                          sx={{
                            flex: 1,
                            py: 2,
                            borderRadius: 3,
                            fontWeight: 700,
                            borderWidth: 2,
                            textTransform: 'none',
                            fontSize: '0.95rem'
                          }}
                        >
                          Others
                        </Button>
                      </Stack>
                    </Grid>

                    {/* Study Form Branch */}
                    {jobType === 'Study' && (
                      <Grid item xs={12} component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Grid container spacing={3}>
                          {/* Subject selection */}
                          <Grid item xs={12} sm={6}>
                            <TextField
                              select
                              fullWidth
                              label="Subject Name"
                              value={selectedSubjectId}
                              onChange={(e) => {
                                setSelectedSubjectId(e.target.value);
                                setChapterId('');
                              }}
                              variant="outlined"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            >
                              {subjectsData?.getSubjects?.map((sub) => (
                                <MenuItem key={sub.id} value={sub.id}>
                                  {sub.name} ({sub.classId?.name || 'All'})
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>

                          {/* Chapter selection (Dropdown added before topic name) */}
                          {selectedSubjectId && (
                            <Grid item xs={12} sm={6} component={motion.div} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                              <TextField
                                select
                                fullWidth
                                label="Chapter Name"
                                value={chapterId}
                                onChange={(e) => setChapterId(e.target.value)}
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                              >
                                {formChaptersData?.getChapters?.map((chap) => (
                                  <MenuItem key={chap.id} value={chap.id}>{chap.name}</MenuItem>
                                ))}
                                {(!formChaptersData?.getChapters || formChaptersData.getChapters.length === 0) && (
                                  <MenuItem disabled>No chapters logged. Please add them in the Chapter Manager first.</MenuItem>
                                )}
                              </TextField>
                            </Grid>
                          )}

                          {/* Topic Input */}
                          {chapterId && (
                            <Grid item xs={12} sm={6} component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                              <TextField
                                fullWidth
                                label="Topic Name"
                                placeholder="e.g. Calculus Basics, Newton's Laws"
                                value={topicName}
                                onChange={(e) => setTopicName(e.target.value)}
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                              />
                            </Grid>
                          )}

                          {/* Choice Chips for Status */}
                          {topicName && (
                            <Grid item xs={12} component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                                Lecture Status
                              </Typography>
                              <Stack direction="row" spacing={1.5}>
                                <Chip
                                  label="Running"
                                  onClick={() => setStatus('Running')}
                                  color={status === 'Running' ? 'success' : 'default'}
                                  variant={status === 'Running' ? 'filled' : 'outlined'}
                                  sx={{
                                    px: 2,
                                    py: 2.2,
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    borderRadius: '12px',
                                    border: '2px solid',
                                    borderColor: status === 'Running' ? 'success.main' : 'divider'
                                  }}
                                />
                                <Chip
                                  label="Complete"
                                  onClick={() => setStatus('Complete')}
                                  color={status === 'Complete' ? 'info' : 'default'}
                                  variant={status === 'Complete' ? 'filled' : 'outlined'}
                                  sx={{
                                    px: 2,
                                    py: 2.2,
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    borderRadius: '12px',
                                    border: '2px solid',
                                    borderColor: status === 'Complete' ? 'primary.main' : 'divider'
                                  }}
                                />
                              </Stack>
                            </Grid>
                          )}
                        </Grid>
                      </Grid>
                    )}

                    {/* Others Form Branch */}
                    {jobType === 'Others' && (
                      <Grid item xs={12} component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Remarks / Activity Details"
                          placeholder="Type what alternative activity you did in the class..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          variant="outlined"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                    )}

                    {/* Action Buttons */}
                    {jobType && (
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                          <Button variant="outlined" onClick={resetForm} sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={submitLoading}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              px: 4,
                              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                            }}
                          >
                            {submitLoading ? 'Saving...' : 'Save & Log Job'}
                          </Button>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Collapse>

          {/* Activity Logs Timeline list */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 40, height: 40 }}>
              <HistoryIcon />
            </Avatar>
            <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
              Your Activity Logs
            </Typography>
          </Box>

          {jobsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : jobsError ? (
            <Alert severity="error">{jobsError.message}</Alert>
          ) : !jobsData?.getPendingJobs || jobsData.getPendingJobs.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
              <JobIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1.5 }} />
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                No activities logged yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                Click the "Job Start" button above to log your current class session.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {jobsData.getPendingJobs.map((job) => (
                <Grid item xs={12} key={job.id} component={motion.div} layout>
                  <Paper
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                      }
                    }}
                  >
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item>
                        <Avatar
                          sx={{
                            bgcolor: job.status === 'Running' ? 'success.lighter' : job.jobType === 'Others' ? 'warning.lighter' : 'info.lighter',
                            color: job.status === 'Running' ? 'success.main' : job.jobType === 'Others' ? 'warning.main' : 'info.main',
                            width: 48,
                            height: 48
                          }}
                        >
                          {job.jobType === 'Study' ? <StudyIcon /> : <OthersIcon />}
                        </Avatar>
                      </Grid>

                      <Grid item xs>
                        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap" sx={{ mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {job.jobType === 'Study' ? (
                              <span>
                                {job.subjectName}
                                {job.chapterId && <span style={{ color: '#7c3aed', fontWeight: 600 }}> › {job.chapterId.name}</span>}
                                {job.topicName && ` : ${job.topicName}`}
                              </span>
                            ) : (
                              'Alternative Activity'
                            )}
                          </Typography>
                          <Chip label={job.jobType} size="small" color={job.jobType === 'Study' ? 'primary' : 'secondary'} sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                          <Chip label={job.status} size="small" color={job.status === 'Running' ? 'success' : 'default'} sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                        </Stack>

                        <Typography variant="body2" color="text.secondary">
                          {job.jobType === 'Others' ? job.remarks : `Lecture is currently set as ${job.status}.`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.72rem' }}>
                          Logged at {new Date(job.createdAt).toLocaleString()}
                        </Typography>
                      </Grid>

                      {job.status === 'Running' && (
                        <Grid item>
                          <Tooltip title="Mark Lecture Complete">
                            <Button
                              variant="outlined"
                              color="success"
                              size="small"
                              startIcon={<CheckIcon />}
                              disabled={updateLoading}
                              onClick={() => handleMarkComplete(job.id)}
                              sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 2 }}
                            >
                              Complete
                            </Button>
                          </Tooltip>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* TAB 0: CHAPTER MANAGER */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3}>
            {/* Add New Chapter */}
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <CardHeader
                  title="Add Class Subject Chapter"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}
                />
                <CardContent sx={{ p: 3 }}>
                  <form onSubmit={handleAddChapterSubmit}>
                    <Stack spacing={3}>
                      <TextField
                        select
                        fullWidth
                        label="Select Subject & Class"
                        value={mgmtSubjectId}
                        onChange={(e) => setMgmtSubjectId(e.target.value)}
                        variant="outlined"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        {subjectsData?.getSubjects?.map((sub) => (
                          <MenuItem key={sub.id} value={sub.id}>
                            {sub.name} ({sub.classId?.name || 'All'})
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        fullWidth
                        label="Chapter Name"
                        placeholder="e.g. Chapter 1: Introduction to Matrices"
                        value={newChapterName}
                        disabled={!mgmtSubjectId}
                        onChange={(e) => setNewChapterName(e.target.value)}
                        variant="outlined"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={addChapterLoading || !mgmtSubjectId || !newChapterName.trim()}
                        startIcon={<AddIcon />}
                        sx={{
                          py: 1.2,
                          borderRadius: 2,
                          fontWeight: 700,
                          textTransform: 'none',
                          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                        }}
                      >
                        {addChapterLoading ? 'Adding Chapter...' : 'Add Chapter'}
                      </Button>
                    </Stack>
                  </form>
                </CardContent>
              </Card>
            </Grid>

            {/* Chapters Directory */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', minHeight: 300 }}>
                <CardHeader
                  title="Chapters Directory"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}
                />
                <CardContent sx={{ p: 3 }}>
                  {!mgmtSubjectId ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Select a Subject from the left panel to list, view and manage its chapters.
                    </Alert>
                  ) : !mgmtChaptersData?.getChapters || mgmtChaptersData.getChapters.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                      <ChapterIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5, mb: 1.5 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        No chapters registered for this subject yet.
                      </Typography>
                    </Paper>
                  ) : (
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Chapter Name</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mgmtChaptersData.getChapters.map((chap) => (
                            <TableRow key={chap.id} hover>
                              <TableCell sx={{ fontWeight: 500 }}>{chap.name}</TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={deleteChapterLoading}
                                  onClick={() => handleDeleteChapterClick(chap.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}

export default PendingJobs;
