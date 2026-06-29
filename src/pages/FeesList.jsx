import React, { useState } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import { 
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, 
  DialogTitle, Grid, TextField, MenuItem, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, 
  Alert, IconButton, TablePagination, Tabs, Tab, Chip, Tooltip, Checkbox,
  Stack
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { Add as AddIcon, FileDownload as ExportIcon, Settings as SettingsIcon, Edit as EditIcon, Delete as DeleteIcon, FilterList as FilterListIcon } from '@mui/icons-material';
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

  // Filter States for Student Ledger
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterAdmissionNo, setFilterAdmissionNo] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMinOutstanding, setFilterMinOutstanding] = useState('');
  const [filterMaxOutstanding, setFilterMaxOutstanding] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    admissionNo: '',
    classId: '',
    status: '',
    minOutstanding: '',
    maxOutstanding: ''
  });

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
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState('');
  const [paymentStudentComponents, setPaymentStudentComponents] = useState([]);
  const [feePaymentsState, setFeePaymentsState] = useState({});
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

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
  const [collectFeeMutation] = useMutation(COLLECT_STUDENT_FEE);

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

  const [getStudentFeeLedgerForPayment, { loading: ledgerLoadingForPayment }] = useLazyQuery(GET_STUDENT_FEE_LEDGER, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.getStudentFeeLedger && data.getStudentFeeLedger.length > 0) {
        const ledgerItem = data.getStudentFeeLedger[0];
        setPaymentStudentComponents(ledgerItem.componentsBreakdown || []);
        
        // Initialize checked components and payment amounts
        const initialPayments = {};
        (ledgerItem.componentsBreakdown || []).forEach(c => {
          initialPayments[c.componentId] = {
            checked: false,
            amountPaid: c.remaining.toString()
          };
        });
        setFeePaymentsState(initialPayments);
      } else {
        setPaymentStudentComponents([]);
        setFeePaymentsState({});
      }
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  React.useEffect(() => {
    if (selectedStudent) {
      getStudentFeeLedgerForPayment({
        variables: {
          studentId: selectedStudent
        }
      });
    } else {
      setPaymentStudentComponents([]);
      setFeePaymentsState({});
    }
  }, [selectedStudent, getStudentFeeLedgerForPayment]);

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

  const hasActiveFilters = Boolean(
    appliedFilters.name || 
    appliedFilters.admissionNo || 
    appliedFilters.classId || 
    appliedFilters.status || 
    appliedFilters.minOutstanding || 
    appliedFilters.maxOutstanding
  );

  const clearAllFilters = () => {
    const defaultFilters = {
      name: '',
      admissionNo: '',
      classId: '',
      status: '',
      minOutstanding: '',
      maxOutstanding: ''
    };
    setAppliedFilters(defaultFilters);
    setFilterName('');
    setFilterAdmissionNo('');
    setFilterClassId('');
    setFilterStatus('');
    setFilterMinOutstanding('');
    setFilterMaxOutstanding('');
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      name: filterName,
      admissionNo: filterAdmissionNo,
      classId: filterClassId,
      status: filterStatus,
      minOutstanding: filterMinOutstanding,
      maxOutstanding: filterMaxOutstanding
    });
    setOpenFilterModal(false);
    setPageLedger(0);
  };

  const filteredLedger = React.useMemo(() => {
    return (ledgerData?.getStudentFeeLedger || []).filter(item => {
      if (appliedFilters.name && !item.studentName.toLowerCase().includes(appliedFilters.name.toLowerCase())) {
        return false;
      }
      if (appliedFilters.admissionNo && !item.admissionNo.toLowerCase().includes(appliedFilters.admissionNo.toLowerCase())) {
        return false;
      }
      if (appliedFilters.classId) {
        const selectedClass = classesData?.getClasses.find(c => c.id === appliedFilters.classId);
        if (selectedClass && item.className !== selectedClass.name) {
          return false;
        }
      }
      if (appliedFilters.status) {
        const payable = item.totalPayable;
        const outstanding = item.outstanding;
        const paid = item.totalPaid;
        let itemStatus = 'NO FEES';
        if (payable > 0) {
          if (outstanding === 0) {
            itemStatus = 'PAID';
          } else if (paid > 0) {
            itemStatus = 'PARTIAL';
          } else {
            itemStatus = 'UNPAID';
          }
        }
        if (appliedFilters.status !== itemStatus) {
          return false;
        }
      }
      if (appliedFilters.minOutstanding && item.outstanding < parseFloat(appliedFilters.minOutstanding)) {
        return false;
      }
      if (appliedFilters.maxOutstanding && item.outstanding > parseFloat(appliedFilters.maxOutstanding)) {
        return false;
      }
      return true;
    });
  }, [ledgerData, appliedFilters, classesData]);

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

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedStudent) {
      setFormError('Please select a student.');
      return;
    }

    const selectedComponents = Object.entries(feePaymentsState)
      .filter(([_, comp]) => comp.checked && parseFloat(comp.amountPaid) > 0)
      .map(([id, comp]) => ({
        componentId: id,
        amountPaid: parseFloat(comp.amountPaid)
      }));

    if (selectedComponents.length === 0) {
      setFormError('Please select at least one fee component and enter a valid amount.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      for (const comp of selectedComponents) {
        await collectFeeMutation({
          variables: {
            studentId: selectedStudent,
            feeId: comp.componentId,
            amountPaid: comp.amountPaid,
            paymentMethod,
            referenceNo,
            remarks
          }
        });
      }

      setOpenModal(false);
      refetch();
      refetchLedger();
      // Reset forms
      setSelectedStudent('');
      setReferenceNo('');
      setRemarks('');
      setFeePaymentsState({});
      dispatch(showToast({ message: 'Fee payments recorded successfully!', severity: 'success' }));
    } catch (err) {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    } finally {
      setIsSubmittingPayment(false);
    }
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
      const moduleName = activeTab === 0 ? 'fees' : 'fees-ledger';
      const response = await fetch(`http://localhost:5000/api/export/${format}/${moduleName}?classId=${classId || ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Export request failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${moduleName === 'fees' ? 'fee-structures' : 'fees-ledger'}.${format === 'excel' ? 'xlsx' : format}`;
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
            {/* Header with Filter Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                Student Ledger Records
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<FilterListIcon />} 
                onClick={() => setOpenFilterModal(true)}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Filter Ledger
              </Button>
            </Box>

            {/* Active Filters Chips */}
            {hasActiveFilters && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 650 }}>
                  Active Filters:
                </Typography>
                {appliedFilters.name && (
                  <Chip 
                    label={`Name: ${appliedFilters.name}`} 
                    onDelete={() => {
                      setAppliedFilters(prev => ({ ...prev, name: '' }));
                      setFilterName('');
                    }} 
                    size="small"
                  />
                )}
                {appliedFilters.admissionNo && (
                  <Chip 
                    label={`Adm No: ${appliedFilters.admissionNo}`} 
                    onDelete={() => {
                      setAppliedFilters(prev => ({ ...prev, admissionNo: '' }));
                      setFilterAdmissionNo('');
                    }} 
                    size="small"
                  />
                )}
                {appliedFilters.classId && (
                  <Chip 
                    label={`Class: ${classesData?.getClasses.find(c => c.id === appliedFilters.classId)?.name}`} 
                    onDelete={() => {
                      setAppliedFilters(prev => ({ ...prev, classId: '' }));
                      setFilterClassId('');
                    }} 
                    size="small"
                  />
                )}
                {appliedFilters.status && (
                  <Chip 
                    label={`Status: ${appliedFilters.status}`} 
                    onDelete={() => {
                      setAppliedFilters(prev => ({ ...prev, status: '' }));
                      setFilterStatus('');
                    }} 
                    size="small"
                  />
                )}
                {appliedFilters.minOutstanding && (
                  <Chip 
                    label={`Min Bal: ₹${appliedFilters.minOutstanding}`} 
                    onDelete={() => {
                      setAppliedFilters(prev => ({ ...prev, minOutstanding: '' }));
                      setFilterMinOutstanding('');
                    }} 
                    size="small"
                  />
                )}
                {appliedFilters.maxOutstanding && (
                  <Chip 
                    label={`Max Bal: ₹${appliedFilters.maxOutstanding}`} 
                    onDelete={() => {
                      setAppliedFilters(prev => ({ ...prev, maxOutstanding: '' }));
                      setFilterMaxOutstanding('');
                    }} 
                    size="small"
                  />
                )}
                <Button 
                  size="small" 
                  onClick={clearAllFilters}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Clear All
                </Button>
              </Box>
            )}

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
                  {filteredLedger
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
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Tooltip title="Record Payment">
                                  <IconButton 
                                    color="success" 
                                    onClick={() => {
                                      setSelectedStudent(ledgerItem.studentId);
                                      setOpenModal(true);
                                    }}
                                    disabled={outstanding === 0}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Customize Student Fees">
                                  <IconButton 
                                    color="secondary" 
                                    onClick={() => handleOpenCustomizeModal(ledgerItem)}
                                  >
                                    <SettingsIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  {filteredLedger.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 8 : 7} align="center">No student ledger data found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {filteredLedger.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[10]}
                component="div"
                count={filteredLedger.length}
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
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                  Select Fee Components to Collect *
                </Typography>
                {ledgerLoadingForPayment ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : paymentStudentComponents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1, fontStyle: 'italic' }}>
                    {selectedStudent ? 'No unpaid fee components found for this student.' : 'Please select a student first.'}
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {paymentStudentComponents.map((comp) => {
                      const compState = feePaymentsState[comp.componentId] || { checked: false, amountPaid: '0' };
                      const isUnpaid = comp.remaining > 0;
                      
                      return (
                        <Box 
                          key={comp.componentId}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            p: 2,
                            border: '1px solid',
                            borderColor: compState.checked ? 'primary.main' : 'divider',
                            borderRadius: 2,
                            bgcolor: compState.checked ? 'action.hover' : 'transparent',
                            transition: 'all 0.2s ease',
                            opacity: isUnpaid ? 1 : 0.6
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Checkbox 
                              checked={compState.checked}
                              disabled={!isUnpaid}
                              onChange={(e) => {
                                setFeePaymentsState({
                                  ...feePaymentsState,
                                  [comp.componentId]: {
                                    ...compState,
                                    checked: e.target.checked
                                  }
                                });
                              }}
                            />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                                {comp.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Total: ₹{comp.totalDue} | Remaining: ₹{comp.remaining} {!isUnpaid && '(PAID)'}
                              </Typography>
                            </Box>
                          </Box>
                          {compState.checked && isUnpaid && (
                            <TextField
                              size="small"
                              type="number"
                              label="Amount to Pay (₹)"
                              value={compState.amountPaid}
                              onChange={(e) => {
                                setFeePaymentsState({
                                  ...feePaymentsState,
                                  [comp.componentId]: {
                                    ...compState,
                                    amountPaid: e.target.value
                                  }
                                });
                              }}
                              sx={{ width: '160px' }}
                              inputProps={{ min: 0, max: comp.remaining }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Grid>

              {Object.values(feePaymentsState).filter(c => c.checked).reduce((sum, c) => sum + (parseFloat(c.amountPaid) || 0), 0) > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.contrastText' }}>
                      Total Amount to Collect
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.contrastText' }}>
                      ₹{Object.values(feePaymentsState).filter(c => c.checked).reduce((sum, c) => sum + (parseFloat(c.amountPaid) || 0), 0)}
                    </Typography>
                  </Box>
                </Grid>
              )}

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
            <Button type="submit" variant="contained" disabled={isSubmittingPayment}>
              {isSubmittingPayment ? 'Saving...' : 'Record Payment'}
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

      {/* Ledger Filter Modal */}
      <Dialog open={openFilterModal} onClose={() => setOpenFilterModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Filter Student Ledger</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <TextField
              fullWidth
              label="Student Name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Search by student name..."
            />
            <TextField
              fullWidth
              label="Admission Number"
              value={filterAdmissionNo}
              onChange={(e) => setFilterAdmissionNo(e.target.value)}
              placeholder="Search by admission number..."
            />
            <TextField
              fullWidth
              select
              label="Class"
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
            >
              <MenuItem value="">All Classes</MenuItem>
              {classesData?.getClasses.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Payment Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="PAID">PAID</MenuItem>
              <MenuItem value="PARTIAL">PARTIAL</MenuItem>
              <MenuItem value="UNPAID">UNPAID</MenuItem>
              <MenuItem value="NO FEES">NO FEES</MenuItem>
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                type="number"
                label="Min Outstanding (₹)"
                value={filterMinOutstanding}
                onChange={(e) => setFilterMinOutstanding(e.target.value)}
              />
              <TextField
                fullWidth
                type="number"
                label="Max Outstanding (₹)"
                value={filterMaxOutstanding}
                onChange={(e) => setFilterMaxOutstanding(e.target.value)}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={clearAllFilters} variant="outlined" color="secondary">
            Reset All
          </Button>
          <Button 
            onClick={handleApplyFilters} 
            variant="contained"
            sx={{ background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF' }}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FeesList;
