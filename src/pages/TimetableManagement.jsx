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

// Helper to get pastel colors based on subject name hash
const getSubjectColor = (subjectName) => {
  if (!subjectName) return '#EEF2F6';
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  // Using high lightness and saturation for clean soft pastel shades
  return `hsl(${h}, 70%, 92%)`;
};

const getSubjectBorderColor = (subjectName) => {
  if (!subjectName) return '#CBD5E1';
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 60%, 70%)`;
};

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function TimetableManagement() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  
  // Permissions
  const canManage = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role);

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
          <Grid container spacing={2.5}>
            {dayEntries.map((entry) => {
              const borderCol = getSubjectBorderColor(entry.subjectId?.name);
              const isDark = theme.palette.mode === 'dark';
              const cardBg = isDark ? '#1E293B' : getSubjectColor(entry.subjectId?.name);
              const textCol = isDark ? '#F8FAFC' : 'text.primary';
              const subTextCol = isDark ? '#94A3B8' : 'text.secondary';
              const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

              return (
                <Grid item xs={12} sm={6} md={4} key={entry.id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      borderLeft: `6px solid ${borderCol}`,
                      backgroundColor: cardBg,
                      position: 'relative',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: isDark ? '0 8px 20px rgba(0,0,0,0.3)' : '0 8px 20px rgba(0,0,0,0.06)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      {/* Period Header (Subject) */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: textCol }}>
                          {entry.subjectId?.name}
                        </Typography>
                        {canManage && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" onClick={() => handleOpenEdit(entry)} color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => setEntryToDelete(entry)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>

                      {/* Timing details */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <TimeIcon fontSize="small" sx={{ color: isDark ? '#64748B' : 'action.active' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: subTextCol }}>
                          {entry.startTime} - {entry.endTime}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1.5, borderColor: dividerColor }} />

                      {/* Other Meta Fields */}
                      <Grid container spacing={1}>
                        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon fontSize="small" sx={{ color: isDark ? '#64748B' : 'action.active' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500, color: textCol }}>
                            {entry.classId?.name} - {entry.sectionId?.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TeacherIcon fontSize="small" sx={{ color: isDark ? '#64748B' : 'action.active' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500, color: textCol }}>
                            {entry.teacherId?.firstName} {entry.teacherId?.lastName}
                          </Typography>
                        </Grid>
                        {entry.roomNumber && (
                          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <RoomIcon fontSize="small" sx={{ color: isDark ? '#64748B' : 'action.active' }} />
                            <Chip
                              size="small"
                              label={`Room ${entry.roomNumber}`}
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                height: 20,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                color: textCol
                              }}
                            />
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}

            {dayEntries.length === 0 && (
              <Grid item xs={12}>
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
              </Grid>
            )}
          </Grid>
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
