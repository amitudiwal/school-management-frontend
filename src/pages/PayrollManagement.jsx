import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useLazyQuery, gql } from '@apollo/client';
import {
  Box, Button, Card, CardContent, Grid, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableRow, TableHead,
  Paper, Typography, CircularProgress, Alert, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  IconButton, useTheme, TablePagination, Divider, Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Receipt as PayslipIcon,
  Print as PrintIcon,
  Calculate as CalculateIcon,
  CheckCircle as PaidIcon
} from '@mui/icons-material';
import {
  GET_PAYROLL_LIST,
  GENERATE_PAYSLIP,
  GET_TEACHER_ATTENDANCE_STATS
} from '../graphql/operations';
import { showToast } from '../store/slices/uiSlice';

// Custom query to fetch teachers along with joining details and banking details
const GET_TEACHERS_FOR_PAYROLL = gql`
  query GetTeachersForPayroll {
    getTeachers {
      id
      firstName
      lastName
      designation
      joinDate
      bankDetails {
        accountName
        accountNo
        bankName
        ifscCode
      }
      userId {
        id
        email
      }
    }
  }
`;

function PayrollManagement() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Tabs: 0 = Payslip Generator, 1 = Payroll History
  const isAdmin = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'HR_STAFF', 'ACCOUNTANT'].includes(user?.role);
  const [activeTab, setActiveTab] = useState(isAdmin ? 0 : 1);

  // Pagination states
  const [page, setPage] = useState(0);

  // Form states for generating payroll
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [basicSalary, setBasicSalary] = useState(50000);
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [year, setYear] = useState(new Date().getFullYear());
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');

  // Allowances & Deductions arrays
  const [allowances, setAllowances] = useState([
    { name: 'House Rent Allowance (HRA)', amount: 15000 },
    { name: 'Medical Allowance', amount: 3000 },
    { name: 'Special Allowance', amount: 2000 }
  ]);

  const [deductions, setDeductions] = useState([
    { name: 'Provident Fund (PF)', amount: 6000 },
    { name: 'Professional Tax (PT)', amount: 200 },
    { name: 'Income Tax (TDS)', amount: 2500 }
  ]);

  // Selected payslip view state
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [payslipOpen, setPayslipOpen] = useState(false);

  // Queries
  const { 
    loading: teachersLoading, 
    data: teachersData 
  } = useQuery(GET_TEACHERS_FOR_PAYROLL, {
    skip: !isAdmin
  });

  const { 
    loading: payrollLoading, 
    error: payrollError, 
    data: payrollData, 
    refetch: refetchPayroll 
  } = useQuery(GET_PAYROLL_LIST, {
    fetchPolicy: 'network-only'
  });

  // Lazy query to fetch attendance stats dynamically when teacher, month, or year changes
  const [fetchAttendanceStats, { data: attendanceData, loading: attendanceLoading }] = useLazyQuery(GET_TEACHER_ATTENDANCE_STATS);

  // Mutations
  const [generatePayslipMutation, { loading: generateSubmitting }] = useMutation(GENERATE_PAYSLIP, {
    onCompleted: () => {
      dispatch(showToast({ message: 'Payslip generated and recorded successfully!', severity: 'success' }));
      setSelectedTeacherId('');
      setBasicSalary(50000);
      setAllowances([
        { name: 'House Rent Allowance (HRA)', amount: 15000 },
        { name: 'Medical Allowance', amount: 3000 },
        { name: 'Special Allowance', amount: 2000 }
      ]);
      setDeductions([
        { name: 'Provident Fund (PF)', amount: 6000 },
        { name: 'Professional Tax (PT)', amount: 200 },
        { name: 'Income Tax (TDS)', amount: 2500 }
      ]);
      refetchPayroll();
      setActiveTab(1); // switch to history tab
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message || 'Error generating payslip', severity: 'error' }));
    }
  });

  // Trigger attendance stats query when selection changes
  useEffect(() => {
    if (selectedTeacherId && month && year) {
      fetchAttendanceStats({
        variables: {
          teacherId: selectedTeacherId,
          month: parseInt(month),
          year: parseInt(year)
        }
      });
    }
  }, [selectedTeacherId, month, year, fetchAttendanceStats]);

  // Pre-fill absence deductions based on attendance query
  useEffect(() => {
    if (attendanceData?.getTeacherAttendanceStats) {
      const stats = attendanceData.getTeacherAttendanceStats;
      const absentCount = stats.absentCount;
      const halfDayCount = stats.halfDayCount;
      
      const totalUnpaidAbsences = absentCount + (halfDayCount * 0.5);
      
      if (totalUnpaidAbsences > 0) {
        // Calculate daily deduction rate
        const dailyRate = Math.round(basicSalary / 30);
        const deductionAmt = Math.round(totalUnpaidAbsences * dailyRate);

        // Check if absence deduction already added
        const existsIdx = deductions.findIndex(d => d.name.toLowerCase().includes('absence'));
        
        if (existsIdx >= 0) {
          const updated = [...deductions];
          updated[existsIdx] = { name: `Absence Deduction (${totalUnpaidAbsences} days)`, amount: deductionAmt };
          setDeductions(updated);
        } else {
          setDeductions(prev => [...prev, { name: `Absence Deduction (${totalUnpaidAbsences} days)`, amount: deductionAmt }]);
        }
      } else {
        // Remove absence deduction if 0 absences
        setDeductions(prev => prev.filter(d => !d.name.toLowerCase().includes('absence')));
      }
    }
  }, [attendanceData, basicSalary]);

  // Allowances Actions
  const handleAddAllowance = () => {
    setAllowances(prev => [...prev, { name: '', amount: 0 }]);
  };

  const handleRemoveAllowance = (idx) => {
    setAllowances(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAllowanceChange = (idx, field, value) => {
    const updated = [...allowances];
    updated[idx] = {
      ...updated[idx],
      [field]: field === 'amount' ? parseFloat(value) || 0 : value
    };
    setAllowances(updated);
  };

  // Deductions Actions
  const handleAddDeduction = () => {
    setDeductions(prev => [...prev, { name: '', amount: 0 }]);
  };

  const handleRemoveDeduction = (idx) => {
    setDeductions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDeductionChange = (idx, field, value) => {
    const updated = [...deductions];
    updated[idx] = {
      ...updated[idx],
      [field]: field === 'amount' ? parseFloat(value) || 0 : value
    };
    setDeductions(updated);
  };

  // Real-time Net Salary calculation
  const totalAllowances = allowances.reduce((sum, item) => sum + item.amount, 0);
  const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
  const calculatedNetSalary = basicSalary + totalAllowances - totalDeductions;

  // Generate Payslip Submit
  const handleGeneratePayroll = (e) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      dispatch(showToast({ message: 'Please select a faculty member', severity: 'warning' }));
      return;
    }

    const selectedTeacher = teachersData?.getTeachers.find(t => t.id === selectedTeacherId);
    if (!selectedTeacher?.userId?.id) {
      dispatch(showToast({ message: 'User mapping not found for teacher', severity: 'error' }));
      return;
    }

    // Filter out items with empty names or 0 amounts
    const finalAllowances = allowances
      .filter(item => item.name.trim() !== '' && item.amount > 0)
      .map(item => ({ name: item.name.trim(), amount: item.amount }));

    const finalDeductions = deductions
      .filter(item => item.name.trim() !== '' && item.amount > 0)
      .map(item => ({ name: item.name.trim(), amount: item.amount }));

    generatePayslipMutation({
      variables: {
        userId: selectedTeacher.userId.id,
        basicSalary: parseFloat(basicSalary),
        month: parseInt(month),
        year: parseInt(year),
        allowances: finalAllowances,
        deductions: finalDeductions,
        paymentMethod
      }
    });
  };

  // Printable slip helper
  const handlePrint = () => {
    window.print();
  };

  // Convert numbers to words (simple helper for USD/generic slip values)
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convert = (n) => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
      return n.toString();
    };

    if (num === 0) return 'Zero';
    return convert(Math.floor(num)) + ' Only';
  };

  const getMonthName = (m) => {
    const date = new Date(2000, m - 1, 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  return (
    <Box sx={{ pb: 5 }}>
      {/* Styles injection for printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-payslip, #printable-payslip * {
            visibility: visible !important;
          }
          #printable-payslip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 40px !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, background: 'linear-gradient(90deg, #6366F1 0%, #D946EF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Payroll & Payslips
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track employee monthly payroll distributions, attendance adjustments, tax deductions, and download salary statements.
        </Typography>
      </Box>

      {/* Tabs */}
      {isAdmin && (
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}
        >
          <Tab label="Salary Calculator & Generator" sx={{ fontWeight: 700, px: 3 }} />
          <Tab label="Payroll Ledger & Slips" sx={{ fontWeight: 700, px: 3 }} />
        </Tabs>
      )}

      {/* TAB 0: GENERATE PAYSLIP */}
      {activeTab === 0 && isAdmin && (
        <Box component="form" onSubmit={handleGeneratePayroll}>
          <Grid container spacing={3}>
            {/* Input Configuration Card */}
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', mb: 3 }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                    Employee & Period Selection
                  </Typography>

                  <TextField
                    select
                    label="Faculty Member"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    fullWidth
                    required
                    disabled={teachersLoading}
                  >
                    {(teachersData?.getTeachers || []).map((teach) => (
                      <MenuItem key={teach.id} value={teach.id}>
                        {`Prof. ${teach.firstName} ${teach.lastName} (${teach.designation || 'Faculty'})`}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="Salary Month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        fullWidth
                        required
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <MenuItem key={m} value={m}>
                            {getMonthName(m)}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="Salary Year"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        fullWidth
                        required
                      >
                        {[year - 1, year, year + 1].map((y) => (
                          <MenuItem key={y} value={y}>
                            {y}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>

                  <TextField
                    label="Basic Salary (₹)"
                    type="number"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(Math.max(0, parseFloat(e.target.value) || 0))}
                    fullWidth
                    required
                  />

                  <TextField
                    select
                    label="Payment Method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    fullWidth
                    required
                  >
                    <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                    <MenuItem value="CASH">Cash</MenuItem>
                    <MenuItem value="CHEQUE">Cheque</MenuItem>
                  </TextField>
                </CardContent>
              </Card>

              {/* Attendance Check Card */}
              {selectedTeacherId && (
                <Card sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                      Monthly Attendance Summary
                    </Typography>

                    {attendanceLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
                    ) : (
                      <Box>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6} sm={3} align="center">
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Present</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.main' }}>
                              {attendanceData?.getTeacherAttendanceStats?.presentCount || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3} align="center">
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Absent</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main' }}>
                              {attendanceData?.getTeacherAttendanceStats?.absentCount || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3} align="center">
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Half Days</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'warning.main' }}>
                              {attendanceData?.getTeacherAttendanceStats?.halfDayCount || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3} align="center">
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>On Leave</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'info.main' }}>
                              {attendanceData?.getTeacherAttendanceStats?.leaveCount || 0}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Alert severity="info" icon={<CalculateIcon />} sx={{ borderRadius: 2 }}>
                          Absence deductions are auto-calculated at a daily rate of basic salary (₹ {Math.round(basicSalary / 30)}/day) for absent days and 50% for half days.
                        </Alert>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Allowances & Deductions Builder */}
            <Grid item xs={12} md={7}>
              {/* Allowances Card */}
              <Card sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                      Allowances & Earnings
                    </Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={handleAddAllowance} sx={{ fontWeight: 700 }}>
                      Add Allowance
                    </Button>
                  </Box>

                  <Stack spacing={2}>
                    {allowances.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          label="Allowance Name"
                          value={item.name}
                          onChange={(e) => handleAllowanceChange(idx, 'name', e.target.value)}
                          fullWidth
                          size="small"
                          required
                        />
                        <TextField
                          label="Amount (₹)"
                          type="number"
                          value={item.amount}
                          onChange={(e) => handleAllowanceChange(idx, 'amount', e.target.value)}
                          sx={{ width: 150 }}
                          size="small"
                          required
                        />
                        <IconButton color="error" size="small" onClick={() => handleRemoveAllowance(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    {allowances.length === 0 && (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                        No allowances added.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Deductions Card */}
              <Card sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                      Deductions & Taxes
                    </Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={handleAddDeduction} sx={{ fontWeight: 700 }}>
                      Add Deduction
                    </Button>
                  </Box>

                  <Stack spacing={2}>
                    {deductions.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          label="Deduction Name"
                          value={item.name}
                          onChange={(e) => handleDeductionChange(idx, 'name', e.target.value)}
                          fullWidth
                          size="small"
                          required
                        />
                        <TextField
                          label="Amount (₹)"
                          type="number"
                          value={item.amount}
                          onChange={(e) => handleDeductionChange(idx, 'amount', e.target.value)}
                          sx={{ width: 150 }}
                          size="small"
                          required
                        />
                        <IconButton color="error" size="small" onClick={() => handleRemoveDeduction(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    {deductions.length === 0 && (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                        No deductions added.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Net Salary Preview & Submit */}
              <Card sx={{ borderRadius: 4, bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#EEF2F6', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                <CardContent sx={{ p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Calculated Monthly Net Salary
                    </Typography>
                    <Typography variant="h3" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                      ₹{calculatedNetSalary.toLocaleString()}
                    </Typography>
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={generateSubmitting || calculatedNetSalary <= 0}
                    sx={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #c084fc 100%)',
                      }
                    }}
                  >
                    {generateSubmitting ? 'Generating...' : 'Record & Generate Payslip'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* TAB 1: PAYROLL HISTORY & LEDGER */}
      {activeTab === 1 && (
        <Box>
          {payrollLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : payrollError ? (
            <Alert severity="error">{payrollError.message}</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflowX: 'auto' }}>
              <Table sx={{ minWidth: 780 }}>
                <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payslip No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Basic Salary</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Net Paid</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment Method</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Paid Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(payrollData?.getPayrollList || [])
                    .slice(page * 10, (page + 1) * 10)
                    .map((pay) => (
                      <TableRow key={pay.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {pay.userId?.name}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {pay.userId?.role === 'SUPER_TEACHER' ? 'Academic Management' : pay.userId?.role?.replace('_', ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{pay.payslipNo}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {getMonthName(pay.month)} {pay.year}
                        </TableCell>
                        <TableCell>₹{pay.basicSalary?.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>
                          ₹{pay.netSalary?.toLocaleString()}
                        </TableCell>
                        <TableCell>{pay.paymentMethod?.replace('_', ' ')}</TableCell>
                        <TableCell>
                          {pay.paymentDate ? new Date(pay.paymentDate).toLocaleDateString('en-GB') : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<PaidIcon fontSize="small" />}
                            label={pay.status}
                            color="success"
                            size="small"
                            variant="soft"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PayslipIcon />}
                            onClick={() => {
                              setSelectedPayslip(pay);
                              setPayslipOpen(true);
                            }}
                            sx={{ fontWeight: 700, borderRadius: 2 }}
                          >
                            View Slip
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  {(!payrollData?.getPayrollList || payrollData.getPayrollList.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No payroll accounts or ledger statements found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {payrollData?.getPayrollList?.length > 10 && (
            <TablePagination
              rowsPerPageOptions={[10]}
              component="div"
              count={payrollData.getPayrollList.length}
              rowsPerPage={10}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              sx={{ mt: 2 }}
            />
          )}
        </Box>
      )}

      {/* PAYSLIP VIEW OVERLAY MODAL */}
      <Dialog
        open={payslipOpen}
        onClose={() => setPayslipOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 5,
            width: '100%',
            maxWidth: 750,
            overflowY: 'auto'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedPayslip && (
            <Box>
              {/* Slip Document Component */}
              <Box id="printable-payslip" sx={{ p: 4 }}>
                {/* School Details Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
                      VIDHYAFLOWAI ACADEMY
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      123 Education Boulevard, Campus City, 94016
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Email: HR@vidhyaflowai.edu | Tel: (555) 019-2831
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: 'primary.main' }}>
                      SALARY STATEMENT
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
                      Payslip No: {selectedPayslip.payslipNo}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Statement Period: {getMonthName(selectedPayslip.month)} {selectedPayslip.year}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Employee / Bank Details Summary */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      EMPLOYEE INFORMATION
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {selectedPayslip.userId?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Email: {selectedPayslip.userId?.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Designation: {selectedPayslip.userId?.role === 'SUPER_TEACHER' ? 'Academic Management' : selectedPayslip.userId?.role?.replace('_', ' ')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      PAYMENT STATEMENT
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Payment Method: {selectedPayslip.paymentMethod?.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payment Date: {selectedPayslip.paymentDate ? new Date(selectedPayslip.paymentDate).toLocaleDateString('en-GB') : '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {selectedPayslip.status}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Earnings & Deductions Breakdown */}
                <Grid container spacing={4} sx={{ mb: 4 }}>
                  {/* Earnings Left Column */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'success.main' }}>
                      EARNINGS / ALLOWANCES
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, boxShadow: 'none', overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Basic Salary</TableCell>
                            <TableCell align="right">₹{selectedPayslip.basicSalary?.toLocaleString()}</TableCell>
                          </TableRow>
                          {(selectedPayslip.allowances || []).map((allow, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{allow.name}</TableCell>
                              <TableCell align="right">₹{allow.amount?.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ fontWeight: 700 }}>
                            <TableCell sx={{ fontWeight: 700 }}>Gross Earnings</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              ₹{(selectedPayslip.basicSalary + (selectedPayslip.allowances || []).reduce((s, a) => s + a.amount, 0))?.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  {/* Deductions Right Column */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'error.main' }}>
                      DEDUCTIONS & TAXES
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, boxShadow: 'none', overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(selectedPayslip.deductions || []).map((ded, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{ded.name}</TableCell>
                              <TableCell align="right">₹{ded.amount?.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          {(!selectedPayslip.deductions || selectedPayslip.deductions.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={2} align="center" color="text.secondary">No deductions</TableCell>
                            </TableRow>
                          )}
                          <TableRow sx={{ fontWeight: 700 }}>
                            <TableCell sx={{ fontWeight: 700 }}>Total Deductions</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              ₹{(selectedPayslip.deductions || []).reduce((s, d) => s + d.amount, 0)?.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>

                <Divider sx={{ mb: 3 }} />

                {/* Net Salary Summary Block */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderRadius: 3, bgcolor: 'action.selected', border: `1px solid ${theme.palette.divider}`, mb: 4 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      NET SALARY PAYOUT
                    </Typography>
                    <Typography variant="caption" sx={{ fontStyle: 'italic', fontWeight: 600 }}>
                      In Words: {numberToWords(selectedPayslip.netSalary)}
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: 'primary.main' }}>
                    ₹{selectedPayslip.netSalary?.toLocaleString()}
                  </Typography>
                </Box>

                {/* Signatures Footer */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, pt: 4 }}>
                  <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, width: 180, textAlign: 'center', pt: 1 }}>
                    <Typography variant="caption" display="block">Employee Signature</Typography>
                  </Box>
                  <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, width: 180, textAlign: 'center', pt: 1 }}>
                    <Typography variant="caption" display="block">Authorized Signatory</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Action Buttons (Not Printed) */}
              <Box className="no-print" sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button onClick={() => setPayslipOpen(false)} sx={{ fontWeight: 700 }}>
                  Close
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  sx={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 3
                  }}
                >
                  Print Payslip
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default PayrollManagement;
