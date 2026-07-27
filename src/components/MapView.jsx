import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Alert, Typography, ButtonGroup, Button, Paper } from '@mui/material';
import GoogleBusMarker from './GoogleBusMarker';
import Bus3DLayer from './Bus3DLayer';

const GOOGLE_TILE_SERVERS = {
  roadmap: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  satellite: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
  terrain: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
};

export default function MapView({ vehiclesList, getRoutePoints, center }) {
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const routesLinesRef = useRef([]);
  const stopsMarkersRef = useRef([]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletError, setLeafletError] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite' | 'terrain'
  const [markerMode, setMarkerMode] = useState('3d'); // '3d' | '2d'

  // 1. Dynamically load Leaflet assets from CDN
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

        // Initialize Leaflet map with Google Maps view settings
        const map = window.L.map('leaflet-map', {
          zoomControl: false,
          attributionControl: true
        }).setView(center || [28.6400, 77.2400], 13);

        window.L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Add Google Maps Roadmap Tile Layer
        const tileLayer = window.L.tileLayer(GOOGLE_TILE_SERVERS.roadmap, {
          attribution: '&copy; <a href="https://maps.google.com">Google Maps</a>',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          maxZoom: 20
        }).addTo(map);

        tileLayerRef.current = tileLayer;
        mapRef.current = map;
        setMapInstance(map);
        setMapLoaded(true);
      } catch (err) {
        console.error('Error initializing Leaflet Google Map:', err);
        setLeafletError(true);
      }
    };

    if (window.L) {
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
        setMapInstance(null);
      }
    };
  }, []);

  // 2. Handle Google Map Type Switching (Roadmap | Satellite | Terrain)
  const handleMapTypeChange = (type) => {
    setMapType(type);
    if (!mapInstance || !window.L || !tileLayerRef.current) return;

    if (tileLayerRef.current) {
      mapInstance.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = window.L.tileLayer(GOOGLE_TILE_SERVERS[type] || GOOGLE_TILE_SERVERS.roadmap, {
      attribution: '&copy; <a href="https://maps.google.com">Google Maps</a>',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxZoom: 20
    }).addTo(mapInstance);

    tileLayerRef.current = newTileLayer;
  };

  // 3. Center/Pan map when center prop changes
  useEffect(() => {
    if (mapInstance && center) {
      mapInstance.setView(center, mapInstance.getZoom() || 13);
    }
  }, [center, mapInstance]);

  // 4. Render Google Maps Navigation Route Lines & Waypoints
  useEffect(() => {
    if (!mapLoaded || !mapInstance || !window.L || vehiclesList.length === 0) return;

    try {
      const L = window.L;

      routesLinesRef.current.forEach((line) => {
        if (line && typeof line.remove === 'function') line.remove();
      });
      routesLinesRef.current = [];

      stopsMarkersRef.current.forEach((marker) => {
        if (marker && typeof marker.remove === 'function') marker.remove();
      });
      stopsMarkersRef.current = [];

      vehiclesList.forEach((v) => {
        if (v.routeId && v.routeId.routeName) {
          const routePoints = getRoutePoints(v.routeId.routeName);
          if (routePoints && routePoints.length > 0) {
            const latlngs = routePoints.map((p) => [p.lat, p.lng]);

            // Google Maps Blue Navigation Line Casing
            const polylineCasing = L.polyline(latlngs, {
              color: '#1A73E8',
              weight: 7,
              opacity: 0.4,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(mapInstance);
            routesLinesRef.current.push(polylineCasing);

            // Google Maps Core Navigation Line
            const polyline = L.polyline(latlngs, {
              color: '#4285F4',
              weight: 5,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(mapInstance);
            routesLinesRef.current.push(polyline);

            // Draw Google-styled circular pin stops
            routePoints.forEach((stop, index) => {
              const stopIconHtml = `
                <div style="
                  background-color: #FFFFFF;
                  color: #1A73E8;
                  width: 22px;
                  height: 22px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                  border: 2px solid #4285F4;
                  font-weight: 800;
                  font-size: 10px;
                  font-family: sans-serif;
                ">
                  ${index + 1}
                </div>
              `;
              const stopIcon = L.divIcon({
                html: stopIconHtml,
                className: 'google-stop-icon',
                iconSize: [22, 22],
                iconAnchor: [11, 11]
              });

              const stopMarker = L.marker([stop.lat, stop.lng], { icon: stopIcon })
                .bindPopup(`<div style="padding: 4px; font-family: sans-serif;"><b>Bus Stop ${index + 1}:</b> ${stop.name}</div>`)
                .addTo(mapInstance);
              stopsMarkersRef.current.push(stopMarker);
            });
          }
        }
      });
    } catch (err) {
      console.error('Error drawing Google Maps route lines and stops:', err);
    }
  }, [mapLoaded, mapInstance, vehiclesList, getRoutePoints]);

  if (leafletError) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', height: '100%', minHeight: '380px' }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Unable to load map tiles without network connectivity.
        </Alert>
        <Typography color="text.secondary" align="center">
          Please verify your internet connection to load Google Maps tiles.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, position: 'relative', width: '100%', height: '100%', borderRadius: 2, overflow: 'hidden' }}>
      {/* Map Container */}
      <div id="leaflet-map" style={{ width: '100%', height: '100%', minHeight: '380px' }} />

      {/* Google Maps Controls Overlay */}
      {mapLoaded && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1000,
            borderRadius: '8px',
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}
        >
          <ButtonGroup size="small" variant="text">
            <Button
              onClick={() => handleMapTypeChange('roadmap')}
              sx={{
                px: 1.8,
                py: 0.6,
                fontWeight: 700,
                fontSize: '0.75rem',
                color: mapType === 'roadmap' ? '#1A73E8' : '#5F6368',
                bgcolor: mapType === 'roadmap' ? '#E8F0FE' : 'transparent',
                '&:hover': { bgcolor: mapType === 'roadmap' ? '#E8F0FE' : '#F1F3F4' }
              }}
            >
              🗺️ Map
            </Button>
            <Button
              onClick={() => handleMapTypeChange('satellite')}
              sx={{
                px: 1.8,
                py: 0.6,
                fontWeight: 700,
                fontSize: '0.75rem',
                color: mapType === 'satellite' ? '#1A73E8' : '#5F6368',
                bgcolor: mapType === 'satellite' ? '#E8F0FE' : 'transparent',
                '&:hover': { bgcolor: mapType === 'satellite' ? '#E8F0FE' : '#F1F3F4' }
              }}
            >
              🛰️ Satellite
            </Button>
            <Button
              onClick={() => handleMapTypeChange('terrain')}
              sx={{
                px: 1.8,
                py: 0.6,
                fontWeight: 700,
                fontSize: '0.75rem',
                color: mapType === 'terrain' ? '#1A73E8' : '#5F6368',
                bgcolor: mapType === 'terrain' ? '#E8F0FE' : 'transparent',
                '&:hover': { bgcolor: mapType === 'terrain' ? '#E8F0FE' : '#F1F3F4' }
              }}
            >
              ⛰️ Terrain
            </Button>
            <Button
              onClick={() => setMarkerMode(markerMode === '3d' ? '2d' : '3d')}
              sx={{
                px: 1.8,
                py: 0.6,
                fontWeight: 800,
                fontSize: '0.75rem',
                color: markerMode === '3d' ? '#D97706' : '#1A73E8',
                bgcolor: markerMode === '3d' ? '#FEF3C7' : '#E8F0FE',
                borderLeft: '1px solid rgba(0,0,0,0.1)'
              }}
            >
              {markerMode === '3d' ? '🚌 3D Rapido Bus' : '📍 2D Google Pin'}
            </Button>
          </ButtonGroup>
        </Paper>
      )}

      {/* Loading Overlay */}
      {!mapLoaded && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'background.paper', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <CircularProgress size={45} />
        </Box>
      )}

      {/* 3D Rapido Bus or 2D Google Marker Layer */}
      {mapLoaded && mapInstance && (
        markerMode === '3d' ? (
          <Bus3DLayer map={mapInstance} markers={vehiclesList} />
        ) : (
          <GoogleBusMarker map={mapInstance} vehiclesList={vehiclesList} />
        )
      )}
    </Box>
  );
}
