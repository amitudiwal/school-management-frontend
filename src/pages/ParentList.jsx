import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, IconButton, InputAdornment
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import { GET_PARENTS, REGISTER_PARENT, UPDATE_PARENT, DELETE_PARENT, GET_STUDENTS } from '../graphql/operations';

function ParentList() {
  const dispatch = useDispatch();
  const [openModal, setOpenModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [parentToDelete, setParentToDelete] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState('FATHER');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const { loading, error, data, refetch } = useQuery(GET_PARENTS);
  const { data: studentsData } = useQuery(GET_STUDENTS);

  const [registerParent, { loading: addLoading }] = useMutation(REGISTER_PARENT, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Parent registered successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateParent, { loading: updateLoading }] = useMutation(UPDATE_PARENT, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Parent profile updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteParent, { loading: deleteLoading }] = useMutation(DELETE_PARENT, {
    onCompleted: () => {
      setParentToDelete(null);
      refetch();
      dispatch(showToast({ message: 'Parent deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setRelation('FATHER');
    setPhone('');
    setPassword('');
    setFormError('');
    setSelectedChildren([]);
    setSelectedParent(null);
    setShowPassword(false);
  };

  const handleClose = () => {
    setOpenModal(false);
    clearForm();
  };

  const handleEdit = (parent) => {
    setSelectedParent(parent);
    setFirstName(parent.firstName);
    setLastName(parent.lastName);
    setEmail(parent.email || parent.userId?.email || '');
    setRelation(parent.relation || 'FATHER');
    setPhone(parent.phone);
    setPassword('dummy_pass');
    setSelectedChildren(parent.children ? parent.children.map(c => c.id) : []);
    setOpenModal(true);
  };

  const handleConfirmDelete = () => {
    if (!parentToDelete) return;
    deleteParent({ variables: { id: parentToDelete.id } });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!firstName || !lastName || !email || !relation || !phone) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const vars = {
      email,
      firstName,
      lastName,
      relation,
      phone,
      childrenIds: selectedChildren
    };

    if (selectedParent) {
      updateParent({
        variables: {
          id: selectedParent.id,
          ...vars
        }
      });
    } else {
      if (!password) {
        setFormError('Password is required for registration.');
        return;
      }
      registerParent({
        variables: {
          ...vars,
          password
        }
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Parents Registry
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => { clearForm(); setOpenModal(true); }}
          sx={{ width: { xs: '100%', sm: 'auto' }, background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF' }}
        >
          Add Parent Profile
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Parent Name</TableCell>
                <TableCell>Relationship</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.getParents.map((parent) => (
                <TableRow key={parent.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{`${parent.firstName} ${parent.lastName}`}</TableCell>
                  <TableCell>{parent.relation}</TableCell>
                  <TableCell>{parent.email || parent.userId?.email || '-'}</TableCell>
                  <TableCell>{parent.phone}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleEdit(parent)}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => setParentToDelete(parent)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {data?.getParents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No parents registered yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedParent ? 'Update Parent Profile' : 'Register Parent'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required select label="Relationship to Student" value={relation} onChange={(e) => setRelation(e.target.value)}>
                  <MenuItem value="FATHER">Father</MenuItem>
                  <MenuItem value="MOTHER">Mother</MenuItem>
                  <MenuItem value="GUARDIAN">Guardian</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required type="email" label="Parent Login Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Grid>
              {!selectedParent && (
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    required={!selectedParent} 
                    type={showPassword ? 'text' : 'password'} 
                    label="Parent Login Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Select Children (Students)"
                  SelectProps={{
                    multiple: true,
                    value: selectedChildren,
                    onChange: (e) => setSelectedChildren(e.target.value),
                    renderValue: (selected) => {
                      const names = selected.map(id => {
                        const s = studentsData?.getStudents?.find(student => student.id === id);
                        return s ? `${s.firstName} ${s.lastName} (Class ${s.classId?.name || 'N/A'})` : id;
                      });
                      return names.join(', ');
                    }
                  }}
                >
                  {studentsData?.getStudents?.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {`${student.firstName} ${student.lastName} (Adm No: ${student.admissionNo}, Class: ${student.classId?.name || 'N/A'})`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Button onClick={handleClose} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addLoading || updateLoading}>
              {addLoading || updateLoading ? 'Saving...' : selectedParent ? 'Update Profile' : 'Add Parent'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(parentToDelete)} onClose={() => setParentToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Parent Profile</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete parent profile "{parentToDelete ? `${parentToDelete.firstName} ${parentToDelete.lastName}` : ''}"? All linked children references will be updated.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setParentToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ParentList;
