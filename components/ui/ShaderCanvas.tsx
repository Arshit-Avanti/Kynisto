"use client";

import React, { useEffect, useRef } from "react";

export function ShaderCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Zero-lag rendering: use WebGL
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) {
      return;
    }

    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_isDark;

      // Smooth noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187,
                            0.366025403784439,
                           -0.577350269189626,
                            0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
              + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        uv.y = 1.0 - uv.y;
        
        // Dynamic fluid blob waves
        float t = u_time * 0.15;
        float n1 = snoise(uv * 1.5 + vec2(t, t));
        float n2 = snoise(uv * 2.0 - vec2(t * 1.2, t * 0.8));
        float n3 = snoise(uv * 1.0 + vec2(sin(t), cos(t)));
        
        float blob = (n1 + n2 + n3) / 3.0;
        
        // Soft ambient lighting colors
        vec3 colorDark1 = vec3(1.0, 0.34, 0.13); // rgba(255, 87, 34)
        vec3 colorDark2 = vec3(0.39, 0.4, 0.95); // rgba(99, 102, 241)
        vec3 colorDark3 = vec3(0.93, 0.28, 0.6); // rgba(236, 72, 153)
        
        vec3 colorLight1 = vec3(1.0, 0.34, 0.13);
        vec3 colorLight2 = vec3(0.23, 0.51, 0.96); // rgba(59, 130, 246)
        vec3 colorLight3 = vec3(0.06, 0.73, 0.51); // rgba(16, 185, 129)
        
        vec3 color1 = mix(colorLight1, colorDark1, u_isDark);
        vec3 color2 = mix(colorLight2, colorDark2, u_isDark);
        vec3 color3 = mix(colorLight3, colorDark3, u_isDark);
        
        vec3 finalColor = mix(mix(color1, color2, uv.x + blob), color3, uv.y - blob);
        
        // Dynamic soft ambient transparency based on fluid blob waves without solid background blocking
        float blobIntensity = smoothstep(-0.4, 0.6, blob);
        float alpha = mix(0.02, 0.14, blobIntensity);
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const isDarkLocation = gl.getUniformLocation(program, "u_isDark");

    let animationFrameId: number | null = null;
    const startTime = performance.now();
    let lastFrameTime = 0;
    const isMobileDevice = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const targetFps = isMobileDevice ? 20 : 30;
    const targetInterval = 1000 / targetFps;

    let isIntersecting = true;
    let isTabVisible = typeof document !== "undefined" ? !document.hidden : true;

    const stopLoop = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const render = (now: number) => {
      if (!isIntersecting || !isTabVisible || (typeof document !== "undefined" && document.hidden)) {
        stopLoop();
        return;
      }

      animationFrameId = requestAnimationFrame(render);

      // Frame throttling: target 30 FPS on Desktop, 20 FPS on Mobile
      if (now - lastFrameTime < targetInterval) return;
      lastFrameTime = now;

      const time = (now - startTime) * 0.001;
      gl.uniform1f(timeLocation, time);
      
      const isDark = document.documentElement.classList.contains("mode-dark") || document.documentElement.classList.contains("dark-theme");
      gl.uniform1f(isDarkLocation, isDark ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const startLoop = () => {
      if (animationFrameId === null && isIntersecting && isTabVisible && (typeof document === "undefined" || !document.hidden)) {
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const handleResize = () => {
      // Downscale canvas resolution to dramatically reduce GPU fill rate load (Zero-Lag)
      const maxDim = isMobileDevice ? 720 : 1280;
      let width = window.innerWidth;
      let height = window.innerHeight;

      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(resolutionLocation, width, height);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // IntersectionObserver to pause rendering when canvas is off-screen
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isIntersecting = entry ? entry.isIntersecting : true;
          if (isIntersecting) {
            startLoop();
          } else {
            stopLoop();
          }
        },
        { threshold: 0.01 }
      );
      observer.observe(canvas);
    }

    // Tab visibility change handler
    const handleVisibilityChange = () => {
      isTabVisible = typeof document !== "undefined" ? !document.hidden : true;
      if (isTabVisible) {
        startLoop();
      } else {
        stopLoop();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    startLoop();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (observer) {
        observer.disconnect();
      }
      stopLoop();
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
