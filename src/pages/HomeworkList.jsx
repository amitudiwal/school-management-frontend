import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSelector } from 'react-redux';
import { 
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, 
  DialogTitle, Grid, TextField, MenuItem, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, 
  Alert, IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import { GET_HOMEWORK, GET_CLASSES, GET_SECTIONS, GET_SUBJECTS, CREATE_HOMEWORK, GET_TEACHERS, UPDATE_HOMEWORK, DELETE_HOMEWORK } from '../graphql/operations';
import CustomDatePicker from '../components/CustomDatePicker';

function HomeworkList() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // States
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [homeworkToDelete, setHomeworkToDelete] = useState(null);

  // Form States for creation
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');

  // Queries
  const { data: classesData } = useQuery(GET_CLASSES);
  
  const { data: sectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: classId || undefined }
  });

  const { data: subjectsData } = useQuery(GET_SUBJECTS, {
    variables: { classId: classId || undefined }
  });

  const { data: teachersData } = useQuery(GET_TEACHERS);

  const { loading: hwLoading, error: hwError, data: hwData, refetch } = useQuery(GET_HOMEWORK, {
    skip: !classId || !sectionId,
    variables: { classId, sectionId }
  });

  // Mutations
  const [createHomeworkMutation, { loading: addLoading }] = useMutation(CREATE_HOMEWORK, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Homework assigned successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateHomeworkMutation, { loading: updateLoading }] = useMutation(UPDATE_HOMEWORK, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Homework updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteHomeworkMutation, { loading: deleteLoading }] = useMutation(DELETE_HOMEWORK, {
    onCompleted: () => {
      setHomeworkToDelete(null);
      refetch();
      dispatch(showToast({ message: 'Homework deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearForm = () => {
    setTitle('');
    setDescription('');
    setFormSubjectId('');
    setDueDate('');
    setFormTeacherId('');
    setFormError('');
    setSelectedHomework(null);
  };

  const handleOpenAssign = () => {
    clearForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (hw) => {
    setSelectedHomework(hw);
    setTitle(hw.title || '');
    setDescription(hw.description || '');
    setFormSubjectId(hw.subjectId?.id || '');
    setDueDate(hw.dueDate ? hw.dueDate.slice(0, 10) : '');
    setFormTeacherId(hw.teacherId?.id || '');
    setFormError('');
    setOpenModal(true);
  };

  const handleConfirmDelete = () => {
    if (!homeworkToDelete) return;
    deleteHomeworkMutation({ variables: { id: homeworkToDelete.id } });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!title || !description || !formSubjectId || !dueDate) {
      setFormError('Please fill in all fields.');
      return;
    }

    // If the requester is an admin, require selecting a teacher
    if (['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user?.role) && !formTeacherId) {
      setFormError('Please select a Teacher to assign this homework.');
      return;
    }

    const variables = {
      title,
      description,
      classId,
      sectionId,
      subjectId: formSubjectId,
      dueDate: new Date(dueDate)
    };

    if (formTeacherId) variables.teacherId = formTeacherId;

    if (selectedHomework) {
      updateHomeworkMutation({
        variables: {
          id: selectedHomework.id,
          ...variables
        }
      });
      return;
    }

    createHomeworkMutation({ variables });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Homework Board
        </Typography>
        {['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'CLASS_TEACHER'].includes(user?.role) && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            disabled={!classId || !sectionId}
            onClick={handleOpenAssign}
            sx={{ width: { xs: '100%', sm: 'auto' }, background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF' }}
          >
            Assign Homework
          </Button>
        )}
      </Box>

      {/* Selectors */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
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

            <Grid item xs={12} sm={6}>
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

      {/* Table */}
      {!classId || !sectionId ? (
        <Alert severity="info">Please select a Class and Section to load assignments.</Alert>
      ) : hwLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : hwError ? (
        <Alert severity="error">{hwError.message}</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 780 }}>
            <TableHead>
              <TableRow>
                <TableCell>Homework Title</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Assigned Task Description</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Assigned By</TableCell>
                {['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'CLASS_TEACHER'].includes(user?.role) && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {hwData?.getHomework.map((hw) => (
                <TableRow key={hw.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{hw.title}</TableCell>
                  <TableCell>{hw.subjectId?.name}</TableCell>
                  <TableCell>{hw.description}</TableCell>
                  <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>{new Date(hw.dueDate).toISOString().split('T')[0]}</TableCell>
                  <TableCell>{hw.teacherId ? `Prof. ${hw.teacherId.firstName} ${hw.teacherId.lastName}` : '-'}</TableCell>
                  {['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'CLASS_TEACHER'].includes(user?.role) && (
                    <TableCell align="right">
                      <IconButton aria-label="Edit homework" color="primary" onClick={() => handleOpenEdit(hw)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton aria-label="Delete homework" color="error" onClick={() => setHomeworkToDelete(hw)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {hwData?.getHomework.length === 0 && (
                <TableRow>
                  <TableCell colSpan={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'CLASS_TEACHER'].includes(user?.role) ? 6 : 5} align="center">No active homework tasks assigned to this class section.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Assign/Edit Homework Dialog */}
      <Dialog open={openModal} onClose={clearForm} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedHomework ? 'Edit Class Homework' : 'Assign Class Homework'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth required label="Homework Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required multiline rows={3} label="Task Instructions / Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth required select label="Select Subject" 
                  value={formSubjectId} 
                  onChange={(e) => setFormSubjectId(e.target.value)}
                >
                  {subjectsData?.getSubjects.map((sub) => (
                    <MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              {['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user?.role) && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Assign Teacher"
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                  >
                    <MenuItem value="">Select a Teacher</MenuItem>
                    {teachersData?.getTeachers?.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{`${t.firstName} ${t.lastName}`}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <CustomDatePicker fullWidth required label="Due Date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Button onClick={clearForm} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addLoading || updateLoading}>
              {addLoading || updateLoading ? 'Saving...' : selectedHomework ? 'Save Changes' : 'Assign Homework'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Homework Dialog */}
      <Dialog open={Boolean(homeworkToDelete)} onClose={() => setHomeworkToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Homework</DialogTitle>
        <DialogContent>
          <Typography>
            Delete homework task "{homeworkToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setHomeworkToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default HomeworkList;
