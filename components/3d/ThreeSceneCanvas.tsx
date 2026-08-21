"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeSceneCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.035);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    const isMobile = window.innerWidth < 768;
    const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1.2 : 1.75);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // ==========================================
    // 💡 LIGHTING
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0x0a192f, 2.5);
    scene.add(ambientLight);

    const cyanPointLight = new THREE.PointLight(0x00f0ff, 3.5, 20);
    cyanPointLight.position.set(4, 3, 4);
    scene.add(cyanPointLight);

    const purplePointLight = new THREE.PointLight(0x7928ca, 3.5, 20);
    purplePointLight.position.set(-4, -3, 3);
    scene.add(purplePointLight);

    const cursorLight = new THREE.PointLight(0x38bdf8, 2, 12);
    cursorLight.position.set(0, 0, 4);
    scene.add(cursorLight);

    // ==========================================
    // 🌌 3D QUANTUM HOLOGRAPHIC CENTERPIECE
    // ==========================================
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 1. Inner Crystalline Icosahedron
    const innerGeo = new THREE.IcosahedronGeometry(1.35, 1);
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      emissive: 0x0a2540,
      roughness: 0.1,
      metalness: 0.8,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    masterGroup.add(innerCore);

    // 2. Core Glow Sphere
    const coreSphereGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const coreSphereMat = new THREE.MeshBasicMaterial({
      color: 0x2457ff,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    const coreSphere = new THREE.Mesh(coreSphereGeo, coreSphereMat);
    masterGroup.add(coreSphere);

    // 3. Gyroscopic Orbital Rings
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65,
      wireframe: true,
    });
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x7928ca,
      transparent: true,
      opacity: 0.55,
      wireframe: true,
    });
    const ringMat3 = new THREE.MeshBasicMaterial({
      color: 0xff8a00,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    });

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.02, 16, 100), ringMat1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.02, 16, 100), ringMat2);
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.02, 16, 100), ringMat3);

    ring1.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 4;
    ring3.rotation.x = -Math.PI / 6;

    masterGroup.add(ring1);
    masterGroup.add(ring2);
    masterGroup.add(ring3);

    // 4. Data Nodes on Rings
    const nodeGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const nodes: THREE.Mesh[] = [];

    for (let i = 0; i < 6; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      masterGroup.add(node);
      nodes.push(node);
    }

    // 5. Constellation Floating Particles
    const particleCount = isMobile ? 350 : 750;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 22;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;
      particleScales[i] = Math.random() * 0.8 + 0.2;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute("scale", new THREE.BufferAttribute(particleScales, 1));

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: isMobile ? 0.04 : 0.05,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ==========================================
    // 🖱️ MOUSE & SCROLL STATE INTERPOLATION
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

    // Scroll Storytelling Logic
    let scrollY = 0;
    let maxScroll = 1;

    const handleScroll = () => {
      scrollY = window.scrollY || document.documentElement.scrollTop;
      maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // Resize Handler
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // ==========================================
    // 🎬 RENDER & ANIMATION LOOP (60 FPS)
    // ==========================================
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const scrollRatio = Math.min(1, Math.max(0, scrollY / maxScroll));

      // Mouse Smooth Lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      cursorLight.position.x = mouseX * 5;
      cursorLight.position.y = -mouseY * 4;

      if (!prefersReducedMotion) {
        // Continuous Celestial Spin
        innerCore.rotation.x = elapsedTime * 0.25;
        innerCore.rotation.y = elapsedTime * 0.35;

        coreSphere.rotation.y = -elapsedTime * 0.15;

        ring1.rotation.z = elapsedTime * 0.4;
        ring2.rotation.x = -elapsedTime * 0.3;
        ring3.rotation.y = elapsedTime * 0.35;

        // Position nodes along ring 1
        nodes.forEach((node, idx) => {
          const angle = elapsedTime * 0.5 + (idx * Math.PI) / 3;
          node.position.x = Math.cos(angle) * 2.1;
          node.position.y = Math.sin(angle) * 2.1 * Math.cos(Math.PI / 3);
          node.position.z = Math.sin(angle) * 2.1 * Math.sin(Math.PI / 3);
        });

        // Floating particles slow drift
        particles.rotation.y = elapsedTime * 0.03;
        particles.rotation.x = -elapsedTime * 0.015;
      }

      // ==========================================
      // 📜 SCROLL-DRIVEN 3D CAMERA & CORE TRANSFORMS
      // ==========================================
      // 0.0 -> Hero: Center floating core
      // 0.2 -> Product Intro: Moves slightly right & zooms in
      // 0.4 -> Features: Moves left, orbital rings expand
      // 0.6 -> Pipeline: Sweeps diagonally upward
      // 0.8 -> Benefits / Testimonials: Pulls back into celestial wide angle
      // 1.0 -> Final CTA: Centered glowing matrix

      const targetX =
        scrollRatio < 0.2
          ? mouseX * 0.5
          : scrollRatio < 0.5
          ? 1.6 + mouseX * 0.3
          : scrollRatio < 0.75
          ? -1.6 + mouseX * 0.3
          : mouseX * 0.4;

      const targetY =
        scrollRatio < 0.2
          ? 0.2 - mouseY * 0.4
          : scrollRatio < 0.5
          ? -0.2 - mouseY * 0.3
          : scrollRatio < 0.75
          ? 0.4 - mouseY * 0.3
          : -0.1 - mouseY * 0.3;

      const targetZ =
        scrollRatio < 0.2
          ? 0
          : scrollRatio < 0.5
          ? 1.2
          : scrollRatio < 0.75
          ? 0.5
          : -1.0;

      masterGroup.position.x += (targetX - masterGroup.position.x) * 0.06;
      masterGroup.position.y += (targetY - masterGroup.position.y) * 0.06;
      masterGroup.position.z += (targetZ - masterGroup.position.z) * 0.06;

      // Subtle tilt towards mouse
      masterGroup.rotation.y = mouseX * 0.4 + (scrollRatio * Math.PI * 1.5);
      masterGroup.rotation.x = -mouseY * 0.3;

      // Expand orbital rings on feature stage
      const ringScale = 1 + Math.sin(scrollRatio * Math.PI) * 0.25;
      ring1.scale.set(ringScale, ringScale, ringScale);
      ring2.scale.set(ringScale, ringScale, ringScale);
      ring3.scale.set(ringScale, ringScale, ringScale);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      coreSphereGeo.dispose();
      coreSphereMat.dispose();
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
