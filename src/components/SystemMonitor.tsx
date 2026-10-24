import React, { useState } from 'react';
import {
  Battery,
  BatteryCharging,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Cpu,
  HardDrive,
  Sun,
  Shield,
  Zap,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { SystemTelemetry } from '../types';
import { jarvisAudio } from './AudioSynthesizer';

interface SystemMonitorProps {
  telemetry: SystemTelemetry;
  onUpdateTelemetry: (patch: Partial<SystemTelemetry>) => void;
  onTriggerAction: (actionName: string, val?: any) => void;
  className?: string;
}

export const SystemMonitor: React.FC<SystemMonitorProps> = ({
  telemetry,
  onUpdateTelemetry,
  onTriggerAction,
  className = '',
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      onUpdateTelemetry({ isFullscreen: true });
    } else {
      document.exitFullscreen().catch(() => {});
      onUpdateTelemetry({ isFullscreen: false });
    }
    jarvisAudio.playHudBeep(1200, 0.06);
  };

  const handleWakeLockToggle = async () => {
    if ('wakeLock' in navigator) {
      if (!telemetry.wakeLockActive) {
        try {
          await (navigator as any).wakeLock.request('screen');
          onUpdateTelemetry({ wakeLockActive: true });
          jarvisAudio.playHudBeep(1500, 0.08);
        } catch {
          onUpdateTelemetry({ wakeLockActive: false });
        }
      } else {
        onUpdateTelemetry({ wakeLockActive: false });
        jarvisAudio.playHudBeep(800, 0.08);
      }
    }
  };

  const handleOptimizeSystem = () => {
    setIsOptimizing(true);
    jarvisAudio.playRepulsorCharge(0.6);
    setTimeout(() => {
      onUpdateTelemetry({
        cpuLoad: 18,
        memoryUsage: 34,
      });
      setIsOptimizing(false);
      jarvisAudio.playHudBeep(1800, 0.1);
    }, 1200);
  };

  return (
    <div
      className={`bg-slate-950/90 border border-cyan-800/80 rounded-xl p-4 stark-glow-cyan text-cyan-200 ${className}`}
    >
      {/* Module Title */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-900/60 mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <span className="font-display font-bold text-sm tracking-widest text-cyan-100 uppercase">
            LAPTOP HARDWARE TELEMETRY & OS COMMAND
          </span>
        </div>
        <button
          onClick={handleOptimizeSystem}
          disabled={isOptimizing}
          className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin text-amber-400' : ''}`} />
          <span>{isOptimizing ? 'PURGING RAM...' : 'OPTIMIZE MEMORY'}</span>
        </button>
      </div>

      {/* Grid of hardware meters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Battery Monitor */}
        <div className="bg-slate-900/80 border border-cyan-900/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
            <span>BATTERY</span>
            {telemetry.isCharging ? (
              <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <Battery className="w-4 h-4 text-cyan-400" />
            )}
          </div>
          <div className="text-xl font-bold font-mono text-cyan-100">
            {telemetry.batteryLevel !== null ? `${telemetry.batteryLevel}%` : 'AC POWER'}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${
                (telemetry.batteryLevel ?? 100) < 20
                  ? 'bg-rose-500'
                  : (telemetry.batteryLevel ?? 100) < 50
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${telemetry.batteryLevel ?? 100}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            {telemetry.isCharging ? 'Charging via AC' : 'Battery Discharging'}
          </div>
        </div>

        {/* CPU Load & Arc Reactor Core */}
        <div className="bg-slate-900/80 border border-cyan-900/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
            <span>STARK CPU CORE</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-100">
            {telemetry.cpuLoad}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-500"
              style={{ width: `${telemetry.cpuLoad}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            {navigator.hardwareConcurrency || 8} Threads @ 4.80 GHz
          </div>
        </div>

        {/* System Memory */}
        <div className="bg-slate-900/80 border border-cyan-900/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
            <span>MEMORY (RAM)</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-100">
            {telemetry.memoryUsage}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-500"
              style={{ width: `${telemetry.memoryUsage}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            {(navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB Detected` : '16 GB Standard'}
          </div>
        </div>

        {/* Network & Latency */}
        <div className="bg-slate-900/80 border border-cyan-900/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
            <span>NETWORK</span>
            {telemetry.online ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <div className="text-xl font-bold font-mono text-cyan-100">
            {telemetry.online ? `${telemetry.pingMs} ms` : 'OFFLINE'}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${telemetry.online ? 'bg-emerald-400' : 'bg-rose-500'}`}
              style={{ width: telemetry.online ? '85%' : '0%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            {telemetry.online ? 'Wi-Fi 6E High Bandwidth' : 'Connection Severed'}
          </div>
        </div>
      </div>

      {/* Laptop OS Control Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-cyan-900/60 font-mono text-xs">
        <button
          onClick={handleFullscreenToggle}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-800/80 text-cyan-200 transition-all"
        >
          {telemetry.isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4 text-cyan-400" />}
          <span>{telemetry.isFullscreen ? 'EXIT FULLSCREEN' : 'MAXIMIZE SCREEN'}</span>
        </button>

        <button
          onClick={handleWakeLockToggle}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded border transition-all ${
            telemetry.wakeLockActive
              ? 'bg-amber-950/80 border-amber-600 text-amber-300 font-bold'
              : 'bg-cyan-950/70 hover:bg-cyan-900/70 border-cyan-800/80 text-cyan-200'
          }`}
        >
          <Sun className="w-4 h-4 text-amber-400" />
          <span>{telemetry.wakeLockActive ? 'WAKELOCK ENGAGED' : 'PREVENT SLEEP'}</span>
        </button>

        <button
          onClick={() => {
            const nextMuted = !telemetry.isMuted;
            onUpdateTelemetry({ isMuted: nextMuted });
            jarvisAudio.setSoundEffectsEnabled(!nextMuted);
            jarvisAudio.playHudBeep(nextMuted ? 600 : 1200, 0.08);
          }}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-800/80 text-cyan-200 transition-all"
        >
          {telemetry.isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          <span>{telemetry.isMuted ? 'AUDIO MUTED' : 'AUDIO ACTIVE'}</span>
        </button>

        <button
          onClick={() => {
            const nextStealth = !telemetry.stealthMode;
            onUpdateTelemetry({ stealthMode: nextStealth });
            onTriggerAction('stealth_mode', nextStealth);
            jarvisAudio.playHudBeep(nextStealth ? 500 : 1600, 0.1);
          }}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded border transition-all ${
            telemetry.stealthMode
              ? 'bg-indigo-950/90 border-indigo-500 text-indigo-300 font-bold'
              : 'bg-cyan-950/70 hover:bg-cyan-900/70 border-cyan-800/80 text-cyan-200'
          }`}
        >
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>{telemetry.stealthMode ? 'STEALTH ACTIVE' : 'ENGAGE STEALTH'}</span>
        </button>
      </div>
    </div>
  );
};
