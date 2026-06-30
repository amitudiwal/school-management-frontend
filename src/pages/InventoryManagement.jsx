import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Grid, Card, CardContent, Typography, Button, IconButton,
  TextField, MenuItem, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, useTheme, Stack, InputAdornment, Paper, Avatar
} from '@mui/material';
import {
  ArrowBack as BackIcon, Add as AddIcon, Search as SearchIcon,
  Delete as DeleteIcon, Edit as EditIcon, Category as CategoryIcon,
  Inventory as InventoryIcon, LocalOffer as PriceIcon, Store as VendorIcon,
  DateRange as CalendarIcon
} from '@mui/icons-material';
import {
  GET_INVENTORY_LIST, ADD_INVENTORY_ITEM,
  UPDATE_INVENTORY_ITEM, DELETE_INVENTORY_ITEM
} from '../graphql/operations';
import { showToast } from '../store/slices/uiSlice';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

const CATEGORIES = [
  { value: 'SPORTS', label: 'Sports & Gym', color: '#6366F1' },
  { value: 'STATIONERY', label: 'Stationery', color: '#10B981' },
  { value: 'FURNITURE', label: 'Furniture', color: '#F59E0B' },
  { value: 'LAB_EQUIPMENT', label: 'Lab Equipment', color: '#14B8A6' },
  { value: 'CLASSROOM', label: 'Classroom Supplies', color: '#EC4899' },
  { value: 'COMPUTERS', label: 'Computers & IT', color: '#3B82F6' },
  { value: 'OTHER', label: 'Other Assets', color: '#6B7280' }
];

function InventoryManagement() {
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  // State Management
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form Field States
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('SPORTS');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');

  // GraphQL Operations
  const { loading, error, data, refetch } = useQuery(GET_INVENTORY_LIST);

  const [addInventoryItem, { loading: addLoading }] = useMutation(ADD_INVENTORY_ITEM, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Inventory item added successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [updateInventoryItem, { loading: editLoading }] = useMutation(UPDATE_INVENTORY_ITEM, {
    onCompleted: () => {
      setOpenModal(false);
      clearForm();
      refetch();
      dispatch(showToast({ message: 'Inventory item updated successfully!', severity: 'success' }));
    },
    onError: (err) => {
      setFormError(err.message);
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const [deleteInventoryItem] = useMutation(DELETE_INVENTORY_ITEM, {
    onCompleted: () => {
      refetch();
      dispatch(showToast({ message: 'Inventory item deleted successfully!', severity: 'success' }));
    },
    onError: (err) => {
      dispatch(showToast({ message: err.message, severity: 'error' }));
    }
  });

  const clearForm = () => {
    setItemName('');
    setCategory('SPORTS');
    setQuantity(1);
    setUnitPrice('');
    setVendorName('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setEditingItem(null);
  };

  const handleOpenAddModal = () => {
    clearForm();
    setOpenModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setItemName(item.itemName);
    setCategory(item.category);
    setQuantity(item.quantity);
    setUnitPrice(item.unitPrice || '');
    setVendorName(item.vendorName || '');
    setPurchaseDate(item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '');
    setFormError('');
    setOpenModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setFormError('Item name is required');
      return;
    }
    const parsedQty = quantity === '' ? 0 : parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      setFormError('Quantity must be a valid non-negative number');
      return;
    }

    const variables = {
      itemName: itemName.trim(),
      category,
      quantity: parsedQty,
      unitPrice: unitPrice ? parseFloat(unitPrice) : null,
      vendorName: vendorName.trim() || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null
    };

    if (editingItem) {
      updateInventoryItem({
        variables: {
          id: editingItem.id,
          ...variables
        }
      });
    } else {
      addInventoryItem({
        variables
      });
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      deleteInventoryItem({ variables: { id } });
    }
  };

  // Helper values
  const hasSchoolAdminAccess = ['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'SUPER_ADMIN'].includes(user?.role);
  const items = data?.getInventoryList || [];

  // Statistics Computations
  const totalItemTypes = items.length;
  const totalStockQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0);

  // Search & Filter Logic
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      (item.vendorName && item.vendorName.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryDetails = (catVal) => {
    return CATEGORIES.find(c => c.value === catVal) || { label: catVal, color: '#6B7280' };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading inventory: {error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {hasSchoolAdminAccess && (
            <IconButton onClick={() => navigate('/')} color="primary" sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <BackIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: 'text.primary' }}>
              School Inventory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track physical assets, sports goods, class supplies, and laboratory equipment.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddModal}
          sx={{
            py: 1.5,
            px: 3,
            fontWeight: 700,
            borderRadius: 3,
            boxShadow: isDark ? 'none' : '0px 4px 14px rgba(99, 102, 241, 0.4)'
          }}
        >
          Add Asset Item
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{
            borderRadius: 4,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Asset Categories
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, fontFamily: "'Outfit', sans-serif" }}>
                    {totalItemTypes}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', width: 56, height: 56 }}>
                  <CategoryIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{
            borderRadius: 4,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Total Quantity
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, fontFamily: "'Outfit', sans-serif" }}>
                    {totalStockQuantity}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(217, 70, 239, 0.1)', color: '#D946EF', width: 56, height: 56 }}>
                  <InventoryIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{
            borderRadius: 4,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Total Estimated Value
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, fontFamily: "'Outfit', sans-serif" }}>
                    ₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', width: 56, height: 56 }}>
                  <PriceIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtering and Searching Bar */}
      <Card sx={{
        mb: 4,
        p: 2,
        borderRadius: 4,
        border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
        background: isDark ? 'rgba(30, 41, 59, 0.2)' : '#ffffff',
      }}>
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              placeholder="Search items by name or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="All Categories"
                clickable
                color={selectedCategory === 'ALL' ? 'primary' : 'default'}
                onClick={() => setSelectedCategory('ALL')}
                sx={{ fontWeight: 600 }}
              />
              {CATEGORIES.map((cat) => (
                <Chip
                  key={cat.value}
                  label={cat.label}
                  clickable
                  sx={{
                    fontWeight: 600,
                    backgroundColor: selectedCategory === cat.value ? cat.color : undefined,
                    color: selectedCategory === cat.value ? '#fff' : undefined,
                    '&:hover': {
                      backgroundColor: selectedCategory === cat.value ? cat.color : undefined,
                    }
                  }}
                  onClick={() => setSelectedCategory(cat.value)}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Inventory Grid List */}
      {filteredItems.length === 0 ? (
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 4,
          border: `1px dashed ${theme.palette.divider}`,
          bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'
        }}>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
            No assets match your filters
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or register a new asset.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" animate="show">
          {filteredItems.map((item) => {
            const catInfo = getCategoryDetails(item.category);
            const isLowStock = item.quantity <= 3;
            const itemValue = item.quantity * (item.unitPrice || 0);

            return (
              <Grid item xs={12} sm={6} md={4} key={item.id} component={motion.div} variants={itemVariants}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                    background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '6px',
                      height: '100%',
                      backgroundColor: catInfo.color
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: isDark ? '0 12px 24px -10px rgba(0,0,0,0.6)' : '0 12px 24px -10px rgba(99, 102, 241, 0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ pl: 3, pt: 3, pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Chip
                        label={catInfo.label}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.65rem',
                          backgroundColor: catInfo.color,
                          color: '#ffffff',
                        }}
                      />
                      
                      <Box>
                        <IconButton size="small" onClick={() => handleOpenEditModal(item)} color="primary" sx={{ mr: 0.5 }}>
                          <EditIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(item.id, item.itemName)} color="error">
                          <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, fontFamily: "'Outfit', sans-serif" }}>
                      {item.itemName}
                    </Typography>

                    {/* Stock status indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1 }}>
                      <Chip
                        label={isLowStock ? (item.quantity === 0 ? 'Out of Stock' : 'Low Stock') : 'In Stock'}
                        size="small"
                        color={isLowStock ? (item.quantity === 0 ? 'error' : 'warning') : 'success'}
                        sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Qty: {item.quantity} units
                      </Typography>
                    </Box>

                    {/* Meta info details */}
                    <Stack spacing={1.5}>
                      {item.unitPrice && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <PriceIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
                          <Typography variant="caption" color="text.secondary">
                            Unit Price: <span style={{ fontWeight: 700, color: theme.palette.text.primary }}>₹{item.unitPrice.toFixed(2)}</span>
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                            Value: <span style={{ fontWeight: 700, color: theme.palette.text.primary }}>₹{itemValue.toFixed(2)}</span>
                          </Typography>
                        </Box>
                      )}

                      {item.vendorName && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <VendorIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
                          <Typography variant="caption" color="text.secondary">
                            Vendor: <span style={{ fontWeight: 700, color: theme.palette.text.primary }}>{item.vendorName}</span>
                          </Typography>
                        </Box>
                      )}

                      {item.purchaseDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CalendarIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
                          <Typography variant="caption" color="text.secondary">
                            Purchased: <span style={{ fontWeight: 700, color: theme.palette.text.primary }}>{new Date(item.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add / Edit Inventory Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            backgroundImage: 'none',
            bgcolor: isDark ? 'background.paper' : '#ffffff',
            boxShadow: '0px 20px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, pb: 1 }}>
          {editingItem ? 'Edit Asset Details' : 'Register New Asset Item'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Footballs, Set of Cricket Kits"
              fullWidth
              required
              variant="outlined"
            />

            <TextField
              select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              fullWidth
              variant="outlined"
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Total Quantity"
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = e.target.value;
                setQuantity(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
              }}
              fullWidth
              required
              variant="outlined"
              inputProps={{ min: 0 }}
            />

            <TextField
              label="Unit Price (₹)"
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="e.g. 15.50"
              fullWidth
              variant="outlined"
              inputProps={{ step: '0.01', min: 0 }}
            />

            <TextField
              label="Vendor Name (Optional)"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g. Sporting Goods Co"
              fullWidth
              variant="outlined"
            />

            <TextField
              label="Purchase Date (Optional)"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={() => setOpenModal(false)} variant="outlined" color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={addLoading || editLoading}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              {addLoading || editLoading ? <CircularProgress size={24} /> : 'Save Asset'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default InventoryManagement;
