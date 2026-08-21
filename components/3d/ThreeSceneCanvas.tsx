"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeSceneCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    // Light clean background fog
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.04);

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 4.5, 6.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    const isMobile = window.innerWidth < 768;
    const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1.2 : 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // ==========================================
    // 💡 CLEAN LIGHTING
    // ==========================================
    const ambLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambLight);

    const cyanLight = new THREE.PointLight(0x0284c7, 3, 20);
    cyanLight.position.set(3, 5, 2);
    scene.add(cyanLight);

    const indigoLight = new THREE.PointLight(0x6366f1, 2.5, 20);
    indigoLight.position.set(-3, 3, -1);
    scene.add(indigoLight);

    // ==========================================
    // 🌊 3D DIGITAL WAVE TERRAIN MESH (NO OBJECTS)
    // ==========================================
    const gridCols = isMobile ? 48 : 72;
    const gridRows = isMobile ? 48 : 72;
    const terrainWidth = 18;
    const terrainDepth = 18;

    const terrainGeo = new THREE.PlaneGeometry(terrainWidth, terrainDepth, gridCols, gridRows);
    terrainGeo.rotateX(-Math.PI / 2.3);

    const posAttr = terrainGeo.attributes.position;
    const vertexCount = posAttr.count;
    const originalY = new Float32Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) {
      originalY[i] = posAttr.getY(i);
    }

    // Modern crisp wireframe shader material
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.38,
      roughness: 0.2,
      metalness: 0.8,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.set(0, -1.2, -1);
    scene.add(terrainMesh);

    // Subtle ambient dust particles
    const particleCount = isMobile ? 150 : 300;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 20;
      particlePositions[i * 3 + 1] = Math.random() * 8 - 1;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x0284c7,
      size: isMobile ? 0.035 : 0.045,
      transparent: true,
      opacity: 0.45,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ==========================================
    // 🖱️ MOUSE RIPPLE & SCROLL LISTENERS
    // ==========================================
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let scrollY = 0;
    let maxScroll = 1;

    const handleScroll = () => {
      scrollY = window.scrollY || document.documentElement.scrollTop;
      maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // ==========================================
    // 🎬 60 FPS RENDER LOOP
    // ==========================================
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const scrollRatio = Math.min(1, Math.max(0, scrollY / maxScroll));

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.06;
      mouseY += (targetMouseY - mouseY) * 0.06;

      cyanLight.position.x = mouseX * 4;
      cyanLight.position.y = 5 - mouseY * 2;

      if (!prefersReducedMotion) {
        // Animate digital wave terrain
        for (let i = 0; i < vertexCount; i++) {
          const u = (i % (gridCols + 1)) / gridCols;
          const v = Math.floor(i / (gridCols + 1)) / gridRows;

          // Wave propagation formula
          const wave1 = Math.sin(u * 8 + elapsedTime * 1.2) * 0.28;
          const wave2 = Math.cos(v * 7 + elapsedTime * 0.9) * 0.24;
          const wave3 = Math.sin((u + v) * 5 - elapsedTime * 1.5) * 0.18;

          // Mouse ripple field
          const distToMouse = Math.hypot(u - 0.5 - mouseX * 0.25, v - 0.5 + mouseY * 0.25);
          const mouseRipple = Math.exp(-distToMouse * 6) * 0.45 * Math.sin(distToMouse * 16 - elapsedTime * 4);

          posAttr.setY(i, originalY[i] + wave1 + wave2 + wave3 + mouseRipple);
        }
        posAttr.needsUpdate = true;

        particles.rotation.y = elapsedTime * 0.02;
      }

      // Camera responds smoothly to scroll
      camera.position.y = 4.5 + scrollRatio * 1.5 - mouseY * 0.5;
      camera.position.z = 6.5 - scrollRatio * 2.0;
      camera.position.x = mouseX * 0.8;
      camera.lookAt(0, -0.4, -1);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="canvas3dContainer"
      aria-hidden="true"
    />
  );
}
