/**
 * 3D Virtual Production & Cinematography Stage
 * Built with Three.js following studio PBR, procedural 3-12 part models, ACES Filmic tone mapping,
 * RoomEnvironment reflections, damped camera kinematics, and collapsible bottom dock ergonomics.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Camera,
  Maximize2,
  Minimize2,
  RotateCw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  Eye,
  Camera as CameraIcon,
  Zap,
} from 'lucide-react';

interface ThreeStageViewProps {
  onCaptureFrame: (dataUrl: string, name: string) => void;
  aspectRatio: string;
}

export const ThreeStageView: React.FC<ThreeStageViewProps> = ({
  onCaptureFrame,
  aspectRatio,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // UI state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<'orbit' | 'hero' | 'crane' | 'cockpit'>('orbit');
  const [explodedVal, setExplodedVal] = useState<number>(0); // 0 to 1
  const [materialTheme, setMaterialTheme] = useState<'titanium' | 'gilded' | 'brass' | 'ceramic'>('titanium');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [turretActive, setTurretActive] = useState<boolean>(true);
  const [capturedFlash, setCapturedFlash] = useState<boolean>(false);

  // Mutable refs for Three.js render loop to avoid GC and closures
  const threeRefs = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    controls: OrbitControls | null;
    heroGroup: THREE.Group | null;
    chassisMesh: THREE.Mesh | null;
    canopyMesh: THREE.Mesh | null;
    gimbalGroup: THREE.Group | null;
    wheels: THREE.Group[];
    thrusters: THREE.Mesh[];
    contactShadow: THREE.Mesh | null;
    materials: { [key: string]: any };
    isSoftwareGl: boolean;
    targetExploded: number;
    currentExploded: number;
    targetCamPos: THREE.Vector3;
    targetCamLook: THREE.Vector3;
    isTransitioningCam: boolean;
    animFrameId: number;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    heroGroup: null,
    chassisMesh: null,
    canopyMesh: null,
    gimbalGroup: null,
    wheels: [],
    thrusters: [],
    contactShadow: null,
    materials: {},
    isSoftwareGl: false,
    targetExploded: 0,
    currentExploded: 0,
    targetCamPos: new THREE.Vector3(7, 4.5, 9),
    targetCamLook: new THREE.Vector3(0, 1.2, 0),
    isTransitioningCam: false,
    animFrameId: 0,
  });

  // Keep targetExploded in sync with slider
  useEffect(() => {
    threeRefs.current.targetExploded = explodedVal;
  }, [explodedVal]);

  // Handle Material Theme updates
  useEffect(() => {
    const mats = threeRefs.current.materials;
    if (!mats.chassis) return;

    if (materialTheme === 'titanium') {
      mats.chassis.color.setHex(0x1a1d29);
      mats.chassis.metalness = 0.92;
      mats.chassis.roughness = 0.28;

      mats.canopy.color.setHex(0x00f0ff);
      mats.canopy.roughness = 0.05;
      mats.canopy.metalness = 0.2;

      mats.accents.color.setHex(0x00f0ff);
      (mats.accents as any).emissive?.setHex(0x003344);
    } else if (materialTheme === 'gilded') {
      mats.chassis.color.setHex(0x0d0d0f);
      mats.chassis.metalness = 0.95;
      mats.chassis.roughness = 0.15;

      mats.canopy.color.setHex(0xd4af37);
      mats.canopy.roughness = 0.08;
      mats.canopy.metalness = 0.9;

      mats.accents.color.setHex(0xf59e0b);
      (mats.accents as any).emissive?.setHex(0x553300);
    } else if (materialTheme === 'brass') {
      mats.chassis.color.setHex(0x5c3a21);
      mats.chassis.metalness = 0.85;
      mats.chassis.roughness = 0.45;

      mats.canopy.color.setHex(0xb45309);
      mats.canopy.roughness = 0.2;
      mats.canopy.metalness = 0.7;

      mats.accents.color.setHex(0xd97706);
      (mats.accents as any).emissive?.setHex(0x331a00);
    } else if (materialTheme === 'ceramic') {
      mats.chassis.color.setHex(0xeeeeee);
      mats.chassis.metalness = 0.1;
      mats.chassis.roughness = 0.25;

      mats.canopy.color.setHex(0x111115);
      mats.canopy.roughness = 0.04;
      mats.canopy.metalness = 0.95;

      mats.accents.color.setHex(0xff0055);
      (mats.accents as any).emissive?.setHex(0x330011);
    }
  }, [materialTheme]);

  // Camera presets
  const applyCameraPreset = (preset: 'orbit' | 'hero' | 'crane' | 'cockpit') => {
    setCameraPreset(preset);
    const state = threeRefs.current;
    state.isTransitioningCam = true;

    if (preset === 'orbit') {
      state.targetCamPos.set(7, 4.5, 9);
      state.targetCamLook.set(0, 1.2, 0);
      setAutoRotate(true);
    } else if (preset === 'hero') {
      state.targetCamPos.set(4.5, 0.8, 5.5);
      state.targetCamLook.set(0, 1.4, 0);
      setAutoRotate(false);
    } else if (preset === 'crane') {
      state.targetCamPos.set(0.1, 11, 2.5);
      state.targetCamLook.set(0, 0, 0);
      setAutoRotate(false);
    } else if (preset === 'cockpit') {
      state.targetCamPos.set(0, 2.2, 0.4);
      state.targetCamLook.set(0, 2.0, 7);
      setAutoRotate(false);
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();
    threeRefs.current.isSoftwareGl = isSoftwareGl;

    // 2. Renderer setup with ACESFilmicToneMapping & sRGB
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // Needed for instant frame capture
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    threeRefs.current.renderer = renderer;

    // 3. Scene & Horizon-matched Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060712);
    scene.fog = new THREE.FogExp2(0x060712, 0.035);
    threeRefs.current.scene = scene;

    // 4. Studio Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Camera & OrbitControls
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    camera.position.set(7, 4.5, 9);
    threeRefs.current.camera = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going beneath ground
    controls.minDistance = 2.0;
    controls.maxDistance = 24.0;
    controls.target.set(0, 1.2, 0);
    controls.addEventListener('start', () => {
      threeRefs.current.isTransitioningCam = false;
    });
    threeRefs.current.controls = controls;

    // 6. Studio 3-Point Lighting Rig
    // Warm Key Light with tight shadow bounds
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.8);
    keyLight.position.set(6, 10, 7);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 25;
      const d = 5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Cool Sky / Ground Fill
    const fillLight = new THREE.HemisphereLight(0x00f0ff, 0x050814, 1.1);
    scene.add(fillLight);

    // Anamorphic Rim Backlight
    const rimLight = new THREE.DirectionalLight(0xff007f, 2.2);
    rimLight.position.set(-8, 5, -8);
    scene.add(rimLight);

    // 7. Procedural Stage Floor with Radial Contact Shadow
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorTexture = createProceduralGridTexture(renderer);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c1a,
      roughness: 0.65,
      metalness: 0.4,
      map: floorTexture,
    });
    floorMat.polygonOffset = true;
    floorMat.polygonOffsetFactor = 1;
    floorMat.polygonOffsetUnits = 1;
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    // Soft Contact Shadow Plane under hero object
    const shadowGeo = new THREE.PlaneGeometry(6.5, 4.5);
    const shadowTex = createRadialContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.015;
    scene.add(contactShadow);
    threeRefs.current.contactShadow = contactShadow;

    // 8. Composite 10-Part Procedural Hero Subject (Cybernetic Cinema Recon Rover)
    const heroGroup = new THREE.Group();
    heroGroup.position.set(0, 0, 0);
    scene.add(heroGroup);
    threeRefs.current.heroGroup = heroGroup;

    // Materials Dictionary
    const mats = {
      chassis: new THREE.MeshPhysicalMaterial({
        color: 0x1a1d29,
        metalness: 0.92,
        roughness: 0.28,
        clearcoat: 0.3,
        clearcoatRoughness: 0.2,
      }),
      canopy: new THREE.MeshPhysicalMaterial({
        color: 0x00f0ff,
        metalness: 0.2,
        roughness: 0.05,
        transmission: isSoftwareGl ? 0 : 0.85,
        transparent: true,
        opacity: isSoftwareGl ? 0.4 : 1,
        ior: 1.52,
        thickness: 0.8,
        clearcoat: 1.0,
      }),
      wheelRubber: new THREE.MeshStandardMaterial({
        color: 0x111215,
        roughness: 0.85,
        metalness: 0.1,
      }),
      wheelRim: new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.2,
        metalness: 0.95,
      }),
      accents: new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x003344,
        roughness: 0.2,
        metalness: 0.8,
      }),
      thrusterGlow: new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
      }),
    };
    threeRefs.current.materials = mats;

    // Part 1: Main Chassis (Lower Beveled Hull)
    const chassisGeo = new THREE.BoxGeometry(2.4, 0.7, 4.2);
    const chassisMesh = new THREE.Mesh(chassisGeo, mats.chassis);
    chassisMesh.position.set(0, 0.95, 0);
    chassisMesh.castShadow = !isSoftwareGl;
    chassisMesh.receiveShadow = !isSoftwareGl;
    heroGroup.add(chassisMesh);
    threeRefs.current.chassisMesh = chassisMesh;

    // Part 2: Cockpit Canopy (Sloped Glass Shell)
    const canopyGeo = new THREE.ConeGeometry(1.2, 1.4, 6);
    canopyGeo.rotateX(Math.PI / 2);
    canopyGeo.scale(1.1, 0.6, 1.8);
    const canopyMesh = new THREE.Mesh(canopyGeo, mats.canopy);
    canopyMesh.position.set(0, 1.6, 0.2);
    canopyMesh.castShadow = !isSoftwareGl;
    heroGroup.add(canopyMesh);
    threeRefs.current.canopyMesh = canopyMesh;

    // Part 3: Articulated Cinema Gimbal Camera Rig (Roof Mount)
    const gimbalGroup = new THREE.Group();
    gimbalGroup.position.set(0, 2.1, 0.6);

    const gimbalBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 0.25, 16),
      mats.chassis
    );
    gimbalGroup.add(gimbalBase);

    const lensBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.28, 0.65, 24),
      mats.wheelRim
    );
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.set(0, 0.25, 0.3);
    gimbalGroup.add(lensBarrel);

    const lensGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.05, 24),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    lensGlass.rotation.x = Math.PI / 2;
    lensGlass.position.set(0, 0.25, 0.63);
    gimbalGroup.add(lensGlass);

    // Tally light
    const tallyLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xff0044 })
    );
    tallyLight.position.set(0.18, 0.42, 0.2);
    gimbalGroup.add(tallyLight);

    heroGroup.add(gimbalGroup);
    threeRefs.current.gimbalGroup = gimbalGroup;

    // Part 4: 4 Heavy-Duty All-Terrain Wheels with Suspension
    const wheelPositions = [
      { x: -1.45, y: 0.65, z: 1.4 },
      { x: 1.45, y: 0.65, z: 1.4 },
      { x: -1.45, y: 0.65, z: -1.4 },
      { x: 1.45, y: 0.65, z: -1.4 },
    ];

    const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.45, 24);
    wheelGeo.rotateZ(Math.PI / 2);

    const rimGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.47, 16);
    rimGeo.rotateZ(Math.PI / 2);

    const wheels: THREE.Group[] = [];
    wheelPositions.forEach((pos) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(pos.x, pos.y, pos.z);

      const tire = new THREE.Mesh(wheelGeo, mats.wheelRubber);
      tire.castShadow = !isSoftwareGl;
      wGroup.add(tire);

      const rim = new THREE.Mesh(rimGeo, mats.wheelRim);
      wGroup.add(rim);

      heroGroup.add(wGroup);
      wheels.push(wGroup);
    });
    threeRefs.current.wheels = wheels;

    // Part 5: Dual Rear Plasma Thrusters
    const thrusters: THREE.Mesh[] = [];
    [-0.6, 0.6].forEach((x) => {
      const tHole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.32, 0.5, 16),
        mats.chassis
      );
      tHole.rotation.x = Math.PI / 2;
      tHole.position.set(x, 1.1, -2.2);

      const tPlasma = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.1, 0.3, 16),
        mats.thrusterGlow
      );
      tPlasma.rotation.x = Math.PI / 2;
      tPlasma.position.set(x, 1.1, -2.4);

      heroGroup.add(tHole);
      heroGroup.add(tPlasma);
      thrusters.push(tPlasma);
    });
    threeRefs.current.thrusters = thrusters;

    // Part 6: Floating Satellite Drones via InstancedMesh (>20 elements)
    const droneCount = 28;
    const droneGeo = new THREE.OctahedronGeometry(0.12);
    const droneMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x004455,
      roughness: 0.1,
      metalness: 0.9,
    });
    const droneMesh = new THREE.InstancedMesh(droneGeo, droneMat, droneCount);
    droneMesh.frustumCulled = false;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < droneCount; i++) {
      const angle = (i / droneCount) * Math.PI * 2;
      const radius = 5.5 + (i % 3) * 1.5;
      const y = 1.5 + Math.sin(i * 1.5) * 1.2;
      dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      dummy.rotation.set(i * 0.2, i * 0.3, 0);
      dummy.updateMatrix();
      droneMesh.setMatrixAt(i, dummy.matrix);
    }
    droneMesh.instanceMatrix.needsUpdate = true;
    scene.add(droneMesh);

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Smooth Render Loop with Damped Camera Transitions
    let lastTime = performance.now();
    const clock = new THREE.Clock();

    const tick = () => {
      const state = threeRefs.current;
      const dt = Math.min(clock.getDelta(), 0.1);
      const time = performance.now() * 0.001;

      // Camera Position & Target Damping
      if (state.isTransitioningCam && state.camera && state.controls) {
        state.camera.position.lerp(state.targetCamPos, 1 - Math.exp(-6 * dt));
        state.controls.target.lerp(state.targetCamLook, 1 - Math.exp(-6 * dt));
        if (state.camera.position.distanceTo(state.targetCamPos) < 0.05) {
          state.isTransitioningCam = false;
        }
      }

      // Auto-rotation around vehicle
      if (autoRotate && !state.isTransitioningCam && state.controls) {
        state.controls.autoRotate = true;
        state.controls.autoRotateSpeed = 1.2;
      } else if (state.controls) {
        state.controls.autoRotate = false;
      }

      state.controls?.update();

      // Exploded View Damping: interpolate current toward target
      state.currentExploded = THREE.MathUtils.damp(
        state.currentExploded,
        state.targetExploded,
        8,
        dt
      );
      const exp = state.currentExploded;

      if (state.canopyMesh) {
        state.canopyMesh.position.y = 1.6 + exp * 1.8;
      }
      if (state.gimbalGroup) {
        state.gimbalGroup.position.y = 2.1 + exp * 2.8;
        // Turret tracking motion
        if (turretActive) {
          state.gimbalGroup.rotation.y = Math.sin(time * 0.8) * 0.6;
        }
      }
      if (state.wheels.length === 4) {
        state.wheels[0].position.x = -1.45 - exp * 1.2; // FL
        state.wheels[1].position.x = 1.45 + exp * 1.2; // FR
        state.wheels[2].position.x = -1.45 - exp * 1.2; // RL
        state.wheels[3].position.x = 1.45 + exp * 1.2; // RR

        // Wheel idle rotation
        state.wheels.forEach((w) => (w.rotation.x += dt * 0.5));
      }

      // Thruster pulse
      state.thrusters.forEach((t, idx) => {
        const pulse = 1 + Math.sin(time * 8 + idx) * 0.25;
        t.scale.set(pulse, pulse, 1);
      });

      // Drone satellite orbit rotation
      droneMesh.rotation.y = time * 0.08;

      renderer.render(scene, camera);
      state.animFrameId = requestAnimationFrame(tick);
    };

    threeRefs.current.animFrameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(threeRefs.current.animFrameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Frame Capture: grabs current WebGL canvas as a 4K resolution snapshot and feeds it into Studio Canvas
  const handleCaptureToStudio = () => {
    const state = threeRefs.current;
    if (!state.renderer || !state.scene || !state.camera) return;

    // Force an immediate fresh frame render
    state.renderer.render(state.scene, state.camera);
    const dataUrl = state.renderer.domElement.toDataURL('image/png', 0.95);

    setCapturedFlash(true);
    setTimeout(() => setCapturedFlash(false), 300);

    onCaptureFrame(dataUrl, `3D_Stage_${cameraPreset.toUpperCase()}_${materialTheme}`);
  };

  return (
    <div className="relative w-full h-[580px] rounded-2xl overflow-hidden bg-[#060712] border border-cyan-900/40 shadow-2xl flex flex-col select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Screen flash feedback on capture */}
      {capturedFlash && (
        <div className="absolute inset-0 bg-white/70 pointer-events-none transition-opacity duration-300 z-30" />
      )}

      {/* Top Telemetry Overlay (Static indicators, no pulsating dots) */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-[#090b18]/90 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] flex items-center gap-1.5 shadow-lg">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            3D VIRTUAL PRODUCTION STAGE
          </span>
          <span className="hidden sm:inline-block px-2 py-1 rounded-md bg-[#090b18]/80 border border-slate-800 text-slate-300 font-mono text-[11px]">
            THREE.JS PBR • ACES FILMIC
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleCaptureToStudio}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
            title="Snap 3D scene and transfer to Studio Canvas for Video / Variations"
          >
            <CameraIcon className="w-3.5 h-3.5" />
            Capture Frame to Studio
          </button>
        </div>
      </div>

      {/* Ergonomic Collapsible Bottom Control Dock (<= 15% viewport footprint, solid/rgba surfaces) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-full max-w-2xl px-3 pointer-events-auto z-20 transition-all">
        {/* Toggle Collapse Pill */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-3 py-0.5 rounded-t-lg bg-[#0e1022] border-t border-x border-slate-700/80 text-[10px] font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1 shadow-md"
          >
            {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {isCollapsed ? 'Show 3D Stage Controls' : 'Hide Controls (Zen Mode)'}
          </button>
        </div>

        {!isCollapsed && (
          <div className="bg-[#0b0d1e] border border-cyan-900/50 rounded-xl p-3 shadow-2xl space-y-2.5">
            {/* Row 1: Camera Presets & Orbit Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-400">CAMERA:</span>
                {(['orbit', 'hero', 'crane', 'cockpit'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => applyCameraPreset(preset)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono capitalize transition-colors ${
                      cameraPreset === preset
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-[#14162e] text-slate-400 hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors ${
                    autoRotate
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-[#14162e] text-slate-400 border-slate-800'
                  }`}
                >
                  ORBIT {autoRotate ? 'ON' : 'OFF'}
                </button>

                <button
                  onClick={() => setTurretActive(!turretActive)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors ${
                    turretActive
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-[#14162e] text-slate-400 border-slate-800'
                  }`}
                >
                  GIMBAL {turretActive ? 'ACTIVE' : 'LOCKED'}
                </button>
              </div>
            </div>

            {/* Row 2: Exploded View Inspection Slider & Material Finish */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-xs">
              {/* Exploded Slider */}
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                  EXPLODED VIEW:
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={explodedVal}
                  onChange={(e) => setExplodedVal(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-mono text-cyan-300 w-8">
                  {Math.round(explodedVal * 100)}%
                </span>
              </div>

              {/* Material Finish Swatches */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-400">FINISH:</span>
                {[
                  { id: 'titanium', label: 'Titanium', color: '#1a1d29' },
                  { id: 'gilded', label: 'Gilded', color: '#d4af37' },
                  { id: 'brass', label: 'Brass', color: '#b45309' },
                  { id: 'ceramic', label: 'Ceramic', color: '#ffffff' },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setMaterialTheme(th.id as any)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors flex items-center gap-1 ${
                      materialTheme === th.id
                        ? 'border-cyan-400 text-white bg-[#1a1d36]'
                        : 'border-slate-800 text-slate-400 bg-[#121429] hover:text-slate-200'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full border border-black/50"
                      style={{ backgroundColor: th.color }}
                    />
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Procedural Grid Floor Texture generated in code with zero external 404 dependencies
 */
function createProceduralGridTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#0a0c1a';
  ctx.fillRect(0, 0, 1024, 1024);

  // Concentric Circles
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.5;
  for (let r = 80; r <= 480; r += 80) {
    ctx.beginPath();
    ctx.arc(512, 512, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Cross lines
  ctx.beginPath();
  ctx.moveTo(512, 32);
  ctx.lineTo(512, 992);
  ctx.moveTo(32, 512);
  ctx.lineTo(992, 512);
  ctx.stroke();

  // Fine grid markings
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.lineWidth = 1;
  const step = 64;
  for (let x = 0; x <= 1024; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, x);
    ctx.lineTo(1024, x);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

/**
 * Soft Radial Contact Shadow Texture
 */
function createRadialContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 240);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
  grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.7)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
