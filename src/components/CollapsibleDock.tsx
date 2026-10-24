import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Sliders,
  Terminal,
  Activity,
  Database,
  Camera,
  Folder,
  Volume2,
  VolumeX,
  Zap,
  Sparkles,
  Shield,
  Layers,
  Mic,
  Share2,
  Hand,
} from 'lucide-react';
import { ActiveApp, HologramReaction } from '../types';
import { jarvisAudio } from './AudioSynthesizer';

interface CollapsibleDockProps {
  activeApp: ActiveApp;
  onSelectApp: (app: ActiveApp) => void;
  explodedSeparation: number;
  onChangeExploded: (val: number) => void;
  onTriggerReaction: (reaction: HologramReaction) => void;
  isAmbientPlaying: boolean;
  onToggleAmbient: () => void;
  isProjectionActive: boolean;
  onToggleProjection: () => void;
  isFingerPointerActive?: boolean;
  onToggleFingerPointer?: () => void;
}

export const CollapsibleDock: React.FC<CollapsibleDockProps> = ({
  activeApp,
  onSelectApp,
  explodedSeparation,
  onChangeExploded,
  onTriggerReaction,
  isAmbientPlaying,
  onToggleAmbient,
  isProjectionActive,
  onToggleProjection,
  isFingerPointerActive = false,
  onToggleFingerPointer,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Keyboard shortcuts: 'H' for dock collapse, 'P' for 3D projection, 'F' for finger pointer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        setIsCollapsed((prev) => !prev);
        jarvisAudio.playHudBeep(1200, 0.05);
      } else if (e.key === 'p' || e.key === 'P') {
        onToggleProjection();
        jarvisAudio.playHudBeep(isProjectionActive ? 1000 : 1600, 0.05);
      } else if ((e.key === 'f' || e.key === 'F') && onToggleFingerPointer) {
        onToggleFingerPointer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProjectionActive, onToggleProjection, onToggleFingerPointer]);

  const navItems: { id: ActiveApp; label: string; icon: React.ReactNode }[] = [
    { id: 'hud', label: '3D Core HUD', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'commands', label: 'Voice Commands', icon: <Mic className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'diagnostics', label: 'Laptop OS', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'terminal', label: 'Terminal', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'camera_vision', label: 'Hand Vision', icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'knowledge', label: 'Knowledge', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'files', label: 'Schematics', icon: <Folder className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-40 transition-transform duration-300 ease-out select-none flex flex-col items-center ${
        isCollapsed ? 'translate-y-[calc(100%-32px)]' : 'translate-y-0'
      }`}
      style={{
        bottom: '16px',
        width: 'min(960px, 94vw)',
      }}
    >
      {/* Collapse / Expand Toggle Tab */}
      <button
        onClick={() => {
          setIsCollapsed(!isCollapsed);
          jarvisAudio.playHudBeep(isCollapsed ? 1400 : 900, 0.05);
        }}
        className="px-4 py-1 rounded-t-lg bg-slate-900 border-t border-x border-cyan-800/80 text-cyan-300 hover:text-cyan-100 text-[11px] font-mono flex items-center gap-1.5 shadow-md transition-colors"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>SHOW STARK CONTROLS [H]</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>HIDE HUD DOCK [H]</span>
          </>
        )}
      </button>

      {/* Main Unified Solid/RGBA Dock */}
      <div className="w-full bg-slate-950 border border-cyan-700/80 rounded-xl p-2.5 stark-glow-cyan shadow-2xl flex flex-col gap-2">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeApp === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectApp(item.id);
                    jarvisAudio.playHudBeep(1200, 0.04);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all shrink-0 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold border border-cyan-300 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/80 hover:bg-cyan-950/80 text-cyan-300 border border-cyan-900/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Actions: 3D Projection Mode & Ambient Audio Toggle */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-cyan-900/60">
            {/* Finger Pointer Toggle */}
            {onToggleFingerPointer && (
              <button
                onClick={() => {
                  onToggleFingerPointer();
                  jarvisAudio.playHudBeep(isFingerPointerActive ? 1000 : 1600, 0.05);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                  isFingerPointerActive
                    ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-400 font-bold shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-cyan-300 border border-cyan-900/60'
                }`}
                title="Toggle Stark Holographic Finger Mouse Pointer [F]"
              >
                <Hand className={`w-3.5 h-3.5 ${isFingerPointerActive ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">FINGER POINTER:</span>
                <span>{isFingerPointerActive ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {/* Projection Mode Toggle */}
            <button
              onClick={() => {
                onToggleProjection();
                jarvisAudio.playHudBeep(isProjectionActive ? 1000 : 1600, 0.05);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                isProjectionActive
                  ? 'bg-amber-950/90 text-amber-300 border border-amber-500 font-bold shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-cyan-300 border border-cyan-900/60'
              }`}
              title="Toggle 3D Holographic Process Constellation Projection [P]"
            >
              <Share2 className={`w-3.5 h-3.5 ${isProjectionActive ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">PROJECTION:</span>
              <span>{isProjectionActive ? 'ACTIVE' : 'OFF'}</span>
            </button>

            {/* Ambient Audio Toggle */}
            <button
              onClick={() => {
                onToggleAmbient();
                jarvisAudio.playHudBeep(1000, 0.04);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                isAmbientPlaying
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-cyan-300 border border-cyan-900/60'
              }`}
              title="Toggle procedural Stark lab reactor hum"
            >
              {isAmbientPlaying ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">ARC HUM: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ARC HUM: OFF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3D Core Reactive Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-cyan-900/60 text-xs font-mono">
          {/* Exploded View Slider */}
          <div className="flex items-center gap-2 text-cyan-300 min-w-48">
            <span className="text-[10px] text-slate-400">EXPLODED CORE:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explodedSeparation}
              onChange={(e) => onChangeExploded(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-bold text-cyan-400 w-8 text-right">
              {Math.round(explodedSeparation * 100)}%
            </span>
          </div>

          {/* Hologram Reaction Presets */}
          <div className="flex items-center gap-1 text-[11px]">
            {/* 3D Process Constellation Projection Button */}
            <button
              onClick={() => {
                onToggleProjection();
                jarvisAudio.playHudBeep(isProjectionActive ? 1000 : 1600, 0.05);
              }}
              className={`px-2 py-0.5 rounded border text-[11px] font-bold flex items-center gap-1 transition-all ${
                isProjectionActive
                  ? 'bg-amber-950 text-amber-300 border-amber-400 shadow-sm shadow-amber-400/30'
                  : 'bg-slate-900 hover:bg-amber-950/60 text-amber-400/80 border-amber-800/60'
              }`}
              title="Cast 3D Process Constellation Nodes [P]"
            >
              <Share2 className="w-3 h-3" />
              <span>3D Nodes {isProjectionActive ? '[ON]' : '[OFF]'}</span>
            </button>
            <button
              onClick={() => onTriggerReaction('pulse_sequence')}
              className="px-2 py-0.5 rounded bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500 text-cyan-200 font-bold flex items-center gap-1 shadow-sm"
              title="Synchronize breathing pulse sequence with ambient hum beat"
            >
              <span>Breathing Pulse</span>
            </button>
            <button
              onClick={() => onTriggerReaction('pulse')}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-cyan-950 border border-cyan-900/60 text-cyan-300"
            >
              Pulse
            </button>
            <button
              onClick={() => onTriggerReaction('accelerating')}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-cyan-950 border border-cyan-900/60 text-cyan-300"
            >
              Accelerate
            </button>
            <button
              onClick={() => onTriggerReaction('repulsor_burst')}
              className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900/80 border border-amber-600 text-amber-300 font-bold"
            >
              Repulsor
            </button>
            <button
              onClick={() => onTriggerReaction('quantum_spin')}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-cyan-950 border border-cyan-900/60 text-cyan-300"
            >
              Quantum
            </button>
            <button
              onClick={() => onTriggerReaction('stealth_blue')}
              className="px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-600 text-indigo-300"
            >
              Stealth
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
