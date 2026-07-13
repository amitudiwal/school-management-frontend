import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Card, CardContent, Grid, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress,
  Alert, IconButton, InputAdornment, Avatar, TablePagination, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Stack, Tooltip, Divider,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon, Visibility as ViewIcon, Print as PrintIcon, Add as AddIcon,
  Close as CloseIcon, CalendarToday as CalendarIcon, School as SchoolIcon,
  Badge as BadgeIcon, HelpOutline as HelpIcon, History as HistoryIcon,
  Phone as PhoneIcon, Person as PersonIcon, Description as DocIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import { GET_STUDENTS, GET_CLASSES, GET_SECTIONS, REGISTER_ALUMNI } from '../graphql/operations';
import { BACKEND_URL } from '../graphql/client';

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  return `${BACKEND_URL}${avatarPath}`;
};

function AlumniManagement() {
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedAlumnus, setSelectedAlumnus] = useState(null);

  // Add Alumni Dialog States
  const [openAddModal, setOpenAddModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dob, setDob] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formSectionId, setFormSectionId] = useState('');
  const [tcNumber, setTcNumber] = useState('');
  const [tcDate, setTcDate] = useState(new Date().toISOString().split('T')[0]);
  const [tcReason, setTcReason] = useState('');
  const [tcDestination, setTcDestination] = useState('');
  const [formError, setFormError] = useState('');

  // Load students with status 'ALUMNI'
  const { data: alumniData, loading, error, refetch } = useQuery(GET_STUDENTS, {
    variables: { status: 'ALUMNI', search: search || undefined }
  });

  const { data: classesData } = useQuery(GET_CLASSES);
  const { data: sectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: formClassId || undefined },
    skip: !formClassId
  });

  const [registerAlumniMutation, { loading: addLoading }] = useMutation(REGISTER_ALUMNI, {
    onCompleted: () => {
      dispatch(showToast({ message: 'Historical Alumni added successfully!', severity: 'success' }));
      setOpenAddModal(false);
      clearForm();
      refetch();
    },
    onError: (err) => {
      setFormError(err.message);
    }
  });

  const alumniList = alumniData?.getStudents || [];

  const handlePrintTC = (studentId) => {
    window.open(`/print/certificate?studentId=${studentId}&type=transfer`, '_blank');
  };

  const clearForm = () => {
    setFirstName('');
    setLastName('');
    setAdmissionNo('');
    setRollNo('');
    setGender('MALE');
    setDob('');
    setFormClassId('');
    setFormSectionId('');
    setTcNumber('');
    setTcDate(new Date().toISOString().split('T')[0]);
    setTcReason('');
    setTcDestination('');
    setFormError('');
  };

  const handleOpenAddModal = () => {
    clearForm();
    setOpenAddModal(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!firstName || !lastName || !admissionNo || !dob || !formClassId || !formSectionId || !tcNumber || !tcReason) {
      setFormError('Please fill out all required fields.');
      return;
    }

    registerAlumniMutation({
      variables: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        admissionNo: admissionNo.trim(),
        rollNo: rollNo.trim() || null,
        gender,
        dateOfBirth: dob,
        classId: formClassId,
        sectionId: formSectionId,
        tcNumber: tcNumber.trim(),
        transferDate: tcDate,
        reason: tcReason.trim(),
        destinationSchool: tcDestination.trim() || null
      }
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Alumni Directory & Records
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddModal}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Add Historical Alumni
          </Button>
          <Chip label={`Total Alumni: ${alumniList.length}`} color="secondary" sx={{ fontWeight: 700, px: 1 }} />
        </Stack>
      </Box>

      {/* Filter and Search Bar */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <TextField
                fullWidth
                placeholder="Search alumni by name or admission number..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress color="secondary" />
        </Box>
      ) : error ? (
        <Alert severity="error">Error loading alumni records: {error.message}</Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }} width="80px">Photo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Admission No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>TC Certificate No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Leaving Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Destination School</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alumniList
                  .slice(page * 10, (page + 1) * 10)
                  .map((alumnus) => (
                    <TableRow key={alumnus.id} hover>
                      <TableCell>
                        <Avatar src={getAvatarUrl(alumnus.userId?.avatar)} sx={{ width: 44, height: 44, border: '1px solid', borderColor: 'divider' }}>
                          {alumnus.firstName?.charAt(0) || ''}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{alumnus.admissionNo}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{`${alumnus.firstName} ${alumnus.lastName}`}</TableCell>
                      <TableCell>
                        <Chip label={alumnus.transferInfo?.tcNumber || 'N/A'} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        {alumnus.transferInfo?.transferDate ? new Date(alumnus.transferInfo.transferDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{alumnus.transferInfo?.reason || '-'}</TableCell>
                      <TableCell>{alumnus.transferInfo?.destinationSchool || '-'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="View Student Profile & History">
                            <IconButton color="info" onClick={() => setSelectedAlumnus(alumnus)}>
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print Transfer Certificate (TC)">
                            <IconButton color="secondary" onClick={() => handlePrintTC(alumnus.id)}>
                              <PrintIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                {alumniList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>
                        No alumni records found. Issue a TC to a student to archive them as alumni.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {alumniList.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10]}
              component="div"
              count={alumniList.length}
              rowsPerPage={10}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
            />
          )}
        </>
      )}

      {/* Add Historical Alumni Modal */}
      <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
          Add Historical Alumni Record
        </DialogTitle>
        <form onSubmit={handleAddSubmit}>
          <DialogContent dividers>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Admission Number"
                  value={admissionNo}
                  onChange={(e) => setAdmissionNo(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Roll Number (Optional)"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Date of Birth"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Class & Section selection */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Leaving Class"
                  value={formClassId}
                  onChange={(e) => {
                    setFormClassId(e.target.value);
                    setFormSectionId('');
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
                  required
                  label="Leaving Section"
                  value={formSectionId}
                  disabled={!formClassId}
                  onChange={(e) => setFormSectionId(e.target.value)}
                >
                  {sectionsData?.getSections.map((sec) => (
                    <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}><Chip label="Transfer Details" size="small" /></Divider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="TC Certificate Number"
                  value={tcNumber}
                  onChange={(e) => setTcNumber(e.target.value)}
                  placeholder="e.g. TC/2026/001"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Departure Date / TC Issued Date"
                  value={tcDate}
                  onChange={(e) => setTcDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Reason for Leaving"
                  value={tcReason}
                  onChange={(e) => setTcReason(e.target.value)}
                  placeholder="e.g. Relocated to green valley"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Destination School/College (Optional)"
                  value={tcDestination}
                  onChange={(e) => setTcDestination(e.target.value)}
                  placeholder="e.g. Greenwood Institute of Technology"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenAddModal(false)} variant="outlined">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="secondary" disabled={addLoading}>
              {addLoading ? 'Saving...' : 'Add Alumni'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Alumnus History & Profile Dialog */}
      <Dialog open={Boolean(selectedAlumnus)} onClose={() => setSelectedAlumnus(null)} maxWidth="md" fullWidth>
        {selectedAlumnus && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                Alumni History & Details
              </Typography>
              <IconButton onClick={() => setSelectedAlumnus(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Header Information */}
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  <Avatar src={getAvatarUrl(selectedAlumnus.userId?.avatar)} sx={{ width: 75, height: 75, border: '2px solid', borderColor: 'secondary.main' }}>
                    {selectedAlumnus.firstName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {selectedAlumnus.firstName} {selectedAlumnus.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Admission No: {selectedAlumnus.admissionNo} | Gender: {selectedAlumnus.gender}
                    </Typography>
                    <Chip label="ARCHIVED ALUMNI" size="small" color="secondary" sx={{ mt: 0.5, fontWeight: 700 }} />
                  </Box>
                </Grid>

                {/* Transfer/TC Details */}
                <Grid item xs={12}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BadgeIcon /> TRANSFER CERTIFICATE (TC) INFORMATION
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" display="block" opacity={0.8}>TC Certificate Number</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedAlumnus.transferInfo?.tcNumber || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" display="block" opacity={0.8}>Date of Departure</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {selectedAlumnus.transferInfo?.transferDate ? new Date(selectedAlumnus.transferInfo.transferDate).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" display="block" opacity={0.8}>Reason for Leaving</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedAlumnus.transferInfo?.reason || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" display="block" opacity={0.8}>Destination Institution</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedAlumnus.transferInfo?.destinationSchool || 'Not Specified'}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* Academic Profile */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon color="primary" /> ACADEMIC PROFILE
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Admitted Class</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAlumnus.classId?.name} - {selectedAlumnus.sectionId?.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Admission Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedAlumnus.admissionDate ? new Date(selectedAlumnus.admissionDate).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedAlumnus.dateOfBirth ? new Date(selectedAlumnus.dateOfBirth).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Family Details */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" /> PARENT & CONTACT INFO
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Parent Name</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedAlumnus.parentId ? `${selectedAlumnus.parentId.firstName} ${selectedAlumnus.parentId.lastName}` : '-'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Emergency Contact Phone</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAlumnus.mobileNumber || '-'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Permanent Address</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedAlumnus.permanentAddress || `${selectedAlumnus.address?.street || ''}, ${selectedAlumnus.address?.city || ''}`}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Promotion Timeline / Student History */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon color="primary" /> PROMOTION HISTORY & TIMELINE
                  </Typography>
                  {selectedAlumnus.promotionHistory && selectedAlumnus.promotionHistory.length > 0 ? (
                    <Box sx={{ borderLeft: '3px solid', borderColor: 'primary.main', pl: 2, ml: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedAlumnus.promotionHistory.map((history, idx) => (
                        <Box key={idx} sx={{ position: 'relative' }}>
                          {/* Dot badge on vertical timeline */}
                          <Box sx={{
                            position: 'absolute',
                            left: '-24px',
                            top: '4px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            border: '2px solid #FFF'
                          }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Promoted from {history.fromClassId?.name || 'Previous Class'} to {history.toClassId?.name || 'Next Class'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Academic Year: {history.academicYear} | Promoted on: {history.promotedAt ? new Date(history.promotedAt).toLocaleDateString() : '-'}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No promotional tracking history recorded.
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PrintIcon />}
                onClick={() => handlePrintTC(selectedAlumnus.id)}
              >
                Print Transfer Certificate (TC)
              </Button>
              <Button onClick={() => setSelectedAlumnus(null)} variant="outlined">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default AlumniManagement;
