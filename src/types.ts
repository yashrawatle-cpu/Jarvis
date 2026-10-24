/**
 * J.A.R.V.I.S. Neural Core & Laptop Operator - Types
 */

export type HologramReaction =
  | 'idle'
  | 'listening'
  | 'analyzing'
  | 'accelerating'
  | 'pulse'
  | 'pulse_sequence'
  | 'repulsor_burst'
  | 'quantum_spin'
  | 'stealth_blue'
  | 'alert';

export type ActiveApp =
  | 'hud'
  | 'terminal'
  | 'knowledge'
  | 'diagnostics'
  | 'camera_vision'
  | 'music'
  | 'files'
  | 'commands';

export type WakeWordState = 'standby' | 'listening_wake' | 'awake_listening_command';

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export type RecognizedGesture =
  | 'NONE'
  | 'OPEN_PALM'
  | 'CLOSED_FIST'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'POINT_UP'
  | 'PINCH_ZOOM'
  | 'PEACE_SIGN';

export interface LaptopAction {
  action: string;
  value?: string;
  feedback: string;
}

export interface JarvisResponse {
  reply: string;
  hologramReaction: HologramReaction;
  laptopActions: LaptopAction[];
  knowledgeTitle?: string;
  knowledgeSummary?: string;
  keyDataPoints?: string[];
  error?: string;
}

export interface SystemTelemetry {
  batteryLevel: number | null;
  isCharging: boolean | null;
  isFullscreen: boolean;
  isMuted: boolean;
  volume: number;
  online: boolean;
  activeApp: ActiveApp;
  wakeLockActive: boolean;
  cpuLoad: number;
  memoryUsage: number;
  pingMs: number;
  stealthMode: boolean;
}

export interface TerminalEntry {
  id: string;
  type: 'user' | 'jarvis' | 'system' | 'error' | 'success';
  text: string;
  timestamp: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  keyPoints: string[];
  equation?: string;
  classification: string;
}

export interface FingerPointerState {
  active: boolean;
  x: number; // Viewport X (pixels)
  y: number; // Viewport Y (pixels)
  rawNormX: number; // 0..1 from webcam
  rawNormY: number; // 0..1 from webcam
  targetName: string | null;
  targetTag: string | null;
  isPinching: boolean;
  isClicking: boolean;
  dwellProgress: number; // 0 to 1
  confidence: number;
  fps: number;
  handDetected: boolean;
  trackingMode: 'webcam' | 'simulation';
  showScannerPiP: boolean;
  sensitivity: number; // 1.0 to 3.0
  smoothing: number; // 0.1 to 0.95
  dwellClickEnabled: boolean;
}

