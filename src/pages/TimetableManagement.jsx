import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, TextField, MenuItem, Typography, CircularProgress,
  Alert, IconButton, Tabs, Tab, Paper, Divider, Chip, useTheme
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  AccessTime as TimeIcon, Room as RoomIcon, School as SchoolIcon,
  Person as TeacherIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../store/slices/uiSlice';
import {
  GET_TIMETABLES,
  CREATE_TIMETABLE_ENTRY,
  UPDATE_TIMETABLE_ENTRY,
  DELETE_TIMETABLE_ENTRY,
  GET_CLASSES,
  GET_SECTIONS,
  GET_SUBJECTS,
  GET_TEACHERS
} from '../graphql/operations';

// Predefined premium color palettes for common school subjects
const SUBJECT_PALETTES = {
  mathematics: {
    light: { bg: '#EEF2FF', border: '#6366F1', text: '#312E81' },
    dark: { bg: 'rgba(99, 102, 241, 0.15)', border: '#818CF8', text: '#E0E7FF' }
  },
  science: {
    light: { bg: '#ECFDF5', border: '#10B981', text: '#064E3B' },
    dark: { bg: 'rgba(16, 185, 129, 0.15)', border: '#34D399', text: '#D1FAE5' }
  },
  physics: {
    light: { bg: '#F0F9FF', border: '#0EA5E9', text: '#0C4A6E' },
    dark: { bg: 'rgba(14, 165, 233, 0.15)', border: '#38BDF8', text: '#E0F2FE' }
  },
  chemistry: {
    light: { bg: '#FEF3C7', border: '#D97706', text: '#78350F' },
    dark: { bg: 'rgba(217, 119, 6, 0.15)', border: '#FBBF24', text: '#FEF3C7' }
  },
  biology: {
    light: { bg: '#F7FEE7', border: '#84CC16', text: '#3F6212' },
    dark: { bg: 'rgba(132, 204, 22, 0.15)', border: '#A3E635', text: '#ECFCCB' }
  },
  english: {
    light: { bg: '#FFF7ED', border: '#F97316', text: '#7C2D12' },
    dark: { bg: 'rgba(249, 115, 22, 0.15)', border: '#FB923C', text: '#FFEDD5' }
  },
  history: {
    light: { bg: '#FAF5FF', border: '#A855F7', text: '#581C87' },
    dark: { bg: 'rgba(168, 85, 247, 0.15)', border: '#C084FC', text: '#F3E8FF' }
  },
  geography: {
    light: { bg: '#F0FDFA', border: '#14B8A6', text: '#115E59' },
    dark: { bg: 'rgba(20, 184, 166, 0.15)', border: '#2DD4BF', text: '#CCFBF1' }
  },
  art: {
    light: { bg: '#FDF2F8', border: '#EC4899', text: '#701A75' },
    dark: { bg: 'rgba(236, 72, 153, 0.15)', border: '#F472B6', text: '#FCE7F3' }
  },
  music: {
    light: { bg: '#FFF1F2', border: '#F43F5E', text: '#9F1239' },
    dark: { bg: 'rgba(244, 63, 94, 0.15)', border: '#FB7185', text: '#FFE4E6' }
  },
  computer: {
    light: { bg: '#F5F3FF', border: '#8B5CF6', text: '#4C1D95' },
    dark: { bg: 'rgba(139, 92, 246, 0.15)', border: '#A78BFA', text: '#EDE9FE' }
  },
  default: {
    light: { bg: '#F1F5F9', border: '#64748B', text: '#0F172A' },
    dark: { bg: 'rgba(100, 116, 139, 0.15)', border: '#94A3B8', text: '#F8FAFC' }
  }
};

const getSubjectPalette = (subjectName, isDark) => {
  if (!subjectName) return SUBJECT_PALETTES.default[isDark ? 'dark' : 'light'];
  
  const nameLower = subjectName.toLowerCase();
  
  for (const key in SUBJECT_PALETTES) {
    if (key !== 'default' && nameLower.includes(key)) {
      return SUBJECT_PALETTES[key][isDark ? 'dark' : 'light'];
    }
  }
  
  // Custom hash-based fallback palette generator with high contrast
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  
  if (isDark) {
    return {
      bg: `hsla(${h}, 50%, 40%, 0.12)`,
      border: `hsl(${h}, 55%, 60%)`,
      text: `hsl(${h}, 70%, 90%)`
    };
  } else {
    return {
      bg: `hsl(${h}, 65%, 97%)`,
      border: `hsl(${h}, 50%, 65%)`,
      text: `hsl(${h}, 70%, 22%)`
    };
  }
};

// Framer Motion variants for timetable grid items
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 22
    }
  }
};

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function TimetableManagement() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  
  // Permissions
  const canManage = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'SUPER_TEACHER'].includes(user?.role);

  // Filter States
  const [filterMode, setFilterMode] = useState('class'); // 'class' or 'teacher'
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('');

  // Active Day Tab
  const [activeDay, setActiveDay] = useState(0);

  // Form States
  const [openModal, setOpenModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [formError, setFormError] = useState('');

  const [dayOfWeek, setDayOfWeek] = useState('MONDAY');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('09:30');
  const [formClassId, setFormClassId] = useState('');
  const [formSectionId, setFormSectionId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // Delete State
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Fetching options
  const { data: classesData } = useQuery(GET_CLASSES, { fetchPolicy: 'network-only' });
  const { data: sectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: selectedClass || undefined },
    fetchPolicy: 'network-only'
  });
  const { data: formSectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: formClassId || undefined },
    fetchPolicy: 'network-only'
  });
  const { data: formSubjectsData } = useQuery(GET_SUBJECTS, {
    variables: { classId: formClassId || undefined },
    fetchPolicy: 'network-only'
  });
  const { data: teachersData } = useQuery(GET_TEACHERS, { fetchPolicy: 'network-only' });

  // Auto-set teacher filter if logged-in user is a Teacher
  useEffect(() => {
    if (user?.role === 'TEACHER' && teachersData?.getTeachers) {
      const match = teachersData.getTeachers.find(t => t.userId?.id === user.id);
      if (match) {
        setFilterMode('teacher');
        setSelectedTeacherFilter(match.id);
      }
    }
  }, [user, teachersData]);

  // Fetch Timetable Entries Query
  const queryVariables = {
    classId: filterMode === 'class' && selectedClass ? selectedClass : undefined,
    sectionId: filterMode === 'class' && selectedSection ? selectedSection : undefined,
    teacherId: filterMode === 'teacher' && selectedTeacherFilter ? selectedTeacherFilter : undefined
  };

  const isFilterSelected = (filterMode === 'class' && selectedSection) || (filterMode === 'teacher' && selectedTeacherFilter);

  const { loading: timetableLoading, error: timetableError, data: timetableData, refetch } = useQuery(GET_TIMETABLES, {
    variables: queryVariables,
    skip: !isFilterSelected
  });

  // Mutations
  const [createTimetableEntry, { loading: addLoading }] = useMutation(CREATE_TIMETABLE_ENTRY, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Timetable entry added successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateTimetableEntry, { loading: updateLoading }] = useMutation(UPDATE_TIMETABLE_ENTRY, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Timetable entry updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteTimetableEntry, { loading: deleteLoading }] = useMutation(DELETE_TIMETABLE_ENTRY, {
    onCompleted: () => {
      setEntryToDelete(null);
      refetch();
      dispatch(showToast({ message: 'Timetable entry deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearForm = () => {
    setDayOfWeek(DAYS[activeDay] || 'MONDAY');
    setStartTime('08:30');
    setEndTime('09:30');
    setFormClassId('');
    setFormSectionId('');
    setFormSubjectId('');
    setFormTeacherId('');
    setRoomNumber('');
    setFormError('');
    setSelectedEntry(null);
  };

  const handleOpenAdd = () => {
    clearForm();
    // Pre-populate class/section if filters are active
    if (filterMode === 'class') {
      setFormClassId(selectedClass);
      setFormSectionId(selectedSection);
    }
    setOpenModal(true);
  };

  const handleOpenEdit = (entry) => {
    setSelectedEntry(entry);
    setDayOfWeek(entry.dayOfWeek);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setFormClassId(entry.classId?.id || '');
    setFormSectionId(entry.sectionId?.id || '');
    setFormSubjectId(entry.subjectId?.id || '');
    setFormTeacherId(entry.teacherId?.id || '');
    setRoomNumber(entry.roomNumber || '');
    setFormError('');
    setOpenModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!dayOfWeek || !startTime || !endTime || !formClassId || !formSectionId || !formSubjectId || !formTeacherId) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const variables = {
      dayOfWeek,
      startTime,
      endTime,
      classId: formClassId,
      sectionId: formSectionId,
      subjectId: formSubjectId,
      teacherId: formTeacherId,
      roomNumber: roomNumber || null
    };

    if (selectedEntry) {
      updateTimetableEntry({
        variables: {
          id: selectedEntry.id,
          ...variables
        }
      });
    } else {
      createTimetableEntry({
        variables
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!entryToDelete) return;
    deleteTimetableEntry({ variables: { id: entryToDelete.id } });
  };

  // Filter & sort list of entries for the active day tab
  const dayEntries = timetableData?.getTimetables
    ?.filter(entry => entry.dayOfWeek === DAYS[activeDay])
    ?.sort((a, b) => a.startTime.localeCompare(b.startTime)) || [];

  return (
    <Box>
      {/* Title Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            Weekly Timetable Board
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and view scheduled classes, teachers, and conflict-free room allocations.
          </Typography>
        </Box>
        {canManage && isFilterSelected && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{ width: { xs: '100%', sm: 'auto' }, background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF' }}
          >
            Add Period
          </Button>
        )}
      </Box>

      {/* Filter Options Bar */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                select
                label="Filter Mode"
                value={filterMode}
                onChange={(e) => {
                  setFilterMode(e.target.value);
                  setSelectedClass('');
                  setSelectedSection('');
                  setSelectedTeacherFilter('');
                }}
              >
                <MenuItem value="class">Class & Section View</MenuItem>
                <MenuItem value="teacher">Teacher Schedule View</MenuItem>
              </TextField>
            </Grid>

            {filterMode === 'class' ? (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Select Class"
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedSection('');
                    }}
                  >
                    {classesData?.getClasses?.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    select
                    label="Select Section"
                    value={selectedSection}
                    disabled={!selectedClass}
                    onChange={(e) => setSelectedSection(e.target.value)}
                  >
                    {sectionsData?.getSections?.map((sec) => (
                      <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </>
            ) : (
              <Grid item xs={12} sm={9}>
                <TextField
                  fullWidth
                  select
                  label="Select Teacher"
                  value={selectedTeacherFilter}
                  disabled={user?.role === 'TEACHER'} // Locked for teachers to their profile
                  onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                >
                  {teachersData?.getTeachers?.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.designation || 'Faculty'})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Main Timetable Area */}
      {!isFilterSelected ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Please select a Class & Section or a Teacher to load the weekly schedule.
        </Alert>
      ) : timetableLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>
      ) : timetableError ? (
        <Alert severity="error">{timetableError.message}</Alert>
      ) : (
        <Box>
          {/* Day Navigation Tabs */}
          <Paper sx={{ mb: 3, borderRadius: 2 }}>
            <Tabs
              value={activeDay}
              onChange={(e, val) => setActiveDay(val)}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
            >
              {DAYS.map((day) => (
                <Tab
                  key={day}
                  label={day.charAt(0) + day.slice(1).toLowerCase()}
                  sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif", px: { xs: 3, md: 5 } }}
                />
              ))}
            </Tabs>
          </Paper>

          {/* Daily Schedule Timeline List */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              style={{ width: '100%' }}
            >
              <Grid container spacing={2.5}>
                {dayEntries.map((entry) => {
                  const isDark = theme.palette.mode === 'dark';
                  const palette = getSubjectPalette(entry.subjectId?.name, isDark);
                  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

                  return (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      key={entry.id}
                      component={motion.div}
                      variants={itemVariants}
                      layout
                    >
                      <motion.div
                        whileHover={{
                          y: -6,
                          scale: 1.02,
                          boxShadow: isDark
                            ? '0 12px 24px rgba(0,0,0,0.4)'
                            : '0 12px 24px rgba(99, 102, 241, 0.08)'
                        }}
                        transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                        style={{ height: '100%' }}
                      >
                        <Card
                          elevation={0}
                          sx={{
                            borderRadius: 3,
                            borderLeft: `6px solid ${palette.border}`,
                            backgroundColor: palette.bg,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                          }}
                        >
                          <CardContent sx={{ p: 2.5, height: '100%' }}>
                            {/* Period Header (Subject) */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: palette.text }}>
                                {entry.subjectId?.name}
                              </Typography>
                              {canManage && (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEdit(entry)}
                                    sx={{
                                      color: palette.text,
                                      opacity: 0.8,
                                      '&:hover': { opacity: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => setEntryToDelete(entry)}
                                    sx={{
                                      color: isDark ? '#FCA5A5' : '#EF4444',
                                      opacity: 0.8,
                                      '&:hover': { opacity: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              )}
                            </Box>

                            {/* Timing details */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                              <TimeIcon fontSize="small" sx={{ color: palette.border }} />
                              <Typography variant="body2" sx={{ fontWeight: 700, color: palette.text, opacity: 0.9 }}>
                                {entry.startTime} - {entry.endTime}
                              </Typography>
                            </Box>

                            <Divider sx={{ my: 1.5, borderColor: dividerColor }} />

                            {/* Other Meta Fields */}
                            <Grid container spacing={1}>
                              <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SchoolIcon fontSize="small" sx={{ color: palette.border, opacity: 0.8 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, color: palette.text, opacity: 0.95 }}>
                                  {entry.classId?.name} - {entry.sectionId?.name}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TeacherIcon fontSize="small" sx={{ color: palette.border, opacity: 0.8 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, color: palette.text, opacity: 0.95 }}>
                                  {entry.teacherId?.firstName} {entry.teacherId?.lastName}
                                </Typography>
                              </Grid>
                              {entry.roomNumber && (
                                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <RoomIcon fontSize="small" sx={{ color: palette.border, opacity: 0.8 }} />
                                  <Chip
                                    size="small"
                                    label={`Room ${entry.roomNumber}`}
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: '0.75rem',
                                      height: 20,
                                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                      color: palette.text,
                                      border: `1px solid ${palette.border}33`
                                    }}
                                  />
                                </Grid>
                              )}
                            </Grid>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  );
                })}

                {dayEntries.length === 0 && (
                  <Grid item xs={12}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: 6,
                          textAlign: 'center',
                          backgroundColor: 'action.hover',
                          borderRadius: 3,
                          border: '1px dashed',
                          borderColor: 'divider'
                        }}
                      >
                        <TimeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                          No Scheduled Classes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          There are no periods scheduled for {DAYS[activeDay].toLowerCase()} yet.
                        </Typography>
                      </Paper>
                    </motion.div>
                  </Grid>
                )}
              </Grid>
            </motion.div>
          </AnimatePresence>
        </Box>
      )}

      {/* --- ADD / EDIT TIMETABLE MODAL --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {selectedEntry ? 'Update Period Settings' : 'Add Timetable Period'}
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Day of Week"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                >
                  {DAYS.map((day) => (
                    <MenuItem key={day} value={day}>
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="time"
                  label="Start Time"
                  InputLabelProps={{ shrink: true }}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="time"
                  label="End Time"
                  InputLabelProps={{ shrink: true }}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Select Class"
                  value={formClassId}
                  onChange={(e) => {
                    setFormClassId(e.target.value);
                    setFormSectionId('');
                    setFormSubjectId('');
                  }}
                >
                  {classesData?.getClasses?.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Select Section"
                  value={formSectionId}
                  disabled={!formClassId}
                  onChange={(e) => setFormSectionId(e.target.value)}
                >
                  {formSectionsData?.getSections?.map((sec) => (
                    <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Select Subject"
                  value={formSubjectId}
                  disabled={!formClassId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                >
                  {formSubjectsData?.getSubjects?.map((sub) => (
                    <MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Assign Teacher"
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                >
                  {teachersData?.getTeachers?.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Room Number (Optional)"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Science Lab, Room 204"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Button onClick={() => setOpenModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addLoading || updateLoading}>
              {addLoading || updateLoading ? 'Saving...' : selectedEntry ? 'Save Changes' : 'Schedule Period'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      <Dialog open={Boolean(entryToDelete)} onClose={() => setEntryToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Remove Period</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this period ({entryToDelete?.subjectId?.name} on {entryToDelete?.dayOfWeek.toLowerCase()}) from the weekly timetable?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setEntryToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TimetableManagement;
