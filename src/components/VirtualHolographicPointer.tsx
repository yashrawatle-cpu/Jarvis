import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Hand,
  Crosshair,
  Maximize2,
  Minimize2,
  X,
  Zap,
  Play,
  Navigation,
  MousePointer,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Target,
  Compass,
} from 'lucide-react';
import { FingerPointerState } from '../types';
import { jarvisAudio } from './AudioSynthesizer';

interface VirtualHolographicPointerProps {
  isActive: boolean;
  onToggleActive: () => void;
  onPointerStateChange?: (state: Partial<FingerPointerState>) => void;
}

interface Particle {
  x: number;
  y: number;
  opacity: number;
  id: number;
}

type InputMode = 'HYBRID' | 'FINGER_ONLY' | 'MOUSE_CO_PILOT';
type ControlDriver = 'FINGERTIP' | 'MOUSE' | 'AUTONOMOUS_SWEEP' | 'NUDGE';

export const VirtualHolographicPointer: React.FC<VirtualHolographicPointerProps> = ({
  isActive,
  onToggleActive,
  onPointerStateChange,
}) => {
  // Video & optical processing refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const opticalAnimRef = useRef<number>(0);
  const renderAnimRef = useRef<number>(0);
  const sweepAnimRef = useRef<number | null>(null);

  // Position & smoothing refs
  const posRef = useRef<{ x: number; y: number }>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  const targetPosRef = useRef<{ x: number; y: number }>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  const pinchCooldownRef = useRef<number>(0);
  const dwellTimerRef = useRef<{ x: number; y: number; startTime: number } | null>(null);
  const lastTargetElemRef = useRef<Element | null>(null);
  const isPinchingRef = useRef<boolean>(false);
  const isSweepingRef = useRef<boolean>(false);
  const handDetectedRef = useRef<boolean>(false);

  // Configuration state
  const [sensitivity, setSensitivity] = useState<number>(1.8);
  const [smoothing, setSmoothing] = useState<number>(0.65);
  const [dwellClickEnabled, setDwellClickEnabled] = useState<boolean>(true);
  const [isPiPMinimized, setIsPiPMinimized] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<InputMode>('HYBRID');
  const [controlDriver, setControlDriver] = useState<ControlDriver>('MOUSE');

  // Dynamic visual state
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  const [targetInfo, setTargetInfo] = useState<{ name: string; isInteractive: boolean }>({
    name: 'VIEWPORT CENTER',
    isInteractive: false,
  });
  const [isPinching, setIsPinching] = useState<boolean>(false);
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [dwellProgress, setDwellProgress] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [handDetected, setHandDetected] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [clickShockwaves, setClickShockwaves] = useState<{ x: number; y: number; id: number }[]>([]);

  // 1. Synthetic DOM Click & Repulsor Shockwave
  const triggerSyntheticClick = useCallback(
    (clientX: number, clientY: number, source = 'PINCH') => {
      const now = performance.now();
      if (now - pinchCooldownRef.current < 400) return; // Debounce rapid multi-click
      pinchCooldownRef.current = now;

      setIsClicking(true);
      jarvisAudio.playLaserClick();

      // Spawn shockwave ring
      const shockId = Date.now();
      setClickShockwaves((prev) => [...prev, { x: clientX, y: clientY, id: shockId }]);
      setTimeout(() => {
        setClickShockwaves((prev) => prev.filter((s) => s.id !== shockId));
      }, 700);

      // Element detection under cursor
      const targetElem = document.elementFromPoint(clientX, clientY);

      if (targetElem) {
        // Dispatch synthetic Pointer & Mouse events
        const pointerDown = new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
          button: 0,
        });
        const pointerUp = new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
          button: 0,
        });
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
          button: 0,
        });

        targetElem.dispatchEvent(pointerDown);
        targetElem.dispatchEvent(pointerUp);
        targetElem.dispatchEvent(clickEvent);

        const actionable = targetElem.closest('button, a, input, select, [role="button"]') as HTMLElement | null;
        if (actionable && typeof actionable.click === 'function') {
          actionable.focus?.();
          actionable.click();
        }
      }

      setTimeout(() => {
        setIsClicking(false);
      }, 240);
    },
    []
  );

  // 2. Autonomous Trajectory Sweep Engine ("Move the Pointer")
  const triggerTrajectorySweep = useCallback(() => {
    if (isSweepingRef.current) return;
    isSweepingRef.current = true;
    setIsSweeping(true);
    setControlDriver('AUTONOMOUS_SWEEP');
    jarvisAudio.playPointerEngage();

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Tactical waypoints across Mark 85 HUD
    const waypoints = [
      { x: w * 0.5, y: h * 0.46, label: 'ARC REACTOR CORE' },
      { x: w * 0.22, y: h * 0.22, label: 'TELEMETRY MATRIX' },
      { x: w * 0.78, y: h * 0.22, label: 'SYSTEM DIAGNOSTICS' },
      { x: w * 0.82, y: h * 0.74, label: 'COMMAND TERMINAL' },
      { x: w * 0.5, y: h * 0.82, label: 'VOCAL COMM MATRIX' },
      { x: w * 0.5, y: h * 0.5, label: 'VIEWPORT STABILIZED' },
    ];

    let currentWaypointIdx = 0;
    const waypointDuration = 650; // ms per waypoint segment
    let segmentStartTime = performance.now();
    let startX = posRef.current.x;
    let startY = posRef.current.y;

    const animateSweep = (now: number) => {
      const elapsed = now - segmentStartTime;
      const progress = Math.min(1, elapsed / waypointDuration);

      // Smooth Ease-in-out cubic curve
      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const targetWP = waypoints[currentWaypointIdx];
      const nextX = startX + (targetWP.x - startX) * ease;
      const nextY = startY + (targetWP.y - startY) * ease;

      targetPosRef.current = { x: nextX, y: nextY };

      if (progress >= 1) {
        // Waypoint reached: Play targeting beep
        jarvisAudio.playTargetHover();
        currentWaypointIdx++;

        if (currentWaypointIdx < waypoints.length) {
          startX = targetWP.x;
          startY = targetWP.y;
          segmentStartTime = now;
          sweepAnimRef.current = requestAnimationFrame(animateSweep);
        } else {
          // Sweep completed!
          isSweepingRef.current = false;
          setIsSweeping(false);
          setControlDriver(handDetectedRef.current ? 'FINGERTIP' : 'MOUSE');
          jarvisAudio.playHudBeep(1800, 0.08);
          sweepAnimRef.current = null;
        }
      } else {
        sweepAnimRef.current = requestAnimationFrame(animateSweep);
      }
    };

    sweepAnimRef.current = requestAnimationFrame(animateSweep);
  }, []);

  // 3. Move Pointer to Specific Screen Target Node
  const moveToTarget = useCallback((targetX: number, targetY: number, targetLabel: string) => {
    targetPosRef.current = { x: targetX, y: targetY };
    setControlDriver('NUDGE');
    jarvisAudio.playTargetHover();
    setTargetInfo({ name: targetLabel, isInteractive: true });
  }, []);

  // 4. Directional Nudge Pad
  const nudgePointer = useCallback((dx: number, dy: number) => {
    if (isSweepingRef.current) return;
    const newX = Math.max(20, Math.min(window.innerWidth - 20, targetPosRef.current.x + dx));
    const newY = Math.max(20, Math.min(window.innerHeight - 20, targetPosRef.current.y + dy));
    targetPosRef.current = { x: newX, y: newY };
    setControlDriver('NUDGE');
    jarvisAudio.playTargetHover();
  }, []);

  // 5. Start / Stop Camera Feed
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not accessible');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      jarvisAudio.playPointerEngage();
    } catch (err: any) {
      console.warn('Pointer webcam access warning:', err);
      setCameraError(err.message || 'Camera permission denied or camera offline');
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    handDetectedRef.current = false;
    setHandDetected(false);
  }, []);

  // 6. Manage Active State Lifecycle
  useEffect(() => {
    if (isActive) {
      startCamera();
      jarvisAudio.playPointerEngage();
    } else {
      stopCamera();
      if (sweepAnimRef.current) {
        cancelAnimationFrame(sweepAnimRef.current);
        sweepAnimRef.current = null;
      }
      isSweepingRef.current = false;
      setIsSweeping(false);
    }
    return () => {
      stopCamera();
      if (sweepAnimRef.current) {
        cancelAnimationFrame(sweepAnimRef.current);
      }
    };
  }, [isActive, startCamera, stopCamera]);

  // 7. Mouse and Keyboard Event Handlers (Dual Input / Fallback)
  useEffect(() => {
    if (!isActive) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      // If autonomous sweep is active, allow sweep to complete
      if (isSweepingRef.current) return;

      // In HYBRID or MOUSE_CO_PILOT mode, mouse directly steers pointer
      if (inputMode === 'MOUSE_CO_PILOT' || inputMode === 'HYBRID') {
        // If hand is detected in HYBRID, hand takes priority, otherwise mouse guides
        if (!handDetectedRef.current || inputMode === 'MOUSE_CO_PILOT') {
          targetPosRef.current = { x: e.clientX, y: e.clientY };
          setControlDriver('MOUSE');
        }
      }
    };

    const handleWindowMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        // Left click trigger click shockwave & feedback
        jarvisAudio.playLaserClick();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        triggerSyntheticClick(posRef.current.x, posRef.current.y, 'MANUAL_SPACEBAR');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudgePointer(0, -60);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudgePointer(0, 60);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudgePointer(-60, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudgePointer(60, 0);
      } else if (e.key.toLowerCase() === 'm') {
        // 'M' triggers trajectory sweep demo
        e.preventDefault();
        triggerTrajectorySweep();
      }
    };

    // Listen to J.A.R.V.I.S. external command dispatched from voice or terminal
    const handleJarvisMovePointer = (e: any) => {
      const mode = e.detail?.target || e.detail?.path || 'sweep';
      if (mode === 'core') {
        moveToTarget(window.innerWidth * 0.5, window.innerHeight * 0.46, 'ARC REACTOR CORE');
      } else if (mode === 'diagnostics') {
        moveToTarget(window.innerWidth * 0.78, window.innerHeight * 0.22, 'SYSTEM DIAGNOSTICS');
      } else if (mode === 'terminal') {
        moveToTarget(window.innerWidth * 0.82, window.innerHeight * 0.74, 'COMMAND TERMINAL');
      } else if (mode === 'dock') {
        moveToTarget(window.innerWidth * 0.5, window.innerHeight * 0.92, 'COLLAPSIBLE DOCK');
      } else {
        triggerTrajectorySweep();
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mousedown', handleWindowMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('jarvis:move_pointer' as any, handleJarvisMovePointer);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mousedown', handleWindowMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('jarvis:move_pointer' as any, handleJarvisMovePointer);
    };
  }, [isActive, inputMode, triggerSyntheticClick, triggerTrajectorySweep, moveToTarget, nudgePointer]);

  // 8. Optical Frame Processing Loop (Webcam Fingertip Detection)
  useEffect(() => {
    if (!isActive) return;

    let frameCount = 0;
    let fpsTimer = performance.now();

    const processOpticalFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState < 2) {
        opticalAnimRef.current = requestAnimationFrame(processOpticalFrame);
        return;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        opticalAnimRef.current = requestAnimationFrame(processOpticalFrame);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Draw mirrored video for natural user feedback
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -w, 0, w, h);
      ctx.restore();

      const frameData = ctx.getImageData(0, 0, w, h);
      const data = frameData.data;

      let skinPixels = 0;
      let sumX = 0;
      let sumY = 0;
      let minX = w;
      let maxX = 0;
      let minY = h;
      let maxY = 0;
      let tipX = 0;
      let tipY = h;

      // Step-3 downsampling for high-speed frame rate
      for (let y = 0; y < h; y += 3) {
        for (let x = 0; x < w; x += 3) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const total = r + g + b;
          if (total > 80) {
            const rn = r / total;
            const gn = g / total;
            // Chromaticity skin detection
            const isSkin =
              rn > 0.35 &&
              rn < 0.56 &&
              gn > 0.25 &&
              gn < 0.39 &&
              r > g &&
              g > b &&
              r - g > 12;

            if (isSkin) {
              skinPixels++;
              sumX += x;
              sumY += y;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;

              // Topmost skin point in camera coordinates
              if (y < tipY) {
                tipY = y;
                tipX = x;
              }
            }
          }
        }
      }

      // FPS tracking
      const now = performance.now();
      frameCount++;
      if (now - fpsTimer >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        fpsTimer = now;
      }

      // Stark Optical Grid Lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      if (skinPixels > 120 && inputMode !== 'MOUSE_CO_PILOT') {
        handDetectedRef.current = true;
        setHandDetected(true);
        if (!isSweepingRef.current) {
          setControlDriver('FINGERTIP');
        }

        const centroidX = sumX / skinPixels;
        const centroidY = sumY / skinPixels;
        const boxW = Math.max(maxX - minX, 30);
        const boxH = Math.max(maxY - minY, 30);

        // Average skin pixels near minimum Y boundary for steady fingertip tracking
        let tipSumX = 0;
        let tipCount = 0;
        const tipThresholdY = minY + Math.min(22, boxH * 0.2);

        for (let y = minY; y <= tipThresholdY; y += 3) {
          for (let x = minX; x <= maxX; x += 3) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const total = r + g + b;
            if (total > 80) {
              const rn = r / total;
              const gn = g / total;
              if (rn > 0.35 && rn < 0.56 && gn > 0.25 && gn < 0.39) {
                tipSumX += x;
                tipCount++;
              }
            }
          }
        }

        const refinedTipX = tipCount > 0 ? tipSumX / tipCount : tipX;
        const refinedTipY = minY;

        // Optical pinch detection
        const isCurrentPinching = boxH < 75 && boxW < 80 && skinPixels > 160;

        if (isCurrentPinching && !isPinchingRef.current) {
          isPinchingRef.current = true;
          setIsPinching(true);
          triggerSyntheticClick(posRef.current.x, posRef.current.y, 'PINCH_OPTICAL');
        } else if (!isCurrentPinching) {
          isPinchingRef.current = false;
          setIsPinching(false);
        }

        // Draw Stark Hand Reticle on preview
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(minX - 4, minY - 4, boxW + 8, boxH + 8);

        // Vector from centroid to fingertip
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centroidX, centroidY);
        ctx.lineTo(refinedTipX, refinedTipY);
        ctx.stroke();

        // Fingertip Reticle Lock
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(refinedTipX, refinedTipY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(refinedTipX, refinedTipY, 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`INDEX TIP: [${Math.round(refinedTipX)}, ${Math.round(refinedTipY)}]`, 8, 16);

        // Map normalized fingertip coordinates to screen dimensions
        if (!isSweepingRef.current) {
          const marginX = w * 0.14;
          const marginY = h * 0.14;
          const normX = Math.max(0, Math.min(1, (refinedTipX - marginX) / (w - 2 * marginX)));
          const normY = Math.max(0, Math.min(1, (refinedTipY - marginY) / (h - 2 * marginY)));

          const screenW = window.innerWidth;
          const screenH = window.innerHeight;
          const centeredNormX = (normX - 0.5) * sensitivity + 0.5;
          const centeredNormY = (normY - 0.5) * sensitivity + 0.5;

          const targetScreenX = Math.max(0, Math.min(screenW, centeredNormX * screenW));
          const targetScreenY = Math.max(0, Math.min(screenH, centeredNormY * screenH));

          targetPosRef.current = { x: targetScreenX, y: targetScreenY };
        }
      } else {
        handDetectedRef.current = false;
        setHandDetected(false);
      }

      opticalAnimRef.current = requestAnimationFrame(processOpticalFrame);
    };

    opticalAnimRef.current = requestAnimationFrame(processOpticalFrame);

    return () => {
      cancelAnimationFrame(opticalAnimRef.current);
    };
  }, [isActive, inputMode, sensitivity, triggerSyntheticClick]);

  // 9. Independent 60 FPS Pointer Smoothing & Render Loop
  // (Runs continuously whenever isActive, regardless of camera status)
  useEffect(() => {
    if (!isActive) return;

    let particleCounter = 0;

    const renderLoop = () => {
      const now = performance.now();
      const currentPos = posRef.current;
      const targetPos = targetPosRef.current;
      const alpha = 1 - smoothing; // Responsiveness coefficient

      currentPos.x += (targetPos.x - currentPos.x) * alpha;
      currentPos.y += (targetPos.y - currentPos.y) * alpha;

      setCursorPos({ x: currentPos.x, y: currentPos.y });

      // Add laser motion particles
      particleCounter++;
      if (particleCounter % 2 === 0) {
        setParticles((prev) => [
          ...prev.slice(-14),
          { x: currentPos.x, y: currentPos.y, opacity: 1, id: Date.now() + Math.random() },
        ]);
      }

      // Hit-testing hovered DOM element for HUD label & Dwell Click
      const elem = document.elementFromPoint(currentPos.x, currentPos.y);
      if (elem) {
        const actionable = elem.closest('button, a, input, select, [role="button"]') as HTMLElement | null;
        let label = 'VIEWPORT';
        let interactive = false;

        if (actionable) {
          interactive = true;
          label =
            actionable.getAttribute('title') ||
            actionable.getAttribute('aria-label') ||
            actionable.innerText?.trim().slice(0, 24) ||
            actionable.tagName.toUpperCase();
        } else if (elem.id) {
          label = `#${elem.id.slice(0, 20)}`;
        }

        setTargetInfo({ name: label, isInteractive: interactive });

        // Dwell Click Logic
        if (dwellClickEnabled && interactive && !isSweepingRef.current) {
          if (!dwellTimerRef.current) {
            dwellTimerRef.current = { x: currentPos.x, y: currentPos.y, startTime: now };
          } else {
            const dist = Math.hypot(currentPos.x - dwellTimerRef.current.x, currentPos.y - dwellTimerRef.current.y);
            if (dist < 20) {
              const elapsed = now - dwellTimerRef.current.startTime;
              const progress = Math.min(1, elapsed / 600); // 600ms dwell threshold
              setDwellProgress(progress);

              if (progress >= 1) {
                triggerSyntheticClick(currentPos.x, currentPos.y, 'DWELL');
                dwellTimerRef.current = null;
                setDwellProgress(0);
              }
            } else {
              dwellTimerRef.current = { x: currentPos.x, y: currentPos.y, startTime: now };
              setDwellProgress(0);
            }
          }
        } else {
          dwellTimerRef.current = null;
          setDwellProgress(0);
        }

        // Play subtle hover tick when entering actionable control
        if (actionable && actionable !== lastTargetElemRef.current) {
          jarvisAudio.playTargetHover();
        }
        lastTargetElemRef.current = actionable;
      }

      renderAnimRef.current = requestAnimationFrame(renderLoop);
    };

    renderAnimRef.current = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(renderAnimRef.current);
    };
  }, [isActive, smoothing, dwellClickEnabled, triggerSyntheticClick]);

  if (!isActive) return null;

  return (
    <>
      {/* 1. Full Screen Holographic Laser Pointer Reticle Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Laser Motion Trail */}
        {particles.map((p, idx) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none transition-opacity duration-300"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${Math.max(2, (idx + 1) * 0.85)}px`,
              height: `${Math.max(2, (idx + 1) * 0.85)}px`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: isPinching || isSweeping ? '#f59e0b' : '#00f0ff',
              boxShadow: `0 0 8px ${isPinching || isSweeping ? '#f59e0b' : '#00f0ff'}`,
              opacity: (idx / particles.length) * 0.75,
            }}
          />
        ))}

        {/* Click Repulsor Shockwaves */}
        {clickShockwaves.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full border-2 border-amber-400 pointer-events-none animate-ping"
            style={{
              left: `${s.x}px`,
              top: `${s.y}px`,
              width: '64px',
              height: '64px',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 25px rgba(245, 158, 11, 0.9), inset 0 0 15px rgba(245, 158, 11, 0.5)',
            }}
          />
        ))}

        {/* Main Holographic Reticle at Cursor Pos */}
        <div
          className="absolute pointer-events-none flex items-center justify-center transition-transform duration-75"
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Outer Rotating Targeting Ring */}
          <div
            className={`w-12 h-12 rounded-full border border-dashed transition-all duration-200 animate-spin ${
              isClicking
                ? 'border-amber-400 w-16 h-16 shadow-lg shadow-amber-500/50'
                : isSweeping
                ? 'border-amber-400 w-14 h-14'
                : targetInfo.isInteractive
                ? 'border-cyan-300 w-14 h-14'
                : 'border-cyan-500/60'
            }`}
            style={{ animationDuration: isSweeping ? '3s' : '8s' }}
          />

          {/* Inner Counter-Rotating Bracket Ring */}
          <div
            className={`absolute w-8 h-8 rounded-full border border-dotted transition-all duration-150 animate-spin ${
              isPinching || isSweeping ? 'border-amber-400' : 'border-cyan-400'
            }`}
            style={{ animationDuration: '4s', animationDirection: 'reverse' }}
          />

          {/* Dwell Progress Circular Ring */}
          {dwellProgress > 0 && (
            <svg
              className="absolute w-14 h-14 -rotate-90 pointer-events-none"
              viewBox="0 0 56 56"
            >
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="150.8"
                strokeDashoffset={150.8 * (1 - dwellProgress)}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
            </svg>
          )}

          {/* Center Laser Focal Node */}
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-150 shadow-md ${
              isClicking || isPinching || isSweeping
                ? 'bg-amber-400 shadow-amber-400 scale-150'
                : targetInfo.isInteractive
                ? 'bg-cyan-300 shadow-cyan-400 scale-125'
                : 'bg-cyan-400 shadow-cyan-500'
            }`}
          />

          {/* Stark Holographic Readout Tag */}
          <div
            className="absolute left-7 top-2 bg-slate-950/90 border border-cyan-500/80 rounded px-2 py-0.5 pointer-events-none shadow-xl stark-glow-cyan text-[10px] font-mono whitespace-nowrap flex items-center gap-1.5"
            style={{ transform: 'translateY(-50%)' }}
          >
            <Crosshair className={`w-3 h-3 ${isPinching || isSweeping ? 'text-amber-400' : 'text-cyan-400'}`} />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-cyan-400 font-bold">
                  [X:{Math.round(cursorPos.x)}, Y:{Math.round(cursorPos.y)}]
                </span>
                {isSweeping ? (
                  <span className="text-amber-400 font-semibold px-1 py-0.2 rounded bg-amber-950/60 border border-amber-500/40 animate-pulse">
                    SWEEPING
                  </span>
                ) : targetInfo.isInteractive ? (
                  <span className="text-amber-400 font-semibold px-1 py-0.2 rounded bg-amber-950/60 border border-amber-500/40">
                    LOCK
                  </span>
                ) : null}
              </div>
              <div className="text-[9px] text-slate-300">
                {targetInfo.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Floating Holographic Optical PiP Controller */}
      <div
        className={`fixed z-50 select-none transition-all duration-300 pointer-events-auto ${
          isPiPMinimized
            ? 'bottom-20 right-4 w-56'
            : 'bottom-20 right-4 w-72 sm:w-84'
        }`}
      >
        <div className="bg-slate-950/95 border border-cyan-500 rounded-xl p-3 stark-glow-cyan shadow-2xl backdrop-blur-md text-cyan-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-cyan-900/60 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-cyan-950 border border-cyan-800">
                <Hand className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="font-display font-bold text-xs text-cyan-100 uppercase tracking-wider flex items-center gap-1.5">
                  FINGER POINTER HUD
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[9px] font-mono text-cyan-400/80 flex items-center gap-1">
                  <span>{controlDriver}:</span>
                  <span className="text-emerald-300">
                    {isSweeping
                      ? 'SWEEPING'
                      : handDetected
                      ? 'OPTICAL LOCK'
                      : 'MOUSE CO-PILOT'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Quick Sweep Button */}
              <button
                onClick={triggerTrajectorySweep}
                className="px-2 py-0.5 rounded bg-cyan-900/70 hover:bg-cyan-800 border border-cyan-600/70 text-cyan-200 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
                title="Execute Autonomous Pointer Sweep across HUD"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>SWEEP</span>
              </button>

              <button
                onClick={() => setIsPiPMinimized(!isPiPMinimized)}
                className="p-1 rounded hover:bg-cyan-950 text-cyan-400 hover:text-cyan-200 transition-colors"
                title={isPiPMinimized ? 'Expand PiP' : 'Minimize PiP'}
              >
                {isPiPMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  onToggleActive();
                  jarvisAudio.playHudBeep(900, 0.08);
                }}
                className="p-1 rounded hover:bg-rose-950 text-rose-400 hover:text-rose-200 transition-colors"
                title="Deactivate Pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Hidden Video element */}
          <video ref={videoRef} playsInline muted className="hidden" width="320" height="240" />

          {/* Expanded Content */}
          {!isPiPMinimized && (
            <>
              {/* Live Canvas Feed with Cyber Reticle */}
              <div className="relative aspect-video w-full bg-slate-900/90 rounded-lg overflow-hidden border border-cyan-900/80 flex items-center justify-center mb-2.5">
                <canvas
                  ref={canvasRef}
                  width="320"
                  height="240"
                  className="w-full h-full object-cover"
                />

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-slate-950/80">
                    <Hand className="w-8 h-8 text-cyan-500 mb-1 opacity-70 animate-bounce" />
                    <p className="text-[11px] font-mono text-cyan-300">
                      {cameraError || 'Activating Optical Camera...'}
                    </p>
                    <p className="text-[9px] font-mono text-slate-400 mt-1">
                      (Physical mouse co-pilot active while camera initializes)
                    </p>
                    <button
                      onClick={startCamera}
                      className="mt-2 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}

                {/* Hand Detection Pill */}
                {cameraActive && (
                  <div className="absolute top-2 left-2 bg-slate-950/80 border border-cyan-500/60 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        handDetected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`}
                    />
                    <span>{handDetected ? 'HAND LOCKED' : 'AIM HAND AT SENSOR'}</span>
                  </div>
                )}

                {/* Gesture Trigger Status Badge */}
                {cameraActive && (
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 border border-amber-500/60 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1.5">
                    <Zap className={`w-3 h-3 ${isPinching ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className={isPinching ? 'text-amber-300 font-bold' : 'text-slate-300'}>
                      {isPinching ? 'PINCH: CLICK' : 'PINCH / DWELL TO CLICK'}
                    </span>
                  </div>
                )}
              </div>

              {/* Mode Selector & Tactical Nudge Pad */}
              <div className="flex flex-col gap-2 text-xs font-mono">
                {/* Input Mode Toggle Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded border border-cyan-900/60 text-[10px]">
                  <button
                    onClick={() => setInputMode('HYBRID')}
                    className={`py-1 rounded text-center transition-colors ${
                      inputMode === 'HYBRID'
                        ? 'bg-cyan-600 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-cyan-200'
                    }`}
                  >
                    HYBRID
                  </button>
                  <button
                    onClick={() => setInputMode('FINGER_ONLY')}
                    className={`py-1 rounded text-center transition-colors ${
                      inputMode === 'FINGER_ONLY'
                        ? 'bg-cyan-600 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-cyan-200'
                    }`}
                  >
                    FINGER
                  </button>
                  <button
                    onClick={() => setInputMode('MOUSE_CO_PILOT')}
                    className={`py-1 rounded text-center transition-colors ${
                      inputMode === 'MOUSE_CO_PILOT'
                        ? 'bg-cyan-600 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-cyan-200'
                    }`}
                  >
                    MOUSE
                  </button>
                </div>

                {/* Quick Target Coordinate Dispatch Buttons */}
                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <span className="text-slate-400">TARGET:</span>
                  <button
                    onClick={() => moveToTarget(window.innerWidth * 0.5, window.innerHeight * 0.46, 'ARC REACTOR CORE')}
                    className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300"
                  >
                    CORE
                  </button>
                  <button
                    onClick={() => moveToTarget(window.innerWidth * 0.78, window.innerHeight * 0.22, 'DIAGNOSTICS')}
                    className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300"
                  >
                    DIAG
                  </button>
                  <button
                    onClick={() => moveToTarget(window.innerWidth * 0.82, window.innerHeight * 0.74, 'TERMINAL')}
                    className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300"
                  >
                    TERM
                  </button>
                  <button
                    onClick={() => moveToTarget(window.innerWidth * 0.5, window.innerHeight * 0.5, 'CENTER')}
                    className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300"
                  >
                    CTR
                  </button>
                </div>

                {/* Directional Nudge Pad & Test Click */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-cyan-900/40">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">NUDGE:</span>
                    <button
                      onClick={() => nudgePointer(-60, 0)}
                      className="p-1 rounded bg-slate-900 hover:bg-cyan-950 border border-cyan-900 text-cyan-300"
                      title="Nudge Left"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => nudgePointer(0, -60)}
                        className="p-0.5 rounded bg-slate-900 hover:bg-cyan-950 border border-cyan-900 text-cyan-300"
                        title="Nudge Up"
                      >
                        <ChevronUp className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => nudgePointer(0, 60)}
                        className="p-0.5 rounded bg-slate-900 hover:bg-cyan-950 border border-cyan-900 text-cyan-300"
                        title="Nudge Down"
                      >
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => nudgePointer(60, 0)}
                      className="p-1 rounded bg-slate-900 hover:bg-cyan-950 border border-cyan-900 text-cyan-300"
                      title="Nudge Right"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => triggerSyntheticClick(cursorPos.x, cursorPos.y, 'TEST_BUTTON')}
                    className="px-2.5 py-1 rounded bg-amber-950 hover:bg-amber-900 border border-amber-600 text-amber-300 text-[10px] font-bold transition-colors"
                  >
                    Click Pulse
                  </button>
                </div>

                {/* Sensitivity Slider */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-cyan-900/40">
                  <span className="text-[10px] text-slate-400">SENSITIVITY:</span>
                  <input
                    type="range"
                    min="1.0"
                    max="2.8"
                    step="0.1"
                    value={sensitivity}
                    onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                    className="flex-1 accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                  <span className="text-cyan-400 font-bold w-7 text-right text-[10px]">{sensitivity}x</span>
                </div>

                {/* Dwell Click Toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-cyan-900/40">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-cyan-300">
                    <input
                      type="checkbox"
                      checked={dwellClickEnabled}
                      onChange={(e) => setDwellClickEnabled(e.target.checked)}
                      className="rounded accent-cyan-400 cursor-pointer"
                    />
                    <span>Dwell-to-Click (Hover 0.6s)</span>
                  </label>
                  <span className="text-[9px] text-slate-400">[SPACE] Click</span>
                </div>
              </div>
            </>
          )}

          {/* Minimized View Bar */}
          {isPiPMinimized && (
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <span className="text-cyan-400 text-[10px]">
                {handDetected ? 'TRACKING [HAND]' : 'CO-PILOT [MOUSE]'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={triggerTrajectorySweep}
                  className="px-2 py-0.5 rounded bg-cyan-900 hover:bg-cyan-800 text-cyan-200 font-bold text-[9px]"
                >
                  SWEEP
                </button>
                <button
                  onClick={() => triggerSyntheticClick(cursorPos.x, cursorPos.y, 'MINI_CLICK')}
                  className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[9px]"
                >
                  CLICK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
