import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSelector } from 'react-redux';
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, TextField, MenuItem, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress,
  Alert, IconButton, InputAdornment, Avatar, TablePagination, Tabs, Tab,
  Switch, FormControlLabel, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, FileDownload as ExportIcon,
  Edit as EditIcon, Delete as DeleteIcon, Visibility, VisibilityOff,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import CustomDatePicker from '../components/CustomDatePicker';
import {
  GET_STUDENTS,
  GET_CLASSES,
  GET_SECTIONS,
  REGISTER_STUDENT,
  UPDATE_STUDENT,
  DELETE_STUDENT,
  GET_PARENTS
} from '../graphql/operations';
import { BACKEND_URL } from '../graphql/client';

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  return `${BACKEND_URL}${avatarPath}`;
};

function FormSectionHeader({ title, color }) {
  return (
    <Box sx={{ 
      backgroundColor: color, 
      color: '#FFF', 
      px: 2, 
      py: 1, 
      borderRadius: 1, 
      mb: 2.5, 
      fontWeight: 800,
      fontFamily: "'Outfit', sans-serif",
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {title}
    </Box>
  );
}

function StudentList() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const canAddStudent = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'ACCOUNTANT'].includes(user?.role);
  const canManageStudent = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'ACCOUNTANT'].includes(user?.role);

  // General navigation state
  const [tabValue, setTabValue] = useState(0);

  // Search & Filters (for Tab 1 - registered list)
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [page, setPage] = useState(0);

  // Reset page on filter changes
  useEffect(() => {
    setPage(0);
  }, [search, classId, sectionId]);

  // --- FORM STATES FOR ADMISSION INTAKE ---
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dob, setDob] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formSectionId, setFormSectionId] = useState('');
  const [formParentId, setFormParentId] = useState('');
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState({});

  // Extra Basic Information
  const [branch, setBranch] = useState('Main Branch');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('General');
  const [mobileNumber, setMobileNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [house, setHouse] = useState('Red House');

  // Physical details
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Documents
  const [apaarId, setApaarId] = useState('');
  const [rteNumber, setRteNumber] = useState('');
  const [penNumber, setPenNumber] = useState('');
  const [aadhaarFront, setAadhaarFront] = useState('');
  const [aadhaarBack, setAadhaarBack] = useState('');
  const [uploadingAadhaarFront, setUploadingAadhaarFront] = useState(false);
  const [uploadingAadhaarBack, setUploadingAadhaarBack] = useState(false);

  // Address
  const [currentAddress, setCurrentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [permanentSameAsCurrent, setPermanentSameAsCurrent] = useState(true);

  // Parent simultaneous registration states
  const [parentMode, setParentMode] = useState('EXISTING'); // 'EXISTING' or 'NEW'
  const [parentFirstName, setParentFirstName] = useState('');
  const [parentLastName, setParentLastName] = useState('');
  const [parentRelation, setParentRelation] = useState('FATHER');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [showParentPassword, setShowParentPassword] = useState(false);

  // Parent/Guardian details (additional)
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  // Fees details
  const [admissionFee, setAdmissionFee] = useState(0);
  const [tuitionFee, setTuitionFee] = useState(0);
  const [transportFee, setTransportFee] = useState(0);
  const [hostelFee, setHostelFee] = useState(0);
  const [otherFee, setOtherFee] = useState(0);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('None');
  const [installmentPlan, setInstallmentPlan] = useState('1');

  // Previous school details
  const [prevSchoolName, setPrevSchoolName] = useState('');
  const [prevClass, setPrevClass] = useState('');
  const [prevTcNumber, setPrevTcNumber] = useState('');
  const [passingYear, setPassingYear] = useState('');

  // Image Upload States
  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);

  const calculateTotalFees = () => {
    return (
      (parseFloat(admissionFee) || 0) +
      (parseFloat(tuitionFee) || 0) +
      (parseFloat(transportFee) || 0) +
      (parseFloat(hostelFee) || 0) +
      (parseFloat(otherFee) || 0)
    );
  };

  const calculateFinalPayable = () => {
    const total = calculateTotalFees();
    const discount = parseFloat(totalDiscount) || 0;
    return total - (total * discount / 100);
  };

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
        setAvatar(result.url);
        dispatch(showToast({ message: 'Image uploaded successfully!', severity: 'success' }));
      } else {
        dispatch(showToast({ message: result.error || 'Upload failed', severity: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(showToast({ message: 'Error uploading image', severity: 'error' }));
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (e, side) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    if (side === 'front') setUploadingAadhaarFront(true);
    else setUploadingAadhaarBack(true);

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
        if (side === 'front') setAadhaarFront(result.url);
        else setAadhaarBack(result.url);
        dispatch(showToast({ message: 'Document uploaded successfully!', severity: 'success' }));
      } else {
        dispatch(showToast({ message: result.error || 'Upload failed', severity: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(showToast({ message: 'Error uploading document', severity: 'error' }));
    } finally {
      if (side === 'front') setUploadingAadhaarFront(false);
      else setUploadingAadhaarBack(false);
    }
  };

  // Queries
  const { loading: studentsLoading, error: studentsError, data: studentsData, refetch } = useQuery(GET_STUDENTS, {
    variables: { classId: classId || undefined, sectionId: sectionId || undefined, search: search || undefined }
  });

  const { data: classesData } = useQuery(GET_CLASSES);
  const { data: sectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: classId || undefined }
  });
  const { data: formSectionsData } = useQuery(GET_SECTIONS, {
    variables: { classId: formClassId || undefined }
  });
  const { data: parentsData } = useQuery(GET_PARENTS);

  // Mutations
  const [registerStudentMutation, { loading: addLoading }] = useMutation(REGISTER_STUDENT, {
    onCompleted: () => {
      clearForm();
      setTabValue(1); // Switch to registered list tab
      refetch();
      dispatch(showToast({ message: 'Student registered successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateStudentMutation, { loading: updateLoading }] = useMutation(UPDATE_STUDENT, {
    onCompleted: () => {
      clearForm();
      setTabValue(1); // Switch to registered list tab
      refetch();
      dispatch(showToast({ message: 'Student details updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteStudentMutation, { loading: deleteLoading }] = useMutation(DELETE_STUDENT, {
    onCompleted: () => {
      setStudentToDelete(null);
      refetch();
      dispatch(showToast({ message: 'Student removed successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setAdmissionNo('');
    setRollNo('');
    setGender('MALE');
    setDob('');
    setFormClassId('');
    setFormSectionId('');
    setFormParentId('');
    setFormError('');
    setErrors({});
    setSelectedStudent(null);
    setAvatar('');
    
    // Reset all new fields
    setBranch('Main Branch');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setPassword('');
    setCategory('General');
    setMobileNumber('');
    setBloodGroup('A+');
    setHouse('Red House');
    setHeight('');
    setWeight('');
    setApaarId('');
    setRteNumber('');
    setPenNumber('');
    setAadhaarFront('');
    setAadhaarBack('');
    setCurrentAddress('');
    setPermanentAddress('');
    setPermanentSameAsCurrent(true);
    setFatherOccupation('');
    setMotherName('');
    setMotherOccupation('');
    setMotherPhone('');
    setGuardianName('');
    setGuardianPhone('');
    setAdmissionFee(0);
    setTuitionFee(0);
    setTransportFee(0);
    setHostelFee(0);
    setOtherFee(0);
    setDueDate(new Date().toISOString().split('T')[0]);
    setTotalDiscount(0);
    setDiscountType('None');
    setInstallmentPlan('1');
    setPrevSchoolName('');
    setPrevClass('');
    setPrevTcNumber('');
    setPassingYear('');

    setParentMode('EXISTING');
    setParentFirstName('');
    setParentLastName('');
    setParentRelation('FATHER');
    setParentPhone('');
    setParentEmail('');
    setParentPassword('');
    setShowParentPassword(false);
  };

  const handleOpenAdmission = () => {
    clearForm();
    setTabValue(0);
  };

  const handleOpenEdit = (student) => {
    setSelectedStudent(student);
    setFirstName(student.firstName || '');
    setLastName(student.lastName || '');
    setEmail(student.userId?.email || '');
    setAdmissionNo(student.admissionNo || '');
    setRollNo(student.rollNo || '');
    setGender(student.gender || 'MALE');
    setDob(student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '');
    setFormClassId(student.classId?.id || '');
    setFormSectionId(student.sectionId?.id || '');
    setFormParentId(student.parentId?.id || '');
    setFormError('');
    setErrors({});
    setAvatar(student.userId?.avatar || '');

    // Load new intake fields
    setBranch(student.branch || 'Main Branch');
    setAdmissionDate(student.admissionDate ? student.admissionDate.slice(0, 10) : new Date().toISOString().split('T')[0]);
    setCategory(student.category || 'General');
    setMobileNumber(student.mobileNumber || '');
    setBloodGroup(student.bloodGroup || 'A+');
    setHouse(student.house || 'Red House');
    setHeight(student.height || '');
    setWeight(student.weight || '');
    setApaarId(student.apaarId || '');
    setRteNumber(student.rteNumber || '');
    setPenNumber(student.penNumber || '');
    setAadhaarFront(student.aadhaarFront || '');
    setAadhaarBack(student.aadhaarBack || '');
    setCurrentAddress(student.address?.street || '');
    setPermanentAddress(student.permanentAddress || '');
    setPermanentSameAsCurrent(!student.permanentAddress || student.permanentAddress === student.address?.street);
    setFatherOccupation(student.fatherOccupation || '');
    setMotherName(student.motherName || '');
    setMotherOccupation(student.motherOccupation || '');
    setMotherPhone(student.motherPhone || '');
    setGuardianName(student.guardianName || '');
    setGuardianPhone(student.guardianPhone || '');
    setAdmissionFee(student.admissionFee || 0);
    setTuitionFee(student.tuitionFee || 0);
    setTransportFee(student.transportFee || 0);
    setHostelFee(student.hostelFee || 0);
    setOtherFee(student.otherFee || 0);
    setDueDate(student.dueDate ? student.dueDate.slice(0, 10) : new Date().toISOString().split('T')[0]);
    setTotalDiscount(student.totalDiscount || 0);
    setDiscountType(student.discountType || 'None');
    setInstallmentPlan(student.installmentPlan || '1');
    setPrevSchoolName(student.prevSchoolName || '');
    setPrevClass(student.prevClass || '');
    setPrevTcNumber(student.transferInfo?.tcNumber || '');
    setPassingYear(student.passingYear || '');

    setTabValue(0); // Switch to the form tab
  };

  const handleAdmissionSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setErrors({});

    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = 'First Name is required.';
    if (!lastName.trim()) newErrors.lastName = 'Last Name is required.';
    
    if (!email.trim()) {
      newErrors.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!admissionNo.trim()) newErrors.admissionNo = 'Admission Number is required.';
    if (!dob) newErrors.dob = 'Date of Birth is required.';
    if (!formClassId) newErrors.formClassId = 'Class selection is required.';
    if (!formSectionId) newErrors.formSectionId = 'Section selection is required.';

    if (!selectedStudent && parentMode === 'NEW') {
      if (!parentFirstName.trim()) newErrors.parentFirstName = 'Parent First Name is required.';
      if (!parentLastName.trim()) newErrors.parentLastName = 'Parent Last Name is required.';
      
      if (!parentEmail.trim()) {
        newErrors.parentEmail = 'Parent Email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
        newErrors.parentEmail = 'Please enter a valid email address.';
      }

      if (!parentPhone.trim()) {
        newErrors.parentPhone = 'Parent Phone Number is required.';
      } else if (!/^\d{10}$/.test(parentPhone.trim())) {
        newErrors.parentPhone = 'Parent Phone Number must be exactly 10 digits.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError('Please correct the highlighted errors before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const variables = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      admissionNo: admissionNo.trim(),
      rollNo: rollNo.trim(),
      gender,
      dateOfBirth: new Date(dob),
      classId: formClassId,
      sectionId: formSectionId,
      address: {
        street: currentAddress.trim(),
        city: 'City',
        state: 'State',
        zipCode: '10001',
        country: 'Country'
      },
      // New intake fields
      branch,
      category,
      mobileNumber: mobileNumber.trim(),
      house,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      apaarId: apaarId.trim(),
      rteNumber: rteNumber.trim(),
      penNumber: penNumber.trim(),
      aadhaarFront,
      aadhaarBack,
      permanentAddress: permanentSameAsCurrent ? currentAddress.trim() : permanentAddress.trim(),
      fatherOccupation: fatherOccupation.trim(),
      motherName: motherName.trim(),
      motherOccupation: motherOccupation.trim(),
      motherPhone: motherPhone.trim(),
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      admissionFee: parseFloat(admissionFee) || 0,
      tuitionFee: parseFloat(tuitionFee) || 0,
      transportFee: parseFloat(transportFee) || 0,
      hostelFee: parseFloat(hostelFee) || 0,
      otherFee: parseFloat(otherFee) || 0,
      dueDate: new Date(dueDate),
      totalDiscount: parseFloat(totalDiscount) || 0,
      discountType,
      installmentPlan,
      prevSchoolName: prevSchoolName.trim(),
      prevClass: prevClass.trim(),
      passingYear: passingYear.trim(),
      bloodGroup
    };

    if (!selectedStudent && parentMode === 'NEW') {
      variables.parentId = null;
      variables.parentFirstName = parentFirstName.trim();
      variables.parentLastName = parentLastName.trim();
      variables.parentEmail = parentEmail.trim();
      variables.parentPhone = parentPhone.trim();
      variables.parentRelation = parentRelation;
      variables.parentPassword = parentPassword || null;
    } else {
      variables.parentId = formParentId || null;
      variables.parentFirstName = null;
      variables.parentLastName = null;
      variables.parentEmail = null;
      variables.parentPhone = null;
      variables.parentRelation = null;
      variables.parentPassword = null;
    }

    if (selectedStudent) {
      updateStudentMutation({
        variables: {
          id: selectedStudent.id,
          ...variables
        }
      });
      return;
    }

    registerStudentMutation({ 
      variables: {
        ...variables,
        avatar
      } 
    });
  };

  const handleConfirmDelete = () => {
    if (!studentToDelete) return;
    deleteStudentMutation({ variables: { id: studentToDelete.id } });
  };

  const handleExport = async (format) => {
    try {
      const response = await fetch(`http://localhost:5000/api/export/${format}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student-directory.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      dispatch(showToast({ message: 'Error exporting report: ' + err.message, severity: 'error' }));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Student Admission & Intake
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={() => handleExport('pdf')} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            PDF Report
          </Button>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={() => handleExport('excel')} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Excel Sheet
          </Button>
          {canAddStudent && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAdmission}
              sx={{ width: { xs: '100%', sm: 'auto' }, background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', color: '#FFFFFF' }}
            >
              New Admission Form
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs Layout */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} aria-label="student register tabs">
          <Tab label="Student Admission Form" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }} />
          <Tab label="Registered Student List" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }} />
        </Tabs>
      </Box>

      {/* Tab 0: Comprehensive Admission Form */}
      {tabValue === 0 && (
        <Card sx={{ p: { xs: 2, sm: 3 } }}>
          <CardContent>
            {formError && <Alert severity="error" sx={{ mb: 3 }}>{formError}</Alert>}
            
            <form onSubmit={handleAdmissionSubmit}>
              {/* --- SECTION 1: BASIC INFORMATION --- */}
              <FormSectionHeader title="Basic Information" color="#8B5CF6" />
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth required label="Admission Number" 
                    value={admissionNo} 
                    onChange={(e) => setAdmissionNo(e.target.value)} 
                    error={Boolean(errors.admissionNo)}
                    helperText={errors.admissionNo}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <CustomDatePicker 
                    fullWidth required label="Admission Date" 
                    value={admissionDate} 
                    onChange={(e) => setAdmissionDate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth label="Roll Number" 
                    value={rollNo} 
                    onChange={(e) => setRollNo(e.target.value)} 
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth select label="Branch" 
                    value={branch} 
                    onChange={(e) => setBranch(e.target.value)}
                  >
                    <MenuItem value="Main Branch">Main Branch</MenuItem>
                    <MenuItem value="Primary Campus">Primary Campus</MenuItem>
                    <MenuItem value="International Branch">International Branch</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth required select label="Class"
                    value={formClassId}
                    onChange={(e) => {
                      setFormClassId(e.target.value);
                      setFormSectionId('');
                      if (errors.formClassId) setErrors(prev => ({ ...prev, formClassId: '' }));
                    }}
                    error={Boolean(errors.formClassId)}
                    helperText={errors.formClassId}
                  >
                    {classesData?.getClasses?.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth required select label="Section"
                    value={formSectionId}
                    disabled={!formClassId}
                    onChange={(e) => {
                      setFormSectionId(e.target.value);
                      if (errors.formSectionId) setErrors(prev => ({ ...prev, formSectionId: '' }));
                    }}
                    error={Boolean(errors.formSectionId)}
                    helperText={errors.formSectionId}
                  >
                    {formSectionsData?.getSections?.map((sec) => (
                      <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth required label="First Name" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    error={Boolean(errors.firstName)}
                    helperText={errors.firstName}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth required label="Last Name" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    error={Boolean(errors.lastName)}
                    helperText={errors.lastName}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth required type="email" label="Student Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth type="password" label="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    helperText="Password for student profile"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth required select label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <CustomDatePicker 
                    fullWidth required label="Date of Birth" 
                    value={dob} 
                    onChange={(e) => setDob(e.target.value)}
                    error={Boolean(errors.dob)}
                    helperText={errors.dob}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField 
                    fullWidth select label="Category" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <MenuItem value="General">General</MenuItem>
                    <MenuItem value="OBC">OBC</MenuItem>
                    <MenuItem value="SC">SC</MenuItem>
                    <MenuItem value="ST">ST</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField 
                    fullWidth label="Mobile Number" 
                    value={mobileNumber} 
                    onChange={(e) => setMobileNumber(e.target.value)} 
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField 
                    fullWidth select label="Blood Group" 
                    value={bloodGroup} 
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField 
                    fullWidth select label="House" 
                    value={house} 
                    onChange={(e) => setHouse(e.target.value)}
                  >
                    <MenuItem value="Red House">Red House</MenuItem>
                    <MenuItem value="Blue House">Blue House</MenuItem>
                    <MenuItem value="Green House">Green House</MenuItem>
                    <MenuItem value="Yellow House">Yellow House</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              {/* --- SECTION 2: PHYSICAL DETAILS & PHOTO --- */}
              <FormSectionHeader title="Physical Details & Photo" color="#10B981" />
              <Grid container spacing={2.5} sx={{ mb: 4 }} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField 
                    fullWidth label="Height (cm)" type="number" 
                    value={height} 
                    onChange={(e) => setHeight(e.target.value)} 
                    placeholder="e.g. 150"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField 
                    fullWidth label="Weight (kg)" type="number" 
                    value={weight} 
                    onChange={(e) => setWeight(e.target.value)} 
                    placeholder="e.g. 45"
                  />
                </Grid>
                <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={getAvatarUrl(avatar)} sx={{ width: 56, height: 56 }}>
                    {firstName?.charAt(0) || ''}
                  </Avatar>
                  <Button variant="outlined" component="label" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Choose Student Photo'}
                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                  </Button>
                </Grid>
              </Grid>

              {/* --- SECTION 3: DOCUMENTS DETAILS & UPLOAD --- */}
              <FormSectionHeader title="Documents Details & Upload" color="#1E293B" />
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="APAAR ID" value={apaarId} onChange={(e) => setApaarId(e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="RTE Number" value={rteNumber} onChange={(e) => setRteNumber(e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="PEN Number" value={penNumber} onChange={(e) => setPenNumber(e.target.value)} />
                </Grid>

                <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 160 }}>Aadhaar Card Front:</Typography>
                  <Button variant="outlined" component="label" disabled={uploadingAadhaarFront}>
                    {uploadingAadhaarFront ? 'Uploading...' : 'Upload Front Side'}
                    <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload(e, 'front')} />
                  </Button>
                  {aadhaarFront && <Typography variant="caption" color="success.main">Uploaded ✓</Typography>}
                </Grid>
                <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 160 }}>Aadhaar Card Back:</Typography>
                  <Button variant="outlined" component="label" disabled={uploadingAadhaarBack}>
                    {uploadingAadhaarBack ? 'Uploading...' : 'Upload Back Side'}
                    <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload(e, 'back')} />
                  </Button>
                  {aadhaarBack && <Typography variant="caption" color="success.main">Uploaded ✓</Typography>}
                </Grid>
              </Grid>

              {/* --- SECTION 4: ADDRESS DETAILS --- */}
              <FormSectionHeader title="Address Details" color="#3B82F6" />
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={permanentSameAsCurrent ? 12 : 6}>
                  <TextField 
                    fullWidth multiline rows={3} label="Current Address" 
                    value={currentAddress} 
                    onChange={(e) => setCurrentAddress(e.target.value)} 
                  />
                  <FormControlLabel
                    control={<Switch checked={permanentSameAsCurrent} onChange={(e) => setPermanentSameAsCurrent(e.target.checked)} color="primary" />}
                    label="Permanent address same as current"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                {!permanentSameAsCurrent && (
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      fullWidth multiline rows={3} label="Permanent Address" 
                      value={permanentAddress} 
                      onChange={(e) => setPermanentAddress(e.target.value)} 
                    />
                  </Grid>
                )}
              </Grid>

              {/* --- SECTION 5: PARENT / GUARDIAN DETAILS --- */}
              <FormSectionHeader title="Parent / Guardian Details" color="#F97316" />
              <Grid container spacing={2.5} sx={{ mb: 2 }}>
                {!selectedStudent && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth select label="Parent Intake Mode"
                      value={parentMode}
                      onChange={(e) => setParentMode(e.target.value)}
                      sx={{ mb: 2 }}
                    >
                      <MenuItem value="EXISTING">Assign Existing Parent Profile</MenuItem>
                      <MenuItem value="NEW">Create & Link New Parent Credentials</MenuItem>
                    </TextField>
                  </Grid>
                )}

                {selectedStudent || parentMode === 'EXISTING' ? (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth select label="Assign Parent"
                      value={formParentId}
                      onChange={(e) => setFormParentId(e.target.value)}
                    >
                      <MenuItem value="">None / No Parent Profile Assigned</MenuItem>
                      {parentsData?.getParents?.map((parent) => (
                        <MenuItem key={parent.id} value={parent.id}>
                          {parent.firstName} {parent.lastName} ({parent.relation})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                ) : (
                  <>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField 
                        fullWidth required label="Father's Name" 
                        value={parentFirstName} 
                        onChange={(e) => setParentFirstName(e.target.value)} 
                        error={Boolean(errors.parentFirstName)}
                        helperText={errors.parentFirstName}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField 
                        fullWidth required label="Father's Surname/Last Name" 
                        value={parentLastName} 
                        onChange={(e) => setParentLastName(e.target.value)} 
                        error={Boolean(errors.parentLastName)}
                        helperText={errors.parentLastName}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField fullWidth label="Father's Occupation" value={fatherOccupation} onChange={(e) => setFatherOccupation(e.target.value)} />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <TextField fullWidth label="Mother's Name" value={motherName} onChange={(e) => setMotherName(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField fullWidth label="Mother's Occupation" value={motherOccupation} onChange={(e) => setMotherOccupation(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField fullWidth label="Mother's Phone Number" value={motherPhone} onChange={(e) => setMotherPhone(e.target.value)} />
                    </Grid>

                    <Grid item xs={12} sm={6} md={6}>
                      <TextField fullWidth label="Guardian's Name" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={6}>
                      <TextField fullWidth label="Guardian's Phone Number" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
                    </Grid>

                    {/* --- SECTION 6: PARENT'S EMAIL & PASSWORD --- */}
                    <Grid item xs={12}>
                      <FormSectionHeader title="Parent's Email & Password" color="#F97316" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField 
                        fullWidth required select label="Relationship to Student" 
                        value={parentRelation} onChange={(e) => setParentRelation(e.target.value)}
                      >
                        <MenuItem value="FATHER">Father</MenuItem>
                        <MenuItem value="MOTHER">Mother</MenuItem>
                        <MenuItem value="GUARDIAN">Guardian</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField 
                        fullWidth required label="Parent's Mobile Number" 
                        value={parentPhone} 
                        onChange={(e) => setParentPhone(e.target.value)} 
                        error={Boolean(errors.parentPhone)}
                        helperText={errors.parentPhone}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField 
                        fullWidth required type="email" label="Parent's Login Email" 
                        value={parentEmail} 
                        onChange={(e) => setParentEmail(e.target.value)} 
                        error={Boolean(errors.parentEmail)}
                        helperText={errors.parentEmail}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type={showParentPassword ? 'text' : 'password'}
                        label="Parent Login Password"
                        placeholder="Leave blank for automatic phone number password"
                        value={parentPassword}
                        onChange={(e) => setParentPassword(e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowParentPassword(!showParentPassword)} edge="end">
                                {showParentPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>

              {/* --- SECTION 7: FEES & PAYMENT PLAN --- */}
              <FormSectionHeader title="Fees & Payment Plan" color="#8B5CF6" />
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth label="Admission Fee (₹)" type="number" 
                    value={admissionFee} 
                    onChange={(e) => setAdmissionFee(e.target.value)} 
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth label="Tuition Fee (₹)" type="number" 
                    value={tuitionFee} 
                    onChange={(e) => setTuitionFee(e.target.value)} 
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth label="Transport Fee (₹)" type="number" 
                    value={transportFee} 
                    onChange={(e) => setTransportFee(e.target.value)} 
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth label="Hostel Fee (₹)" type="number" 
                    value={hostelFee} 
                    onChange={(e) => setHostelFee(e.target.value)} 
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth label="Other Fee (₹)" type="number" 
                    value={otherFee} 
                    onChange={(e) => setOtherFee(e.target.value)} 
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <CustomDatePicker 
                    fullWidth label="Due Date" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)} 
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth select label="Installment Plan" 
                    value={installmentPlan} 
                    onChange={(e) => setInstallmentPlan(e.target.value)}
                  >
                    <MenuItem value="1">1 Installment (Full Term)</MenuItem>
                    <MenuItem value="2">2 Installments</MenuItem>
                    <MenuItem value="3">3 Installments</MenuItem>
                    <MenuItem value="4">4 Installments (Quarterly)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    fullWidth select label="Discount Type" 
                    value={discountType} 
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="Scholarship">Scholarship</MenuItem>
                    <MenuItem value="Sibling">Sibling</MenuItem>
                    <MenuItem value="Staff Discount">Staff Discount</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField 
                    fullWidth label="Total Fees (₹)" 
                    value={calculateTotalFees()} 
                    InputProps={{ readOnly: true }} 
                    variant="filled" 
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField 
                    fullWidth label="Total Discount (%)" type="number" 
                    value={totalDiscount} 
                    onChange={(e) => setTotalDiscount(e.target.value)} 
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField 
                    fullWidth label="Final Payable Fees (₹)" 
                    value={calculateFinalPayable()} 
                    InputProps={{ readOnly: true, style: { fontWeight: 800 } }} 
                    variant="filled" 
                  />
                </Grid>
              </Grid>

              {/* --- SECTION 8: PREVIOUS SCHOOL DETAILS (Accordion) --- */}
              <Accordion sx={{ mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: '#EC489920' }}>
                  <Typography sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: '#EC4899', fontSize: '0.9rem' }}>
                    PREVIOUS SCHOOL DETAILS
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 2.5 }}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Previous School Name" value={prevSchoolName} onChange={(e) => setPrevSchoolName(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Previous Class" value={prevClass} onChange={(e) => setPrevClass(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="TC Number" value={prevTcNumber} onChange={(e) => setPrevTcNumber(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Passing Year" value={passingYear} onChange={(e) => setPassingYear(e.target.value)} />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Form Submission Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button onClick={clearForm} variant="outlined" color="secondary" sx={{ minWidth: 120 }}>
                  Reset
                </Button>
                <Button 
                  type="submit" variant="contained" 
                  disabled={addLoading || updateLoading} 
                  sx={{ 
                    minWidth: 160, 
                    background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)', 
                    color: '#FFFFFF' 
                  }}
                >
                  {addLoading || updateLoading ? 'Saving...' : selectedStudent ? 'Save Changes' : 'Save Admission'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 1: Registered Student Directory */}
      {tabValue === 1 && (
        <>
          {/* Filters Bar */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Search Student Name / Adm No..."
                    variant="outlined"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Filter by Grade Level"
                    value={classId}
                    onChange={(e) => {
                      setClassId(e.target.value);
                      setSectionId('');
                    }}
                  >
                    <MenuItem value="">All Classes</MenuItem>
                    {classesData?.getClasses?.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Filter by Section"
                    value={sectionId}
                    disabled={!classId}
                    onChange={(e) => setSectionId(e.target.value)}
                  >
                    <MenuItem value="">All Sections</MenuItem>
                    {sectionsData?.getSections?.map((sec) => (
                      <MenuItem key={sec.id} value={sec.id}>{sec.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Data Table */}
          {studentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : studentsError ? (
            <Alert severity="error">{studentsError.message}</Alert>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 820 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="80px">Photo</TableCell>
                      <TableCell>Admission No</TableCell>
                      <TableCell>Roll No</TableCell>
                      <TableCell>Student Name</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Grade Level</TableCell>
                      <TableCell>Assigned Section</TableCell>
                      <TableCell>Parent / Guardian</TableCell>
                      {canManageStudent && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(studentsData?.getStudents || [])
                      .slice(page * 10, (page + 1) * 10)
                      .map((st) => (
                        <TableRow key={st.id} hover>
                          <TableCell>
                            <Avatar src={getAvatarUrl(st.userId?.avatar)} sx={{ width: 44, height: 44, border: '1px solid', borderColor: 'divider' }}>
                              {st.firstName?.charAt(0) || ''}
                            </Avatar>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{st.admissionNo}</TableCell>
                          <TableCell>{st.rollNo || '-'}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{`${st.firstName} ${st.lastName}`}</TableCell>
                          <TableCell>{st.gender}</TableCell>
                          <TableCell>{st.classId?.name}</TableCell>
                          <TableCell>{st.sectionId?.name}</TableCell>
                          <TableCell>{st.parentId ? `${st.parentId.firstName} ${st.parentId.lastName}` : '-'}</TableCell>
                          {canManageStudent && (
                            <TableCell align="right">
                              <IconButton aria-label="Edit student" color="primary" onClick={() => handleOpenEdit(st)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton aria-label="Delete student" color="error" onClick={() => setStudentToDelete(st)}>
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    {(!studentsData?.getStudents || studentsData.getStudents.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={canManageStudent ? 9 : 8} align="center">No data</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {studentsData?.getStudents?.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[10]}
                  component="div"
                  count={studentsData.getStudents.length}
                  rowsPerPage={10}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(studentToDelete)} onClose={() => setStudentToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Student</DialogTitle>
        <DialogContent>
          <Typography>
            Delete {studentToDelete ? `${studentToDelete.firstName} ${studentToDelete.lastName}` : 'this student'} from the student register?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button onClick={() => setStudentToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StudentList;
