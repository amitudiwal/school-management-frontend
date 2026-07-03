import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'dark'
      ? {
          // Premium Dark Mode
          primary: {
            main: '#6366F1', // Indigo HSL accent
            light: '#818CF8',
            dark: '#4F46E5',
          },
          secondary: {
            main: '#D946EF', // Fuchsia accent
            light: '#E879F9',
            dark: '#C084FC',
          },
          background: {
            default: '#0B0F19', // Deep luxury slate canvas
            paper: '#111827',   // Rich card container
            neutral: '#1F2937'
          },
          text: {
            primary: '#F8FAFC',
            secondary: '#94A3B8',
          },
          divider: '#374151',
        }
      : {
          // Premium Light Mode
          primary: {
            main: '#4F46E5',
            light: '#6366F1',
            dark: '#3730A3',
          },
          secondary: {
            main: '#D946EF',
            light: '#F472B6',
            dark: '#A21CAF',
          },
          background: {
            default: '#F8FAFC', // Slate soft-light canvas
            paper: '#FFFFFF',   // Pure white card
            neutral: '#F1F5F9'
          },
          text: {
            primary: '#0F172A',
            secondary: '#475569',
          },
          divider: '#E2E8F0',
        }),
  },
  typography: {
    fontFamily: "'Inter', 'Outfit', 'Marcellus', sans-serif",
    h1: {
      fontFamily: "'Marcellus', serif",
      fontWeight: 400,
    },
    h2: {
      fontFamily: "'Marcellus', serif",
      fontWeight: 400,
    },
    h3: {
      fontFamily: "'Marcellus', serif",
      fontWeight: 400,
    },
    h4: {
      fontFamily: "'Marcellus', serif",
      fontWeight: 400,
    },
    h5: {
      fontFamily: "'Marcellus', serif",
      fontWeight: 400,
    },
    h6: {
      fontFamily: "'Marcellus', serif",
      fontWeight: 400,
    },
    button: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 16, // Curves for modern card designs
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, *': {
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: mode === 'dark' ? '#0B0F19' : '#F8FAFC',
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'dark' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(79, 70, 229, 0.4)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: mode === 'dark' ? 'rgba(99, 102, 241, 0.6)' : 'rgba(79, 70, 229, 0.6)',
          },
          scrollbarWidth: 'thin',
          scrollbarColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.4) #0B0F19' : 'rgba(79, 70, 229, 0.4) #F8FAFC',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '10px 20px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 8px 20px rgba(99, 102, 241, 0.24)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: '16px',
          boxShadow: mode === 'dark' 
            ? '0 4px 20px 0 rgba(0, 0, 0, 0.35)' 
            : '0 4px 20px 0 rgba(99, 102, 241, 0.05)',
          border: mode === 'dark' ? '1px solid #1F2937' : '1px solid #E2E8F0',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'dark'
              ? '0 8px 30px 0 rgba(0, 0, 0, 0.5)'
              : '0 8px 30px 0 rgba(99, 102, 241, 0.12)',
          }
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: mode === 'dark' ? '#1F2937' : '#F1F5F9',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
          '& input[type="date"]': {
            cursor: 'pointer',
          },
          '& input::-webkit-calendar-picker-indicator': {
            filter: mode === 'dark' 
              ? 'invert(0.8) sepia(100%) saturate(2000%) hue-rotate(220deg) brightness(1.2)' 
              : 'sepia(100%) saturate(2000%) hue-rotate(220deg) brightness(0.6)',
            cursor: 'pointer',
            padding: '6px',
            marginRight: '-4px',
            borderRadius: '50%',
            backgroundColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.18)',
              transform: 'scale(1.1)',
            }
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? '#94A3B8' : '#475569',
          '&.Mui-focused': {
            color: mode === 'dark' ? '#818CF8' : '#4F46E5',
          },
          '&.MuiInputLabel-shrink': {
            color: mode === 'dark' ? '#94A3B8' : '#475569',
            '&.Mui-focused': {
              color: mode === 'dark' ? '#818CF8' : '#4F46E5',
            },
          },
          '&.MuiInputLabel-outlined': {
            color: mode === 'dark' ? '#94A3B8' : '#475569',
            '&.Mui-focused': {
              color: mode === 'dark' ? '#818CF8' : '#4F46E5',
            },
            '&.MuiInputLabel-shrink': {
              color: mode === 'dark' ? '#94A3B8' : '#475569',
            },
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? '#94A3B8' : '#475569',
          '&.Mui-focused': {
            color: mode === 'dark' ? '#818CF8' : '#4F46E5',
          },
          '&.MuiFormLabel-filled': {
            color: mode === 'dark' ? '#94A3B8' : '#475569',
          },
        },
      },
    },
  },
});

export const createMuiTheme = (mode) => createTheme(getDesignTokens(mode));
export default createMuiTheme;
