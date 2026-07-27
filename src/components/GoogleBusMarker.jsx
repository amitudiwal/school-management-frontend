import React, { useEffect, useRef } from 'react';

// Helper to calculate bearing angle between two lat/lng points
function calculateBearing(startLat, startLng, destLat, destLng) {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export default function GoogleBusMarker({ map, vehiclesList }) {
  const markersRef = useRef(new Map());

  useEffect(() => {
    if (!map || !window.L) return;

    const L = window.L;

    const generateGooglePopupHtml = (v) => {
      const isOnline = v.status === 'Active';
      const isSos = !!v.sosMessage;
      const labelVal = v.vehicleNo || v.label || 'School Bus';
      const routeVal = v.routeName || v.routeId?.routeName || 'Unassigned Route';
      const driverVal = v.driverName || 'Assigned Driver';
      const phoneVal = v.driverPhone || 'N/A';
      const speedVal = v.speed ? `${v.speed} km/h` : (isOnline ? 'Moving' : 'Stopped');

      return `
        <div style="
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 10px 12px;
          min-width: 220px;
          color: #1F2937;
          border-radius: 12px;
        ">
          <!-- Header Bar -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #F3F4F6; padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 800;
                font-size: 14px;
                box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);
              ">
                🚌
              </div>
              <div>
                <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #111827;">Bus ${labelVal}</h4>
                <span style="font-size: 11px; color: #6B7280;">${v.model || 'School Transport'}</span>
              </div>
            </div>
            <span style="
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 700;
              background-color: ${isSos ? '#FEE2E2' : isOnline ? '#D1FAE5' : '#F3F4F6'};
              color: ${isSos ? '#DC2626' : isOnline ? '#059669' : '#6B7280'};
            ">
              <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${isSos ? '#DC2626' : isOnline ? '#10B981' : '#9CA3AF'};"></span>
              ${isSos ? 'SOS ALERT' : isOnline ? 'Active' : 'Offline'}
            </span>
          </div>

          <!-- Body Info -->
          <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px; color: #4B5563;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6B7280; font-weight: 600;">Route:</span>
              <span style="font-weight: 700; color: #1F2937;">${routeVal}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6B7280; font-weight: 600;">Driver:</span>
              <span style="font-weight: 700; color: #1F2937;">${driverVal}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6B7280; font-weight: 600;">Current Speed:</span>
              <span style="font-weight: 700; color: #2563EB;">${speedVal}</span>
            </div>
          </div>

          <!-- Action Footer -->
          ${phoneVal && phoneVal !== 'N/A' ? `
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #F3F4F6;">
              <a href="tel:${phoneVal}" style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                width: 100%;
                padding: 6px 0;
                background-color: #2563EB;
                color: white;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 700;
                font-size: 12px;
                box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
              ">
                📞 Call Driver (${phoneVal})
              </a>
            </div>
          ` : ''}
        </div>
      `;
    };

    const validVehicles = vehiclesList.filter(
      v => typeof v.currentLatitude === 'number' && typeof v.currentLongitude === 'number'
    );

    // Remove deleted vehicle markers
    markersRef.current.forEach((markerData, id) => {
      if (!validVehicles.some(v => v.id === id)) {
        if (markerData.marker) markerData.marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    validVehicles.forEach((v) => {
      const id = v.id;
      const lat = v.currentLatitude;
      const lng = v.currentLongitude;
      const isOnline = v.status === 'Active';
      const isSos = !!v.sosMessage;
      const busNo = v.vehicleNo || v.label || 'Bus';

      let prevData = markersRef.current.get(id);
      let bearing = prevData ? prevData.bearing : 0;

      if (prevData && (prevData.lat !== lat || prevData.lng !== lng)) {
        bearing = calculateBearing(prevData.lat, prevData.lng, lat, lng);
      }

      // Build Google Maps style marker HTML
      const markerHtml = `
        <div style="position: relative; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
          <!-- Animated Radar Pulse Ring -->
          ${isOnline ? `
            <div style="
              position: absolute;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: ${isSos ? 'rgba(239, 68, 68, 0.35)' : 'rgba(66, 133, 244, 0.35)'};
              animation: googlePulse 2s infinite ease-out;
              pointer-events: none;
            "></div>
          ` : ''}

          <!-- Google Bus Icon Badge Container -->
          <div style="
            position: relative;
            width: 38px;
            height: 38px;
            background: ${isSos ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'};
            border: 2.5px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(${bearing}deg);
            transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          ">
            <!-- Front Bus Icon SVG -->
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 16C4 16.5523 4.44772 17 5 17H6C6.55228 17 7 16.5523 7 16V15H17V16C17 16.5523 17.4477 17 18 17H19C19.5523 17 20 16.5523 20 16V6C20 3.79086 18.2091 2 16 2H8C5.79086 2 4 3.79086 4 6V16ZM6.5 13C5.67157 13 5 12.3284 5 11.5C5 10.6716 5.67157 10 6.5 10C7.32843 10 8 10.6716 8 11.5C8 12.3284 7.32843 13 6.5 13ZM17.5 13C16.6716 13 16 12.3284 16 11.5C16 10.6716 16.6716 10 17.5 10C18.3284 10 19 10.6716 19 11.5C19 12.3284 18.3284 13 17.5 13ZM6 5.5C6 4.67157 6.67157 4 7.5 4H16.5C17.3284 4 18 4.67157 18 5.5V8.5H6V5.5Z" fill="#1F2937"/>
            </svg>

            <!-- Direction Indicator Wedge -->
            <div style="
              position: absolute;
              top: -5px;
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-bottom: 7px solid ${isSos ? '#DC2626' : '#D97706'};
            "></div>
          </div>

          <!-- Top Label Badge -->
          <div style="
            position: absolute;
            top: -16px;
            background: #111827;
            color: #FFFFFF;
            font-size: 10px;
            font-weight: 800;
            padding: 1px 6px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            white-space: nowrap;
            letter-spacing: 0.3px;
          ">
            ${busNo}
          </div>
        </div>
      `;

      const googleIcon = L.divIcon({
        html: markerHtml,
        className: 'google-bus-marker-icon',
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      });

      if (prevData) {
        // Update position and icon
        prevData.marker.setLatLng([lat, lng]);
        prevData.marker.setIcon(googleIcon);
        prevData.marker.getPopup().setContent(generateGooglePopupHtml(v));
        markersRef.current.set(id, { lat, lng, bearing, marker: prevData.marker });
      } else {
        // Create new marker
        const marker = L.marker([lat, lng], { icon: googleIcon })
          .bindPopup(generateGooglePopupHtml(v), {
            className: 'google-leaflet-popup',
            maxWidth: 260
          })
          .addTo(map);

        markersRef.current.set(id, { lat, lng, bearing, marker });
      }
    });

    // Inject CSS for pulse animation & custom popups if not present
    if (!document.getElementById('google-map-marker-css')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'google-map-marker-css';
      styleEl.innerHTML = `
        @keyframes googlePulse {
          0% {
            transform: scale(0.6);
            opacity: 0.9;
          }
          70% {
            transform: scale(1.4);
            opacity: 0.1;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        .google-bus-marker-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, [map, vehiclesList]);

  return null;
}
