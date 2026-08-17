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
    fontFamily: "'Plus Jakarta Sans', 'Outfit', 'Inter', sans-serif",
    h1: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 800,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h6: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 600,
    },
    subtitle2: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 600,
    },
    body1: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 400,
    },
    body2: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 400,
    },
    button: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 700,
      textTransform: 'none',
      letterSpacing: '0.01em',
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
            width: '7px',
            height: '7px',
          },
          '&::-webkit-scrollbar-track': {
            background: mode === 'dark' ? '#0B0F19' : '#F8FAFC',
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'dark' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(79, 70, 229, 0.4)',
            borderRadius: '999px',
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
          padding: '10px 22px',
          boxShadow: 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          fontWeight: 700,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'dark'
              ? '0px 10px 25px rgba(99, 102, 241, 0.35)'
              : '0px 10px 25px rgba(79, 70, 229, 0.25)',
          },
          '&:active': {
            transform: 'translateY(0)',
          }
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #EC4899 0%, #D946EF 100%)',
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: '18px',
          boxShadow: mode === 'dark' 
            ? '0 10px 30px 0 rgba(0, 0, 0, 0.4)' 
            : '0 10px 30px 0 rgba(99, 102, 241, 0.06)',
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(226, 232, 240, 0.8)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: mode === 'dark'
              ? '0 16px 40px 0 rgba(0, 0, 0, 0.6)'
              : '0 16px 40px 0 rgba(99, 102, 241, 0.14)',
          }
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          fontWeight: 700,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.04)',
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '20px',
          boxShadow: mode === 'dark'
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.8)'
            : '0 25px 60px -15px rgba(99, 102, 241, 0.2)',
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.8)',
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '14px 18px',
          borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9',
        },
        head: {
          fontWeight: 800,
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: mode === 'dark' ? '#94A3B8' : '#64748B',
          backgroundColor: mode === 'dark' ? 'rgba(31, 41, 55, 0.7)' : '#F8FAFC',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
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
