import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useLocation } from 'react-router-dom';
import {
  Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Paper, Grid, Divider
} from '@mui/material';
import { GET_STUDENT, GET_STUDENT_MARKS } from '../graphql/operations';

function PrintReportCard() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const studentId = queryParams.get('studentId');
  const examId = queryParams.get('examId');

  // Queries
  const { data: studentData, loading: studentLoading, error: studentError } = useQuery(GET_STUDENT, {
    variables: { id: studentId },
    skip: !studentId
  });

  const { data: marksData, loading: marksLoading, error: marksError } = useQuery(GET_STUDENT_MARKS, {
    variables: { studentId, examId },
    skip: !studentId
  });

  const student = studentData?.getStudent;
  const marks = marksData?.getStudentMarks || [];

  // Filter marks for selected exam if examId is provided
  const examName = marks.length > 0 ? marks[0].examId?.name : 'Term Assessment';
  const academicYear = marks.length > 0 ? marks[0].examId?.academicYear : '2026-2027';

  // Math calculations
  const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
  const totalMax = marks.length * 100; // Assuming max marks is 100 per subject
  const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : '0.00';
  const isPassed = marks.every(m => m.marksObtained >= 33); // Pass criteria >= 33%

  // Auto trigger browser print once data has loaded
  useEffect(() => {
    if (!studentLoading && !marksLoading && student && marks.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [studentLoading, marksLoading, student, marks]);

  if (studentLoading || marksLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', gap: 2 }}>
        <CircularProgress size={50} />
        <Typography variant="body1" sx={{ fontWeight: 600 }}>Generating Report Card PDF...</Typography>
      </Box>
    );
  }

  if (studentError || marksError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Error loading report card data: {studentError?.message || marksError?.message}</Alert>
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">No student profile found with the supplied ID.</Alert>
      </Box>
    );
  }

  if (marks.length === 0) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="info">No grades or exam marks recorded for this student.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: 4,
      maxWidth: '800px',
      margin: '0 auto',
      bgcolor: '#ffffff',
      color: '#000000',
      minHeight: '297mm', // A4 height
      boxSizing: 'border-box',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Printable page styling injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}} />

      {/* School Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, textTransform: 'uppercase', color: '#1E3A8A', letterSpacing: 0.5 }}>
          Greenwood International School
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5 }}>
          Affiliation No: 2048911 | Greenwood Valley, Road 12, Hyderabad - 500034
        </Typography>
        <Typography variant="h6" sx={{ mt: 2.5, fontWeight: 800, bgcolor: '#F1F5F9', py: 0.75, color: '#0F172A', borderRadius: 1.5, letterSpacing: 1 }}>
          ACADEMIC REPORT CARD ({academicYear})
        </Typography>
      </Box>

      {/* Student Personal Info Card */}
      <Box sx={{ border: '2px solid #E2E8F0', borderRadius: 3, p: 2.5, mb: 4 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>STUDENT NAME</Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1E293B' }}>
              {student.firstName} {student.lastName}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>CLASS & SEC</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E293B' }}>
              {student.classId?.name || '-'} ({student.sectionId?.name || '-'})
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>ROLL NUMBER</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E293B' }}>
              {student.rollNo || '-'}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>ADMISSION NUMBER</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E293B' }}>
              {student.admissionNo}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>DATE OF BIRTH</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E293B' }}>
              {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>EXAMINATION</Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, color: '#1E3A8A' }}>
              {examName}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Subject Marks Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#1E293B', py: 1.5 }}>Subject Name</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: '#1E293B' }}>Max Marks</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: '#1E293B' }}>Pass Marks</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: '#1E293B' }}>Marks Obtained</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: '#1E293B' }}>Grade</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#1E293B' }}>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {marks.map((m) => (
              <TableRow key={m.id}>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>{m.subjectId?.name}</TableCell>
                <TableCell align="center">100</TableCell>
                <TableCell align="center">33</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: m.marksObtained < 33 ? 'error.main' : 'inherit' }}>
                  {m.marksObtained}
                </TableCell>
                <TableCell align="center">
                  <Typography sx={{ fontWeight: 700, color: m.marksObtained < 33 ? 'error.main' : 'success.main' }}>
                    {m.grade || 'A'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>{m.remarks || 'Satisfactory'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Aggregate Score Panel */}
      <Box sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 3, p: 3, mb: 6 }}>
        <Grid container spacing={3} sx={{ textAlign: 'center' }}>
          <Grid item xs={3}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>AGGREGATE SCORE</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>{totalObtained} / {totalMax}</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>PERCENTAGE</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1E3A8A' }}>{percentage}%</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>RESULT STATUS</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: isPassed ? 'success.main' : 'error.main' }}>
              {isPassed ? 'PROMOTED / PASS' : 'FAILED / COMPARTMENT'}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>ATTENDANCE RATE</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>94.2%</Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Signatures Pad */}
      <Box sx={{ mt: 10 }}>
        <Grid container spacing={4} sx={{ textAlign: 'center' }}>
          <Grid item xs={4}>
            <Divider sx={{ borderStyle: 'dashed', borderColor: '#94A3B8', mb: 1.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>Class Teacher</Typography>
          </Grid>
          <Grid item xs={4}>
            <Divider sx={{ borderStyle: 'dashed', borderColor: '#94A3B8', mb: 1.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>Principal Signature</Typography>
          </Grid>
          <Grid item xs={4}>
            <Divider sx={{ borderStyle: 'dashed', borderColor: '#94A3B8', mb: 1.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>Parent / Guardian</Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Footer copyright */}
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="caption" color="text.disabled">
          Generated automatically via VidhyaFlowAI School ERP SaaS platform. This document is valid without physical seals.
        </Typography>
      </Box>
    </Box>
  );
}

export default PrintReportCard;
