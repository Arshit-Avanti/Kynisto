"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, Eye, Zap, ShieldCheck } from "lucide-react";

type ThemeColor = {
  name: string;
  primary: number;
  secondary: number;
  accent: number;
  bgHex: string;
};

const THEMES: ThemeColor[] = [
  { name: "Cyber Cyan", primary: 0x00f0ff, secondary: 0x2457ff, accent: 0x7928ca, bgHex: "#00f0ff" },
  { name: "Neon Emerald", primary: 0x10b981, secondary: 0x065f46, accent: 0x34d399, bgHex: "#10b981" },
  { name: "Solar Amber", primary: 0xf59e0b, secondary: 0xd97706, accent: 0xfbbf24, bgHex: "#f59e0b" },
  { name: "Quantum Violet", primary: 0x8b5cf6, secondary: 0x6d28d9, accent: 0xc084fc, bgHex: "#8b5cf6" },
];

export function InteractiveShowcase3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedTheme, setSelectedTheme] = useState<number>(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeTelemetry, setActiveTelemetry] = useState("Quantum Locality Nexus Active");

  const coreRef = useRef<THREE.Group | null>(null);
  const materialsRef = useRef<{ coreMat?: THREE.MeshPhysicalMaterial; ringMat?: THREE.MeshBasicMaterial }>({});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // Lights
    const ambLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambLight);

    const pLight1 = new THREE.PointLight(THEMES[selectedTheme].primary, 3, 10);
    pLight1.position.set(3, 2, 3);
    scene.add(pLight1);

    const pLight2 = new THREE.PointLight(THEMES[selectedTheme].accent, 2.5, 10);
    pLight2.position.set(-3, -2, 2);
    scene.add(pLight2);

    // Object Group
    const group = new THREE.Group();
    scene.add(group);
    coreRef.current = group;

    // Torus Knot Centerpiece
    const knotGeo = new THREE.TorusKnotGeometry(1.0, 0.3, 128, 32, 2, 3);
    const knotMat = new THREE.MeshPhysicalMaterial({
      color: THEMES[selectedTheme].primary,
      emissive: 0x051025,
      roughness: 0.15,
      metalness: 0.85,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const knotMesh = new THREE.Mesh(knotGeo, knotMat);
    group.add(knotMesh);

    // Inner Glowing Core
    const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: THEMES[selectedTheme].secondary,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(sphereMesh);

    materialsRef.current = { coreMat: knotMat, ringMat: sphereMat };

    // Interactive Drag Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      setIsInteracting(true);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !group) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      group.rotation.y += deltaX * 0.008;
      group.rotation.x += deltaY * 0.008;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        setIsInteracting(true);
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || !group || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      group.rotation.y += deltaX * 0.008;
      group.rotation.x += deltaY * 0.008;

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    dom.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    // Render loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (!isDragging) {
        group.rotation.y += 0.006;
        group.rotation.x = Math.sin(elapsed * 0.5) * 0.2;
      }

      sphereMesh.rotation.y = -elapsed * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      knotGeo.dispose();
      knotMat.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, [selectedTheme]);

  const handleThemeSwitch = (index: number) => {
    setSelectedTheme(index);
    setActiveTelemetry(`Quantum Wavelength Shifted: ${THEMES[index].name}`);
  };

  return (
    <div className="showcasePlayground" ref={mountRef} style={{ cursor: isInteracting ? "grabbing" : "grab" }}>
      {/* Top Right Color Theme Palette */}
      <div className="showcaseControls">
        {THEMES.map((theme, idx) => (
          <button
            key={theme.name}
            type="button"
            className={`colorThemeBtn ${selectedTheme === idx ? "active" : ""}`}
            style={{ backgroundColor: theme.bgHex }}
            title={theme.name}
            onClick={() => handleThemeSwitch(idx)}
          />
        ))}
      </div>

      {/* Bottom Floating Telemetry Badge */}
      <div className="showcaseBadge">
        <Sparkles className="w-4 h-4 text-[#00f0ff] animate-spin" style={{ animationDuration: "6s" }} />
        <span><b>3D Interactive Inspector:</b> Drag to rotate 360° | Click color to shift wavelength</span>
      </div>
    </div>
  );
}
