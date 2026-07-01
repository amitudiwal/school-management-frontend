import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Grid, MenuItem, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
  Tab, Tabs, IconButton, TablePagination, Stack, Chip, Alert
} from '@mui/material';
import {
  Add as AddIcon, Book as BookIcon, AssignmentReturn as ReturnIcon,
  Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon,
  CheckCircleOutline as CheckedIcon, ErrorOutline as WarningIcon,
  Schedule as PendingIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';
import {
  GET_LIBRARY_BOOKS,
  GET_BOOK_ISSUES,
  CREATE_LIBRARY_BOOK,
  UPDATE_LIBRARY_BOOK,
  DELETE_LIBRARY_BOOK,
  ISSUE_LIBRARY_BOOK,
  RETURN_LIBRARY_BOOK,
  GET_STUDENTS,
  GET_TEACHERS
} from '../graphql/operations';

function LibraryManagement() {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.ui.themeMode);
  const isDark = themeMode === 'dark';

  const [activeTab, setActiveTab] = useState(0);
  const [pageBooks, setPageBooks] = useState(0);
  const [pageIssues, setPageIssues] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Book Form Modal
  const [openBookModal, setOpenBookModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookIsbn, setBookIsbn] = useState('');
  const [bookCategory, setBookCategory] = useState('Science');
  const [bookCopies, setBookCopies] = useState(1);
  const [bookRack, setBookRack] = useState('');
  const [bookError, setBookError] = useState('');

  // Issue Book Modal
  const [openIssueModal, setOpenIssueModal] = useState(false);
  const [issueBookId, setIssueBookId] = useState('');
  const [issueUserId, setIssueUserId] = useState('');
  const [issueDueDate, setIssueDueDate] = useState('');
  const [issueError, setIssueError] = useState('');

  // Return Book Modal
  const [openReturnModal, setOpenReturnModal] = useState(false);
  const [returnIssue, setReturnIssue] = useState(null);
  const [fineAmount, setFineAmount] = useState(0);
  const [finePaidStatus, setFinePaidStatus] = useState('NO_FINE');

  // Delete Confirmations
  const [bookToDelete, setBookToDelete] = useState(null);

  // Queries
  const { data: booksData, loading: booksLoading, refetch: refetchBooks } = useQuery(GET_LIBRARY_BOOKS, {
    variables: { search: searchQuery }
  });
  const { data: issuesData, loading: issuesLoading, refetch: refetchIssues } = useQuery(GET_BOOK_ISSUES);
  const { data: studentsData } = useQuery(GET_STUDENTS);
  const { data: teachersData } = useQuery(GET_TEACHERS);

  // Mutations
  const [createBook, { loading: addLoading }] = useMutation(CREATE_LIBRARY_BOOK);
  const [updateBook, { loading: editLoading }] = useMutation(UPDATE_LIBRARY_BOOK);
  const [deleteBook] = useMutation(DELETE_LIBRARY_BOOK);
  const [issueBook, { loading: issueLoading }] = useMutation(ISSUE_LIBRARY_BOOK);
  const [returnBook, { loading: returnLoading }] = useMutation(RETURN_LIBRARY_BOOK);

  // List of Book Categories
  const categories = ['Science', 'Mathematics', 'Fiction', 'History', 'Literature', 'Geography', 'Computer Science', 'General'];

  // Combine Students & Teachers for borrowers list
  const borrowers = [
    ...(studentsData?.getStudents || []).map(s => ({
      id: s.userId?.id || s.id,
      name: `${s.firstName} ${s.lastName} (Student - Roll: ${s.rollNo || 'N/A'})`
    })),
    ...(teachersData?.getTeachers || []).map(t => ({
      id: t.userId?.id || t.id,
      name: `${t.firstName} ${t.lastName} (Teacher - ${t.designation || 'Faculty'})`
    }))
  ];

  // Calculations for stats
  const totalBooksCount = booksData?.getLibraryBooks?.reduce((sum, b) => sum + b.totalCopies, 0) || 0;
  const issuedBooksCount = issuesData?.getBookIssues?.filter(i => i.status === 'ISSUED').length || 0;
  const availableBooksCount = totalBooksCount - issuedBooksCount;

  // Clear Handlers
  const clearBookForm = () => {
    setBookTitle('');
    setBookAuthor('');
    setBookIsbn('');
    setBookCategory('Science');
    setBookCopies(1);
    setBookRack('');
    setBookError('');
    setSelectedBook(null);
  };

  const handleOpenAddBook = () => {
    clearBookForm();
    setOpenBookModal(true);
  };

  const handleEditBook = (book) => {
    setSelectedBook(book);
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setBookIsbn(book.isbn);
    setBookCategory(book.category);
    setBookCopies(book.totalCopies);
    setBookRack(book.rackNo || '');
    setBookError('');
    setOpenBookModal(true);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookError('');
    if (!bookTitle || !bookAuthor || !bookIsbn || !bookCategory) {
      setBookError('Please fill in all required fields.');
      return;
    }
    const variables = {
      title: bookTitle,
      author: bookAuthor,
      isbn: bookIsbn,
      category: bookCategory,
      totalCopies: parseInt(bookCopies, 10),
      rackNo: bookRack || null
    };

    try {
      if (selectedBook) {
        await updateBook({ variables: { id: selectedBook.id, ...variables } });
        dispatch(showToast({ message: 'Book updated successfully!', severity: 'success' }));
      } else {
        await createBook({ variables });
        dispatch(showToast({ message: 'Book added to catalog!', severity: 'success' }));
      }
      setOpenBookModal(false);
      clearBookForm();
      refetchBooks();
    } catch (err) {
      setBookError(err.message);
    }
  };

  const handleDeleteBookConfirm = async () => {
    if (!bookToDelete) return;
    try {
      await deleteBook({ variables: { id: bookToDelete.id } });
      dispatch(showToast({ message: 'Book deleted from catalog.', severity: 'success' }));
      setBookToDelete(null);
      refetchBooks();
      refetchIssues();
    } catch (err) {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  };

  const handleOpenIssue = (book) => {
    setIssueBookId(book.id);
    setIssueUserId('');
    setIssueDueDate('');
    setIssueError('');
    setOpenIssueModal(true);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setIssueError('');
    if (!issueBookId || !issueUserId || !issueDueDate) {
      setIssueError('All fields are required to checkout.');
      return;
    }

    try {
      await issueBook({
        variables: {
          bookId: issueBookId,
          userId: issueUserId,
          dueDate: new Date(issueDueDate)
        }
      });
      dispatch(showToast({ message: 'Book checked out successfully!', severity: 'success' }));
      setOpenIssueModal(false);
      refetchBooks();
      refetchIssues();
    } catch (err) {
      setIssueError(err.message);
    }
  };

  const handleOpenReturn = (issue) => {
    setReturnIssue(issue);
    
    // Auto calculate late fine (e.g. ₹5 per day past due date)
    const due = new Date(issue.dueDate);
    const today = new Date();
    if (today > due) {
      const diffTime = Math.abs(today - due);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const calculatedFine = diffDays * 5;
      setFineAmount(calculatedFine);
      setFinePaidStatus('UNPAID');
    } else {
      setFineAmount(0);
      setFinePaidStatus('NO_FINE');
    }
    
    setOpenReturnModal(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    try {
      await returnBook({
        variables: {
          issueId: returnIssue.id,
          fineAmount: parseFloat(fineAmount),
          finePaidStatus
        }
      });
      dispatch(showToast({ message: 'Book returned successfully!', severity: 'success' }));
      setOpenReturnModal(false);
      refetchBooks();
      refetchIssues();
    } catch (err) {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  };

  const handleTabChange = (event, val) => {
    setActiveTab(val);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
            Library Bookshelf
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage book catalogs, student/teacher borrowing transactions, outstanding checkouts, and overdue late fees.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddBook}
          sx={{
            background: 'linear-gradient(135deg, #6366F1 0%, #D946EF 100%)',
            color: '#FFFFFF',
            fontWeight: 700,
            borderRadius: 2.5,
            py: 1.25,
            px: 3,
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
          }}
        >
          Add Book to Shelf
        </Button>
      </Box>

      {/* Stats Board */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)', background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff' }}>
            <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Total Catalog Books
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, fontFamily: "'Outfit', sans-serif" }}>
                  {totalBooksCount}
                </Typography>
              </Box>
              <Chip icon={<BookIcon />} label="Library stock" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)', background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff' }}>
            <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Active Borrowed Books
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, fontFamily: "'Outfit', sans-serif" }}>
                  {issuedBooksCount}
                </Typography>
              </Box>
              <Chip icon={<PendingIcon />} label="Issued out" color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)', background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff' }}>
            <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Available Copy Count
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, fontFamily: "'Outfit', sans-serif" }}>
                  {availableBooksCount}
                </Typography>
              </Box>
              <Chip icon={<CheckedIcon />} label="On Shelf" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Menu */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab icon={<BookIcon />} iconPosition="start" label="Book Catalog" sx={{ fontWeight: 700 }} />
        <Tab icon={<ReturnIcon />} iconPosition="start" label="Issue & Return Ledger" sx={{ fontWeight: 700 }} />
      </Tabs>

      {/* Tab 0: Book Catalog */}
      {activeTab === 0 && (
        <Box>
          {/* Searching Filter */}
          <Card sx={{ mb: 3, p: 2, borderRadius: 3, background: isDark ? 'rgba(30, 41, 59, 0.2)' : '#ffffff' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  placeholder="Search books by title, author, or ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <SearchIcon color="action" sx={{ mr: 1 }} />
                    )
                  }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          </Card>

          {booksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 3 }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>ISBN</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="center">Rack No</TableCell>
                      <TableCell align="center">Copies Available</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(booksData?.getLibraryBooks || []).map((book) => (
                      <TableRow key={book.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>{book.isbn}</TableCell>
                        <TableCell>
                          <Chip label={book.category} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="center">{book.rackNo || '-'}</TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {book.availableCopies} / {book.totalCopies}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenIssue(book)}
                              disabled={book.availableCopies === 0}
                              sx={{ borderRadius: 2, textTransform: 'none', py: 0.25 }}
                            >
                              Checkout
                            </Button>
                            <IconButton color="primary" onClick={() => handleEditBook(book)}>
                              <EditIcon sx={{ fontSize: '1.2rem' }} />
                            </IconButton>
                            <IconButton color="error" onClick={() => setBookToDelete(book)}>
                              <DeleteIcon sx={{ fontSize: '1.2rem' }} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!booksData?.getLibraryBooks || booksData.getLibraryBooks.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No books found in shelf database.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {booksData?.getLibraryBooks?.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[10]}
                  component="div"
                  count={booksData.getLibraryBooks.length}
                  rowsPerPage={10}
                  page={pageBooks}
                  onPageChange={(e, newPage) => setPageBooks(newPage)}
                />
              )}
            </>
          )}
        </Box>
      )}

      {/* Tab 1: Issues Ledger */}
      {activeTab === 1 && (
        <Box>
          {issuesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 3 }}>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Book Title</TableCell>
                      <TableCell>Borrower</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Issue Date</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Return Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Late Fee</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(issuesData?.getBookIssues || [])
                      .slice(pageIssues * 10, (pageIssues + 1) * 10)
                      .map((issue) => {
                        const isOverdue = issue.status === 'ISSUED' && new Date() > new Date(issue.dueDate);
                        return (
                          <TableRow key={issue.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{issue.bookId?.title}</TableCell>
                            <TableCell>{issue.userId?.name}</TableCell>
                            <TableCell>
                              <Chip label={issue.userId?.role} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.65rem' }} />
                            </TableCell>
                            <TableCell>{new Date(issue.issueDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(issue.dueDate).toLocaleDateString()}</TableCell>
                            <TableCell>{issue.returnDate ? new Date(issue.returnDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={isOverdue ? 'OVERDUE' : issue.status}
                                color={isOverdue ? 'error' : issue.status === 'RETURNED' ? 'success' : 'warning'}
                                size="small"
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {issue.fineAmount > 0 ? (
                                <Typography color={issue.finePaidStatus === 'PAID' ? 'success.main' : 'error.main'} sx={{ fontWeight: 700 }}>
                                  ₹{issue.fineAmount} ({issue.finePaidStatus})
                                </Typography>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {issue.status === 'ISSUED' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<ReturnIcon />}
                                  onClick={() => handleOpenReturn(issue)}
                                  sx={{ borderRadius: 2, textTransform: 'none', py: 0.25 }}
                                >
                                  Return
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {(!issuesData?.getBookIssues || issuesData.getBookIssues.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={9} align="center">No checkout transactions recorded.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {issuesData?.getBookIssues?.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[10]}
                  component="div"
                  count={issuesData.getBookIssues.length}
                  rowsPerPage={10}
                  page={pageIssues}
                  onPageChange={(e, newPage) => setPageIssues(newPage)}
                />
              )}
            </>
          )}
        </Box>
      )}

      {/* ADD/EDIT BOOK MODAL */}
      <Dialog open={openBookModal} onClose={() => setOpenBookModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedBook ? 'Edit Book Specifications' : 'Add New Book'}</DialogTitle>
        <form onSubmit={handleBookSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {bookError && <Alert severity="error" sx={{ mb: 2 }}>{bookError}</Alert>}
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField fullWidth required label="Book Title" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Author Name" value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="ISBN Code" value={bookIsbn} onChange={(e) => setBookIsbn(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required select label="Book Category" value={bookCategory} onChange={(e) => setBookCategory(e.target.value)}>
                  {categories.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Rack Allocation" value={bookRack} onChange={(e) => setBookRack(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required type="number" label="Total Copy Stock" value={bookCopies} onChange={(e) => setBookCopies(e.target.value)} inputProps={{ min: 1 }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenBookModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addLoading || editLoading}>
              {addLoading || editLoading ? 'Saving...' : selectedBook ? 'Save Changes' : 'Catalog Book'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* CHECKOUT BOOK MODAL */}
      <Dialog open={openIssueModal} onClose={() => setOpenIssueModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Issue Book Checkout</DialogTitle>
        <form onSubmit={handleIssueSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {issueError && <Alert severity="error" sx={{ mb: 2 }}>{issueError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Select Borrower (Student/Teacher)"
                  value={issueUserId}
                  onChange={(e) => setIssueUserId(e.target.value)}
                >
                  {borrowers.map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Due Return Date"
                  value={issueDueDate}
                  onChange={(e) => setIssueDueDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenIssueModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={issueLoading}>
              {issueLoading ? 'Processing...' : 'Disburse Book'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* RETURN BOOK MODAL */}
      <Dialog open={openReturnModal} onClose={() => setOpenReturnModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Return Book</DialogTitle>
        <form onSubmit={handleReturnSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to log return of <strong>{returnIssue?.bookId?.title}</strong> from <strong>{returnIssue?.userId?.name}</strong>?
            </Typography>
            {fineAmount > 0 && (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'error.light', color: 'error.contrastText', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  OVERDUE DETECTED!
                </Typography>
                <Typography variant="body2">
                  Calculated Late Fine: ₹{fineAmount}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    select
                    size="small"
                    label="Fine Status"
                    value={finePaidStatus}
                    onChange={(e) => setFinePaidStatus(e.target.value)}
                    sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                  >
                    <MenuItem value="PAID">Collected (PAID)</MenuItem>
                    <MenuItem value="UNPAID">Pending (UNPAID)</MenuItem>
                  </TextField>
                </Stack>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenReturnModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={returnLoading}>
              {returnLoading ? 'Processing...' : 'Complete Return'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={Boolean(bookToDelete)} onClose={() => setBookToDelete(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Book</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete book "{bookToDelete?.title}"? All checkouts records relating to this book will be dropped.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setBookToDelete(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleDeleteBookConfirm} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LibraryManagement;
