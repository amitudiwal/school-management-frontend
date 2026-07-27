import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const TWEEN_DURATION = 1200; // Interpolation duration in milliseconds (1.2 seconds)
const LEAN_INTENSITY = 0.25;  // Tilt angle intensity when turning (radians)
const BASE_BUS_SCALE = 1.4;  // Size multiplier for the bus models in 3D scene

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
  });

  // 1. Create a detailed 3D Rapido-style School Bus model built from Three.js primitives
  const createProceduralBus = () => {
    const busGroup = new THREE.Group();
    busGroup.name = 'procedural-bus';

    // Materials
    // Vibrant Iconic Yellow School Bus Paint
    const busYellowMat = new THREE.MeshStandardMaterial({ 
      color: 0xFBBF24, // Bright School Bus Yellow
      metalness: 0.3, 
      roughness: 0.25 
    });

    const busDarkYellowMat = new THREE.MeshStandardMaterial({ 
      color: 0xD97706, // Darker yellow trim
      metalness: 0.3, 
      roughness: 0.3 
    });
    
    // Tinted dark glass for windows
    const glassMat = new THREE.MeshStandardMaterial({ 
      color: 0x111827, 
      roughness: 0.1, 
      metalness: 0.9 
    });
    
    // Black plastic/trim
    const trimMat = new THREE.MeshStandardMaterial({ 
      color: 0x111827, 
      roughness: 0.7 
    });
    
    // Wheel rubber
    const tireMat = new THREE.MeshStandardMaterial({ 
      color: 0x1F2937, 
      roughness: 0.9 
    });
    
    // Silver wheel rims
    const rimMat = new THREE.MeshStandardMaterial({ 
      color: 0xE5E7EB, 
      metalness: 0.8, 
      roughness: 0.2 
    });

    // 1. Main Chassis / Body (Yellow)
    // Box dimensions: width=1.35, height=0.95, depth=3.0
    const bodyGeom = new THREE.BoxGeometry(1.35, 0.95, 3.0);
    const body = new THREE.Mesh(bodyGeom, busYellowMat);
    body.position.y = 0.68;
    busGroup.add(body);

    // Black horizontal side stripe (classic school bus look)
    const stripeGeom = new THREE.BoxGeometry(1.37, 0.12, 2.9);
    const stripe = new THREE.Mesh(stripeGeom, trimMat);
    stripe.position.y = 0.65;
    busGroup.add(stripe);

    // Hood / Engine Front Nose (curved slightly down)
    const hoodGeom = new THREE.BoxGeometry(1.34, 0.5, 0.6);
    const hood = new THREE.Mesh(hoodGeom, busYellowMat);
    hood.position.set(0, 0.5, 1.6);
    busGroup.add(hood);

    // 2. Front Windshield (Sleek tilted glass)
    const frontWindshieldGeom = new THREE.BoxGeometry(1.31, 0.45, 0.1);
    const frontWindshield = new THREE.Mesh(frontWindshieldGeom, glassMat);
    frontWindshield.position.set(0, 0.92, 1.32);
    frontWindshield.rotation.x = -Math.PI / 16;
    busGroup.add(frontWindshield);

    // 3. Side Windows (Row of individual windows)
    const windowGeom = new THREE.BoxGeometry(0.02, 0.4, 0.35);
    [-0.8, -0.3, 0.2, 0.7, 1.2].forEach((zPos) => {
      const wL = new THREE.Mesh(windowGeom, glassMat);
      wL.position.set(-0.685, 0.9, -zPos + 0.3);
      busGroup.add(wL);

      const wR = wL.clone();
      wR.position.x = 0.685;
      busGroup.add(wR);
    });
    
    // Rear Window
    const rearWindowGeom = new THREE.BoxGeometry(1.1, 0.4, 0.02);
    const rearWindow = new THREE.Mesh(rearWindowGeom, glassMat);
    rearWindow.position.set(0, 0.9, -1.51);
    busGroup.add(rearWindow);

    // 4. Wheels (2 axles, 4 wheels with chrome rims)
    const tireGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 20);
    const rimGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.21, 14);
    
    const wheelPositions = [
      [-0.7, 0.28, 0.9],   // Front Left
      [0.7, 0.28, 0.9],    // Front Right
      [-0.7, 0.28, -0.9],  // Back Left
      [0.7, 0.28, -0.9]    // Back Right
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

    // 5. Side-view mirrors
    const mirrorArmGeom = new THREE.BoxGeometry(0.3, 0.04, 0.04);
    const mirrorArmL = new THREE.Mesh(mirrorArmGeom, trimMat);
    mirrorArmL.position.set(-0.78, 1.0, 1.4);
    mirrorArmL.rotation.y = Math.PI / 6;
    busGroup.add(mirrorArmL);

    const mirrorPieceGeom = new THREE.BoxGeometry(0.06, 0.2, 0.1);
    const mirrorL = new THREE.Mesh(mirrorPieceGeom, trimMat);
    mirrorL.position.set(-0.92, 0.9, 1.48);
    busGroup.add(mirrorL);

    const mirrorArmR = mirrorArmL.clone();
    mirrorArmR.position.x = 0.78;
    mirrorArmR.rotation.y = -Math.PI / 6;
    busGroup.add(mirrorArmR);

    const mirrorR = mirrorL.clone();
    mirrorR.position.x = 0.92;
    busGroup.add(mirrorR);

    // 6. Headlights (Bright LED white)
    const headlightGeom = new THREE.BoxGeometry(0.22, 0.1, 0.03);
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xFFFBEB });
    const headlightL = new THREE.Mesh(headlightGeom, headlightMat);
    headlightL.position.set(-0.48, 0.42, 1.91);
    
    const headlightR = headlightL.clone();
    headlightR.position.x = 0.48;
    
    busGroup.add(headlightL);
    busGroup.add(headlightR);

    // Red Taillights at the back
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
    const taillightL = new THREE.Mesh(headlightGeom, taillightMat);
    taillightL.position.set(-0.48, 0.45, -1.51);

    const taillightR = taillightL.clone();
    taillightR.position.x = 0.48;

    busGroup.add(taillightL);
    busGroup.add(taillightR);
    
    // Front Grill & Bumper
    const grillGeom = new THREE.BoxGeometry(0.7, 0.3, 0.04);
    const grill = new THREE.Mesh(grillGeom, trimMat);
    grill.position.set(0, 0.45, 1.91);
    busGroup.add(grill);

    const bumperGeom = new THREE.BoxGeometry(1.38, 0.16, 0.08);
    const bumper = new THREE.Mesh(bumperGeom, trimMat);
    bumper.position.set(0, 0.28, 1.89);
    busGroup.add(bumper);

    // 7. Rapido-style Ground Shadow & Pulse Ring Underneath
    const shadowGeom = new THREE.PlaneGeometry(2.4, 4.0);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.02, 0);
    busGroup.add(shadowMesh);

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

    const scene = new THREE.Scene();

    // Aerial 3/4 camera view
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 32, 28);
    camera.lookAt(0, 0, 0);

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(20, 40, 25);
    dirLight.castShadow = true;
    scene.add(dirLight);

    resourcesRef.current.scene = scene;
    resourcesRef.current.camera = camera;
    resourcesRef.current.renderer = renderer;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      renderer.setSize(newW, newH);
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    // Try loading GLB model fallback file
    const loader = new GLTFLoader();
    loader.load(
      '/models/bus_school_fallback.glb',
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        
        const scaleVal = 2.6 / maxDim;
        model.scale.set(scaleVal, scaleVal, scaleVal);

        const pivotWrapper = new THREE.Group();
        model.position.y = -box.min.y * scaleVal;
        pivotWrapper.add(model);

        resourcesRef.current.masterBusModel = pivotWrapper;
      },
      undefined,
      (err) => {
        resourcesRef.current.masterBusModel = createProceduralBus();
      }
    );

    return () => {
      resizeObserver.disconnect();
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      busesRef.current.forEach((bus) => {
        scene.remove(bus.model);
        if (bus.invisibleMarker) {
          bus.invisibleMarker.remove();
        }
      });
      busesRef.current.clear();
      renderer.dispose();
      scene.clear();
    };
  }, [map]);

  // 3. React to marker changes & sync Leaflet popups
  useEffect(() => {
    if (!map || !resourcesRef.current.scene) return;
    const scene = resourcesRef.current.scene;

    const generatePopupHtml = (marker) => {
      const isOnline = marker.status === 'Active';
      const labelVal = marker.vehicleNo || marker.label || 'School Bus';
      const routeVal = marker.routeName || marker.routeId?.routeName || 'Unassigned Route';
      const driverVal = marker.driverName || 'Driver';
      const phoneVal = marker.driverPhone || 'N/A';
      const speedVal = marker.speed ? `${marker.speed} km/h` : (isOnline ? '28 km/h' : 'Stopped');

      return `
        <div style="font-family: 'Outfit', sans-serif; padding: 10px 12px; min-width: 220px; color: #1F2937;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #F3F4F6; padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 14px;">🚌</div>
              <div>
                <h4 style="margin: 0; font-size: 15px; font-weight: 800;">Bus ${labelVal}</h4>
                <span style="font-size: 11px; color: #6B7280;">3D Rapido Tracker</span>
              </div>
            </div>
            <span style="padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; background: ${isOnline ? '#D1FAE5' : '#F3F4F6'}; color: ${isOnline ? '#059669' : '#6B7280'};">
              ${isOnline ? 'Active' : 'Offline'}
            </span>
          </div>
          <div style="font-size: 12px; display: flex; flex-direction: column; gap: 4px; color: #4B5563;">
            <div><strong>Route:</strong> ${routeVal}</div>
            <div><strong>Driver:</strong> ${driverVal}</div>
            <div><strong>Live Speed:</strong> <span style="color: #2563EB; font-weight: 700;">${speedVal}</span></div>
          </div>
          ${phoneVal && phoneVal !== 'N/A' ? `
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #F3F4F6;">
              <a href="tel:${phoneVal}" style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 6px 0; background: #2563EB; color: white; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 12px;">📞 Call Driver (${phoneVal})</a>
            </div>
          ` : ''}
        </div>
      `;
    };

    const validMarkers = markers.filter(
      (m) => typeof m.currentLatitude === 'number' && typeof m.currentLongitude === 'number'
    );

    busesRef.current.forEach((bus, id) => {
      if (!validMarkers.some((m) => m.id === id)) {
        scene.remove(bus.model);
        if (bus.invisibleMarker) {
          bus.invisibleMarker.remove();
        }
        busesRef.current.delete(id);
      }
    });

    validMarkers.forEach((marker) => {
      const id = marker.id;
      const lat = marker.currentLatitude;
      const lng = marker.currentLongitude;

      if (busesRef.current.has(id)) {
        const bus = busesRef.current.get(id);
        
        if (bus.invisibleMarker) {
          bus.invisibleMarker.getPopup().setContent(generatePopupHtml(marker));
        }

        if (bus.targetLat !== lat || bus.targetLng !== lng) {
          bus.startLat = bus.currentLat;
          bus.startLng = bus.currentLng;
          bus.targetLat = lat;
          bus.targetLng = lng;
          bus.startTime = performance.now();

          const dLat = lat - bus.startLat;
          const dLng = lng - bus.startLng;
          
          if (Math.abs(dLat) > 1e-7 || Math.abs(dLng) > 1e-7) {
            const targetHeading = Math.atan2(dLng, dLat);
            bus.startHeading = bus.currentHeading;
            bus.targetHeading = targetHeading;
          }
        }
      } else {
        const modelTemplate = resourcesRef.current.masterBusModel || createProceduralBus();
        const busModel = modelTemplate.clone();
        
        busModel.scale.set(BASE_BUS_SCALE, BASE_BUS_SCALE, BASE_BUS_SCALE);
        busModel.rotation.order = 'YXZ';
        scene.add(busModel);

        const invisibleIcon = window.L.divIcon({
          html: `<div style="width: 50px; height: 50px; background: transparent; border: none; cursor: pointer;"></div>`,
          className: 'invisible-bus-marker',
          iconSize: [50, 50],
          iconAnchor: [25, 25]
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

      busesRef.current.forEach((bus) => {
        const elapsed = now - bus.startTime;
        const rawProgress = Math.min(elapsed / bus.duration, 1.0);
        const progress = easeInOutQuad(rawProgress);

        bus.currentLat = bus.startLat + (bus.targetLat - bus.startLat) * progress;
        bus.currentLng = bus.startLng + (bus.targetLng - bus.startLng) * progress;

        if (bus.invisibleMarker) {
          bus.invisibleMarker.setLatLng([bus.currentLat, bus.currentLng]);
        }

        const leafletPixel = map.latLngToContainerPoint([bus.currentLat, bus.currentLng]);
        const width = renderer.domElement.clientWidth;
        const height = renderer.domElement.clientHeight;

        tempNdc.x = (leafletPixel.x / width) * 2 - 1;
        tempNdc.y = -(leafletPixel.y / height) * 2 + 1;

        raycaster.setFromCamera(tempNdc, camera);
        if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
          bus.model.position.copy(intersectionPoint);
        }

        let headingDiff = bus.targetHeading - bus.startHeading;
        headingDiff = Math.atan2(Math.sin(headingDiff), Math.cos(headingDiff));
        bus.currentHeading = bus.startHeading + headingDiff * progress;
        
        bus.model.rotation.y = Math.PI - bus.currentHeading;

        const leanFactor = Math.sin(progress * Math.PI);
        bus.model.rotation.z = -LEAN_INTENSITY * leanFactor * headingDiff;
      });

      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animateLoop);
    };

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
        zIndex: 650,
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
