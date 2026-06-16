import React, { useState } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import { 
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, 
  DialogTitle, Grid, TextField, MenuItem, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, 
  Alert, IconButton, TablePagination, Tabs, Tab, Chip, Tooltip
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { Add as AddIcon, FileDownload as ExportIcon, Settings as SettingsIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { GET_FEES_LIST, GET_STUDENT_FEE_LEDGER, GET_CLASSES, GET_STUDENTS, COLLECT_STUDENT_FEE, CREATE_FEE_STRUCTURE, UPDATE_FEE_STRUCTURE, DELETE_FEE_STRUCTURE, GET_STUDENT_FEE_STRUCTURE, SAVE_STUDENT_FEE_STRUCTURE } from '../graphql/operations';
import { showToast } from '../store/slices/uiSlice';
import CustomDatePicker from '../components/CustomDatePicker';

function FeesList() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  
  // Role checks
  const isAdmin = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'ACCOUNTANT'].includes(user?.role);

  // States
  const [classId, setClassId] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openStructureModal, setOpenStructureModal] = useState(false);
  const [selectedFeeStruct, setSelectedFeeStruct] = useState(null);
  const [feeStructToDelete, setFeeStructToDelete] = useState(null);
  const [page, setPage] = useState(0);

  // Customize States
  const [openCustomizeModal, setOpenCustomizeModal] = useState(false);
  const [selectedStudentForCustomize, setSelectedStudentForCustomize] = useState(null);
  const [customizeComponents, setCustomizeComponents] = useState([]);

  // Reset page when class filter changes
  React.useEffect(() => {
    setPage(0);
    setPageLedger(0);
  }, [classId]);

  // States
  const [activeTab, setActiveTab] = useState(0);
  const [pageLedger, setPageLedger] = useState(0);

  // Form States for fee payment collection
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedFee, setSelectedFee] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState('');

  // Form States for fee structure creation
  const [structTitle, setStructTitle] = useState('');
  const [structCategory, setStructCategory] = useState('TUITION');
  const [structAmount, setStructAmount] = useState('');
  const [structClassId, setStructClassId] = useState('');
  const [structDueDate, setStructDueDate] = useState('');
  const [structAcademicYear, setStructAcademicYear] = useState('2026-2027');
  const [structDescription, setStructDescription] = useState('');
  const [structFormError, setStructFormError] = useState('');

  // Queries
  const { loading: feesLoading, error: feesError, data: feesData, refetch } = useQuery(GET_FEES_LIST, {
    variables: { classId: classId || undefined }
  });

  const { loading: ledgerLoading, error: ledgerError, data: ledgerData, refetch: refetchLedger } = useQuery(GET_STUDENT_FEE_LEDGER, {
    variables: { classId: classId || undefined }
  });

  const { data: classesData } = useQuery(GET_CLASSES);
  const { data: studentsData } = useQuery(GET_STUDENTS);

  // Mutations
  const [collectFeeMutation, { loading: payLoading }] = useMutation(COLLECT_STUDENT_FEE, {
    onCompleted: () => {
      setOpenModal(false);
      refetch();
      refetchLedger();
      // Reset forms
      setSelectedStudent('');
      setSelectedFee('');
      setAmountPaid('');
      setReferenceNo('');
      setRemarks('');
      dispatch(showToast({ message: 'Fee payment recorded successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [createFeeStructureMutation, { loading: structLoading }] = useMutation(CREATE_FEE_STRUCTURE, {
    onCompleted: () => {
      setOpenStructureModal(false);
      clearStructureForm();
      refetch();
      refetchLedger();
      dispatch(showToast({ message: 'Fee structure created successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setStructFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateFeeStructureMutation, { loading: structUpdateLoading }] = useMutation(UPDATE_FEE_STRUCTURE, {
    onCompleted: () => {
      setOpenStructureModal(false);
      clearStructureForm();
      refetch();
      refetchLedger();
      dispatch(showToast({ message: 'Fee structure updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setStructFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteFeeStructureMutation, { loading: deleteLoading }] = useMutation(DELETE_FEE_STRUCTURE, {
    onCompleted: () => {
      setFeeStructToDelete(null);
      refetch();
      refetchLedger();
      dispatch(showToast({ message: 'Fee structure deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [getStudentFeeStructure, { loading: structureLoading }] = useLazyQuery(GET_STUDENT_FEE_STRUCTURE, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.getStudentFeeStructure) {
        const comps = data.getStudentFeeStructure.components.map(c => ({
          id: c.id,
          name: c.name,
          category: c.category,
          amount: c.amount,
          dueDate: c.dueDate ? c.dueDate.split('T')[0] : '',
          description: c.description || ''
        }));
        setCustomizeComponents(comps);
      }
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [saveStudentFeeStructureMutation, { loading: saveStructureLoading }] = useMutation(SAVE_STUDENT_FEE_STRUCTURE, {
    onCompleted: () => {
      setOpenCustomizeModal(false);
      refetchLedger();
      dispatch(showToast({ message: 'Student fee structure customized successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearStructureForm = () => {
    setStructTitle('');
    setStructCategory('TUITION');
    setStructAmount('');
    setStructClassId('');
    setStructDueDate('');
    setStructAcademicYear('2026-2027');
    setStructDescription('');
    setStructFormError('');
    setSelectedFeeStruct(null);
  };

  const handlePaySubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedStudent || !selectedFee || !amountPaid) {
      setFormError('Please select a student, a fee structure, and enter an amount.');
      return;
    }

    collectFeeMutation({
      variables: {
        studentId: selectedStudent,
        feeId: selectedFee,
        amountPaid: parseFloat(amountPaid),
        paymentMethod,
        referenceNo,
        remarks
      }
    });
  };

  const handleStructSubmit = (e) => {
    e.preventDefault();
    setStructFormError('');

    if (!structTitle || !structCategory || !structAmount || !structClassId || !structDueDate || !structAcademicYear) {
      setStructFormError('All fields marked with an asterisk (*) are required.');
      return;
    }

    const vars = {
      title: structTitle,
      category: structCategory,
      amount: parseFloat(structAmount),
      classId: structClassId,
      dueDate: structDueDate,
      academicYear: structAcademicYear,
      description: structDescription
    };

    if (selectedFeeStruct) {
      updateFeeStructureMutation({
        variables: {
          id: selectedFeeStruct.id,
          ...vars
        }
      });
    } else {
      createFeeStructureMutation({ variables: vars });
    }
  };

  const handleEditStruct = (fee) => {
    setSelectedFeeStruct(fee);
    setStructTitle(fee.title);
    setStructCategory(fee.category);
    setStructAmount(fee.amount);
    setStructClassId(fee.classId?.id || '');
    setStructDueDate(fee.dueDate ? fee.dueDate.split('T')[0] : '');
    setStructAcademicYear(fee.academicYear);
    setStructDescription(fee.description || '');
    setOpenStructureModal(true);
  };

  const handleConfirmDelete = () => {
    if (!feeStructToDelete) return;
    deleteFeeStructureMutation({ variables: { id: feeStructToDelete.id } });
  };

  const handleOpenCustomizeModal = (ledgerItem) => {
    setSelectedStudentForCustomize(ledgerItem);
    setCustomizeComponents([]);
    setOpenCustomizeModal(true);
    getStudentFeeStructure({
      variables: {
        studentId: ledgerItem.studentId,
        academicYear: '2026-2027'
      }
    });
  };

  const handleUpdateComponent = (index, field, value) => {
    const updated = [...customizeComponents];
    updated[index] = { ...updated[index], [field]: value };
    setCustomizeComponents(updated);
  };

  const handleAddComponent = () => {
    setCustomizeComponents([
      ...customizeComponents,
      {
        id: 'new-' + Date.now(),
        name: '',
        category: 'TUITION',
        amount: 0,
        dueDate: new Date().toISOString().split('T')[0],
        description: ''
      }
    ]);
  };

  const handleDeleteComponent = (index) => {
    const updated = customizeComponents.filter((_, i) => i !== index);
    setCustomizeComponents(updated);
  };

  const handleSaveCustomize = () => {
    for (const comp of customizeComponents) {
      if (!comp.name.trim()) {
        dispatch(showToast({ message: 'Component name is required.', severity: 'warning' }));
        return;
      }
      if (comp.amount === '' || isNaN(parseFloat(comp.amount))) {
        dispatch(showToast({ message: 'Component amount must be a valid number.', severity: 'warning' }));
        return;
      }
      if (!comp.dueDate) {
        dispatch(showToast({ message: 'Component due date is required.', severity: 'warning' }));
        return;
      }
    }

    const cleanedComponents = customizeComponents.map(c => ({
      name: c.name,
      category: c.category,
      amount: parseFloat(c.amount),
      dueDate: c.dueDate,
      description: c.description
    }));

    saveStudentFeeStructureMutation({
      variables: {
        studentId: selectedStudentForCustomize.studentId,
        academicYear: '2026-2027',
        components: cleanedComponents
      }
    });
  };

  const handleExport = async (format) => {
    try {
      const response = await fetch(`http://localhost:5000/api/export/${format}/fees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Export request failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fees-ledger.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Error exporting report: ' + err.message);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Fees Ledger & Collection
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={() => handleExport('pdf')} sx={{ width: { xs: '100%', sm: 'auto' } }}>PDF Report</Button>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={() => handleExport('excel')} sx={{ width: { xs: '100%', sm: 'auto' } }}>Excel Sheet</Button>
          
          {isAdmin && (
            <Button 
              variant="outlined" 
              startIcon={<SettingsIcon />} 
              onClick={() => { clearStructureForm(); setOpenStructureModal(true); }}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Add Fee Structure
            </Button>
          )}

          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpenModal(true)}
            sx={{ width: { xs: '100%', sm: 'auto' }, background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF' }}
          >
            Collect Fee Payment
          </Button>
        </Box>
      </Box>

      {/* Filter Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Filter Fees by Class"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <MenuItem value="">All Classes</MenuItem>
                {classesData?.getClasses.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs Selector */}
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)} 
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Fee Structures & Invoices" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }} />
        <Tab label="Student Payment Ledger" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }} />
      </Tabs>

      {/* Data Table */}
      {activeTab === 0 ? (
        feesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
        ) : feesError ? (
          <Alert severity="error">{feesError.message}</Alert>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Fee Invoice Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Billing Amount</TableCell>
                    <TableCell>Target Class</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Academic Term</TableCell>
                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(feesData?.getFeesList || [])
                    .slice(page * 10, (page + 1) * 10)
                    .map((fee) => (
                      <TableRow key={fee.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{fee.title}</TableCell>
                        <TableCell>{fee.category}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>₹{fee.amount}</TableCell>
                        <TableCell>{fee.classId?.name}</TableCell>
                        <TableCell>{new Date(fee.dueDate).toISOString().split('T')[0]}</TableCell>
                        <TableCell>{fee.academicYear}</TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            <IconButton color="primary" onClick={() => handleEditStruct(fee)}><EditIcon /></IconButton>
                            <IconButton color="error" onClick={() => setFeeStructToDelete(fee)}><DeleteIcon /></IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  {(!feesData?.getFeesList || feesData.getFeesList.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} align="center">No data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {feesData?.getFeesList?.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[10]}
                component="div"
                count={feesData.getFeesList.length}
                rowsPerPage={10}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
              />
            )}
          </>
        )
      ) : (
        ledgerLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
        ) : ledgerError ? (
          <Alert severity="error">{ledgerError.message}</Alert>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Admission No.</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Total Payable</TableCell>
                    <TableCell>Total Paid</TableCell>
                    <TableCell>Outstanding Balance</TableCell>
                    <TableCell>Status</TableCell>
                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(ledgerData?.getStudentFeeLedger || [])
                    .slice(pageLedger * 10, (pageLedger + 1) * 10)
                    .map((ledgerItem) => {
                      const outstanding = ledgerItem.outstanding;
                      const payable = ledgerItem.totalPayable;
                      const paid = ledgerItem.totalPaid;
                      
                      let statusText = 'NO FEES';
                      let statusColor = 'default';
                      
                      if (payable > 0) {
                        if (outstanding === 0) {
                          statusText = 'PAID';
                          statusColor = 'success';
                        } else if (paid > 0) {
                          statusText = 'PARTIAL';
                          statusColor = 'warning';
                        } else {
                          statusText = 'UNPAID';
                          statusColor = 'error';
                        }
                      }
                      
                      return (
                        <TableRow key={ledgerItem.studentId} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{ledgerItem.studentName}</TableCell>
                          <TableCell>{ledgerItem.admissionNo}</TableCell>
                          <TableCell>{ledgerItem.className}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>₹{payable}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>₹{paid}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: outstanding > 0 ? '#EF4444' : '#10B981' }}>
                            ₹{outstanding}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={statusText} 
                              color={statusColor} 
                              size="small" 
                              sx={{ fontWeight: 700, fontSize: '0.75rem' }} 
                            />
                          </TableCell>
                          {isAdmin && (
                            <TableCell align="right">
                              <Tooltip title="Customize Student Fees">
                                <IconButton 
                                  color="secondary" 
                                  onClick={() => handleOpenCustomizeModal(ledgerItem)}
                                >
                                  <SettingsIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  {(!ledgerData?.getStudentFeeLedger || ledgerData.getStudentFeeLedger.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 8 : 7} align="center">No student ledger data found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {ledgerData?.getStudentFeeLedger?.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[10]}
                component="div"
                count={ledgerData.getStudentFeeLedger.length}
                rowsPerPage={10}
                page={pageLedger}
                onPageChange={(e, newPage) => setPageLedger(newPage)}
              />
            )}
          </>
        )
      )}

      {/* Collect Fee Payment Dialog Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Record Student Fee Payment</DialogTitle>
        <form onSubmit={handlePaySubmit}>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  fullWidth required select label="Select Student" 
                  value={selectedStudent} 
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  {studentsData?.getStudents.map((st) => (
                    <MenuItem key={st.id} value={st.id}>
                      {`${st.firstName} ${st.lastName} (${st.admissionNo})`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField 
                  fullWidth required select label="Select Fee Invoice" 
                  value={selectedFee} 
                  onChange={(e) => setSelectedFee(e.target.value)}
                >
                  {feesData?.getFeesList.map((fee) => (
                    <MenuItem key={fee.id} value={fee.id}>
                      {`${fee.title} - ₹${fee.amount}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth required type="number" label="Amount Paid (₹)" 
                  value={amountPaid} 
                  onChange={(e) => setAmountPaid(e.target.value)} 
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth required select label="Payment Mode" 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="CARD">Credit/Debit Card</MenuItem>
                  <MenuItem value="ONLINE">Online Gateway</MenuItem>
                  <MenuItem value="BANK_TRANSFER">Bank Wire Transfer</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField 
                  fullWidth label="Reference/Transaction ID" 
                  value={referenceNo} 
                  onChange={(e) => setReferenceNo(e.target.value)} 
                />
              </Grid>

              <Grid item xs={12}>
                <TextField 
                  fullWidth multiline rows={2} label="Memo / Remarks" 
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)} 
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Button onClick={() => setOpenModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={payLoading}>
              {payLoading ? 'Saving...' : 'Record Payment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add/Edit Fee Structure Modal */}
      <Dialog open={openStructureModal} onClose={() => setOpenStructureModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedFeeStruct ? 'Update Fee Structure' : 'Create New Fee Structure'}</DialogTitle>
        <form onSubmit={handleStructSubmit}>
          <DialogContent>
            {structFormError && <Alert severity="error" sx={{ mb: 2 }}>{structFormError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  fullWidth required label="Fee Invoice Title" 
                  placeholder="e.g. Tuition Fee - Q1"
                  value={structTitle} 
                  onChange={(e) => setStructTitle(e.target.value)} 
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth required select label="Category" 
                  value={structCategory} 
                  onChange={(e) => setStructCategory(e.target.value)}
                >
                  <MenuItem value="TUITION">Tuition Fee</MenuItem>
                  <MenuItem value="EXAMINATION">Examination Fee</MenuItem>
                  <MenuItem value="TRANSPORT">Transport Fee</MenuItem>
                  <MenuItem value="LIBRARY">Library Fee</MenuItem>
                  <MenuItem value="ADMISSION">Admission Fee</MenuItem>
                  <MenuItem value="SPORTS">Sports Fee</MenuItem>
                  <MenuItem value="OTHER">Other Fee</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth required type="number" label="Billing Amount (₹)" 
                  value={structAmount} 
                  onChange={(e) => setStructAmount(e.target.value)} 
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth required select label="Target Class" 
                  value={structClassId} 
                  onChange={(e) => setStructClassId(e.target.value)}
                >
                  {classesData?.getClasses.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <CustomDatePicker 
                  fullWidth required label="Due Date" 
                  value={structDueDate} 
                  onChange={(e) => setStructDueDate(e.target.value)} 
                />
              </Grid>

              <Grid item xs={12}>
                <TextField 
                  fullWidth required label="Academic Term / Year" 
                  value={structAcademicYear} 
                  onChange={(e) => setStructAcademicYear(e.target.value)} 
                />
              </Grid>

              <Grid item xs={12}>
                <TextField 
                  fullWidth multiline rows={2} label="Description" 
                  value={structDescription} 
                  onChange={(e) => setStructDescription(e.target.value)} 
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Button onClick={() => setOpenStructureModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={structLoading}>
              {structLoading ? 'Creating...' : 'Create Structure'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(feeStructToDelete)} onClose={() => setFeeStructToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Fee Structure</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete fee structure "{feeStructToDelete?.title}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setFeeStructToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customize Student Fee Structure Dialog */}
      <Dialog 
        open={openCustomizeModal} 
        onClose={() => setOpenCustomizeModal(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
            Customize Fee Structure
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Student: <strong>{selectedStudentForCustomize?.studentName}</strong> | Class: <strong>{selectedStudentForCustomize?.className}</strong> | Admission No: <strong>{selectedStudentForCustomize?.admissionNo}</strong>
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: '300px' }}>
          {structureLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {customizeComponents.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    No fee components found for this student.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddComponent}
                  >
                    Add First Fee Component
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                    Fee Components Breakup
                  </Typography>
                  {customizeComponents.map((comp, idx) => (
                    <Box 
                      key={comp.id || idx} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: 2, 
                        position: 'relative', 
                        bgcolor: 'background.neutral' 
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Component Name"
                            required
                            value={comp.name}
                            onChange={(e) => handleUpdateComponent(idx, 'name', e.target.value)}
                            placeholder="e.g. Scholarship Tuition Fee"
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            size="small"
                            select
                            label="Category"
                            value={comp.category}
                            onChange={(e) => handleUpdateComponent(idx, 'category', e.target.value)}
                          >
                            <MenuItem value="TUITION">Tuition Fee</MenuItem>
                            <MenuItem value="TRANSPORT">Transport Fee</MenuItem>
                            <MenuItem value="EXAMINATION">Examination Fee</MenuItem>
                            <MenuItem value="LIBRARY">Library Fee</MenuItem>
                            <MenuItem value="ADMISSION">Admission Fee</MenuItem>
                            <MenuItem value="SPORTS">Sports Fee</MenuItem>
                            <MenuItem value="UNIFORM">Uniform Fee</MenuItem>
                            <MenuItem value="BOOKS">Books Fee</MenuItem>
                            <MenuItem value="DISCOUNT">Discount</MenuItem>
                            <MenuItem value="FINE">Fine</MenuItem>
                            <MenuItem value="OTHER">Other Fee</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={2.5}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Amount (₹)"
                            required
                            value={comp.amount}
                            onChange={(e) => handleUpdateComponent(idx, 'amount', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <CustomDatePicker
                            fullWidth
                            size="small"
                            label="Due Date"
                            required
                            value={comp.dueDate}
                            onChange={(e) => handleUpdateComponent(idx, 'dueDate', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={0.5} sx={{ textAlign: 'right' }}>
                          <Tooltip title="Remove Component">
                            <IconButton 
                              color="error" 
                              size="small" 
                              onClick={() => handleDeleteComponent(idx)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Description"
                            value={comp.description}
                            onChange={(e) => handleUpdateComponent(idx, 'description', e.target.value)}
                            placeholder="Optional details, e.g. Special scholarship rate"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddComponent}
                    sx={{ mt: 1 }}
                  >
                    Add Component
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
          <Button onClick={() => setOpenCustomizeModal(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCustomize} 
            variant="contained" 
            disabled={saveStructureLoading || structureLoading}
            sx={{ background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF' }}
          >
            {saveStructureLoading ? 'Saving Changes...' : 'Save Structure'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FeesList;
