"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * 3D Icon Data structure for positioning and interactive physics
 */
interface IconItem {
  group: THREE.Group;
  baseX: number;
  baseY: number;
  baseZ: number;
  rotSpeedX: number;
  rotSpeedY: number;
  floatSpeed: number;
  floatAmplitude: number;
  phase: number;
  pointLight: THREE.PointLight;
  baseLightIntensity: number;
}

export function HeroCanvas3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect mobile or low-power device
    const isLowPower =
      window.innerWidth < 768 ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05040b, 0.025);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isLowPower,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    backLight.position.set(-6, -4, -4);
    scene.add(backLight);

    // Dynamic responsive spread multiplier
    const getSpreadX = () => (window.innerWidth < 768 ? 1.6 : 3.1);
    const getSpreadY = () => (window.innerWidth < 768 ? 1.2 : 1.7);

    let spreadX = getSpreadX();
    let spreadY = getSpreadY();

    // -------------------------------------------------------------
    // ICON BUILDERS
    // -------------------------------------------------------------

    // 1. Salon Scissors
    function createScissorsMesh(): { group: THREE.Group; light: THREE.PointLight } {
      const group = new THREE.Group();

      const screwGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16);
      const screwMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        metalness: 0.95,
        roughness: 0.1,
        emissive: 0x64748b,
        emissiveIntensity: 0.3,
      });
      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.rotation.x = Math.PI / 2;
      group.add(screw);

      const bladeMat = new THREE.MeshPhysicalMaterial({
        color: 0xf43f5e,
        emissive: 0x881337,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });

      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.6,
      });

      const bladeGroup1 = new THREE.Group();
      const bladeShape1 = new THREE.Shape();
      bladeShape1.moveTo(-0.03, 0);
      bladeShape1.lineTo(0.04, 0.15);
      bladeShape1.lineTo(0.025, 0.95);
      bladeShape1.lineTo(0, 1.05);
      bladeShape1.lineTo(-0.02, 0.95);
      bladeShape1.lineTo(-0.03, 0.15);
      bladeShape1.closePath();

      const extrudeSettings = {
        depth: 0.025,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.01,
        bevelThickness: 0.01,
      };
      const bladeGeo1 = new THREE.ExtrudeGeometry(bladeShape1, extrudeSettings);
      const blade1 = new THREE.Mesh(bladeGeo1, bladeMat);
      blade1.position.z = 0.01;
      bladeGroup1.add(blade1);

      const ringGeo1 = new THREE.TorusGeometry(0.18, 0.035, 16, 32);
      const ring1 = new THREE.Mesh(ringGeo1, handleMat);
      ring1.position.set(-0.02, -0.22, 0.01);
      ring1.rotation.z = Math.PI * 0.15;
      bladeGroup1.add(ring1);

      bladeGroup1.rotation.z = -0.22;
      group.add(bladeGroup1);

      const bladeGroup2 = bladeGroup1.clone();
      bladeGroup2.rotation.z = 0.22;
      bladeGroup2.scale.x = -1;
      group.add(bladeGroup2);

      const light = new THREE.PointLight(0xf43f5e, 4.5, 6);
      group.add(light);

      group.scale.set(0.95, 0.95, 0.95);
      return { group, light };
    }

    // 2. Grocery Basket
    function createGroceryBasketMesh(): { group: THREE.Group; light: THREE.PointLight } {
      const group = new THREE.Group();

      const basketMat = new THREE.MeshPhysicalMaterial({
        color: 0x10b981,
        emissive: 0x064e3b,
        emissiveIntensity: 0.7,
        roughness: 0.15,
        metalness: 0.4,
        transmission: 0.3,
        transparent: true,
        opacity: 0.9,
        clearcoat: 0.8,
      });

      const rimGeo = new THREE.TorusGeometry(0.5, 0.035, 16, 32);
      const rim = new THREE.Mesh(rimGeo, basketMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.25;
      group.add(rim);

      const baseRimGeo = new THREE.TorusGeometry(0.38, 0.03, 16, 32);
      const baseRim = new THREE.Mesh(baseRimGeo, basketMat);
      baseRim.rotation.x = Math.PI / 2;
      baseRim.position.y = -0.25;
      group.add(baseRim);

      const postCount = 8;
      const postGeo = new THREE.CylinderGeometry(0.018, 0.015, 0.5, 12);
      for (let i = 0; i < postCount; i++) {
        const angle = (i / postCount) * Math.PI * 2;
        const rTop = 0.5;
        const rBot = 0.38;
        const xTop = Math.cos(angle) * rTop;
        const zTop = Math.sin(angle) * rTop;
        const xBot = Math.cos(angle) * rBot;
        const zBot = Math.sin(angle) * rBot;

        const post = new THREE.Mesh(postGeo, basketMat);
        post.position.set((xTop + xBot) / 2, 0, (zTop + zBot) / 2);
        post.rotation.z = Math.atan2(xTop - xBot, 0.5);
        post.rotation.x = -Math.atan2(zTop - zBot, 0.5);
        group.add(post);
      }

      const handleGeo = new THREE.TorusGeometry(0.48, 0.03, 16, 32, Math.PI);
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x059669,
        emissiveIntensity: 0.9,
        metalness: 0.7,
        roughness: 0.2,
      });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.set(0, 0.25, 0);
      group.add(handle);

      const produceItems = [
        { color: 0xef4444, emissive: 0x991b1b, pos: [-0.15, -0.1, -0.1], r: 0.14 },
        { color: 0xf97316, emissive: 0x9a3412, pos: [0.15, -0.12, 0.05], r: 0.15 },
        { color: 0xa855f7, emissive: 0x581c87, pos: [0.0, -0.08, 0.14], r: 0.13 },
      ];

      produceItems.forEach((item) => {
        const geo = new THREE.SphereGeometry(item.r, 24, 24);
        const mat = new THREE.MeshStandardMaterial({
          color: item.color,
          emissive: item.emissive,
          emissiveIntensity: 0.8,
          roughness: 0.3,
          metalness: 0.2,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(item.pos[0], item.pos[1], item.pos[2]);
        group.add(mesh);
      });

      const light = new THREE.PointLight(0x10b981, 4.5, 6);
      group.add(light);

      group.scale.set(0.9, 0.9, 0.9);
      return { group, light };
    }

    // 3. Pharmacy Pill
    function createPillMesh(): { group: THREE.Group; light: THREE.PointLight } {
      const group = new THREE.Group();

      const topGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.35, 32);
      const topMat = new THREE.MeshPhysicalMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.7,
        roughness: 0.15,
        metalness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });
      const topCylinder = new THREE.Mesh(topGeo, topMat);
      topCylinder.position.y = 0.175;
      group.add(topCylinder);

      const domeGeo = new THREE.SphereGeometry(0.24, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const topDome = new THREE.Mesh(domeGeo, topMat);
      topDome.position.y = 0.35;
      group.add(topDome);

      const botMat = new THREE.MeshPhysicalMaterial({
        color: 0xf8fafc,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.3,
        clearcoat: 1.0,
      });
      const botCylinder = new THREE.Mesh(topGeo, botMat);
      botCylinder.position.y = -0.175;
      group.add(botCylinder);

      const botDomeGeo = new THREE.SphereGeometry(
        0.24,
        32,
        16,
        0,
        Math.PI * 2,
        Math.PI / 2,
        Math.PI / 2,
      );
      const botDome = new THREE.Mesh(botDomeGeo, botMat);
      botDome.position.y = -0.35;
      group.add(botDome);

      const seamGeo = new THREE.TorusGeometry(0.245, 0.015, 16, 32);
      const seamMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.9,
        metalness: 0.8,
      });
      const seam = new THREE.Mesh(seamGeo, seamMat);
      seam.rotation.x = Math.PI / 2;
      group.add(seam);

      const crossGroup = new THREE.Group();
      const crossMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.9,
        metalness: 0.5,
      });
      const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.07, 0.07), crossMat);
      const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.25, 0.07), crossMat);
      crossGroup.add(bar1);
      crossGroup.add(bar2);
      crossGroup.position.set(0.42, 0.1, 0.1);
      group.add(crossGroup);

      const light = new THREE.PointLight(0x06b6d4, 4.5, 6);
      group.add(light);

      group.rotation.z = Math.PI * 0.25;
      return { group, light };
    }

    // 4. Coffee Cup
    function createCoffeeCupMesh(): { group: THREE.Group; light: THREE.PointLight; steamRings: THREE.Mesh[] } {
      const group = new THREE.Group();

      const cupMat = new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        emissive: 0xb45309,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.4,
        clearcoat: 0.9,
        clearcoatRoughness: 0.1,
      });

      const cupGeo = new THREE.CylinderGeometry(0.38, 0.26, 0.75, 32);
      const cup = new THREE.Mesh(cupGeo, cupMat);
      group.add(cup);

      const rimGeo = new THREE.TorusGeometry(0.385, 0.03, 16, 32);
      const rim = new THREE.Mesh(rimGeo, cupMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.375;
      group.add(rim);

      const handleGeo = new THREE.TorusGeometry(0.24, 0.04, 16, 32, Math.PI * 1.3);
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 0.8,
        metalness: 0.6,
        roughness: 0.2,
      });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.set(-0.35, 0, 0);
      handle.rotation.z = Math.PI * 0.35;
      group.add(handle);

      const liquidGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.02, 32);
      const liquidMat = new THREE.MeshStandardMaterial({
        color: 0x78350f,
        emissive: 0xd97706,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.2,
      });
      const liquid = new THREE.Mesh(liquidGeo, liquidMat);
      liquid.position.y = 0.34;
      group.add(liquid);

      const steamRings: THREE.Mesh[] = [];
      const steamMat = new THREE.MeshBasicMaterial({
        color: 0xfde68a,
        transparent: true,
        opacity: 0.4,
        wireframe: true,
      });

      for (let i = 0; i < 3; i++) {
        const steamRingGeo = new THREE.TorusGeometry(0.12 + i * 0.04, 0.01, 12, 24);
        const steamRing = new THREE.Mesh(steamRingGeo, steamMat);
        steamRing.rotation.x = Math.PI / 2;
        steamRing.position.y = 0.5 + i * 0.2;
        steamRing.scale.set(1 + i * 0.2, 1 + i * 0.2, 1);
        group.add(steamRing);
        steamRings.push(steamRing);
      }

      const light = new THREE.PointLight(0xf59e0b, 4.5, 6);
      group.add(light);

      group.scale.set(0.9, 0.9, 0.9);
      return { group, light, steamRings };
    }

    // -------------------------------------------------------------
    // INSTANTIATE AND POSITION THE 4 STORE ICONS
    // -------------------------------------------------------------
    const iconsData: IconItem[] = [];

    const scissors = createScissorsMesh();
    const basket = createGroceryBasketMesh();
    const pill = createPillMesh();
    const coffee = createCoffeeCupMesh();

    const configs = [
      {
        data: scissors,
        x: -spreadX,
        y: spreadY,
        z: 0.2,
        rotX: 0.3,
        rotY: 0.4,
        fSpeed: 1.2,
        fAmp: 0.15,
        phase: 0,
      },
      {
        data: coffee,
        x: spreadX,
        y: spreadY,
        z: -0.2,
        rotX: 0.2,
        rotY: 0.5,
        fSpeed: 1.0,
        fAmp: 0.18,
        phase: Math.PI * 0.5,
      },
      {
        data: basket,
        x: -spreadX * 1.05,
        y: -spreadY,
        z: -0.1,
        rotX: 0.4,
        rotY: 0.3,
        fSpeed: 1.4,
        fAmp: 0.16,
        phase: Math.PI,
      },
      {
        data: pill,
        x: spreadX * 1.05,
        y: -spreadY,
        z: 0.1,
        rotX: 0.3,
        rotY: 0.45,
        fSpeed: 1.1,
        fAmp: 0.14,
        phase: Math.PI * 1.5,
      },
    ];

    configs.forEach((cfg) => {
      cfg.data.group.position.set(cfg.x, cfg.y, cfg.z);
      scene.add(cfg.data.group);

      iconsData.push({
        group: cfg.data.group,
        baseX: cfg.x,
        baseY: cfg.y,
        baseZ: cfg.z,
        rotSpeedX: cfg.rotX,
        rotSpeedY: cfg.rotY,
        floatSpeed: cfg.fSpeed,
        floatAmplitude: cfg.fAmp,
        phase: cfg.phase,
        pointLight: cfg.data.light,
        baseLightIntensity: 4.5,
      });
    });

    // -------------------------------------------------------------
    // CENTRAL AMBIENT CONNECTIVE RING & PARTICLES
    // -------------------------------------------------------------
    const ringGeometry = new THREE.TorusGeometry(1.6, 0.012, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 3;
    scene.add(ringMesh);

    // Floating particle constellation
    const particleCount = isLowPower ? 40 : 90;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 16;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // EVENT LISTENERS & RESIZE
    // -------------------------------------------------------------
    const handleMouseMove = (event: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseRef.current.targetX = (event.clientX / innerWidth - 0.5) * 2;
      mouseRef.current.targetY = (event.clientY / innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      spreadX = getSpreadX();
      spreadY = getSpreadY();

      // Update base positions
      iconsData[0].baseX = -spreadX;
      iconsData[0].baseY = spreadY;
      iconsData[1].baseX = spreadX;
      iconsData[1].baseY = spreadY;
      iconsData[2].baseX = -spreadX * 1.05;
      iconsData[2].baseY = -spreadY;
      iconsData[3].baseX = spreadX * 1.05;
      iconsData[3].baseY = -spreadY;

      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize, { passive: true });

    // -------------------------------------------------------------
    // ANIMATION LOOP & VIEWPORT OBSERVER
    // -------------------------------------------------------------
    let animationFrameId = 0;
    let isVisible = true;
    const clock = new THREE.Clock();

    const animate = () => {
      if (!isVisible) {
        animationFrameId = 0;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse position interpolation (lerp)
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      // Animate 4 3D store icons
      iconsData.forEach((item) => {
        // Continuous float animation
        const floatOffset = Math.sin(elapsedTime * item.floatSpeed + item.phase) * item.floatAmplitude;
        item.group.position.x = item.baseX + Math.cos(elapsedTime * 0.5 + item.phase) * 0.08;
        item.group.position.y = item.baseY + floatOffset;

        // Continuous rotation + smooth mouse tilt toward cursor
        item.group.rotation.y = elapsedTime * item.rotSpeedY + mouseX * 0.65;
        item.group.rotation.x = Math.sin(elapsedTime * 0.6 + item.phase) * 0.2 + mouseY * 0.5;
        item.group.rotation.z = Math.cos(elapsedTime * 0.4 + item.phase) * 0.15 - mouseX * 0.3;

        // Proximity scale & glow boost calculation
        // Project icon position into normalized screen space roughly
        const projX = item.baseX / 4.0;
        const projY = item.baseY / 2.5;
        const dx = mouseX - projX;
        const dy = -mouseY - projY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Hover scale response
        const targetScale = dist < 0.6 ? 1.18 : 1.0;
        item.group.scale.x += (targetScale - item.group.scale.x) * 0.08;
        item.group.scale.y += (targetScale - item.group.scale.y) * 0.08;
        item.group.scale.z += (targetScale - item.group.scale.z) * 0.08;

        // Glow intensity boost on proximity
        const glowBoost = dist < 0.6 ? 7.5 : item.baseLightIntensity;
        item.pointLight.intensity += (glowBoost - item.pointLight.intensity) * 0.08;
      });

      // Animate coffee steam wafting up
      coffee.steamRings.forEach((ring, idx) => {
        ring.position.y = 0.5 + ((elapsedTime * 0.4 + idx * 0.25) % 0.6);
        ring.rotation.z = elapsedTime * 0.5 + idx;
      });

      // Animate central ring & particle constellation
      ringMesh.rotation.z = -elapsedTime * 0.15;
      ringMesh.rotation.y = elapsedTime * 0.1;

      particleSystem.rotation.y = elapsedTime * 0.02 + mouseX * 0.15;
      particleSystem.rotation.x = mouseY * 0.1;

      // Parallax camera movement
      camera.position.x = mouseX * 0.7;
      camera.position.y = -mouseY * 0.7;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !animationFrameId) {
            animate();
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    animate();

    // -------------------------------------------------------------
    // DISPOSAL & CLEANUP
    // -------------------------------------------------------------
    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      // Traversal cleanup for deep disposal
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((mat) => mat.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });

      particleGeometry.dispose();
      particleMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className="heroCanvas3DWrap"
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.85,
        backgroundColor: "transparent",
      }}
    >
      <div className="heroCanvasOverlayGlow" />
    </div>
  );
}
