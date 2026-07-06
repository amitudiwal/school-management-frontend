import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import Bus3DLayer from './Bus3DLayer';

export default function MapView({ vehiclesList, getRoutePoints, center }) {
  const mapRef = useRef(null);
  const routesLinesRef = useRef([]);
  const stopsMarkersRef = useRef([]);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletError, setLeafletError] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

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

        // Initialize Leaflet map with standard light theme (CartoDB Positron)
        const map = window.L.map('leaflet-map', {
          zoomControl: true,
          attributionControl: true
        }).setView(center || [28.6400, 77.2400], 12);
        
        // CartoDB Positron: light, minimalist, no API key required
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        mapRef.current = map;
        setMapInstance(map);
        setMapLoaded(true);
      } catch (err) {
        console.error('Error initializing Leaflet:', err);
        setLeafletError(true);
      }
    };

    if (window.L) {
      // Small timeout to ensure DOM container is rendered
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

  // 2. Center/Pan map when the center prop changes
  useEffect(() => {
    if (mapInstance && center) {
      mapInstance.setView(center, mapInstance.getZoom() || 12);
    }
  }, [center, mapInstance]);

  // 3. Render Route Polylines and Stop Markers on the Map
  useEffect(() => {
    if (!mapLoaded || !mapInstance || !window.L || vehiclesList.length === 0) return;

    try {
      const L = window.L;

      // Clear existing route lines
      routesLinesRef.current.forEach((line) => {
        if (line && typeof line.remove === 'function') line.remove();
      });
      routesLinesRef.current = [];

      // Clear existing stop markers
      stopsMarkersRef.current.forEach((marker) => {
        if (marker && typeof marker.remove === 'function') marker.remove();
      });
      stopsMarkersRef.current = [];

      // Draw routes and stops for each active vehicle
      vehiclesList.forEach((v) => {
        if (v.routeId && v.routeId.routeName) {
          const routePoints = getRoutePoints(v.routeId.routeName);
          if (routePoints && routePoints.length > 0) {
            const latlngs = routePoints.map((p) => [p.lat, p.lng]);

            // Draw Indigo path line
            const polyline = L.polyline(latlngs, {
              color: '#6366F1',
              weight: 4,
              opacity: 0.7,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(mapInstance);
            routesLinesRef.current.push(polyline);

            // Draw numbered circular pins for stops
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
                  box-shadow: 0 2px 5px rgba(0,0,0,0.25);
                  border: 2px solid white;
                  font-weight: 800;
                  font-size: 9px;
                  font-family: sans-serif;
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
                .addTo(mapInstance);
              stopsMarkersRef.current.push(stopMarker);
            });
          }
        }
      });
    } catch (err) {
      console.error('Error drawing route lines and stops:', err);
    }
  }, [mapLoaded, mapInstance, vehiclesList, getRoutePoints]);

  if (leafletError) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', height: '100%', minHeight: '380px' }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Unable to load map without internet connectivity.
        </Alert>
        <Typography color="text.secondary" align="center">
          Please check your network and reload the page to initialize CartoDB map tiles.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, position: 'relative', width: '100%', height: '100%', borderRadius: 2, overflow: 'hidden' }}>
      <div id="leaflet-map" style={{ width: '100%', height: '100%', minHeight: '380px' }} />
      
      {!mapLoaded && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'background.paper', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <CircularProgress size={45} />
        </Box>
      )}

      {mapLoaded && mapInstance && (
        <Bus3DLayer map={mapInstance} markers={vehiclesList} />
      )}
    </Box>
  );
}
