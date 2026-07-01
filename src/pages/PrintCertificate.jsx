import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useLocation } from 'react-router-dom';
import { Box, CircularProgress, Alert, Typography, Grid } from '@mui/material';
import { GET_STUDENT } from '../graphql/operations';

function PrintCertificate() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const studentId = queryParams.get('studentId');
  const type = queryParams.get('type') || 'excellence'; // 'excellence', 'transfer', 'bonafide'

  // Query
  const { data: studentData, loading, error } = useQuery(GET_STUDENT, {
    variables: { id: studentId },
    skip: !studentId
  });

  const student = studentData?.getStudent;

  // Auto trigger printing
  useEffect(() => {
    if (!loading && student) {
      const timer = setTimeout(() => {
        window.print();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [loading, student]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', gap: 2 }}>
        <CircularProgress size={50} />
        <Typography variant="body1" sx={{ fontWeight: 600 }}>Drafting Official Certificate...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Error loading student certificate: {error.message}</Alert>
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

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const admissionYear = student.admissionDate ? new Date(student.admissionDate).getFullYear() : '2025';

  return (
    <Box sx={{
      width: '297mm', // A4 Landscape width
      height: '210mm', // A4 Landscape height
      margin: '0 auto',
      p: 4,
      bgcolor: '#ffffff',
      color: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      position: 'relative',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      {/* Import elegant calligraphy script fonts from Google Fonts */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,600;0,800;1,400&display=swap" />

      {/* Landscape Print styling rules */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}} />

      {/* Ornamental Certificate Double Borders */}
      <Box sx={{
        width: '100%',
        height: '100%',
        border: '15px solid #1E3A8A', // Outer deep blue border
        borderRadius: 2,
        boxSizing: 'border-box',
        p: '8px',
        position: 'relative'
      }}>
        <Box sx={{
          width: '100%',
          height: '100%',
          border: '4px double #D97706', // Inner gold border
          boxSizing: 'border-box',
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'center',
          background: 'radial-gradient(circle, rgba(253,251,243,0.5) 0%, rgba(255,255,255,1) 100%)'
        }}>
          {/* Certificate Header */}
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#1E3A8A', fontFamily: "'Playfair Display', serif", letterSpacing: 1.5, mb: 1 }}>
              GREENWOOD INTERNATIONAL SCHOOL
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748B', letterSpacing: 2, textTransform: 'uppercase' }}>
              Hyderabad, Telangana, India
            </Typography>
          </Box>

          {/* Certificate Title based on type */}
          <Box>
            {type === 'excellence' && (
              <>
                <Typography variant="h2" sx={{ fontWeight: 800, color: '#D97706', fontFamily: "'Playfair Display', serif", fontStyle: 'italic', mb: 2 }}>
                  Certificate of Excellence
                </Typography>
                <Typography variant="body1" sx={{ color: '#475569', fontSize: '1.1rem', letterSpacing: 0.5 }}>
                  This is proudly presented to
                </Typography>
                <Typography sx={{ fontStyle: 'normal', fontFamily: "'Great Vibes', cursive", fontSize: '4.5rem', color: '#1E293B', my: 2.5 }}>
                  {student.firstName} {student.lastName}
                </Typography>
                <Typography variant="body1" sx={{ color: '#475569', maxWidth: '750px', lineHeight: 1.6, fontSize: '1.05rem', margin: '0 auto' }}>
                  in recognition of his/her outstanding academic performance, exemplary character, and active involvement in class activities during the term, demonstrating the highest qualities of leadership and scholarly pursuit.
                </Typography>
              </>
            )}

            {type === 'transfer' && (
              <>
                <Typography variant="h2" sx={{ fontWeight: 800, color: '#D97706', fontFamily: "'Playfair Display', serif", fontStyle: 'italic', mb: 2 }}>
                  Transfer Certificate
                </Typography>
                <Typography variant="body1" sx={{ color: '#475569', fontSize: '1.1rem' }}>
                  This is to certify that
                </Typography>
                <Typography sx={{ fontStyle: 'normal', fontFamily: "'Great Vibes', cursive", fontSize: '4.5rem', color: '#1E293B', my: 2.5 }}>
                  {student.firstName} {student.lastName}
                </Typography>
                <Typography variant="body1" sx={{ color: '#475569', maxWidth: '800px', lineHeight: 1.8, fontSize: '1.05rem', margin: '0 auto' }}>
                  Admission No: <strong>{student.admissionNo}</strong>, son/daughter of <strong>{student.parentId ? `${student.parentId.firstName} ${student.parentId.lastName}` : 'Marie Curie'}</strong>, was admitted to this institution in Class <strong>{student.classId?.name || 'Class 10'}</strong> on {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'June 1, 2025'}. All dues have been cleared. His/Her conduct during his/her tenure at this school has been <strong>Exemplary</strong>. He/She is hereby granted Transfer Certificate.
                </Typography>
              </>
            )}

            {type === 'bonafide' && (
              <>
                <Typography variant="h2" sx={{ fontWeight: 800, color: '#D97706', fontFamily: "'Playfair Display', serif", fontStyle: 'italic', mb: 2 }}>
                  Bonafide Certificate
                </Typography>
                <Typography variant="body1" sx={{ color: '#475569', fontSize: '1.1rem' }}>
                  This is to certify that
                </Typography>
                <Typography sx={{ fontStyle: 'normal', fontFamily: "'Great Vibes', cursive", fontSize: '4.5rem', color: '#1E293B', my: 2.5 }}>
                  {student.firstName} {student.lastName}
                </Typography>
                <Typography variant="body1" sx={{ color: '#475569', maxWidth: '800px', lineHeight: 1.8, fontSize: '1.05rem', margin: '0 auto' }}>
                  Admission No: <strong>{student.admissionNo}</strong>, is a bonafide student of this institution, studying in Class <strong>{student.classId?.name || 'Class 10'}</strong>, Section <strong>{student.sectionId?.name || 'A'}</strong> during the academic term 2026-2027.
                </Typography>
              </>
            )}
          </Box>

          {/* Signatures Panel */}
          <Box sx={{ width: '100%', mt: 4 }}>
            <Grid container spacing={3} sx={{ justifyContent: 'space-between', px: 4 }}>
              <Grid item xs={3} sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748B', mb: 1 }}>DATE ISSUED</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800 }}>{todayStr}</Typography>
              </Grid>
              <Grid item xs={4} sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Decorative Seal circle */}
                <Box sx={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: '3px double #D97706',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  transform: 'rotate(-10deg)',
                  opacity: 0.8
                }}>
                  GIS SEAL
                </Box>
              </Grid>
              <Grid item xs={3} sx={{ textAlign: 'right' }}>
                <Box sx={{ height: '30px' }} /> {/* Space for signature */}
                <Typography variant="body1" sx={{ fontWeight: 800, borderTop: '2px dashed #94A3B8', pt: 1, display: 'inline-block', minWidth: '150px' }}>
                  Principal
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default PrintCertificate;
