import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation } from '@apollo/client';
import { motion } from 'framer-motion';
import {
  Box, Grid, Card, CardContent, Typography, Button, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Alert, Stack,
  Chip, Avatar, Divider, Tabs, Tab, useTheme, List, ListItem, ListItemText,
  TextField, Paper, IconButton, Autocomplete
} from '@mui/material';
import {
  DirectionsBus as BusIcon,
  Person as DriverIcon,
  Phone as PhoneIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Speed as SpeedIcon,
  AddCircle as AddIcon,
  Explore as ExploreIcon,
  AccessTime as TimeIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import {
  GET_VEHICLES_TRACKING,
  UPDATE_VEHICLE_LOCATION,
  CREATE_TRANSPORT_ROUTE,
  CREATE_VEHICLE,
  GET_TRANSPORT_ROUTES,
  GET_SCHOOL
} from '../graphql/operations';
import MapView from '../components/MapView';

const SIM_ROUTES = {};

const LOCATION_COORDS = {
  'School Main Gate': { lat: 28.6400, lng: 77.2400 },
  'School Campus': { lat: 28.6400, lng: 77.2400 },
  'Central School Campus': { lat: 28.6400, lng: 77.2400 }
};


function BusTracker() {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);

  const { data: schoolData } = useQuery(GET_SCHOOL, {
    variables: { id: user?.schoolId },
    skip: !user?.schoolId || user?.role === 'SUPER_ADMIN',
  });

  const [activeTab, setActiveTab] = useState(0);

  // Geolocation Broadcasting State
  const [selectedSimVehicle, setSelectedSimVehicle] = useState('');
  const [simRouteName, setSimRouteName] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [realCoords, setRealCoords] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  // Refs
  const watchIdRef = useRef(null);

  // Queries & Mutations
  const { loading, error, data, refetch } = useQuery(GET_VEHICLES_TRACKING, {
    pollInterval: isSimulating ? 0 : 4000, // Speed up polling when not simulating, let client local update do it
    fetchPolicy: 'network-only'
  });

  const { data: routesData, refetch: refetchRoutes } = useQuery(GET_TRANSPORT_ROUTES);

  const [updateLocation] = useMutation(UPDATE_VEHICLE_LOCATION);
  const [createRoute] = useMutation(CREATE_TRANSPORT_ROUTE);
  const [createVehicle] = useMutation(CREATE_VEHICLE);

  const vehiclesList = data?.getVehicles || [];
  const routesList = routesData?.getTransportRoutes || [];

  // Set default active tab based on role
  useEffect(() => {
    if (user?.role === 'DRIVER') {
      setActiveTab(1);
    } else {
      setActiveTab(0);
    }
  }, [user]);

  // Auto-select vehicle for logged in driver
  useEffect(() => {
    if (user?.role === 'DRIVER' && vehiclesList.length > 0 && !selectedSimVehicle) {
      const driverName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const driverPhone = user.phone || '';
      
      const matchedVehicle = vehiclesList.find(v => {
        const nameMatch = v.driverName && driverName && v.driverName.toLowerCase().includes(driverName.toLowerCase());
        const phoneMatch = v.driverPhone && driverPhone && v.driverPhone.replace(/\D/g, '').includes(driverPhone.replace(/\D/g, ''));
        return nameMatch || phoneMatch;
      });

      if (matchedVehicle) {
        setSelectedSimVehicle(matchedVehicle.id);
        if (matchedVehicle.routeId) {
          setSimRouteName(matchedVehicle.routeId.routeName);
        }
      }
    }
  }, [user, vehiclesList, selectedSimVehicle]);

  // Dynamic base coordinates and location resolver
  const city = schoolData?.getSchool?.address?.city || '';
  let baseLat = 28.6400;
  let baseLng = 77.2400;
  if (city) {
    const cityLower = city.toLowerCase().trim();
    if (cityLower === 'jaipur') {
      baseLat = 26.9124;
      baseLng = 75.7873;
    } else if (cityLower === 'boston') {
      baseLat = 42.3601;
      baseLng = -71.0589;
    } else if (cityLower === 'mumbai') {
      baseLat = 19.0760;
      baseLng = 72.8777;
    } else if (cityLower === 'bangalore' || cityLower === 'bengaluru') {
      baseLat = 12.9716;
      baseLng = 77.5946;
    }
  }

  const getCoordsForLocation = useCallback((locName) => {
    if (!locName) return { lat: baseLat, lng: baseLng };
    const normalized = locName.trim();
    if (LOCATION_COORDS[normalized]) {
      return LOCATION_COORDS[normalized];
    }
    
    // Deterministic hash of string to generate offset
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const offsetLat = ((Math.abs(hash) % 1000) / 1000 - 0.5) * 0.08;
    const offsetLng = (((Math.abs(hash >> 3) % 1000) / 1000 - 0.5) * 0.08);
    
    return {
      lat: baseLat + offsetLat,
      lng: baseLng + offsetLng
    };
  }, [baseLat, baseLng]);

  const getRoutePoints = useCallback((name) => {
    const dbRoute = routesList.find(r => r.routeName === name);
    if (dbRoute) {
      const points = [];
      points.push({
        name: dbRoute.startLocation,
        ...getCoordsForLocation(dbRoute.startLocation)
      });
      if (dbRoute.stops && dbRoute.stops.length > 0) {
        dbRoute.stops.forEach(s => {
          points.push({
            name: s.stopName,
            ...getCoordsForLocation(s.stopName)
          });
        });
      }
      points.push({
        name: dbRoute.endLocation,
        ...getCoordsForLocation(dbRoute.endLocation)
      });
      return points;
    }
    
    return [];
  }, [routesList, getCoordsForLocation]);



  const locationSuggestions = React.useMemo(() => {
    const city = schoolData?.getSchool?.address?.city || '';
    const defaults = city 
      ? [
          'School Campus',
          'School Main Gate',
          `${city} Railway Station`,
          `${city} Central Bus Stand`,
          `${city} City Center`,
          `${city} Metro Station`,
          `${city} Main Market`,
          `${city} Airport`,
          `${city} East Crossing`,
          `${city} West Hub`,
          `${city} South Junction`,
          `${city} North Terminal`,
        ]
      : [
          'School Campus',
          'School Main Gate',
          'Central Railway Station',
          'Main Bus Terminal',
          'City Center',
          'Metro Station Hub',
          'Main Market Crossing',
          'Local Airport',
          'East Crossing Terminal',
          'West Hub Terminal',
          'South Junction Hub',
          'North Terminal Gate',
        ];
    const existing = routesList.flatMap(r => [r.startLocation, r.endLocation]).filter(Boolean);
    return Array.from(new Set([...defaults, ...existing]));
  }, [routesList, schoolData]);

  // --- Fleet Manager Form State ---
  // Transport Route Form
  const [routeName, setRouteName] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [routeFee, setRouteFee] = useState('');
  const [stops, setStops] = useState([]);
  const [newStopName, setNewStopName] = useState('');
  const [newStopTime, setNewStopTime] = useState('');

  // Vehicle/Driver Form
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleCapacity, setVehicleCapacity] = useState('');
  const [vehicleDriverName, setVehicleDriverName] = useState('');
  const [vehicleDriverPhone, setVehicleDriverPhone] = useState('');
  const [vehicleRouteId, setVehicleRouteId] = useState('');

  // Feedback State
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState({});

  // --- Handlers ---
  const handleAddStop = () => {
    if (!newStopName.trim()) return;
    setStops([...stops, { stopName: newStopName.trim(), arrivalTime: newStopTime.trim() || '08:00 AM' }]);
    setNewStopName('');
    setNewStopTime('');
  };

  const handleRemoveStop = (index) => {
    setStops(stops.filter((_, idx) => idx !== index));
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setErrors({});

    const newErrors = {};
    if (!routeName.trim()) newErrors.routeName = 'Route Name is required.';
    if (!startLocation.trim()) newErrors.startLocation = 'Starting Point is required.';
    if (!endLocation.trim()) newErrors.endLocation = 'Destination Point is required.';
    
    const feeVal = parseFloat(routeFee);
    if (isNaN(feeVal) || feeVal <= 0) {
      newErrors.routeFee = 'Monthly Route Fee must be a positive number.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError('Please correct the highlighted errors before submitting.');
      return;
    }

    try {
      await createRoute({
        variables: {
          routeName: routeName.trim(),
          startLocation: startLocation.trim(),
          endLocation: endLocation.trim(),
          routeFee: feeVal,
          stops: stops.map(s => ({ stopName: s.stopName, arrivalTime: s.arrivalTime }))
        }
      });
      setFormSuccess('Transport Route created successfully!');
      setRouteName('');
      setStartLocation('');
      setEndLocation('');
      setRouteFee('');
      setStops([]);
      refetchRoutes();
    } catch (err) {
      console.error('Error creating route:', err);
      setFormError(err.message || 'Failed to create transport route.');
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setErrors({});

    const newErrors = {};
    if (!vehicleNo.trim()) newErrors.vehicleNo = 'Vehicle Plate Number is required.';
    
    const capVal = parseInt(vehicleCapacity, 10);
    if (isNaN(capVal) || capVal <= 0) {
      newErrors.vehicleCapacity = 'Seating Capacity must be a positive integer.';
    }

    if (!vehicleDriverName.trim()) newErrors.vehicleDriverName = 'Driver Full Name is required.';

    if (!vehicleDriverPhone.trim()) {
      newErrors.vehicleDriverPhone = 'Driver Phone Number is required.';
    } else if (!/^\d{10}$/.test(vehicleDriverPhone.trim())) {
      newErrors.vehicleDriverPhone = 'Driver phone number must be exactly 10 digits (digits only).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError('Please correct the highlighted errors before submitting.');
      return;
    }

    try {
      await createVehicle({
        variables: {
          vehicleNo: vehicleNo.trim(),
          model: vehicleModel.trim() || null,
          capacity: capVal,
          driverName: vehicleDriverName.trim(),
          driverPhone: vehicleDriverPhone.trim(),
          routeId: vehicleRouteId || null
        }
      });
      setFormSuccess('Vehicle registered successfully!');
      setVehicleNo('');
      setVehicleModel('');
      setVehicleCapacity('');
      setVehicleDriverName('');
      setVehicleDriverPhone('');
      setVehicleRouteId('');
      refetch(); // Refetch the tracking vehicles
    } catch (err) {
      console.error('Error creating vehicle:', err);
      setFormError(err.message || 'Failed to register vehicle.');
    }
  };



  // Demo initialization removed.

  // --- DRIVER CONSOLE TRIP REAL GPS STREAMER ---
  const handleToggleSimulation = () => {
    if (isSimulating) {
      // STOP GPS BROADCASTING
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsSimulating(false);
      setRealCoords(null);
      setGpsError(null);

      // Mark vehicle status as Inactive on server
      if (selectedSimVehicle) {
        updateLocation({
          variables: {
            id: selectedSimVehicle,
            latitude: baseLat,
            longitude: baseLng,
            status: 'Inactive'
          }
        }).then(() => refetch());
      }
    } else {
      // START GPS BROADCASTING
      if (!selectedSimVehicle) return;
      if (!navigator.geolocation) {
        setGpsError('Geolocation is not supported by this browser/device.');
        return;
      }

      setIsSimulating(true);
      setGpsError(null);

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, speed } = position.coords;
          // speed is in m/s, convert to km/h if it is a number
          const speedKmH = typeof speed === 'number' && speed > 0 ? Math.round(speed * 3.6) : 0;
          setRealCoords({ latitude, longitude, accuracy, speed: speedKmH });

          updateLocation({
            variables: {
              id: selectedSimVehicle,
              latitude,
              longitude,
              status: 'Active'
            }
          }).then(() => refetch());
        },
        (err) => {
          console.error('GPS error:', err);
          let errMsg = 'Failed to retrieve location.';
          if (err.code === 1) errMsg = 'Permission denied. Please allow location access.';
          else if (err.code === 2) errMsg = 'Position unavailable. Check your GPS signal.';
          else if (err.code === 3) errMsg = 'GPS timeout. Try again.';
          setGpsError(errMsg);
          setIsSimulating(false);
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000
        }
      );

      watchIdRef.current = watchId;
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setFormSuccess('');
    setFormError('');
    setErrors({});
  }, [activeTab]);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          GraphQL Query Error: {error.message}
        </Alert>
        {error.graphQLErrors && error.graphQLErrors.map((err, idx) => (
          <Alert key={idx} severity="error" sx={{ mb: 1 }}>
            {err.message} (Path: {err.path ? err.path.join('.') : 'N/A'})
          </Alert>
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
          GPS School Bus Tracker
        </Typography>
        <Chip
          label="Live Tracking Portal"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 700 }}
          icon={<ExploreIcon />}
        />
      </Box>

      {/* Tabs Menu */}
      {['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role) && (
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Live Tracking Board" sx={{ fontWeight: 700 }} />
          <Tab label="Driver Console / Simulator" sx={{ fontWeight: 700 }} />
          <Tab label="Fleet Manager" sx={{ fontWeight: 700 }} />
        </Tabs>
      )}

      {/* RENDER BOTH TABS (Preserving Map DOM to prevent Leaflet cleanup crashes) */}
      <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
        <Grid container spacing={3}>
          {/* Map Column */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: { xs: 450, md: 550 }, display: 'flex', flexDirection: 'column', p: 1 }}>
              <MapView 
                vehiclesList={vehiclesList}
                getRoutePoints={getRoutePoints}
                center={[baseLat, baseLng]}
              />
            </Card>
          </Grid>

          {/* Sidebar / Info Column */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Active School Fleets
                </Typography>

                {loading && vehiclesList.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                ) : vehiclesList.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                      No vehicles or routes are configured in the database yet.
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      Go to the Fleet Manager tab to configure routes and register vehicles.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2.5}>
                    {vehiclesList.map(vehicle => {
                      const isOnline = vehicle.status === 'Active';
                      return (
                        <Card key={vehicle.id} variant="outlined" sx={{ borderLeft: `5px solid ${isOnline ? '#10B981' : '#64748B'}`, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                  Bus {vehicle.vehicleNo}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Model: {vehicle.model}
                                </Typography>
                              </Box>
                              <Chip
                                label={isOnline ? 'Active' : 'Inactive'}
                                size="small"
                                color={isOnline ? 'success' : 'default'}
                                sx={{ fontWeight: 700 }}
                              />
                            </Box>

                            <Divider sx={{ my: 1 }} />

                            <Stack spacing={1}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ExploreIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {vehicle.routeId?.routeName || 'Unassigned Route'}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DriverIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {vehicle.driverName}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PhoneIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {vehicle.driverPhone}
                                </Typography>
                              </Box>
                            </Stack>

                            {isOnline && (
                              <Box sx={{ mt: 2, p: 1, bgcolor: '#10B98115', borderRadius: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                                  Currently transmitting Live coordinates
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(vehicle.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
        {/* SIMULATOR PANEL */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Driver GPS Broadcaster Panel
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
                Broadcast your mobile device's actual GPS location. Once active, the server receives real-time GPS coordinates to display on the live tracking board.
              </Typography>

              {vehiclesList.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                    Please register fleets or initialize demo data in the first tab to begin.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  <FormControl fullWidth disabled={isSimulating}>
                    <InputLabel id="sim-vehicle-select-label">Select Active Bus</InputLabel>
                    <Select
                      labelId="sim-vehicle-select-label"
                      value={selectedSimVehicle}
                      label="Select Active Bus"
                      onChange={(e) => {
                        const vehicleId = e.target.value;
                        setSelectedSimVehicle(vehicleId);
                        const vObj = vehiclesList.find(v => v.id === vehicleId);
                        if (vObj && vObj.routeId) {
                          setSimRouteName(vObj.routeId.routeName);
                        }
                      }}
                    >
                      {vehiclesList.map(v => (
                        <MenuItem key={v.id} value={v.id}>
                          Bus {v.vehicleNo} ({v.routeId?.routeName || 'No Route'})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ExploreIcon color="primary" /> GPS Status & Settings
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Assigned Route: <strong>{simRouteName || 'Unassigned'}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        💡 <strong>Notice:</strong> Keep this browser tab open and ensure your phone screen stays active while driving. Turn on high accuracy location mode on your device.
                      </Typography>
                    </Stack>
                  </Card>

                  <Button
                    variant="contained"
                    color={isSimulating ? 'error' : 'success'}
                    size="large"
                    disabled={!selectedSimVehicle}
                    onClick={handleToggleSimulation}
                    startIcon={isSimulating ? <StopIcon /> : <PlayIcon />}
                    sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                  >
                    {isSimulating ? 'Stop GPS Broadcasting' : 'Start GPS Broadcasting'}
                  </Button>
                </Stack>
              )}
            </Card>
          </Grid>

          {/* Real-time telemetry feed */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Live Driver Telemetry Console
              </Typography>

              {gpsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {gpsError}
                </Alert>
              )}

              {!isSimulating ? (
                <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', minHeight: 300 }}>
                  <ExploreIcon sx={{ fontSize: '3.5rem', color: 'text.secondary', opacity: 0.25, mb: 2 }} />
                  <Typography color="text.secondary">Start broadcasting to stream live GPS telemetry.</Typography>
                </Box>
              ) : (
                <Stack spacing={3} sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <SpeedIcon color="success" />
                      <Typography sx={{ fontWeight: 600 }}>Calculated Speed</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main' }}>
                      {realCoords?.speed !== undefined ? `${realCoords.speed} km/h` : '0 km/h'}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <ExploreIcon color="primary" />
                      <Typography sx={{ fontWeight: 600 }}>Current Coordinates</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {realCoords ? `${realCoords.latitude.toFixed(5)}, ${realCoords.longitude.toFixed(5)}` : 'Retrieving GPS lock...'}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <TimeIcon color="warning" />
                      <Typography sx={{ fontWeight: 600 }}>GPS Accuracy</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {realCoords ? `± ${realCoords.accuracy.toFixed(1)} meters` : 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 'auto', p: 2, bgcolor: '#10B98115', borderRadius: 2, border: '1px dashed', borderColor: 'success.main' }}>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }} align="center">
                      ✓ GPS BROADCAST: ACTIVE | Transmitting to Server...
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Fleet Manager Tab Content */}
      <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
        {/* Alert feedback */}
        {formSuccess && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setFormSuccess('')}>
            {formSuccess}
          </Alert>
        )}
        {formError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setFormError('')}>
            {formError}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Create Route Column */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <ExploreIcon color="primary" sx={{ fontSize: 30 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                    Configure Transport Route
                  </Typography>
                </Box>
                
                <form onSubmit={handleCreateRoute}>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      label="Route Name"
                      placeholder="e.g. Route C - East Loop"
                      value={routeName}
                      onChange={(e) => {
                        setRouteName(e.target.value);
                        if (errors.routeName) setErrors(prev => ({ ...prev, routeName: '' }));
                      }}
                      error={Boolean(errors.routeName)}
                      helperText={errors.routeName}
                      required
                      variant="outlined"
                    />
                    <Autocomplete
                      freeSolo
                      options={locationSuggestions}
                      value={startLocation}
                      onChange={(event, newValue) => {
                        setStartLocation(newValue || '');
                        if (errors.startLocation) setErrors(prev => ({ ...prev, startLocation: '' }));
                      }}
                      onInputChange={(event, newInputValue) => {
                        setStartLocation(newInputValue || '');
                        if (errors.startLocation) setErrors(prev => ({ ...prev, startLocation: '' }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Starting Point Location"
                          placeholder="e.g. East Crossing Terminal"
                          error={Boolean(errors.startLocation)}
                          helperText={errors.startLocation}
                          required
                          variant="outlined"
                        />
                      )}
                    />
                    <Autocomplete
                      freeSolo
                      options={locationSuggestions}
                      value={endLocation}
                      onChange={(event, newValue) => {
                        setEndLocation(newValue || '');
                        if (errors.endLocation) setErrors(prev => ({ ...prev, endLocation: '' }));
                      }}
                      onInputChange={(event, newInputValue) => {
                        setEndLocation(newInputValue || '');
                        if (errors.endLocation) setErrors(prev => ({ ...prev, endLocation: '' }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Destination Point Location"
                          placeholder="e.g. School Campus"
                          error={Boolean(errors.endLocation)}
                          helperText={errors.endLocation}
                          required
                          variant="outlined"
                        />
                      )}
                    />
                    <TextField
                      fullWidth
                      label="Monthly Route Fee ($)"
                      type="number"
                      placeholder="e.g. 1200"
                      value={routeFee}
                      onChange={(e) => {
                        setRouteFee(e.target.value);
                        if (errors.routeFee) setErrors(prev => ({ ...prev, routeFee: '' }));
                      }}
                      error={Boolean(errors.routeFee)}
                      helperText={errors.routeFee}
                      required
                      variant="outlined"
                    />

                    <Divider sx={{ my: 1 }} />

                    {/* Stops Builder */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>
                        Route Schedule & Stops
                      </Typography>
                      
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={7}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Stop Name"
                            placeholder="e.g. Central Market"
                            value={newStopName}
                            onChange={(e) => setNewStopName(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Time"
                            placeholder="08:00 AM"
                            value={newStopTime}
                            onChange={(e) => setNewStopTime(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={handleAddStop}
                            sx={{ height: '100%', minWidth: 'auto', borderRadius: 1.5 }}
                          >
                            Add
                          </Button>
                        </Grid>
                      </Grid>

                      {stops.length > 0 ? (
                        <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 200, overflowY: 'auto', bgcolor: 'background.default' }}>
                          <List dense disablePadding>
                            {stops.map((stop, idx) => (
                              <ListItem
                                key={idx}
                                secondaryAction={
                                  <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveStop(idx)}>
                                    <DeleteIcon color="error" />
                                  </IconButton>
                                }
                              >
                                <Chip label={idx + 1} size="small" color="primary" sx={{ mr: 1.5, fontWeight: 700 }} />
                                <ListItemText
                                  primary={stop.stopName}
                                  secondary={`Arrival Time: ${stop.arrivalTime}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      ) : (
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                          No custom stops added. If empty, the system falls back to seeded stops.
                        </Typography>
                      )}
                    </Box>

                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      Save Transport Route
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Register Vehicle Column */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <BusIcon color="primary" sx={{ fontSize: 30 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                    Register Vehicle & Driver Details
                  </Typography>
                </Box>

                <form onSubmit={handleCreateVehicle}>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      label="Vehicle Plate Number"
                      placeholder="e.g. DL-1CA-5678"
                      value={vehicleNo}
                      onChange={(e) => {
                        setVehicleNo(e.target.value);
                        if (errors.vehicleNo) setErrors(prev => ({ ...prev, vehicleNo: '' }));
                      }}
                      error={Boolean(errors.vehicleNo)}
                      helperText={errors.vehicleNo}
                      required
                      variant="outlined"
                    />
                    <TextField
                      fullWidth
                      label="Vehicle Model"
                      placeholder="e.g. Volvo Comfort 200"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      variant="outlined"
                    />
                    <TextField
                      fullWidth
                      label="Seating Capacity"
                      type="number"
                      placeholder="e.g. 35"
                      value={vehicleCapacity}
                      onChange={(e) => {
                        setVehicleCapacity(e.target.value);
                        if (errors.vehicleCapacity) setErrors(prev => ({ ...prev, vehicleCapacity: '' }));
                      }}
                      error={Boolean(errors.vehicleCapacity)}
                      helperText={errors.vehicleCapacity}
                      required
                      variant="outlined"
                    />
                    <TextField
                      fullWidth
                      label="Driver Full Name"
                      placeholder="e.g. John Doe"
                      value={vehicleDriverName}
                      onChange={(e) => {
                        setVehicleDriverName(e.target.value);
                        if (errors.vehicleDriverName) setErrors(prev => ({ ...prev, vehicleDriverName: '' }));
                      }}
                      error={Boolean(errors.vehicleDriverName)}
                      helperText={errors.vehicleDriverName}
                      required
                      variant="outlined"
                    />
                    <TextField
                      fullWidth
                      label="Driver Phone Number"
                      placeholder="e.g. +91 98765 43210"
                      value={vehicleDriverPhone}
                      onChange={(e) => {
                        setVehicleDriverPhone(e.target.value);
                        if (errors.vehicleDriverPhone) setErrors(prev => ({ ...prev, vehicleDriverPhone: '' }));
                      }}
                      error={Boolean(errors.vehicleDriverPhone)}
                      helperText={errors.vehicleDriverPhone}
                      required
                      variant="outlined"
                    />

                    <FormControl fullWidth>
                      <InputLabel id="fleet-route-select-label">Assign Transport Route</InputLabel>
                      <Select
                        labelId="fleet-route-select-label"
                        value={vehicleRouteId}
                        label="Assign Transport Route"
                        onChange={(e) => setVehicleRouteId(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>None - Unassigned</em>
                        </MenuItem>
                        {routesList.map((route) => (
                          <MenuItem key={route.id} value={route.id}>
                            {route.routeName} ({route.startLocation} ➔ {route.endLocation})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      Register Vehicle & Driver
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default BusTracker;
