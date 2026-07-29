import React, { useState } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import { 
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, 
  DialogTitle, Grid, TextField, MenuItem, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, 
  Alert, IconButton, TablePagination, Tabs, Tab, Chip, Tooltip, Checkbox,
  Stack, Divider, Avatar, LinearProgress
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { 
  Add as AddIcon, FileDownload as ExportIcon, Settings as SettingsIcon, 
  Edit as EditIcon, Delete as DeleteIcon, FilterList as FilterListIcon, 
  AutoAwesome as AutoIcon, School as SchoolIcon, DirectionsBus as BusIcon, 
  Assessment as AssessmentIcon, LocalLibrary as LibraryIcon, EmojiEvents as SportsIcon, 
  TrendingUp as TrendingIcon, PieChart as ChartIcon, Class as ClassIcon, Payment as PaymentIcon
} from '@mui/icons-material';
import { GET_FEES_LIST, GET_STUDENT_FEE_LEDGER, GET_CLASSES, GET_STUDENTS, COLLECT_STUDENT_FEE, CREATE_FEE_STRUCTURE, UPDATE_FEE_STRUCTURE, DELETE_FEE_STRUCTURE, GET_STUDENT_FEE_STRUCTURE, SAVE_STUDENT_FEE_STRUCTURE } from '../graphql/operations';
import { showToast } from '../store/slices/uiSlice';
import CustomDatePicker from '../components/CustomDatePicker';
import { BACKEND_URL } from '../graphql/client';

const PRESETS = [
  { title: 'Tuition Fee - Q1', category: 'TUITION', amount: 6500, desc: 'Quarter 1 Tuition Fee billing' },
  { title: 'Tuition Fee - Q2', category: 'TUITION', amount: 6500, desc: 'Quarter 2 Tuition Fee billing' },
  { title: 'Mid-Term Exam Fee', category: 'EXAMINATION', amount: 1500, desc: 'Mid-Term Exam charges' },
  { title: 'Final Exam Fee', category: 'EXAMINATION', amount: 2000, desc: 'Final Exam charges' },
  { title: 'Monthly Bus Fee', category: 'TRANSPORT', amount: 1200, desc: 'School bus transport monthly pass' },
  { title: 'Annual Sports Fee', category: 'SPORTS', amount: 1000, desc: 'Annual sports meet and amenities charge' },
  { title: 'Library Access Fee', category: 'LIBRARY', amount: 800, desc: 'Library membership and resource fee' },
];

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
  const [quickPayAmount, setQuickPayAmount] = useState('');

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
        setQuickPayAmount('');
      } else {
        setPaymentStudentComponents([]);
        setFeePaymentsState({});
        setQuickPayAmount('');
      }
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  // Financial metrics stats
  const stats = React.useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    let outstanding = 0;
    const classStats = {};
    const categoryStats = {};
    
    const ledger = ledgerData?.getStudentFeeLedger || [];
    ledger.forEach(item => {
      totalBilled += item.totalPayable || 0;
      totalCollected += item.totalPaid || 0;
      outstanding += item.outstanding || 0;
      
      // Class breakdown
      if (item.className) {
        if (!classStats[item.className]) {
          classStats[item.className] = { billed: 0, collected: 0, outstanding: 0, count: 0 };
        }
        classStats[item.className].billed += item.totalPayable || 0;
        classStats[item.className].collected += item.totalPaid || 0;
        classStats[item.className].outstanding += item.outstanding || 0;
        classStats[item.className].count += 1;
      }
      
      // Category breakdown
      (item.componentsBreakdown || []).forEach(comp => {
        const cat = comp.category || 'OTHER';
        if (!categoryStats[cat]) {
          categoryStats[cat] = { billed: 0, collected: 0, outstanding: 0 };
        }
        categoryStats[cat].billed += comp.totalDue || 0;
        categoryStats[cat].collected += comp.totalPaid || 0;
        categoryStats[cat].outstanding += comp.remaining || 0;
      });
    });
    return { totalBilled, totalCollected, outstanding, classStats, categoryStats };
  }, [ledgerData]);

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
      setQuickPayAmount('');
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

  const handleApplyQuickPay = () => {
    const amount = parseFloat(quickPayAmount) || 0;
    if (amount <= 0) return;

    let remaining = amount;
    const updatedState = {};

    // Initial state
    paymentStudentComponents.forEach(comp => {
      updatedState[comp.componentId] = {
        checked: false,
        amountPaid: '0'
      };
    });

    // Distribute among unpaid items
    for (const comp of paymentStudentComponents) {
      if (remaining <= 0) break;
      const compRemaining = comp.remaining;
      if (compRemaining <= 0) continue;

      if (remaining >= compRemaining) {
        updatedState[comp.componentId] = {
          checked: true,
          amountPaid: compRemaining.toString()
        };
        remaining -= compRemaining;
      } else {
        updatedState[comp.componentId] = {
          checked: true,
          amountPaid: remaining.toFixed(2).toString()
        };
        remaining = 0;
      }
    }

    setFeePaymentsState(updatedState);
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
      const response = await fetch(`${BACKEND_URL}/api/export/${format}/${moduleName}?classId=${classId || ''}`, {
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
      {/* Title & Action Buttons Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Fees Ledger & Collection
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={() => handleExport('pdf')} sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: 2, fontWeight: 700 }}>PDF Report</Button>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={() => handleExport('excel')} sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: 2, fontWeight: 700 }}>Excel Sheet</Button>
          


          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => {
              setSelectedStudent('');
              setOpenModal(true);
            }}
            sx={{ 
              width: { xs: '100%', sm: 'auto' }, 
              background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', 
              color: '#FFFFFF', 
              fontWeight: 700,
              borderRadius: 2
            }}
          >
            Collect Fee Payment
          </Button>
        </Box>
      </Box>

      {/* Tabs Menu */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ py: 1 }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} sm={8}>
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)} 
                sx={{ borderBottom: 0 }}
              >
                <Tab label="Collections Dashboard" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }} />
                <Tab label="Fee Structures & Builder" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }} />
                <Tab label="Student Payment Ledger" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }} />
              </Tabs>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                size="small"
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

      {/* Tab 0: Collections Dashboard */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* KPI Summary Cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', 
                color: '#FFFFFF', 
                borderRadius: 4,
                boxShadow: '0 8px 24px rgba(49, 46, 129, 0.25)',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)' }
              }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" sx={{ opacity: 0.8, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1.2 }}>
                        Total Fees Billed
                      </Typography>
                      <Typography variant="h3" sx={{ mt: 1.5, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                        ₹{stats.totalBilled.toLocaleString()}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.1)', width: 56, height: 56 }}>
                      <PaymentIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)', 
                color: '#FFFFFF', 
                borderRadius: 4,
                boxShadow: '0 8px 24px rgba(6, 95, 70, 0.25)',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)' }
              }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" sx={{ opacity: 0.8, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1.2 }}>
                        Total Collected
                      </Typography>
                      <Typography variant="h3" sx={{ mt: 1.5, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                        ₹{stats.totalCollected.toLocaleString()}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.1)', width: 56, height: 56 }}>
                      <TrendingIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%)', 
                color: '#FFFFFF', 
                borderRadius: 4,
                boxShadow: '0 8px 24px rgba(127, 29, 29, 0.25)',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)' }
              }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" sx={{ opacity: 0.8, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1.2 }}>
                        Outstanding Balance
                      </Typography>
                      <Typography variant="h3" sx={{ mt: 1.5, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                        ₹{stats.outstanding.toLocaleString()}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.1)', width: 56, height: 56 }}>
                      <ChartIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Collection Progress & Metrics */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                Fee Collection Coverage Rate
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Proportion of successfully collected fees against the total billed revenue for this term.
              </Typography>
              
              {/* Progress gauge */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Progress (Collected / Billed)
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {(stats.totalBilled > 0 ? (stats.totalCollected / stats.totalBilled) * 100 : 0).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.totalBilled > 0 ? (stats.totalCollected / stats.totalBilled) * 100 : 0} 
                    sx={{ height: 16, borderRadius: 8, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 8, background: 'linear-gradient(90deg, #6366F1 0%, #10B981 100%)' } }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Secondary breakdowns */}
          <Grid container spacing={3}>
            {/* Class Breakdown stats */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.5, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ClassIcon color="primary" /> Class-wise Collection Analysis
                  </Typography>
                  {Object.keys(stats.classStats).length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 4, textAlign: 'center' }}>
                      No ledger data available to break down class statistics.
                    </Typography>
                  ) : (
                    <Stack spacing={2.5}>
                      {Object.entries(stats.classStats).map(([className, classInfo]) => {
                        const classRate = classInfo.billed > 0 ? (classInfo.collected / classInfo.billed) * 100 : 0;
                        return (
                          <Box key={className}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {className}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                ₹{classInfo.collected.toLocaleString()} collected / ₹{classInfo.billed.toLocaleString()} billed ({classRate.toFixed(0)}%)
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={classRate} 
                              sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover' }}
                            />
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Category Breakdown stats */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.5, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChartIcon color="secondary" /> Category-wise Billing Breakdown
                  </Typography>
                  {Object.keys(stats.categoryStats).length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 4, textAlign: 'center' }}>
                      No ledger data available to break down category statistics.
                    </Typography>
                  ) : (
                    <Stack spacing={2.5}>
                      {Object.entries(stats.categoryStats).map(([cat, catInfo]) => {
                        const catRate = catInfo.billed > 0 ? (catInfo.collected / catInfo.billed) * 100 : 0;
                        return (
                          <Box key={cat}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                                {cat.toLowerCase()} Fees
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                ₹{catInfo.collected.toLocaleString()} / ₹{catInfo.billed.toLocaleString()} ({catRate.toFixed(0)}%)
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={catRate} 
                              color="secondary"
                              sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover' }}
                            />
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab 1: Fee Structure & Simple Feeding */}
      {activeTab === 1 && (
        <Grid container spacing={4}>
          {/* Left Column: Quick Builder Feeding System */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                  Quick Fee Structure Builder
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Use templates to populate details instantly, specify settings, and publish the invoice structure.
                </Typography>

                {/* Presets Grid */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.secondary', display: 'block' }}>
                  Quick Preset Templates
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3.5 }}>
                  {PRESETS.map((preset, index) => (
                    <Chip
                      key={index}
                      label={preset.title}
                      onClick={() => {
                        setStructTitle(preset.title);
                        setStructCategory(preset.category);
                        setStructAmount(preset.amount.toString());
                        setStructDescription(preset.desc);
                        // Auto-fill due date to the end of this month
                        const d = new Date();
                        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                        setStructDueDate(lastDay.toISOString().split('T')[0]);
                        dispatch(showToast({ message: `Loaded preset template: ${preset.title}`, severity: 'info' }));
                      }}
                      variant="outlined"
                      color="secondary"
                      sx={{ cursor: 'pointer', fontWeight: 650, borderStyle: 'dashed' }}
                    />
                  ))}
                </Box>

                <Divider sx={{ my: 2.5 }} />

                {/* Feeding Form */}
                <form onSubmit={handleStructSubmit}>
                  {structFormError && <Alert severity="error" sx={{ mb: 2.5 }}>{structFormError}</Alert>}
                  <Stack spacing={2.5}>
                    <TextField 
                      fullWidth required label="Fee Invoice Title" 
                      placeholder="e.g. Tuition Fee - Q1"
                      value={structTitle} 
                      onChange={(e) => setStructTitle(e.target.value)} 
                    />
                    
                    <Grid container spacing={2}>
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
                    </Grid>

                    <Grid container spacing={2}>
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
                    </Grid>

                    <TextField 
                      fullWidth required label="Academic Term / Year" 
                      value={structAcademicYear} 
                      onChange={(e) => setStructAcademicYear(e.target.value)} 
                    />

                    <TextField 
                      fullWidth multiline rows={2} label="Description" 
                      value={structDescription} 
                      onChange={(e) => setStructDescription(e.target.value)} 
                      placeholder="Optional fee structure description details..."
                    />

                    <Box sx={{ display: 'flex', gap: 2, pt: 1 }}>
                      <Button 
                        type="button" 
                        variant="outlined" 
                        fullWidth 
                        onClick={clearStructureForm}
                      >
                        Reset Form
                      </Button>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="secondary" 
                        fullWidth 
                        disabled={structLoading}
                        sx={{ background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF', fontWeight: 700 }}
                      >
                        {structLoading ? 'Creating...' : 'Publish Structure'}
                      </Button>
                    </Box>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Visual Invoices / Cards Catalog */}
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                Active Fee Structures ({feesData?.getFeesList?.length || 0})
              </Typography>
              {feesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
              ) : feesError ? (
                <Alert severity="error">{feesError.message}</Alert>
              ) : !feesData?.getFeesList || feesData.getFeesList.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center', border: '1.5px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
                  <Typography color="text.secondary">No fee structures configured for this class query.</Typography>
                </Card>
              ) : (
                <Grid container spacing={2}>
                  {feesData.getFeesList.map((fee) => {
                    // Choose color and icon based on category
                    let catColor = '#6366F1'; // Default Tuition/Indigo
                    let CatIcon = SchoolIcon;
                    if (fee.category === 'TRANSPORT') {
                      catColor = '#F59E0B'; // Transport/Amber
                      CatIcon = BusIcon;
                    } else if (fee.category === 'EXAMINATION') {
                      catColor = '#3B82F6'; // Examination/Blue
                      CatIcon = AssessmentIcon;
                    } else if (fee.category === 'LIBRARY') {
                      catColor = '#8B5CF6'; // Library/Purple
                      CatIcon = LibraryIcon;
                    } else if (fee.category === 'SPORTS') {
                      catColor = '#EC4899'; // Sports/Pink
                      CatIcon = SportsIcon;
                    } else if (fee.category === 'OTHER') {
                      catColor = '#64748B'; // Other/Grey
                      CatIcon = SettingsIcon;
                    }

                    return (
                      <Grid item xs={12} sm={6} key={fee.id}>
                        <Card sx={{ 
                          borderTop: `6px solid ${catColor}`, 
                          borderRadius: 3, 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          transition: 'all 0.2s ease',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }
                        }}>
                          <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ bgcolor: `${catColor}15`, color: catColor, width: 40, height: 40 }}>
                                  <CatIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                    {fee.title}
                                  </Typography>
                                  <Chip label={fee.classId?.name || 'All Classes'} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 650, mt: 0.5 }} />
                                </Box>
                              </Box>
                              
                              {isAdmin && (
                                <Box sx={{ display: 'flex' }}>
                                  <IconButton size="small" color="primary" onClick={() => handleEditStruct(fee)}><EditIcon fontSize="small" /></IconButton>
                                  <IconButton size="small" color="error" onClick={() => setFeeStructToDelete(fee)}><DeleteIcon fontSize="small" /></IconButton>
                                </Box>
                              )}
                            </Box>
                            
                            <Divider sx={{ my: 1.5 }} />
                            
                            <Stack spacing={1}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <Typography variant="caption" color="text.secondary">Billing Amount</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: "'Outfit', sans-serif" }}>
                                  ₹{fee.amount.toLocaleString()}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary">Due Date</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: new Date(fee.dueDate) < new Date() ? 'error.main' : 'text.secondary' }}>
                                  {new Date(fee.dueDate).toISOString().split('T')[0]}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary">Academic Year</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                  {fee.academicYear}
                                </Typography>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Student Ledger & Collection */}
      {activeTab === 2 && (
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

          <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 3 }}>
            <Table sx={{ minWidth: 760 }}>
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Admission No.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Payable</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Paid</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Outstanding Balance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  {isAdmin && <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>}
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
                    <TableCell colSpan={isAdmin ? 8 : 7} align="center">No student ledger matches the filters.</TableCell>
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
      )}

      {/* Collect Fee Payment Dialog Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Record Student Fee Payment</DialogTitle>
        <form onSubmit={handlePaySubmit}>
          <DialogContent dividers>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2.5}>
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

              {paymentStudentComponents.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'action.hover', border: '1.5px dashed', borderColor: 'primary.main', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AutoIcon color="secondary" /> Quick Pay Auto-Fill (Optional)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <TextField
                        size="small"
                        type="number"
                        label="Enter Total Cash Received (₹)"
                        value={quickPayAmount}
                        onChange={(e) => setQuickPayAmount(e.target.value)}
                        fullWidth
                      />
                      <Button 
                        type="button"
                        variant="contained" 
                        color="secondary"
                        onClick={handleApplyQuickPay}
                        sx={{ textTransform: 'none', fontWeight: 700, minWidth: '120px' }}
                      >
                        Auto-Fill
                      </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Tip: Enter the total amount paid by parent. The system will distribute it automatically to the oldest unpaid components.
                    </Typography>
                  </Paper>
                </Grid>
              )}

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
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.contrastText' }}>
                      Total Amount to Collect
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.contrastText', fontFamily: "'Outfit', sans-serif" }}>
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

              <Grid item xs={12} sm={6}>
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
          <DialogActions sx={{ p: 3 }}>
            <Button type="button" onClick={() => setOpenModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={isSubmittingPayment} sx={{ fontWeight: 700 }}>
              {isSubmittingPayment ? 'Saving...' : 'Record Payment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add/Edit Fee Structure Modal */}
      <Dialog open={openStructureModal} onClose={() => setOpenStructureModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedFeeStruct ? 'Update Fee Structure' : 'Create New Fee Structure'}</DialogTitle>
        <form onSubmit={handleStructSubmit}>
          <DialogContent dividers>
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
          <DialogActions sx={{ p: 3 }}>
            <Button type="button" onClick={() => setOpenStructureModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={structLoading} sx={{ fontWeight: 700 }}>
              {structLoading ? 'Creating...' : selectedFeeStruct ? 'Update Structure' : 'Create Structure'}
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
        <DialogActions sx={{ p: 3 }}>
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
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenCustomizeModal(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCustomize} 
            variant="contained" 
            disabled={saveStructureLoading || structureLoading}
            sx={{ background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF', fontWeight: 700 }}
          >
            {saveStructureLoading ? 'Saving Changes...' : 'Save Structure'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ledger Filter Modal */}
      <Dialog open={openFilterModal} onClose={() => setOpenFilterModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Filter Student Ledger</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
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
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={clearAllFilters} variant="outlined">
            Reset All
          </Button>
          <Button 
            onClick={handleApplyFilters} 
            variant="contained"
            color="secondary"
            sx={{ fontWeight: 700 }}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FeesList;
