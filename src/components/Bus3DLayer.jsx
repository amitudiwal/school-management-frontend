import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const TWEEN_DURATION = 1200; // Interpolation duration in milliseconds (1.2 seconds)
const LEAN_INTENSITY = 0.25;  // Tilt angle intensity when turning (radians)
const BASE_BUS_SCALE = 1.2;  // Size multiplier for the bus models in 3D scene

// Helper: easeInOutQuad for smooth tweening
const easeInOutQuad = (t) => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

export default function Bus3DLayer({ map, markers }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const busesRef = useRef(new Map()); // Holds tracking info for all active buses
  const resourcesRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    masterBusModel: null,
    proceduralMaterial: null,
  });

  // 1. Create a detailed procedural bus model fallback built from Three.js primitives
  const createProceduralBus = () => {
    const busGroup = new THREE.Group();
    busGroup.name = 'procedural-bus';

    // Materials
    // Polished silver/grey metallic paint for the main body
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0xD1D5DB, // light grey / silver
      metalness: 0.85, 
      roughness: 0.18 
    });
    
    // Tinted dark glass for windows
    const glassMat = new THREE.MeshStandardMaterial({ 
      color: 0x111827, 
      roughness: 0.1, 
      metalness: 0.9 
    });
    
    // Black plastic/trim
    const trimMat = new THREE.MeshStandardMaterial({ 
      color: 0x1F2937, 
      roughness: 0.7 
    });
    
    // Wheel rubber
    const tireMat = new THREE.MeshStandardMaterial({ 
      color: 0x111827, 
      roughness: 0.9 
    });
    
    // Silver wheel rims
    const rimMat = new THREE.MeshStandardMaterial({ 
      color: 0xE5E7EB, 
      metalness: 0.8, 
      roughness: 0.3 
    });

    // 1. Main Chassis / Body (Silver)
    // Box dimensions: width=1.3, height=0.9, depth=2.8
    const bodyGeom = new THREE.BoxGeometry(1.3, 0.9, 2.8);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.65; // Lift up slightly to leave space for wheels
    busGroup.add(body);

    // 2. Front Windshield (Sleek tilted glass)
    // We can use a slightly smaller front box to simulate the cockpit
    const frontWindshieldGeom = new THREE.BoxGeometry(1.31, 0.5, 0.4);
    const frontWindshield = new THREE.Mesh(frontWindshieldGeom, glassMat);
    frontWindshield.position.set(0, 0.85, 1.25); // At the very front
    // Tilt slightly forward
    frontWindshield.rotation.x = -Math.PI / 12;
    busGroup.add(frontWindshield);

    // 3. Side Windows (Long continuous dark strip)
    // Left and Right windows
    const leftWindowGeom = new THREE.BoxGeometry(0.02, 0.45, 2.3);
    const leftWindow = new THREE.Mesh(leftWindowGeom, glassMat);
    leftWindow.position.set(-0.66, 0.85, -0.1);
    busGroup.add(leftWindow);

    const rightWindow = leftWindow.clone();
    rightWindow.position.x = 0.66;
    busGroup.add(rightWindow);
    
    // Rear Window
    const rearWindowGeom = new THREE.BoxGeometry(1.1, 0.4, 0.02);
    const rearWindow = new THREE.Mesh(rearWindowGeom, glassMat);
    rearWindow.position.set(0, 0.85, -1.41);
    busGroup.add(rearWindow);

    // 4. Wheels (2 axles, 4 wheels with silver rims)
    const tireGeom = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 16);
    const rimGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.19, 12);
    
    const wheelPositions = [
      [-0.67, 0.26, 0.85],  // Front Left
      [0.67, 0.26, 0.85],   // Front Right
      [-0.67, 0.26, -0.85], // Back Left
      [0.67, 0.26, -0.85]   // Back Right
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wheelSubGroup = new THREE.Group();
      
      const tire = new THREE.Mesh(tireGeom, tireMat);
      tire.rotation.z = Math.PI / 2;
      wheelSubGroup.add(tire);
      
      const rim = new THREE.Mesh(rimGeom, rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelSubGroup.add(rim);
      
      wheelSubGroup.position.set(x, y, z);
      busGroup.add(wheelSubGroup);
    });

    // 5. Sleek side-view mirrors (extending forward-outwards from the front)
    // Left Mirror Arm and Piece
    const mirrorArmGeom = new THREE.BoxGeometry(0.3, 0.04, 0.04);
    const mirrorArmL = new THREE.Mesh(mirrorArmGeom, trimMat);
    mirrorArmL.position.set(-0.75, 1.0, 1.25);
    mirrorArmL.rotation.y = Math.PI / 6;
    busGroup.add(mirrorArmL);

    const mirrorPieceGeom = new THREE.BoxGeometry(0.06, 0.2, 0.1);
    const mirrorL = new THREE.Mesh(mirrorPieceGeom, trimMat);
    mirrorL.position.set(-0.9, 0.9, 1.35);
    busGroup.add(mirrorL);

    // Right Mirror Arm and Piece
    const mirrorArmR = mirrorArmL.clone();
    mirrorArmR.position.x = 0.75;
    mirrorArmR.rotation.y = -Math.PI / 6;
    busGroup.add(mirrorArmR);

    const mirrorR = mirrorL.clone();
    mirrorR.position.x = 0.9;
    busGroup.add(mirrorR);

    // 6. Modern Headlights (white LED strip look at the bottom)
    const headlightGeom = new THREE.BoxGeometry(0.2, 0.06, 0.03);
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xFFFEE0 });
    const headlightL = new THREE.Mesh(headlightGeom, headlightMat);
    headlightL.position.set(-0.45, 0.38, 1.41);
    
    const headlightR = headlightL.clone();
    headlightR.position.x = 0.45;
    
    busGroup.add(headlightL);
    busGroup.add(headlightR);
    
    // Bottom bumper trim (grey/black plastic)
    const bumperGeom = new THREE.BoxGeometry(1.3, 0.15, 0.08);
    const bumper = new THREE.Mesh(bumperGeom, trimMat);
    bumper.position.set(0, 0.3, 1.38);
    busGroup.add(bumper);

    // Center the geometry pivot so the bottom wheels rest exactly at y = 0
    const pivotWrapper = new THREE.Group();
    pivotWrapper.add(busGroup);
    return pivotWrapper;
  };

  // 2. Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!canvasRef.current || !map) return;

    const container = map.getContainer();
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create scene with fog for depth cueing
    const scene = new THREE.Scene();

    // Create camera angled down at the ground (3/4 aerial view)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 32, 28);
    camera.lookAt(0, 0, 0);

    // Create renderer with alpha support to show the Leaflet map underneath
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(15, 35, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Save references for cleanup and global render actions
    resourcesRef.current.scene = scene;
    resourcesRef.current.camera = camera;
    resourcesRef.current.renderer = renderer;

    // Handle container resize dynamically
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      renderer.setSize(newW, newH);
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    // Load the GLB bus model from public assets
    const loader = new GLTFLoader();
    loader.load(
      '/models/bus.glb',
      (gltf) => {
        // Success: Process and scale GLB model
        const model = gltf.scene;
        
        // Calculate model dimensions to scale it uniformly
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Normalize size so the model length fits our grid scale
        const scaleVal = 2.4 / maxDim;
        model.scale.set(scaleVal, scaleVal, scaleVal);

        // Adjust Y offset so bottom wheels touch y = 0
        const pivotWrapper = new THREE.Group();
        model.position.y = -box.min.y * scaleVal;
        pivotWrapper.add(model);

        resourcesRef.current.masterBusModel = pivotWrapper;
        console.log('Successfully loaded GLB 3D bus model.');
      },
      undefined,
      (err) => {
        // Failure fallback: build a procedural bus from boxes and cylinders
        console.warn('GLB Bus Model load failed, using procedural fallback:', err);
        resourcesRef.current.masterBusModel = createProceduralBus();
      }
    );

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      // Remove all elements in the scene
      busesRef.current.forEach((bus) => {
        scene.remove(bus.model);
        if (bus.invisibleMarker) {
          bus.invisibleMarker.remove();
        }
      });
      busesRef.current.clear();

      // Dispose resources
      renderer.dispose();
      scene.clear();
    };
  }, [map]);

  // 3. React to marker changes, synchronize local database & Leaflet overlay popups
  useEffect(() => {
    if (!map || !resourcesRef.current.scene) return;
    const scene = resourcesRef.current.scene;

    // Helper: update popup layout content
    const generatePopupHtml = (marker) => {
      const isOnline = marker.status === 'Active';
      const labelVal = marker.label || marker.vehicleNo || 'Bus';
      const routeVal = marker.routeName || marker.routeId?.routeName || 'Unassigned Route';
      const driverVal = marker.driverName || 'Driver';
      const phoneVal = marker.driverPhone || 'N/A';

      return `
        <div style="font-family: 'Outfit', sans-serif; padding: 4px; min-width: 160px; line-height: 1.4;">
          <h4 style="margin: 0 0 6px 0; color: #1E293B; display: flex; align-items: center; justify-content: space-between; font-weight: 700;">
            <span>Bus ${labelVal}</span>
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${isOnline ? '#10B981' : '#64748B'};"></span>
          </h4>
          <div style="font-size: 11px; color: #475569;">
            <p style="margin: 2px 0;"><strong>Route:</strong> ${routeVal}</p>
            <p style="margin: 2px 0;"><strong>Driver:</strong> ${driverVal}</p>
            <p style="margin: 2px 0;"><strong>Phone:</strong> ${phoneVal}</p>
            <p style="margin: 2px 0; color: ${isOnline ? '#059669' : '#475569'};"><strong>Status:</strong> ${isOnline ? 'Active / On Trip' : 'Inactive / Parked'}</p>
          </div>
        </div>
      `;
    };

    // Filter invalid coordinates and setup models
    const validMarkers = markers.filter(
      (m) => typeof m.currentLatitude === 'number' && typeof m.currentLongitude === 'number'
    );

    // Delete removed markers
    busesRef.current.forEach((bus, id) => {
      if (!validMarkers.some((m) => m.id === id)) {
        scene.remove(bus.model);
        if (bus.invisibleMarker) {
          bus.invisibleMarker.remove();
        }
        busesRef.current.delete(id);
      }
    });

    // Add or Update markers
    validMarkers.forEach((marker) => {
      const id = marker.id;
      const lat = marker.currentLatitude;
      const lng = marker.currentLongitude;

      if (busesRef.current.has(id)) {
        // Update existing bus tween details
        const bus = busesRef.current.get(id);
        
        // Update Leaflet marker content
        if (bus.invisibleMarker) {
          bus.invisibleMarker.getPopup().setContent(generatePopupHtml(marker));
        }

        // Only start a new tween if the location coordinates actually shifted
        if (bus.targetLat !== lat || bus.targetLng !== lng) {
          bus.startLat = bus.currentLat;
          bus.startLng = bus.currentLng;
          bus.targetLat = lat;
          bus.targetLng = lng;
          bus.startTime = performance.now();

          // Calculate travel direction heading (bearing)
          const dLat = lat - bus.startLat;
          const dLng = lng - bus.startLng;
          
          if (Math.abs(dLat) > 1e-7 || Math.abs(dLng) > 1e-7) {
            const targetHeading = Math.atan2(dLng, dLat); // angle in map mercator space
            bus.startHeading = bus.currentHeading;
            bus.targetHeading = targetHeading;
          }
        }
      } else {
        // Create new bus entry
        // Use loaded master model, or create a temporary procedural fallback if model is still loading
        const modelTemplate = resourcesRef.current.masterBusModel || createProceduralBus();
        const busModel = modelTemplate.clone();
        
        // Apply scaling constraints
        busModel.scale.set(BASE_BUS_SCALE, BASE_BUS_SCALE, BASE_BUS_SCALE);
        busModel.rotation.order = 'YXZ'; // Important order to prevent roll/yaw gimbal lock
        scene.add(busModel);

        // Add invisible/transparent Leaflet marker underneath the 3D model for click events
        const invisibleIcon = window.L.divIcon({
          html: `<div style="width: 44px; height: 44px; background: transparent; border: none; cursor: pointer;"></div>`,
          className: 'invisible-bus-marker',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const invisibleMarker = window.L.marker([lat, lng], { icon: invisibleIcon })
          .bindPopup(generatePopupHtml(marker))
          .addTo(map);

        busesRef.current.set(id, {
          id,
          model: busModel,
          startLat: lat,
          startLng: lng,
          targetLat: lat,
          targetLng: lng,
          currentLat: lat,
          currentLng: lng,
          startHeading: 0,
          targetHeading: 0,
          currentHeading: 0,
          startTime: performance.now(),
          duration: TWEEN_DURATION,
          invisibleMarker
        });
      }
    });
  }, [markers, map]);

  // 4. Projection math & animation loop (executed at 60 FPS)
  useEffect(() => {
    if (!map) return;

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    const tempNdc = new THREE.Vector2();
    const intersectionPoint = new THREE.Vector3();

    const animateLoop = () => {
      const now = performance.now();
      const scene = resourcesRef.current.scene;
      const camera = resourcesRef.current.camera;
      const renderer = resourcesRef.current.renderer;

      if (!scene || !camera || !renderer) {
        requestRef.current = requestAnimationFrame(animateLoop);
        return;
      }

      // Check if fallback model loaded, swap out procedural model if GLB loaded in background
      const masterModel = resourcesRef.current.masterBusModel;
      busesRef.current.forEach((bus) => {
        // Swap model from procedural to GLB if it loaded later
        if (masterModel && bus.model.children[0] && bus.model.children[0].name === 'procedural-bus' && masterModel.name !== 'procedural-bus') {
          scene.remove(bus.model);
          const newModel = masterModel.clone();
          newModel.scale.set(BASE_BUS_SCALE, BASE_BUS_SCALE, BASE_BUS_SCALE);
          newModel.rotation.order = 'YXZ';
          scene.add(newModel);
          bus.model = newModel;
        }

        // Interpolate tween position
        const elapsed = now - bus.startTime;
        const rawProgress = Math.min(elapsed / bus.duration, 1.0);
        const progress = easeInOutQuad(rawProgress);

        // Set current lat/lng interpolation coordinates
        bus.currentLat = bus.startLat + (bus.targetLat - bus.startLat) * progress;
        bus.currentLng = bus.startLng + (bus.targetLng - bus.startLng) * progress;

        // Keep the transparent Leaflet marker synced under the 3D model
        if (bus.invisibleMarker) {
          bus.invisibleMarker.setLatLng([bus.currentLat, bus.currentLng]);
        }

        // Project coordinate: 2D LatLng -> Screen Pixel -> NDC -> 3D scene point
        const leafletPixel = map.latLngToContainerPoint([bus.currentLat, bus.currentLng]);
        const width = renderer.domElement.clientWidth;
        const height = renderer.domElement.clientHeight;

        tempNdc.x = (leafletPixel.x / width) * 2 - 1;
        tempNdc.y = -(leafletPixel.y / height) * 2 + 1;

        raycaster.setFromCamera(tempNdc, camera);
        if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
          bus.model.position.copy(intersectionPoint);
        }

        // Interpolate rotation angle around Y-axis (Yaw)
        let headingDiff = bus.targetHeading - bus.startHeading;
        headingDiff = Math.atan2(Math.sin(headingDiff), Math.cos(headingDiff)); // Handle shortest wrap-around path
        bus.currentHeading = bus.startHeading + headingDiff * progress;
        
        // Align rotation direction. With positive Z forward, Y-rotation = PI - currentHeading
        bus.model.rotation.y = Math.PI - bus.currentHeading;

        // Apply visual roll tilt banking into turns (Z-axis roll)
        // Bank angle peaks at progress = 0.5 and slopes back down to 0 at progress = 1.0
        const leanFactor = Math.sin(progress * Math.PI);
        bus.model.rotation.z = -LEAN_INTENSITY * leanFactor * headingDiff;
      });

      // Render updated frame
      renderer.render(scene, camera);

      requestRef.current = requestAnimationFrame(animateLoop);
    };

    // Begin looping
    requestRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [map]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 600, // Make overlay sit above map tile pane (400) but below controls/popups (700+)
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
