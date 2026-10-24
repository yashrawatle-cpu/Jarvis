import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Hand, Eye, Zap, RefreshCw, Activity, CheckCircle, ShieldAlert } from 'lucide-react';
import { RecognizedGesture } from '../types';
import { jarvisAudio } from './AudioSynthesizer';

interface HandGestureVisionProps {
  onGestureDetected: (gesture: RecognizedGesture, description: string) => void;
  activeGesture: RecognizedGesture;
  className?: string;
  isFingerPointerActive?: boolean;
  onLaunchFingerPointer?: () => void;
}

export const HandGestureVision: React.FC<HandGestureVisionProps> = ({
  onGestureDetected,
  activeGesture,
  className = '',
  isFingerPointerActive = false,
  onLaunchFingerPointer,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);
  const [lastActionTime, setLastActionTime] = useState<number>(0);
  const [trackingMode, setTrackingMode] = useState<'camera' | 'simulation'>('camera');

  // Tracking motion history for swipes
  const prevCentroidRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const gestureCooldownRef = useRef<number>(0);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API unavailable in this browser context.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 480 },
          height: { ideal: 360 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      jarvisAudio.playHudBeep(1400, 0.1);
    } catch (err: any) {
      console.warn('Camera access warning:', err);
      setCameraError(err.message || 'Camera permission denied or camera unavailable.');
      setIsCameraActive(false);
      setTrackingMode('simulation');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Trigger gesture action helper with debounce cooldown
  const triggerGesture = useCallback(
    (gesture: RecognizedGesture, description: string, score: number) => {
      const now = performance.now();
      if (now - gestureCooldownRef.current < 900) return; // 900ms cooldown
      gestureCooldownRef.current = now;

      setConfidence(Math.round(score));
      setLastActionTime(Date.now());
      jarvisAudio.playGestureDetectedSound();
      onGestureDetected(gesture, description);
    },
    [onGestureDetected]
  );

  // Optical Processing Loop
  useEffect(() => {
    if (!isCameraActive) return;

    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Draw mirrored video frame
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -w, 0, w, h);
      ctx.restore();

      // Sample image data for skin & hand motion optical segmentation
      const frameData = ctx.getImageData(0, 0, w, h);
      const data = frameData.data;

      let skinPixels = 0;
      let sumX = 0;
      let sumY = 0;
      let minX = w;
      let maxX = 0;
      let minY = h;
      let maxY = 0;

      // Fast downsampled scan (step 4)
      for (let y = 0; y < h; y += 4) {
        for (let x = 0; x < w; x += 4) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Normalized RGB skin tone detector
          const total = r + g + b;
          if (total > 80) {
            const rn = r / total;
            const gn = g / total;
            const isSkin =
              rn > 0.36 &&
              rn < 0.55 &&
              gn > 0.26 &&
              gn < 0.38 &&
              r > g &&
              g > b &&
              r - g > 15;

            if (isSkin) {
              skinPixels++;
              sumX += x;
              sumY += y;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
      }

      const now = performance.now();
      frameCount++;
      if (now - fpsTimer >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        fpsTimer = now;
      }

      // Stark Cyber HUD overlay styling
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      // Grid lines
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      if (skinPixels > 180) {
        const centroidX = sumX / skinPixels;
        const centroidY = sumY / skinPixels;
        const boxW = Math.max(maxX - minX, 40);
        const boxH = Math.max(maxY - minY, 40);
        const area = boxW * boxH;
        const density = skinPixels / (area / 16);

        // Draw Stark Hand Tracking Reticle
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(minX - 8, minY - 8, boxW + 16, boxH + 16);

        // Corner brackets
        const bLen = 14;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(minX - 8, minY - 8 + bLen);
        ctx.lineTo(minX - 8, minY - 8);
        ctx.lineTo(minX - 8 + bLen, minY - 8);
        // Bottom-right
        ctx.moveTo(maxX + 8 - bLen, maxY + 8);
        ctx.lineTo(maxX + 8, maxY + 8);
        ctx.lineTo(maxX + 8, maxY + 8 - bLen);
        ctx.stroke();

        // Centroid tracking node
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(centroidX, centroidY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Motion analysis for swipes
        if (prevCentroidRef.current) {
          const dx = centroidX - prevCentroidRef.current.x;
          const dt = now - prevCentroidRef.current.time;
          const speedX = (dx / dt) * 1000;

          if (speedX > 450) {
            triggerGesture('SWIPE_RIGHT', 'Swipe Right: Next Workspace', 94);
          } else if (speedX < -450) {
            triggerGesture('SWIPE_LEFT', 'Swipe Left: Prev Workspace', 94);
          }
        }
        prevCentroidRef.current = { x: centroidX, y: centroidY, time: now };

        // Posture / Gesture Recognition
        const aspect = boxH / boxW;

        if (density > 0.45 && boxW < 120 && boxH < 120) {
          // Compact dense hand -> Closed Fist
          triggerGesture('CLOSED_FIST', 'Closed Fist: Lock Core & Repulsor Charge', 96);
        } else if (boxW > 110 && density < 0.35 && aspect > 0.8 && aspect < 1.4) {
          // Wide open palm with separated spread
          triggerGesture('OPEN_PALM', 'Open Palm: Expand Core & Pause HUD', 93);
        } else if (aspect > 1.6 && boxW < 75) {
          // Tall single finger pointing up
          triggerGesture('POINT_UP', 'Point Up: Toggle Fullscreen', 89);
        } else if (boxW > 70 && boxW < 130 && aspect > 1.3) {
          // Two fingers upright (Peace sign)
          triggerGesture('PEACE_SIGN', 'Peace Sign: Launch Knowledge Codex', 91);
        }

        // HUD Text Tag
        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText(
          `LOCK: [${Math.round(centroidX)}, ${Math.round(centroidY)}] D:${density.toFixed(2)}`,
          minX,
          minY - 14
        );
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isCameraActive, triggerGesture]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className={`flex flex-col bg-slate-950/90 border border-cyan-800/80 rounded-xl p-4 stark-glow-cyan text-cyan-200 ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-900/60 mb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          <span className="font-display font-bold text-sm tracking-widest text-cyan-100 uppercase">
            STARK OPTICAL HAND TRACKER
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onLaunchFingerPointer && (
            <button
              onClick={onLaunchFingerPointer}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors flex items-center gap-1.5 ${
                isFingerPointerActive
                  ? 'bg-amber-950 text-amber-300 border border-amber-500 shadow-md shadow-amber-500/20'
                  : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80'
              }`}
              title="Engage live holographic finger laser mouse pointer"
            >
              <Hand className="w-3.5 h-3.5 text-cyan-400" />
              <span>FINGER MOUSE: {isFingerPointerActive ? 'ON' : 'OFF'}</span>
            </button>
          )}
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
            {isCameraActive ? `${fps} FPS` : 'STANDBY'}
          </span>
          <button
            onClick={isCameraActive ? stopCamera : startCamera}
            className={`px-3 py-1 text-xs font-mono font-semibold rounded transition-colors flex items-center gap-1.5 ${
              isCameraActive
                ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/60'
                : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border border-cyan-400 font-bold'
            }`}
          >
            {isCameraActive ? (
              <>
                <CameraOff className="w-3.5 h-3.5" /> Stop Feed
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" /> Start Webcam
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Video / Canvas Display */}
      <div className="relative aspect-video w-full bg-slate-900/90 rounded-lg overflow-hidden border border-cyan-900/80 flex items-center justify-center">
        {/* Hidden video element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="hidden"
          width="480"
          height="360"
        />

        {/* Processed canvas with Stark HUD */}
        <canvas
          ref={canvasRef}
          width="480"
          height="360"
          className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : 'block'}`}
        />

        {/* Offline / Placeholder state */}
        {!isCameraActive && (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
            <Hand className="w-12 h-12 text-cyan-600 mb-2 opacity-60" />
            <p className="text-xs font-mono text-cyan-300/80 mb-3">
              Webcam vision enables gesture control of laptop workspace, 3D Arc Reactor expansion, and repulsor charging.
            </p>
            {cameraError && (
              <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-800/60 mb-3 text-left">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
            <button
              onClick={startCamera}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs uppercase tracking-wider rounded transition-all shadow-md shadow-cyan-500/20"
            >
              Initialize Optical Sensor
            </button>
          </div>
        )}

        {/* Live Active Gesture Overlay */}
        {isCameraActive && activeGesture !== 'NONE' && (
          <div className="absolute top-3 left-3 bg-slate-950/85 border border-cyan-400 px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-cyan-400 font-bold">{activeGesture}</span>
              <span className="text-slate-400 ml-2">({confidence}%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Interactive Gesture Simulator / Trigger Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400/80 mb-2">
          <span>GESTURE TACTICAL CONTROLS (CLICK OR USE HAND IN CAMERA):</span>
          <span>HOTKEYS [1-6]</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => triggerGesture('OPEN_PALM', 'Open Palm: Expand Core & Pause HUD', 98)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 hover:border-cyan-400 text-xs font-mono text-cyan-200 transition-all text-left"
          >
            <span className="font-bold text-cyan-400">[1]</span>
            <div>
              <div className="font-semibold">Open Palm</div>
              <div className="text-[10px] text-cyan-400/70">Expand Core</div>
            </div>
          </button>

          <button
            onClick={() => triggerGesture('CLOSED_FIST', 'Closed Fist: Repulsor Charge', 99)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 hover:border-cyan-400 text-xs font-mono text-cyan-200 transition-all text-left"
          >
            <span className="font-bold text-amber-400">[2]</span>
            <div>
              <div className="font-semibold">Closed Fist</div>
              <div className="text-[10px] text-amber-400/70">Repulsor Beam</div>
            </div>
          </button>

          <button
            onClick={() => triggerGesture('SWIPE_RIGHT', 'Swipe Right: Next Workspace', 95)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 hover:border-cyan-400 text-xs font-mono text-cyan-200 transition-all text-left"
          >
            <span className="font-bold text-cyan-400">[3]</span>
            <div>
              <div className="font-semibold">Swipe Right</div>
              <div className="text-[10px] text-cyan-400/70">Next App</div>
            </div>
          </button>

          <button
            onClick={() => triggerGesture('SWIPE_LEFT', 'Swipe Left: Prev Workspace', 95)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 hover:border-cyan-400 text-xs font-mono text-cyan-200 transition-all text-left"
          >
            <span className="font-bold text-cyan-400">[4]</span>
            <div>
              <div className="font-semibold">Swipe Left</div>
              <div className="text-[10px] text-cyan-400/70">Prev App</div>
            </div>
          </button>

          <button
            onClick={() => triggerGesture('POINT_UP', 'Point Up: Toggle Fullscreen', 92)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 hover:border-cyan-400 text-xs font-mono text-cyan-200 transition-all text-left"
          >
            <span className="font-bold text-cyan-400">[5]</span>
            <div>
              <div className="font-semibold">Point Up</div>
              <div className="text-[10px] text-cyan-400/70">Fullscreen</div>
            </div>
          </button>

          <button
            onClick={() => triggerGesture('PEACE_SIGN', 'Peace Sign: Launch Knowledge', 96)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 hover:border-cyan-400 text-xs font-mono text-cyan-200 transition-all text-left"
          >
            <span className="font-bold text-cyan-400">[6]</span>
            <div>
              <div className="font-semibold">Peace Sign</div>
              <div className="text-[10px] text-cyan-400/70">Knowledge</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
