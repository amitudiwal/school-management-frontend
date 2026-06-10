import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, TextField, MenuItem, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress,
  Alert, Chip, IconButton
} from '@mui/material';
import { Add as AddIcon, CheckCircle as ApproveIcon, Cancel as RejectIcon, Block as SuspendIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import { GET_SCHOOLS, CREATE_SCHOOL, UPDATE_SCHOOL, DELETE_SCHOOL } from '../graphql/operations';

function SchoolsList() {
  const dispatch = useDispatch();
  const [openModal, setOpenModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolToDelete, setSchoolToDelete] = useState(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('BASIC');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [schoolCode, setSchoolCode] = useState('');

  // Queries
  const { loading, error, data, refetch } = useQuery(GET_SCHOOLS);

  // Mutations
  const [createSchoolMutation, { loading: addLoading }] = useMutation(CREATE_SCHOOL, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'School registered successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateSchoolMutation, { loading: updateLoading }] = useMutation(UPDATE_SCHOOL, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'School details updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteSchoolMutation, { loading: deleteLoading }] = useMutation(DELETE_SCHOOL, {
    onCompleted: () => {
      setSchoolToDelete(null);
      refetch();
      dispatch(showToast({ message: 'School removed successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearForm = () => {
    setName('');
    setSlug('');
    setEmail('');
    setPhone('');
    setPlan('BASIC');
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
    setSchoolCode('');
    setFormError('');
    setSelectedSchool(null);
  };

  const handleOpenRegister = () => {
    clearForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (sch) => {
    setSelectedSchool(sch);
    setName(sch.name || '');
    setSlug(sch.slug || '');
    setEmail(sch.contact?.email || '');
    setPhone(sch.contact?.phone || '');
    setPlan(sch.subscription?.plan || 'BASIC');
    setSchoolCode(sch.schoolCode || '');
    setFormError('');
    setOpenModal(true);
  };

  const handleConfirmDelete = () => {
    if (!schoolToDelete) return;
    deleteSchoolMutation({ variables: { id: schoolToDelete.id } });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (selectedSchool) {
      if (!name) {
        setFormError('Please fill in the School Entity Name.');
        return;
      }
      updateSchoolMutation({
        variables: {
          id: selectedSchool.id,
          name,
          plan
        }
      });
      return;
    }

    if (!name || !slug || !email || !phone || !adminName || !adminEmail || !adminPassword) {
      setFormError('Please fill in all required fields.');
      return;
    }

    createSchoolMutation({
      variables: {
        name,
        slug,
        schoolCode,
        contactEmail: email,
        contactPhone: phone,
        plan,
        adminName,
        adminEmail,
        adminPassword
      }
    });
  };

  const handleStatusChange = (schoolId, nextStatus) => {
    updateSchoolMutation({
      variables: {
        id: schoolId,
        status: nextStatus
      }
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          SaaS Tenants (Schools)
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenRegister}
          sx={{ width: { xs: '100%', sm: 'auto' }, background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF' }}
        >
          Register School
        </Button>
      </Box>

      {/* List Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>School Name</TableCell>
                <TableCell>Subdomain Slug</TableCell>
                <TableCell>Subscription Plan</TableCell>
                <TableCell>Account Status</TableCell>
                <TableCell>Contact Email</TableCell>
                <TableCell>Onboarding Date</TableCell>
                <TableCell align="right">Actions / Control</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.getSchools.map((sch) => (
                <TableRow key={sch.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{sch.name}</TableCell>
                  <TableCell>{sch.slug}</TableCell>
                  <TableCell>
                    <Chip size="small" label={sch.subscription?.plan} color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={sch.status}
                      color={['ACTIVE', 'APPROVED'].includes(sch.status) ? 'success' : sch.status === 'PENDING' ? 'warning' : 'error'}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>{sch.contact?.email}</TableCell>
                  <TableCell>{new Date(sch.createdAt).toISOString().split('T')[0]}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                      {sch.status === 'PENDING' && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => handleStatusChange(sch.id, 'APPROVED')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<RejectIcon />}
                            onClick={() => handleStatusChange(sch.id, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {['ACTIVE', 'APPROVED'].includes(sch.status) && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<SuspendIcon />}
                          onClick={() => handleStatusChange(sch.id, 'SUSPENDED')}
                        >
                          Suspend
                        </Button>
                      )}
                      {['REJECTED', 'SUSPENDED'].includes(sch.status) && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<ApproveIcon />}
                          onClick={() => handleStatusChange(sch.id, 'APPROVED')}
                        >
                          Approve
                        </Button>
                      )}
                      <IconButton color="primary" onClick={() => handleOpenEdit(sch)} aria-label="edit school">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" onClick={() => setSchoolToDelete(sch)} aria-label="delete school">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Provision/Edit School Dialog Modal */}
      <Dialog open={openModal} onClose={clearForm} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedSchool ? 'Edit School Details' : 'Register School for Approval'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth required label="School Entity Name" value={name} onChange={(e) => setName(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required disabled={Boolean(selectedSchool)} label="Domain Slug (e.g. greenwood)" value={slug} onChange={(e) => setSlug(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required type="email" disabled={Boolean(selectedSchool)} label="Contact Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required disabled={Boolean(selectedSchool)} label="Contact Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="School Code"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  fullWidth
                  required
                  disabled={Boolean(selectedSchool)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth required select label="Subscription Level"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                >
                  <MenuItem value="TRIAL">Trial Mode</MenuItem>
                  <MenuItem value="BASIC">Basic Edition</MenuItem>
                  <MenuItem value="PREMIUM">Premium Suite</MenuItem>
                  <MenuItem value="ENTERPRISE">Enterprise Tier</MenuItem>
                </TextField>
              </Grid>
              {!selectedSchool && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1 }}>
                      School Admin Account
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth required label="Admin Name" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required type="email" label="Admin Login Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required type="password" label="Admin Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Button onClick={clearForm} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addLoading || updateLoading}>
              {addLoading || updateLoading ? 'Saving...' : selectedSchool ? 'Save Changes' : 'Register School'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete School Confirmation Dialog */}
      <Dialog open={Boolean(schoolToDelete)} onClose={() => setSchoolToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete School</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete school "{schoolToDelete?.name}"? All associated data will be soft-deleted. This action is irreversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setSchoolToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SchoolsList;
