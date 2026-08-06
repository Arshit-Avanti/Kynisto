"use client";

import { useEffect, useRef, useState } from "react";

/**
 * GeometricMesh3D — Interconnected triangular wireframe mesh background
 * that subtly pulses and reacts to scroll position.
 * Rendered on a full-viewport canvas behind all content.
 */
export function GeometricMesh3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Detect low power
    const isLowPower =
      window.innerWidth < 768 ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Grid of nodes
    const cols = isLowPower ? 8 : 14;
    const rows = isLowPower ? 6 : 10;

    interface Node {
      baseX: number;
      baseY: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      phase: number;
      amplitude: number;
    }

    let nodes: Node[] = [];

    function createNodes() {
      nodes = [];
      const spacingX = width / (cols - 1);
      const spacingY = height / (rows - 1);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Offset every other row for triangular mesh
          const offsetX = row % 2 === 0 ? 0 : spacingX * 0.5;
          nodes.push({
            baseX: col * spacingX + offsetX,
            baseY: row * spacingY,
            x: col * spacingX + offsetX,
            y: row * spacingY,
            vx: 0,
            vy: 0,
            phase: Math.random() * Math.PI * 2,
            amplitude: 8 + Math.random() * 12,
          });
        }
      }
    }

    createNodes();

    // Build triangle connections
    function getTriangleEdges(): [number, number][] {
      const edges: [number, number][] = [];
      const edgeSet = new Set<string>();

      const addEdge = (a: number, b: number) => {
        if (a >= 0 && a < nodes.length && b >= 0 && b < nodes.length) {
          const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edges.push([a, b]);
          }
        }
      };

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          // Right neighbor
          if (col < cols - 1) addEdge(idx, idx + 1);
          // Below neighbor
          if (row < rows - 1) addEdge(idx, idx + cols);
          // Diagonal connections for triangles
          if (row < rows - 1) {
            if (row % 2 === 0) {
              // Even rows: diagonal to bottom-right
              if (col < cols - 1) addEdge(idx, idx + cols + 1);
            } else {
              // Odd rows: diagonal to bottom-left
              if (col > 0) addEdge(idx, idx + cols - 1);
            }
          }
        }
      }

      return edges;
    }

    const edges = getTriangleEdges();

    // Scroll listener
    const handleScroll = () => {
      scrollRef.current = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Mouse listener
    const handleMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / width;
      mouseRef.current.y = e.clientY / height;
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });

    // Resize
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      createNodes();
    };
    window.addEventListener("resize", handleResize, { passive: true });

    let animId = 0;
    let isVisible = true;
    let time = 0;

    const animate = () => {
      if (!isVisible) {
        animId = 0;
        return;
      }
      animId = requestAnimationFrame(animate);
      time += 0.008;

      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const scroll = scrollRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update node positions with float + scroll + mouse influence
      nodes.forEach((node) => {
        const floatX = Math.sin(time * 0.7 + node.phase) * node.amplitude;
        const floatY = Math.cos(time * 0.5 + node.phase * 1.3) * node.amplitude * 0.8;

        // Scroll influence — shift nodes vertically
        const scrollShift = scroll * 40 * (node.baseY / height);

        // Mouse proximity repulsion (subtle)
        const dx = mx * width - node.baseX;
        const dy = my * height - node.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repulse = Math.max(0, 1 - dist / 250);
        const repulseX = repulse * -dx * 0.06;
        const repulseY = repulse * -dy * 0.06;

        node.x = node.baseX + floatX + repulseX;
        node.y = node.baseY + floatY + scrollShift + repulseY;
      });

      // Pulse intensity based on scroll & time
      const pulseAlpha = 0.06 + Math.sin(time * 1.2) * 0.02 + scroll * 0.04;

      // Draw edges
      edges.forEach(([a, b]) => {
        const na = nodes[a];
        const nb = nodes[b];
        const edgeDist = Math.sqrt(
          (na.x - nb.x) ** 2 + (na.y - nb.y) ** 2
        );

        // Fade far edges
        const maxDist = Math.max(width / (cols - 1), height / (rows - 1)) * 1.8;
        const edgeAlpha = Math.max(0, 1 - edgeDist / maxDist) * pulseAlpha;

        if (edgeAlpha < 0.005) return;

        // Color: emerald accent with scroll-shift to gold
        const r = Math.round(34 + scroll * 200);
        const g = Math.round(197 - scroll * 100);
        const bColor = Math.round(94 - scroll * 80);

        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${bColor}, ${edgeAlpha.toFixed(3)})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      });

      // Draw node dots
      nodes.forEach((node) => {
        const dotAlpha = pulseAlpha * 2.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 197, 94, ${dotAlpha.toFixed(3)})`;
        ctx.fill();
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !animId) {
            animate();
          }
        });
      },
      { threshold: 0.01 }
    );
    observer.observe(canvas);

    animate();

    return () => {
      observer.disconnect();
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.6,
      }}
    />
  );
}
