import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, TextField, MenuItem, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress,
  Alert, Chip, IconButton, Avatar, InputAdornment, TablePagination
} from '@mui/material';
import { Add as AddIcon, CheckCircle as ApproveIcon, Cancel as RejectIcon, Block as SuspendIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import { GET_SCHOOLS, CREATE_SCHOOL, UPDATE_SCHOOL, DELETE_SCHOOL } from '../graphql/operations';
import { BACKEND_URL } from '../graphql/client';

const getSchoolLogoUrl = (logoPath) => {
  if (!logoPath) return '';
  if (logoPath.startsWith('http')) return logoPath;
  return `${BACKEND_URL}${logoPath}`;
};

function SchoolsList() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [openModal, setOpenModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [page, setPage] = useState(0);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('BASIC');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [formError, setFormError] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [logo, setLogo] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const result = await response.json();
      if (response.ok) {
        setLogo(result.url);
        setSchoolLogo(result.url);
        dispatch(showToast({ message: 'Logo uploaded successfully!', severity: 'success' }));
      } else {
        dispatch(showToast({ message: result.error || 'Upload failed', severity: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(showToast({ message: 'Error uploading logo', severity: 'error' }));
    } finally {
      setUploading(false);
    }
  };

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
    setStreet('');
    setCity('');
    setState('');
    setZipCode('');
    setCountry('');
    setFormError('');
    setSelectedSchool(null);
    setLogo('');
    setSchoolLogo('');
    setShowPassword(false);
    setOpenModal(false);
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
    setLogo(sch.logo || '');
    setSchoolLogo(sch.schoolLogo || '');
    setStreet(sch.address?.street || '');
    setCity(sch.address?.city || '');
    setState(sch.address?.state || '');
    setZipCode(sch.address?.zipCode || '');
    setCountry(sch.address?.country || '');
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
          plan,
          logo,
          schoolLogo,
          address: {
            street,
            city,
            state,
            zipCode,
            country
          }
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
        adminPassword,
        logo,
        schoolLogo,
        address: {
          street,
          city,
          state,
          zipCode,
          country
        }
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
        <>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }} width="80px">Logo</TableCell>
                  <TableCell>School Name</TableCell>
                  <TableCell>Subdomain Slug</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Subscription Plan</TableCell>
                  <TableCell>Account Status</TableCell>
                  <TableCell>Contact Email</TableCell>
                  <TableCell>Onboarding Date</TableCell>
                  <TableCell align="right">Actions / Control</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.getSchools || [])
                  .slice(page * 10, (page + 1) * 10)
                  .map((sch) => (
                    <TableRow key={sch.id} hover>
                      <TableCell>
                        <Avatar 
                          src={getSchoolLogoUrl(sch.schoolLogo || sch.logo)} 
                          variant="rounded"
                          sx={{ width: 40, height: 40, border: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}
                        >
                          {sch.name?.charAt(0) || ''}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{sch.name}</TableCell>
                      <TableCell>{sch.slug}</TableCell>
                      <TableCell>{sch.address?.city || '—'}</TableCell>
                      <TableCell>{sch.address?.state || '—'}</TableCell>
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
                {(!data?.getSchools || data.getSchools.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No data</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {data?.getSchools?.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10]}
              component="div"
              count={data.getSchools.length}
              rowsPerPage={10}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
            />
          )}
        </>
      )}

      {/* Provision/Edit School Dialog Modal */}
      <Dialog 
        open={openModal} 
        onClose={clearForm} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          component: 'form',
          onSubmit: handleSubmit,
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(148, 163, 184, 0.3)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'rgba(148, 163, 184, 0.5)',
            },
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedSchool ? 'Edit School Details' : 'Register School for Approval'}</DialogTitle>
        <DialogContent
          dividers
          sx={{
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(148, 163, 184, 0.3)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'rgba(148, 163, 184, 0.5)',
            },
          }}
        >
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar 
                  src={getSchoolLogoUrl(schoolLogo || logo)} 
                  variant="rounded" 
                  sx={{ width: 64, height: 64, border: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}
                >
                  {name?.charAt(0) || 'S'}
                </Avatar>
                <Button variant="outlined" component="label" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload School Logo'}
                  <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </Button>
              </Grid>
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
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1 }}>
                  School Address Configuration
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Zip/Postal Code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
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
                    <TextField 
                      fullWidth 
                      required 
                      type={showPassword ? 'text' : 'password'} 
                      label="Admin Password" 
                      value={adminPassword} 
                      onChange={(e) => setAdminPassword(e.target.value)} 
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
