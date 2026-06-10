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
    fontFamily: "'Inter', 'Outfit', sans-serif",
    h1: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 800,
    },
    h2: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 700,
    },
    h3: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 700,
    },
    h4: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 600,
    },
    h5: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 600,
    },
    h6: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 600,
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
  },
});

export const createMuiTheme = (mode) => createTheme(getDesignTokens(mode));
export default createMuiTheme;
