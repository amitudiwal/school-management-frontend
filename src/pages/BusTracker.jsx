import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation } from '@apollo/client';
import { motion } from 'framer-motion';
import {
  Box, Grid, Card, CardContent, Typography, Button, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Alert, Stack,
  Chip, Avatar, Divider, Tabs, Tab, useTheme, List, ListItem, ListItemText,
  TextField, Paper, IconButton, Autocomplete, FormControlLabel, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, Radio
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
  Delete as DeleteIcon,
  Warning as AlertTriangle,
  MyLocation as MyLocationIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import {
  GET_VEHICLES_TRACKING,
  UPDATE_VEHICLE_LOCATION,
  CREATE_TRANSPORT_ROUTE,
  DELETE_TRANSPORT_ROUTE,
  CREATE_VEHICLE,
  DELETE_VEHICLE,
  GET_TRANSPORT_ROUTES,
  GET_SCHOOL,
  TRIGGER_SOS,
  CLEAR_SOS
} from '../graphql/operations';
import MapView from '../components/MapView';
import { CITIES_AND_STATES_DB, filterLocationSuggestions } from '../utils/locationsData';

const SIM_ROUTES = {};


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
  const [useMockSimulation, setUseMockSimulation] = useState(true);
  const simIntervalRef = useRef(null);
  const currentSimIndexRef = useRef(0);

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
  const [triggerSosMutation] = useMutation(TRIGGER_SOS);
  const [clearSosMutation] = useMutation(CLEAR_SOS);

  const [deleteRouteMutation] = useMutation(DELETE_TRANSPORT_ROUTE, {
    onCompleted: () => {
      refetchRoutes();
      refetch();
    }
  });

  const [deleteVehicleMutation] = useMutation(DELETE_VEHICLE, {
    onCompleted: () => {
      refetch();
    }
  });

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '', type: 'route' });

  const handleDeleteRoute = (id, routeName) => {
    setDeleteModal({ open: true, id, name: routeName, type: 'route' });
  };

  const handleDeleteVehicle = (id, vehicleNo) => {
    setDeleteModal({ open: true, id, name: `Bus ${vehicleNo}`, type: 'vehicle' });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.id) return;
    if (deleteModal.type === 'route') {
      deleteRouteMutation({ variables: { id: deleteModal.id } });
    } else if (deleteModal.type === 'vehicle') {
      deleteVehicleMutation({ variables: { id: deleteModal.id } });
    }
    setDeleteModal({ open: false, id: null, name: '', type: 'route' });
  };

  // SOS State
  const [sosOpen, setSosOpen] = useState(false);
  const [sosReason, setSosReason] = useState('Bus Breakdown');
  const [triggeringSos, setTriggeringSos] = useState(false);
  
  // Arrived Stops Checklist State
  const [arrivedStops, setArrivedStops] = useState({});

  // Wake Lock Ref
  const wakeLockRef = useRef(null);

  const vehiclesList = data?.getVehicles || [];
  const routesList = routesData?.getTransportRoutes || [];

  const selectedSimVehicleObj = vehiclesList.find(v => v.id === selectedSimVehicle);

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
  const schoolCity = schoolData?.getSchool?.address?.city || '';
  
  // Dynamically resolve base region coordinates from school city (defaults to Ujjain, MP: 23.1765, 75.7885)
  const baseCoords = React.useMemo(() => {
    let lat = 23.1765; // Default Ujjain, MP
    let lng = 75.7885;
    if (schoolCity) {
      const match = CITIES_AND_STATES_DB.find(
        c => c.city.toLowerCase() === schoolCity.toLowerCase() || c.name.toLowerCase().includes(schoolCity.toLowerCase())
      );
      if (match) {
        lat = match.lat;
        lng = match.lng;
      }
    }
    return { lat, lng };
  }, [schoolCity]);

  const baseLat = baseCoords.lat;
  const baseLng = baseCoords.lng;

  const LOCATION_COORDS = React.useMemo(() => ({
    'School Main Gate': { lat: baseLat, lng: baseLng },
    'School Campus': { lat: baseLat, lng: baseLng },
    'Central School Campus': { lat: baseLat, lng: baseLng }
  }), [baseLat, baseLng]);

  const getCoordsForLocation = useCallback((locName) => {
    if (!locName) return { lat: baseLat, lng: baseLng };
    const normalized = locName.trim();
    
    // 1. Check for explicit coordinates suffix: @ lat, lng
    const match = normalized.match(/@\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }

    // 2. Check dynamic LOCATION_COORDS
    if (LOCATION_COORDS[normalized]) {
      return LOCATION_COORDS[normalized];
    }
    
    // 3. Search CITIES_AND_STATES_DB with smart landmark matching priority
    const normLower = normalized.toLowerCase();
    
    // Priority 1: Exact match by name or city
    let found = CITIES_AND_STATES_DB.find(c => c.name.toLowerCase() === normLower || c.city.toLowerCase() === normLower);
    
    // Priority 2: Name in input (prioritizing specific landmarks/towns like Ghudawan over broad cities like Ujjain/Khachrod)
    if (!found) {
      // Find all DB entries whose name is contained in normalized input
      const matchingEntries = CITIES_AND_STATES_DB.filter(c => normLower.includes(c.name.toLowerCase()));
      if (matchingEntries.length > 0) {
        // Pick the longest matching name (most specific landmark, e.g. "Ghudawan, Khachrod" or "Ghudawan" over "Khachrod")
        matchingEntries.sort((a, b) => b.name.length - a.name.length);
        found = matchingEntries[0];
      }
    }

    // Priority 3: Input contained inside DB entry name
    if (!found) {
      found = CITIES_AND_STATES_DB.find(c => c.name.toLowerCase().includes(normLower));
    }

    if (found) {
      return { lat: found.lat, lng: found.lng };
    }

    // 4. Deterministic hash offset centered around school's local region (Ujjain/MP)
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const offsetLat = ((Math.abs(hash) % 1000) / 1000 - 0.5) * 0.05;
    const offsetLng = (((Math.abs(hash >> 3) % 1000) / 1000 - 0.5) * 0.05);
    
    return {
      lat: baseLat + offsetLat,
      lng: baseLng + offsetLng
    };
  }, [baseLat, baseLng, LOCATION_COORDS]);

  const getMainStops = useCallback((name) => {
    const dbRoute = routesList.find(r => r.routeName === name);
    if (dbRoute) {
      const mainStops = [];
      const startCoords = getCoordsForLocation(dbRoute.startLocation);
      mainStops.push({
        name: dbRoute.startLocation,
        ...startCoords
      });
      if (dbRoute.stops && dbRoute.stops.length > 0) {
        dbRoute.stops.forEach(s => {
          mainStops.push({
            name: s.stopName,
            ...getCoordsForLocation(s.stopName)
          });
        });
      }
      const endCoords = getCoordsForLocation(dbRoute.endLocation);
      mainStops.push({
        name: dbRoute.endLocation,
        ...endCoords
      });
      return mainStops;
    }
    return [];
  }, [routesList, getCoordsForLocation]);

  const getRoutePoints = useCallback((name) => {
    const dbRoute = routesList.find(r => r.routeName === name);
    if (dbRoute) {
      const mainStops = getMainStops(name);

      // Interpolate smooth sub-waypoints between stops for 3D bus navigation animation
      const detailedPoints = [];
      for (let i = 0; i < mainStops.length - 1; i++) {
        const from = mainStops[i];
        const to = mainStops[i + 1];
        detailedPoints.push(from);
        
        const steps = 6;
        for (let s = 1; s < steps; s++) {
          const ratio = s / steps;
          detailedPoints.push({
            name: `${from.name} ➔ ${to.name} (${Math.round(ratio * 100)}%)`,
            lat: from.lat + (to.lat - from.lat) * ratio,
            lng: from.lng + (to.lng - from.lng) * ratio
          });
        }
      }
      detailedPoints.push(mainStops[mainStops.length - 1]);
      return detailedPoints;
    }
    
    return [];
  }, [routesList, getMainStops]);

  // Dynamic Map Center auto-focused on active vehicles or configured routes
  const mapCenter = React.useMemo(() => {
    const activeVehicle = vehiclesList.find(v => typeof v.currentLatitude === 'number' && typeof v.currentLongitude === 'number');
    if (activeVehicle) {
      return [activeVehicle.currentLatitude, activeVehicle.currentLongitude];
    }
    if (routesList.length > 0 && routesList[0].startLocation) {
      const coords = getCoordsForLocation(routesList[0].startLocation);
      if (coords && coords.lat && coords.lng) {
        return [coords.lat, coords.lng];
      }
    }
    return [baseLat, baseLng];
  }, [vehiclesList, routesList, getCoordsForLocation, baseLat, baseLng]);



  const [fetchedSuggestions, setFetchedSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [locationError, setLocationError] = useState('');

  const fetchSuggestionsFromGPS = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }
    setIsLoadingSuggestions(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const delta = 0.15; // ~15km radius bounding box
        const left = longitude - delta;
        const right = longitude + delta;
        const top = latitude + delta;
        const bottom = latitude - delta;
        
        try {
          // 1. Reverse geocoding for current exact address
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          
          let currentAddrShort = '';
          let cityName = '';
          if (revRes.ok) {
            const revData = await revRes.json();
            if (revData && revData.display_name) {
              const addrParts = revData.address || {};
              const placeName = addrParts.amenity || addrParts.building || addrParts.shop || addrParts.office || '';
              const road = addrParts.road || '';
              const suburb = addrParts.suburb || addrParts.neighbourhood || '';
              const cityVal = addrParts.city || addrParts.town || addrParts.village || addrParts.county || '';
              
              if (cityVal) {
                cityName = cityVal;
              }

              const parts = [placeName, road, suburb, cityVal].filter(Boolean);
              currentAddrShort = parts.slice(0, 2).join(', ');
              if (!currentAddrShort) {
                currentAddrShort = revData.display_name.split(',').slice(0, 2).join(',').trim();
              }
            }
          }

          // 2. Fetch nearby landmarks bounded within local area
          const searchQueries = [
            `https://nominatim.openstreetmap.org/search?format=json&q=bus+stop&viewbox=${left},${top},${right},${bottom}&bounded=1&limit=5`,
            `https://nominatim.openstreetmap.org/search?format=json&q=station&viewbox=${left},${top},${right},${bottom}&bounded=1&limit=5`,
            `https://nominatim.openstreetmap.org/search?format=json&q=market&viewbox=${left},${top},${right},${bottom}&bounded=1&limit=5`
          ];
          if (cityName) {
            searchQueries.push(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&viewbox=${left},${top},${right},${bottom}&bounded=1&limit=5`);
          }

          const responses = await Promise.all(
            searchQueries.map(url =>
              fetch(url, { headers: { 'Accept-Language': 'en' } })
                .then(res => res.json())
                .catch(() => [])
            )
          );

          const suggestions = [];
          if (currentAddrShort) {
            suggestions.push(`Current Location (${currentAddrShort}) @ ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          } else {
            suggestions.push(`Current Location @ ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }

          responses.forEach(results => {
            if (Array.isArray(results)) {
              results.forEach(item => {
                const displayName = item.display_name;
                const nameParts = displayName.split(',');
                const name = nameParts[0].trim();
                const context = nameParts[1] ? nameParts[1].trim() : '';
                const cleanName = context ? `${name}, ${context}` : name;
                const latVal = parseFloat(item.lat).toFixed(6);
                const lonVal = parseFloat(item.lon).toFixed(6);
                const fullSuggestion = `${cleanName} @ ${latVal}, ${lonVal}`;

                if (cleanName && !suggestions.includes(fullSuggestion)) {
                  suggestions.push(fullSuggestion);
                }
              });
            }
          });

          setFetchedSuggestions(suggestions);
        } catch (error) {
          console.error("Error fetching suggestions from current location:", error);
          setLocationError("Failed to fetch nearby landmark suggestions.");
        } finally {
          setIsLoadingSuggestions(false);
        }
      },
      (error) => {
        console.warn("Geolocation retrieval error:", error);
        let errMsg = "Location permission denied.";
        if (error.code === 2) errMsg = "Position unavailable. Verify GPS connection.";
        else if (error.code === 3) errMsg = "GPS timeout.";
        setLocationError(errMsg);
        setIsLoadingSuggestions(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    if (activeTab === 2 && fetchedSuggestions.length === 0 && !isLoadingSuggestions) {
      fetchSuggestionsFromGPS();
    }
  }, [activeTab, fetchedSuggestions.length, isLoadingSuggestions, fetchSuggestionsFromGPS]);

  const handleSetLocationToCurrent = useCallback((setField) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          
          let currentAddrShort = '';
          if (revRes.ok) {
            const revData = await revRes.json();
            if (revData && revData.display_name) {
              const addrParts = revData.address || {};
              const placeName = addrParts.amenity || addrParts.building || addrParts.shop || addrParts.office || '';
              const road = addrParts.road || '';
              const suburb = addrParts.suburb || addrParts.neighbourhood || '';
              const cityVal = addrParts.city || addrParts.town || addrParts.village || '';
              
              const parts = [placeName, road, suburb, cityVal].filter(Boolean);
              currentAddrShort = parts.slice(0, 2).join(', ');
              if (!currentAddrShort) {
                currentAddrShort = revData.display_name.split(',').slice(0, 2).join(',').trim();
              }
            }
          }
          
          const value = currentAddrShort
            ? `Current Location (${currentAddrShort}) @ ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            : `Current Location @ ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          setFetchedSuggestions(prev => {
            if (!prev.includes(value)) {
              return [value, ...prev];
            }
            return prev;
          });
          
          setField(value);
        } catch (error) {
          console.error("Error setting current location:", error);
          const fallback = `Current Location @ ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setField(fallback);
        }
      },
      (error) => {
        console.warn("Geolocation retrieval error:", error);
        alert(`Failed to retrieve current location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const locationSuggestions = React.useMemo(() => {
    const city = schoolData?.getSchool?.address?.city || '';
    const defaults = CITIES_AND_STATES_DB.map(c => c.name);
    const existing = routesList.flatMap(r => [r.startLocation, r.endLocation]).filter(Boolean);
    return Array.from(new Set([...fetchedSuggestions, ...existing, ...defaults]));
  }, [routesList, schoolData, fetchedSuggestions]);

  // Live State, City & Landmark Autocomplete Search Engine
  const [startLocationOptions, setStartLocationOptions] = useState(() => CITIES_AND_STATES_DB.map(c => c.name));
  const [endLocationOptions, setEndLocationOptions] = useState(() => CITIES_AND_STATES_DB.map(c => c.name));
  const [stopLocationOptions, setStopLocationOptions] = useState(() => CITIES_AND_STATES_DB.map(c => c.name));
  const searchDebounceRef = useRef(null);

  const handleSearchLocationSuggestions = useCallback((value, setOptions) => {
    if (!value || value.trim() === '') {
      setOptions(CITIES_AND_STATES_DB.map(c => c.name));
      return;
    }

    const q = value.trim();

    // 1. Instant local database filtering ($0ms delay)
    const localFiltered = filterLocationSuggestions(q).map(c => c.name);
    setOptions(localFiltered);

    // 2. Debounced live OpenStreetMap (Nominatim) search for fine-grained places & landmarks
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (q.length >= 2) {
      searchDebounceRef.current = setTimeout(async () => {
        try {
          const schoolCity = schoolData?.getSchool?.address?.city || '';
          // Biased query with city context if query doesn't explicitly mention it
          const searchQuery = (schoolCity && !q.toLowerCase().includes(schoolCity.toLowerCase())) 
            ? `${q}, ${schoolCity}` 
            : q;

          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=8`,
            { headers: { 'Accept-Language': 'en' } }
          );

          if (res.ok) {
            const data = await res.json();
            const liveNames = data.map(item => {
              const parts = item.display_name.split(',');
              const place = parts[0].trim();
              const cityOrDistrict = parts[1] ? parts[1].trim() : '';
              return cityOrDistrict ? `${place}, ${cityOrDistrict}` : place;
            });

            // If biased search returns fewer results, try exact global query
            if (liveNames.length === 0 && searchQuery !== q) {
              const globalRes = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6`,
                { headers: { 'Accept-Language': 'en' } }
              );
              if (globalRes.ok) {
                const globalData = await globalRes.json();
                globalData.forEach(item => {
                  const parts = item.display_name.split(',');
                  const place = parts[0].trim();
                  const cityOrDistrict = parts[1] ? parts[1].trim() : '';
                  liveNames.push(cityOrDistrict ? `${place}, ${cityOrDistrict}` : place);
                });
              }
            }

            const combined = Array.from(new Set([...localFiltered, ...liveNames]));
            setOptions(combined.slice(0, 25));
          }
        } catch (err) {
          // Gracefully fallback to instant local matches
        }
      }, 250); // 250ms smooth debounce
    }
  }, [schoolData]);

  // Sync route points lookup coordinates if available in database
  const getCoordinatesForLocation = useCallback((locName) => {
    if (!locName) return null;
    const found = CITIES_AND_STATES_DB.find(
      c => c.name.toLowerCase() === locName.toLowerCase() || c.city.toLowerCase() === locName.toLowerCase()
    );
    if (found) {
      return { lat: found.lat, lng: found.lng };
    }
    return null;
  }, []);

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

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Wake Lock acquired');
      }
    } catch (err) {
      console.warn('Wake Lock request failed:', err.message);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().then(() => {
        wakeLockRef.current = null;
        console.log('Wake Lock released');
      });
    }
  };

  const handleTriggerSOS = async () => {
    if (!selectedSimVehicle) return;
    setTriggeringSos(true);
    try {
      await triggerSosMutation({
        variables: {
          id: selectedSimVehicle,
          message: sosReason
        }
      });
      setSosOpen(false);
      refetch();
    } catch (err) {
      console.error('SOS Trigger error:', err);
    } finally {
      setTriggeringSos(false);
    }
  };

  const handleClearSOS = async (vehicleId) => {
    try {
      await clearSosMutation({
        variables: {
          id: vehicleId
        }
      });
      refetch();
    } catch (err) {
      console.error('SOS Clear error:', err);
    }
  };

  // Haversine distance formula in meters
  const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Check proximity to stops and mark arrival
  useEffect(() => {
    if (vehiclesList.length === 0) return;
    
    let updated = false;
    const newArrived = { ...arrivedStops };

    vehiclesList.forEach(vehicle => {
      if (vehicle.status !== 'Active') return;
      if (!vehicle.routeId?.routeName) return;

      const routePoints = getRoutePoints(vehicle.routeId.routeName);
      routePoints.forEach(point => {
        const key = `${vehicle.id}-${point.name}`;
        if (newArrived[key]) return; // Already arrived

        const dist = getDistanceMeters(
          vehicle.currentLatitude,
          vehicle.currentLongitude,
          point.lat,
          point.lng
        );

        if (dist < 150) {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          newArrived[key] = nowStr;
          updated = true;
        }
      });
    });

    if (updated) {
      setArrivedStops(newArrived);
    }
  }, [vehiclesList, arrivedStops, getRoutePoints]);

  // Clean up arrived checklist of inactive vehicles
  useEffect(() => {
    let changed = false;
    const newArrived = { ...arrivedStops };
    
    Object.keys(newArrived).forEach(key => {
      const vehicleId = key.split('-')[0];
      const vehicle = vehiclesList.find(v => v.id === vehicleId);
      if (!vehicle || vehicle.status !== 'Active') {
        delete newArrived[key];
        changed = true;
      }
    });

    if (changed) {
      setArrivedStops(newArrived);
    }
  }, [vehiclesList]);

  // --- DRIVER CONSOLE TRIP REAL GPS STREAMER ---
  const handleToggleSimulation = () => {
    if (isSimulating) {
      // STOP GPS BROADCASTING / SIMULATION
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (simIntervalRef.current !== null) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      releaseWakeLock();
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
      // START GPS BROADCASTING / SIMULATION
      if (!selectedSimVehicle) return;

      setIsSimulating(true);
      setGpsError(null);
      requestWakeLock();

      if (useMockSimulation) {
        // Run demo path simulation
        const routePoints = getRoutePoints(simRouteName);
        if (routePoints.length === 0) {
          // If no route points, simulate static base with slight jitter
          let step = 0;
          simIntervalRef.current = setInterval(() => {
            const jitterLat = baseLat + (Math.sin(step) * 0.005);
            const jitterLng = baseLng + (Math.cos(step) * 0.005);
            step += 0.5;
            setRealCoords({ latitude: jitterLat, longitude: jitterLng, accuracy: 5, speed: 25 });
            updateLocation({
              variables: {
                id: selectedSimVehicle,
                latitude: jitterLat,
                longitude: jitterLng,
                status: 'Active'
              }
            }).then(() => refetch());
          }, 3000);
        } else {
          currentSimIndexRef.current = 0;
          // Trigger first point immediately
          const initialPoint = routePoints[0];
          setRealCoords({ latitude: initialPoint.lat, longitude: initialPoint.lng, accuracy: 3, speed: 30 });
          updateLocation({
            variables: {
              id: selectedSimVehicle,
              latitude: initialPoint.lat,
              longitude: initialPoint.lng,
              status: 'Active'
            }
          }).then(() => refetch());
          currentSimIndexRef.current = 1 % routePoints.length;

          simIntervalRef.current = setInterval(() => {
            const point = routePoints[currentSimIndexRef.current];
            setRealCoords({ latitude: point.lat, longitude: point.lng, accuracy: 3, speed: 30 });
            updateLocation({
              variables: {
                id: selectedSimVehicle,
                latitude: point.lat,
                longitude: point.lng,
                status: 'Active'
              }
            }).then(() => refetch());
            currentSimIndexRef.current = (currentSimIndexRef.current + 1) % routePoints.length;
          }, 3000);
        }
      } else {
        if (!navigator.geolocation) {
          setGpsError('Geolocation is not supported by this browser/device.');
          setIsSimulating(false);
          return;
        }
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, accuracy, speed } = position.coords;
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
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simIntervalRef.current !== null) {
        clearInterval(simIntervalRef.current);
      }
      releaseWakeLock();
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
        {/* SOS BANNERS */}
        {vehiclesList.filter(v => v.sosMessage).map(v => (
          <Alert
            key={v.id}
            severity="error"
            variant="filled"
            sx={{
              mb: 3,
              borderRadius: 2,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.9 },
                '50%': { opacity: 1, transform: 'scale(1.005)' },
                '100%': { opacity: 0.9 }
              },
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
              fontWeight: 700
            }}
            action={
              ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TRANSPORT_MANAGER'].includes(user?.role) && (
                <Button
                  color="inherit"
                  size="small"
                  variant="outlined"
                  onClick={() => handleClearSOS(v.id)}
                  sx={{ fontWeight: 800, textTransform: 'none' }}
                >
                  Resolve Alert
                </Button>
              )
            }
          >
            🚨 EMERGENCY: Bus {v.vehicleNo} has reported "{v.sosMessage}" (Driver: {v.driverName}, Phone: {v.driverPhone}) at {new Date(v.sosTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!
          </Alert>
        ))}

        <Grid container spacing={3}>
          {/* Map Column */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: { xs: 450, md: 550 }, display: 'flex', flexDirection: 'column', p: 1 }}>
              <MapView 
                vehiclesList={vehiclesList}
                getRoutePoints={getRoutePoints}
                center={mapCenter}
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={isOnline ? 'Active' : 'Inactive'}
                                  size="small"
                                  color={isOnline ? 'success' : 'default'}
                                  sx={{ fontWeight: 700 }}
                                />
                                {['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TRANSPORT_MANAGER'].includes(user?.role) && (
                                  <IconButton
                                    size="small"
                                    color="error"
                                    title="Delete Vehicle"
                                    onClick={() => handleDeleteVehicle(vehicle.id, vehicle.vehicleNo)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
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

                            {vehicle.sosMessage && (
                              <Box sx={{ mt: 1.5, p: 1, bgcolor: '#EF444415', border: '1px solid #EF4444', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AlertTriangle sx={{ color: 'error.main', fontSize: '1.2rem' }} />
                                <Typography variant="caption" color="error.main" sx={{ fontWeight: 800 }}>
                                  SOS Alert: {vehicle.sosMessage}
                                </Typography>
                              </Box>
                            )}

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

                            {isOnline && vehicle.routeId?.routeName && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}>
                                  Stops Progress Timeline:
                                </Typography>
                                <Stack spacing={0.5}>
                                  {getMainStops(vehicle.routeId.routeName).map((point, idx) => {
                                    const arrivalTime = arrivedStops[`${vehicle.id}-${point.name}`];
                                    return (
                                      <Box
                                        key={idx}
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          p: 0.75,
                                          bgcolor: arrivalTime ? '#10B98110' : '#64748B08',
                                          borderRadius: 1,
                                          borderLeft: arrivalTime ? '3px solid #10B981' : '3px solid #64748B'
                                        }}
                                      >
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: arrivalTime ? 'success.main' : 'text.primary' }}>
                                          {arrivalTime ? '✓' : '○'} {point.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                          {arrivalTime ? `Arrived ${arrivalTime}` : 'Pending'}
                                        </Typography>
                                      </Box>
                                    );
                                  })}
                                </Stack>
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

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={useMockSimulation}
                        onChange={(e) => setUseMockSimulation(e.target.checked)}
                        disabled={isSimulating}
                      />
                    }
                    label="Simulate Route Movement (Demo/Test Mode)"
                    sx={{ alignSelf: 'flex-start' }}
                  />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                    <Button
                      variant="contained"
                      color={isSimulating ? 'error' : 'success'}
                      size="large"
                      fullWidth
                      disabled={!selectedSimVehicle}
                      onClick={handleToggleSimulation}
                      startIcon={isSimulating ? <StopIcon /> : <PlayIcon />}
                      sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      {isSimulating ? 'Stop GPS Broadcasting' : 'Start GPS Broadcasting'}
                    </Button>

                    {selectedSimVehicleObj?.sosMessage ? (
                      <Button
                        variant="contained"
                        color="warning"
                        size="large"
                        fullWidth
                        disabled={!selectedSimVehicle}
                        onClick={() => handleClearSOS(selectedSimVehicle)}
                        startIcon={<AlertTriangle />}
                        sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                      >
                        Clear SOS Alert
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="error"
                        size="large"
                        fullWidth
                        disabled={!isSimulating}
                        onClick={() => setSosOpen(true)}
                        startIcon={<AlertTriangle />}
                        sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                      >
                        Trigger SOS Emergency
                      </Button>
                    )}
                  </Stack>
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
                      options={startLocationOptions}
                      value={startLocation}
                      onChange={(event, newValue) => {
                        setStartLocation(newValue || '');
                        if (errors.startLocation) setErrors(prev => ({ ...prev, startLocation: '' }));
                      }}
                      onInputChange={(event, newInputValue) => {
                        setStartLocation(newInputValue || '');
                        if (errors.startLocation) setErrors(prev => ({ ...prev, startLocation: '' }));
                        handleSearchLocationSuggestions(newInputValue || '', setStartLocationOptions);
                      }}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} key={option} sx={{ py: 1, px: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <LocationOnIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {option}
                          </Typography>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Starting Point Location"
                          placeholder="Type state, city or landmark (e.g. Ujjain, Indore, Delhi...)"
                          error={Boolean(errors.startLocation)}
                          helperText={errors.startLocation || "Autocomplete suggestions for all states & cities"}
                          required
                          variant="outlined"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleSetLocationToCurrent(setStartLocation)}
                                  title="Detect Current Location"
                                  sx={{ mr: 0.5 }}
                                >
                                  <MyLocationIcon fontSize="small" />
                                </IconButton>
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                    />
                    <Autocomplete
                      freeSolo
                      options={endLocationOptions}
                      value={endLocation}
                      onChange={(event, newValue) => {
                        setEndLocation(newValue || '');
                        if (errors.endLocation) setErrors(prev => ({ ...prev, endLocation: '' }));
                      }}
                      onInputChange={(event, newInputValue) => {
                        setEndLocation(newInputValue || '');
                        if (errors.endLocation) setErrors(prev => ({ ...prev, endLocation: '' }));
                        handleSearchLocationSuggestions(newInputValue || '', setEndLocationOptions);
                      }}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} key={option} sx={{ py: 1, px: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <LocationOnIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {option}
                          </Typography>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Destination Point Location"
                          placeholder="Type state, city or landmark (e.g. School Campus, Bhopal...)"
                          error={Boolean(errors.endLocation)}
                          helperText={errors.endLocation || "Autocomplete suggestions for all states & cities"}
                          required
                          variant="outlined"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleSetLocationToCurrent(setEndLocation)}
                                  title="Detect Current Location"
                                  sx={{ mr: 0.5 }}
                                >
                                  <MyLocationIcon fontSize="small" />
                                </IconButton>
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
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
                          <Autocomplete
                            freeSolo
                            options={stopLocationOptions}
                            value={newStopName}
                            onChange={(event, newValue) => {
                              setNewStopName(newValue || '');
                            }}
                            onInputChange={(event, newInputValue) => {
                              setNewStopName(newInputValue || '');
                              handleSearchLocationSuggestions(newInputValue || '', setStopLocationOptions);
                            }}
                            renderOption={(props, option) => (
                              <Box component="li" {...props} key={option} sx={{ py: 0.75, px: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOnIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                  {option}
                                </Typography>
                              </Box>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                size="small"
                                label="Stop Name / Landmark"
                                placeholder="Search landmark or stop..."
                              />
                            )}
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

        {/* Active Routes & Vehicles Management Lists */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 3 }}>
            Manage Configured Transport Routes & Registered Vehicles
          </Typography>

          <Grid container spacing={3}>
            {/* Routes List */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ExploreIcon color="primary" /> Configured Routes ({routesList.length})
                </Typography>

                {routesList.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                    No transport routes configured. Use the form above to add a route.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {routesList.map((route) => (
                      <Paper key={route.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              {route.routeName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {route.startLocation} ➔ {route.endLocation}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteRoute(route.id, route.routeName)}
                            sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 700 }}
                          >
                            Delete Route
                          </Button>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            Fee: ₹{route.routeFee}/mo
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {route.stops?.length || 0} Intermediate Stops
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Card>
            </Grid>

            {/* Vehicles List */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusIcon color="primary" /> Registered Fleets ({vehiclesList.length})
                </Typography>

                {vehiclesList.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                    No vehicles registered yet. Use the form above to register a bus and driver.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {vehiclesList.map((v) => (
                      <Paper key={v.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              Bus {v.vehicleNo}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Driver: {v.driverName} ({v.driverPhone})
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteVehicle(v.id, v.vehicleNo)}
                            sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 700 }}
                          >
                            Delete Bus
                          </Button>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Route: {v.routeId?.routeName || 'Unassigned'}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
      {/* SOS Modal Dialog */}
      <Dialog open={sosOpen} onClose={() => setSosOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>
          🚨 Trigger Emergency SOS Alert
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will broadcast a critical warning banner to all administrators and parents tracking this vehicle. Select the emergency category:
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={sosReason}
              onChange={(e) => setSosReason(e.target.value)}
            >
              <FormControlLabel value="Bus Breakdown" control={<Radio color="error" />} label="⚙️ Bus Breakdown / Engine Failure" />
              <FormControlLabel value="Flat Tire" control={<Radio color="error" />} label="🛞 Flat Tire" />
              <FormControlLabel value="Accident" control={<Radio color="error" />} label="💥 Traffic Accident" />
              <FormControlLabel value="Medical Emergency" control={<Radio color="error" />} label="🚑 Medical Emergency" />
              <FormControlLabel value="Severe Traffic Block" control={<Radio color="error" />} label="🚧 Severe Traffic / Road Block" />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setSosOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleTriggerSOS}
            variant="contained"
            color="error"
            disabled={triggeringSos}
          >
            {triggeringSos ? 'Sending Alert...' : 'Send SOS Alert'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modern Confirmation Dialog for Route & Vehicle Deletion */}
      <Dialog
        open={deleteModal.open}
        onClose={() => setDeleteModal({ ...deleteModal, open: false })}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Avatar sx={{ bgcolor: '#EF444415', color: 'error.main', width: 44, height: 44 }}>
            <AlertTriangle />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
              Confirm Deletion
            </Typography>
            <Typography variant="caption" color="text.secondary">
              This action cannot be undone
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
            Are you sure you want to delete the {deleteModal.type === 'route' ? 'transport route' : 'vehicle'}{' '}
            <strong>"{deleteModal.name}"</strong>?
          </Typography>
          {deleteModal.type === 'route' ? (
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1.5, bgcolor: '#EF444410', p: 1.5, borderRadius: 2, border: '1px dashed #EF444450', fontWeight: 600 }}>
              ⚠️ Deleting this route will unassign all active buses associated with it.
            </Typography>
          ) : (
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1.5, bgcolor: '#EF444410', p: 1.5, borderRadius: 2, border: '1px dashed #EF444450', fontWeight: 600 }}>
              ⚠️ Deleting this bus will remove live tracking updates and driver assignments.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setDeleteModal({ ...deleteModal, open: false })}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            startIcon={<DeleteIcon />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
          >
            Delete {deleteModal.type === 'route' ? 'Route' : 'Vehicle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BusTracker;
