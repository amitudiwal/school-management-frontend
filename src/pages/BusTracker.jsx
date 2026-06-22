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

const SIM_ROUTES = {
  'Route A - North City': [
    { name: 'Terminal A - Sector 12', lat: 28.6139, lng: 77.2090 },
    { name: 'Stop 1 - Sector 15 Metro', lat: 28.6250, lng: 77.2200 },
    { name: 'Stop 2 - Rajeev Chowk Hub', lat: 28.6300, lng: 77.2180 },
    { name: 'Stop 3 - Connaught Place', lat: 28.6328, lng: 77.2197 },
    { name: 'School Main Gate', lat: 28.6400, lng: 77.2400 }
  ],
  'Route B - South Hub': [
    { name: 'Terminal B - Vasant Kunj', lat: 28.5355, lng: 77.1554 },
    { name: 'Stop 1 - Saket City Mall', lat: 28.5244, lng: 77.2066 },
    { name: 'Stop 2 - Hauz Khas Metro', lat: 28.5434, lng: 77.2061 },
    { name: 'Stop 3 - AIIMS Crossing', lat: 28.5672, lng: 77.2100 },
    { name: 'School Main Gate', lat: 28.6400, lng: 77.2400 }
  ]
};

const LOCATION_COORDS = {
  // Delhi / Defaults
  'Terminal A - Sector 12': { lat: 28.6139, lng: 77.2090 },
  'Stop 1 - Sector 15 Metro': { lat: 28.6250, lng: 77.2200 },
  'Stop 2 - Rajeev Chowk Hub': { lat: 28.6300, lng: 77.2180 },
  'Stop 3 - Connaught Place': { lat: 28.6328, lng: 77.2197 },
  'School Main Gate': { lat: 28.6400, lng: 77.2400 },
  'School Campus': { lat: 28.6400, lng: 77.2400 },
  'Central School Campus': { lat: 28.6400, lng: 77.2400 },
  
  'Terminal B - Vasant Kunj': { lat: 28.5355, lng: 77.1554 },
  'Stop 1 - Saket City Mall': { lat: 28.5244, lng: 77.2066 },
  'Stop 2 - Hauz Khas Metro': { lat: 28.5434, lng: 77.2061 },
  'Stop 3 - AIIMS Crossing': { lat: 28.5672, lng: 77.2100 },

  'East Crossing Terminal': { lat: 28.6300, lng: 77.2900 },
  'Central Market': { lat: 28.6200, lng: 77.2700 },
  'Tech Park': { lat: 28.6250, lng: 77.2500 },

  'Sector 62 Terminal': { lat: 28.6200, lng: 77.3700 },
  'Metro Station Gate 2': { lat: 28.6250, lng: 77.3500 },

  // Jaipur
  'Jaipur Railway Station': { lat: 26.9196, lng: 75.7878 },
  'Gopalbari': { lat: 26.9170, lng: 75.7920 },
  'Jaipur Central Bus Stand': { lat: 26.9280, lng: 75.7980 },
};


function BusTracker() {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);

  const { data: schoolData } = useQuery(GET_SCHOOL, {
    variables: { id: user?.schoolId },
    skip: !user?.schoolId || user?.role === 'SUPER_ADMIN',
  });

  const [activeTab, setActiveTab] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletError, setLeafletError] = useState(false);

  // Simulation State
  const [selectedSimVehicle, setSelectedSimVehicle] = useState('');
  const [simRouteName, setSimRouteName] = useState('Route A - North City');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simSpeed, setSimSpeed] = useState(45);
  const [initializing, setInitializing] = useState(false);

  // Refs for Leaflet Map
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const routesLinesRef = useRef([]);
  const stopsMarkersRef = useRef([]);
  const simIntervalRef = useRef(null);

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
    if (SIM_ROUTES[name]) {
      return SIM_ROUTES[name];
    }
    
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
    
    return SIM_ROUTES['Route A - North City'];
  }, [routesList, getCoordsForLocation]);

  // Pan map when school location details load
  useEffect(() => {
    if (mapRef.current && schoolData?.getSchool?.address?.city) {
      const cityVal = schoolData.getSchool.address.city.toLowerCase().trim();
      let bLat = 28.6400;
      let bLng = 77.2400;
      if (cityVal === 'jaipur') {
        bLat = 26.9124;
        bLng = 75.7873;
      } else if (cityVal === 'boston') {
        bLat = 42.3601;
        bLng = -71.0589;
      } else if (cityVal === 'mumbai') {
        bLat = 19.0760;
        bLng = 72.8777;
      } else if (cityVal === 'bangalore' || cityVal === 'bengaluru') {
        bLat = 12.9716;
        bLng = 77.5946;
      }
      mapRef.current.setView([bLat, bLng], 12);
    }
  }, [schoolData]);

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

  // --- DYNAMICALLY LOAD LEAFLET MAP FROM CDN ---
  useEffect(() => {
    let isMounted = true;
    let leafletLink = document.getElementById('leaflet-css');
    if (!leafletLink) {
      leafletLink = document.createElement('link');
      leafletLink.id = 'leaflet-css';
      leafletLink.rel = 'stylesheet';
      leafletLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletLink);
    }

    let leafletScript = document.getElementById('leaflet-js');
    if (!leafletScript) {
      leafletScript = document.createElement('script');
      leafletScript.id = 'leaflet-js';
      leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.head.appendChild(leafletScript);
    }

    const initMap = () => {
      if (!isMounted) return;
      if (!window.L) {
        setLeafletError(true);
        return;
      }
      try {
        if (mapRef.current) return;
        
        const container = document.getElementById('leaflet-map');
        if (!container) return;

        // Initialize Map (default center at School Main Gate)
        const mapInstance = window.L.map('leaflet-map').setView([28.6400, 77.2400], 12);
        
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance);

        mapRef.current = mapInstance;
        setMapLoaded(true);
      } catch (err) {
        console.error('Error initializing Leaflet:', err);
        setLeafletError(true);
      }
    };

    if (window.L) {
      // Map div may not be rendered yet in tab 0
      setTimeout(initMap, 100);
    } else {
      leafletScript.addEventListener('load', initMap);
      leafletScript.addEventListener('error', () => setLeafletError(true));
    }

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (leafletScript) {
        leafletScript.removeEventListener('load', initMap);
      }
    };
  }, []);

  // --- RENDER VEHICLE & ROUTE MARKERS ---
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.L || vehiclesList.length === 0) return;

    try {
      const L = window.L;

      // Clear markers not in the current list
      Object.keys(markersRef.current).forEach(id => {
        if (!vehiclesList.find(v => v.id === id)) {
          if (markersRef.current[id] && typeof markersRef.current[id].remove === 'function') {
            markersRef.current[id].remove();
          }
          delete markersRef.current[id];
        }
      });

      // Draw Stops and Polylines
      if (routesLinesRef.current) {
        routesLinesRef.current.forEach(line => {
          if (line && typeof line.remove === 'function') line.remove();
        });
      }
      routesLinesRef.current = [];

      if (stopsMarkersRef.current) {
        stopsMarkersRef.current.forEach(marker => {
          if (marker && typeof marker.remove === 'function') marker.remove();
        });
      }
      stopsMarkersRef.current = [];

      // Draw active routes stop points
      vehiclesList.forEach(v => {
        if (v.routeId && v.routeId.routeName) {
          const routePoints = getRoutePoints(v.routeId.routeName);
          if (routePoints.length > 0) {
            const latlngs = routePoints.map(p => [p.lat, p.lng]);
            
            // Draw connecting path line
            const polyline = L.polyline(latlngs, { color: '#6366F1', weight: 4, opacity: 0.6 }).addTo(mapRef.current);
            routesLinesRef.current.push(polyline);

            // Place stop points
            routePoints.forEach((stop, index) => {
              const stopIconHtml = `
                <div style="
                  background-color: #6366F1;
                  color: white;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  border: 2px solid white;
                  font-weight: 800;
                  font-size: 9px;
                ">
                  ${index + 1}
                </div>
              `;
              const stopIcon = L.divIcon({
                html: stopIconHtml,
                className: 'custom-stop-icon',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });

              const stopMarker = L.marker([stop.lat, stop.lng], { icon: stopIcon })
                .bindPopup(`<b>Stop ${index + 1}:</b> ${stop.name}`)
                .addTo(mapRef.current);
              stopsMarkersRef.current.push(stopMarker);
            });
          }
        }
      });

      // Update or Draw Bus Positions
      vehiclesList.forEach(vehicle => {
        const { id, vehicleNo, currentLatitude, currentLongitude, status, driverName, driverPhone, routeId } = vehicle;
        const isOnline = status === 'Active';

        // Safeguard coordinates from null/undefined/NaN
        const lat = (typeof currentLatitude === 'number' && !isNaN(currentLatitude)) ? currentLatitude : 28.6139;
        const lng = (typeof currentLongitude === 'number' && !isNaN(currentLongitude)) ? currentLongitude : 77.2090;

        const busIconHtml = `
          <div style="
            background-color: ${isOnline ? '#10B981' : '#64748B'};
            color: white;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 3px solid white;
            font-size: 16px;
            transition: all 0.5s ease;
          ">
            🚌
          </div>
        `;

        const customIcon = L.divIcon({
          html: busIconHtml,
          className: 'custom-bus-marker',
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });

        const popupContent = `
          <div style="font-family: sans-serif; padding: 5px; min-width: 150px;">
            <h4 style="margin: 0 0 5px 0; color: #1E293B; display: flex; align-items: center; gap: 5px;">
              Bus ${vehicleNo}
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${isOnline ? '#10B981' : '#64748B'};"></span>
            </h4>
            <p style="margin: 4px 0; font-size: 12px;"><b>Route:</b> ${routeId?.routeName || 'Unassigned'}</p>
            <p style="margin: 4px 0; font-size: 12px;"><b>Driver:</b> ${driverName}</p>
            <p style="margin: 4px 0; font-size: 12px;"><b>Phone:</b> ${driverPhone}</p>
            <p style="margin: 4px 0; font-size: 12px;"><b>Status:</b> ${isOnline ? 'Active / On Trip' : 'Inactive / Parked'}</p>
          </div>
        `;

        if (markersRef.current[id]) {
          // Move Marker
          markersRef.current[id].setLatLng([lat, lng]);
          markersRef.current[id].getPopup().setContent(popupContent);
        } else {
          // Create Marker
          const marker = L.marker([lat, lng], { icon: customIcon })
            .bindPopup(popupContent)
            .addTo(mapRef.current);
          markersRef.current[id] = marker;
        }
      });
    } catch (err) {
      console.error('Error rendering markers:', err);
    }
  }, [mapLoaded, vehiclesList, routesList, getRoutePoints]);

  // --- INITIALIZE DEMO VEHICLES & ROUTES ---
  const handleInitDemo = async () => {
    try {
      setInitializing(true);
      
      // Create Route A
      const routeARes = await createRoute({
        variables: {
          routeName: 'Route A - North City',
          startLocation: 'Terminal A - Sector 12',
          endLocation: 'School Main Gate',
          routeFee: 1500,
          stops: [
            { stopName: 'Terminal A - Sector 12', arrivalTime: '07:30 AM' },
            { stopName: 'Stop 1 - Sector 15 Metro', arrivalTime: '07:45 AM' },
            { stopName: 'Stop 2 - Rajeev Chowk Hub', arrivalTime: '07:55 AM' },
            { stopName: 'Stop 3 - Connaught Place', arrivalTime: '08:05 AM' },
            { stopName: 'School Main Gate', arrivalTime: '08:15 AM' }
          ]
        }
      });
      const routeAId = routeARes.data.createTransportRoute.id;

      // Create Route B
      const routeBRes = await createRoute({
        variables: {
          routeName: 'Route B - South Hub',
          startLocation: 'Terminal B - Vasant Kunj',
          endLocation: 'School Main Gate',
          routeFee: 1800,
          stops: [
            { stopName: 'Terminal B - Vasant Kunj', arrivalTime: '07:20 AM' },
            { stopName: 'Stop 1 - Saket City Mall', arrivalTime: '07:40 AM' },
            { stopName: 'Stop 2 - Hauz Khas Metro', arrivalTime: '07:50 AM' },
            { stopName: 'Stop 3 - AIIMS Crossing', arrivalTime: '08:00 AM' },
            { stopName: 'School Main Gate', arrivalTime: '08:15 AM' }
          ]
        }
      });
      const routeBId = routeBRes.data.createTransportRoute.id;

      // Create Vehicles
      await createVehicle({
        variables: {
          vehicleNo: 'NY-1234',
          model: 'Tata Marcopolo School Bus',
          capacity: 40,
          driverName: 'Robert Oppenheimer',
          driverPhone: '+1 555-0199',
          routeId: routeAId
        }
      });

      await createVehicle({
        variables: {
          vehicleNo: 'NY-5678',
          model: 'Mahindra Cruiser',
          capacity: 15,
          driverName: 'Albert Einstein',
          driverPhone: '+1 555-0245',
          routeId: routeBId
        }
      });

      refetch();
      refetchRoutes();
    } catch (err) {
      console.error('Error seeding demo data:', err);
    } finally {
      setInitializing(false);
    }
  };

  // --- DRIVER CONSOLE TRIP SIMULATION TRIGGER ---
  const handleToggleSimulation = () => {
    if (isSimulating) {
      // STOP SIMULATION
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
      setIsSimulating(false);
      setSimStep(0);

      // Mark vehicle status as Inactive on server
      if (selectedSimVehicle) {
        const routePoints = getRoutePoints(simRouteName);
        const lastCoords = routePoints[routePoints.length - 1]; // Reset position to school
        updateLocation({
          variables: {
            id: selectedSimVehicle,
            latitude: lastCoords.lat,
            longitude: lastCoords.lng,
            status: 'Inactive'
          }
        }).then(() => refetch());
      }
    } else {
      // START SIMULATION
      if (!selectedSimVehicle) return;
      setIsSimulating(true);
      setSimStep(0);
      
      const routePoints = getRoutePoints(simRouteName);
      let currentStepIndex = 0;

      // Immediately execute first step
      const stepPoint = routePoints[0];
      updateLocation({
        variables: {
          id: selectedSimVehicle,
          latitude: stepPoint.lat,
          longitude: stepPoint.lng,
          status: 'Active'
        }
      }).then(() => refetch());

      // Set simulation interval
      simIntervalRef.current = setInterval(() => {
        currentStepIndex += 1;
        if (currentStepIndex >= routePoints.length) {
          // Completed the trip!
          clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
          setIsSimulating(false);
          setSimStep(0);

          // Reset status to Inactive
          updateLocation({
            variables: {
              id: selectedSimVehicle,
              latitude: routePoints[routePoints.length - 1].lat,
              longitude: routePoints[routePoints.length - 1].lng,
              status: 'Inactive'
            }
          }).then(() => refetch());
        } else {
          setSimStep(currentStepIndex);
          const nextPoint = routePoints[currentStepIndex];
          
          // Randomize speed slightly
          setSimSpeed(Math.floor(Math.random() * 20) + 35);

          updateLocation({
            variables: {
              id: selectedSimVehicle,
              latitude: nextPoint.lat,
              longitude: nextPoint.lng,
              status: 'Active'
            }
          }).then(() => refetch());
        }
      }, 5000); // Shift coords every 5 seconds
    }
  };

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
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

      {/* RENDER BOTH TABS (Preserving Map DOM to prevent Leaflet cleanup crashes) */}
      <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
        <Grid container spacing={3}>
          {/* Map Column */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: { xs: 450, md: 550 }, display: 'flex', flexDirection: 'column', p: 1 }}>
              {leafletError ? (
                <Box sx={{ p: 3, display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Unable to load real Leaflet map without internet connectivity.
                  </Alert>
                  <Typography color="text.secondary" align="center">
                    Please connect to the internet to load OpenStreetMap tiles.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ flexGrow: 1, position: 'relative', width: '100%', height: '100%', borderRadius: 2, overflow: 'hidden' }}>
                  <div id="leaflet-map" style={{ width: '100%', height: '100%', minHeight: '380px' }} />
                  {!mapLoaded && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'background.paper', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                      <CircularProgress size={40} />
                    </Box>
                  )}
                </Box>
              )}
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
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
                      No vehicles or routes are configured in the database yet.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleInitDemo}
                      disabled={initializing}
                      startIcon={initializing ? <CircularProgress size={20} /> : <AddIcon />}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    >
                      Initialize Demo Vehicles & Routes
                    </Button>
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
                Driver Control Simulator Panel
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
                Simulate a live school bus GPS tracking session. Once activated, the driver's phone sends real-time GPS coordinates to the server every 5 seconds.
              </Typography>

              {vehiclesList.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                    Please initialize the demo fleets in the first tab to begin simulation.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  <FormControl fullWidth disabled={isSimulating}>
                    <InputLabel id="sim-vehicle-select-label">Select Simulation Bus</InputLabel>
                    <Select
                      labelId="sim-vehicle-select-label"
                      value={selectedSimVehicle}
                      label="Select Simulation Bus"
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
                      <ExploreIcon color="primary" /> Route Points to Traverse:
                    </Typography>
                    <List dense>
                      {getRoutePoints(simRouteName).map((point, index) => (
                        <ListItem key={index}>
                          <Chip
                            label={index + 1}
                            size="small"
                            color={simStep === index && isSimulating ? 'success' : 'primary'}
                            sx={{ mr: 2, fontWeight: 800, width: 22, height: 22 }}
                          />
                          <ListItemText
                            primary={point.name}
                            primaryTypographyProps={{
                              fontWeight: simStep === index && isSimulating ? 700 : 500,
                              color: simStep === index && isSimulating ? 'success.main' : 'text.primary'
                            }}
                            secondary={`Lat: ${point.lat}, Lng: ${point.lng}`}
                          />
                        </ListItem>
                      ))}
                    </List>
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
                    {isSimulating ? 'Stop Simulation & Turn Off GPS' : 'Start Route Simulation'}
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

              {!isSimulating ? (
                <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', minHeight: 300 }}>
                  <ExploreIcon sx={{ fontSize: '3.5rem', color: 'text.secondary', opacity: 0.25, mb: 2 }} />
                  <Typography color="text.secondary">Start a simulation to stream live telemetry.</Typography>
                </Box>
              ) : (
                <Stack spacing={3} sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <SpeedIcon color="success" />
                      <Typography sx={{ fontWeight: 600 }}>Calculated Speed</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main' }}>
                      {simSpeed} km/h
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <ExploreIcon color="primary" />
                      <Typography sx={{ fontWeight: 600 }}>Current Coordinates</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {getRoutePoints(simRouteName)[simStep]?.lat?.toFixed(5)}, {getRoutePoints(simRouteName)[simStep]?.lng?.toFixed(5)}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                      Trip Progress:
                    </Typography>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Next Stop:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {getRoutePoints(simRouteName)[simStep + 1]?.name || 'School Main Gate (Arrival)'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Estimated Time to Arrival:</Typography>
                        <Chip
                          label={`${(getRoutePoints(simRouteName).length - simStep - 1) * 3} mins`}
                          size="small"
                          color="warning"
                          icon={<TimeIcon />}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                    </Stack>
                  </Box>

                  <Box sx={{ mt: 'auto', p: 2, bgcolor: '#10B98115', borderRadius: 2, border: '1px dashed', borderColor: 'success.main' }}>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }} align="center">
                      ✓ GPS Signal: ACTIVE | Transmitting to Server...
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
