import React, { useState, useEffect } from 'react';
import { Battery, BatteryCharging, Wifi, Clock, Zap, Radio, Mic, Hand, Download } from 'lucide-react';
import { RecognizedGesture, SystemTelemetry, WakeWordState, SupportedLanguage } from '../types';

interface HUDHeaderProps {
  telemetry: SystemTelemetry;
  activeGesture: RecognizedGesture;
  isProcessing: boolean;
  wakeState?: WakeWordState;
  wakeCountdown?: number;
  onOpenVoiceCommands?: () => void;
  language?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  isFingerPointerActive?: boolean;
  onToggleFingerPointer?: () => void;
  onOpenDownloadModal?: () => void;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  telemetry,
  activeGesture,
  isProcessing,
  wakeState = 'standby',
  wakeCountdown = 0,
  onOpenVoiceCommands,
  language = 'en',
  onLanguageChange,
  isFingerPointerActive = false,
  onToggleFingerPointer,
  onOpenDownloadModal,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isAwaitingCommand = wakeState === 'awake_listening_command';
  const isListenerActive = wakeState === 'listening_wake' || isAwaitingCommand;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none p-3 select-none flex items-start justify-between">
      {/* Top Left: Stark J.A.R.V.I.S. Spec Badge */}
      <div
        className={`pointer-events-auto bg-slate-950/85 border rounded-lg px-3 py-1.5 flex items-center gap-2.5 transition-all duration-300 ${
          isAwaitingCommand
            ? 'border-amber-400 stark-glow-gold'
            : 'border-cyan-800/80 stark-glow-cyan'
        }`}
      >
        {/* Core Reactor Indicator Bead: Turns from Cyan to Gold when awaiting command */}
        <div
          className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
            isAwaitingCommand
              ? 'bg-amber-400 shadow-md shadow-amber-400/80 animate-pulse'
              : 'bg-cyan-400'
          }`}
        />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-sm text-cyan-100 tracking-wider">
              J.A.R.V.I.S.
            </span>
            <span
              className={`text-[10px] font-mono border px-1 rounded transition-colors duration-300 ${
                isAwaitingCommand
                  ? 'border-amber-400/80 text-amber-300 bg-amber-950/40'
                  : 'border-cyan-800/80 text-cyan-400/80'
              }`}
            >
              MK-85
            </span>
          </div>
          <div
            className={`text-[10px] font-mono transition-colors duration-300 ${
              isAwaitingCommand
                ? 'text-amber-400 font-semibold'
                : isProcessing
                ? 'text-cyan-300'
                : 'text-slate-400'
            }`}
          >
            {isAwaitingCommand
              ? `WAKE DETECTED // AWAITING COMMAND [${wakeCountdown}s]`
              : isProcessing
              ? 'CALCULATING QUANTUM VECTORS...'
              : 'ALL SYSTEMS NOMINAL'}
          </div>
        </div>
      </div>

      {/* Top Center: Prominent Visual Indicator that shifts from CYAN to GOLD */}
      <div className="pointer-events-auto flex items-center gap-2">
        {activeGesture !== 'NONE' ? (
          <div className="bg-slate-950/90 border border-amber-500/80 rounded-lg px-3 py-1.5 stark-glow-gold flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-300">
              GESTURE: {activeGesture}
            </span>
          </div>
        ) : (
          <div
            className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-2 transition-all duration-300 shadow-lg ${
              isAwaitingCommand
                ? 'bg-slate-950/95 border-amber-400 stark-glow-gold text-amber-300'
                : isListenerActive
                ? 'bg-slate-950/85 border-cyan-500/80 stark-glow-cyan text-cyan-200'
                : 'bg-slate-950/70 border-cyan-900/60 text-slate-400'
            }`}
          >
            {/* Pulsing beacon bead: Cyan when listening for wake word, Gold when waiting for command */}
            <div
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                isAwaitingCommand
                  ? 'bg-amber-400 shadow-sm shadow-amber-300 animate-ping'
                  : isListenerActive
                  ? 'bg-cyan-400 shadow-sm shadow-cyan-300'
                  : 'bg-slate-600'
              }`}
            />

            {isAwaitingCommand ? (
              <div className="flex items-center gap-1.5 font-bold">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>"JARVIS" ACTIVE // AWAITING COMMAND [{wakeCountdown}s]</span>
              </div>
            ) : isListenerActive ? (
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  WAKE LISTENER: <strong className="text-cyan-100">"JARVIS"</strong> READY
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400">
                <Mic className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>WAKE LISTENER: STANDBY</span>
              </div>
            )}
          </div>
        )}

        {onOpenVoiceCommands && (
          <button
            onClick={onOpenVoiceCommands}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-700/80 hover:border-cyan-400 text-cyan-200 text-xs font-mono font-bold transition-all shadow-md"
            title="Open Voice Command Directory"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            <span>COMMANDS</span>
          </button>
        )}

        {onToggleFingerPointer && (
          <button
            onClick={onToggleFingerPointer}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md ${
              isFingerPointerActive
                ? 'bg-cyan-950 border border-cyan-400 text-cyan-200 stark-glow-cyan'
                : 'bg-slate-950/80 hover:bg-cyan-950/80 border border-cyan-800/80 text-cyan-400/80 hover:text-cyan-200'
            }`}
            title="Toggle Holographic Finger Mouse Pointer [F]"
          >
            <Hand className={`w-3.5 h-3.5 ${isFingerPointerActive ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
            <span>FINGER MOUSE: {isFingerPointerActive ? 'ON' : 'OFF'}</span>
          </button>
        )}

        {/* Top Language Switcher */}
        {onLanguageChange && (
          <div className="hidden lg:flex items-center rounded-lg bg-slate-950/90 border border-cyan-800/80 p-0.5 text-[11px] font-mono">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-0.5 rounded transition-colors ${
                language === 'en'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-2 py-0.5 rounded transition-colors ${
                language === 'hi'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="हिंदी (Hindi)"
            >
              हिंदी
            </button>
            <button
              onClick={() => onLanguageChange('mr')}
              className={`px-2 py-0.5 rounded transition-colors ${
                language === 'mr'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="मराठी (Marathi)"
            >
              मराठी
            </button>
          </div>
        )}
      </div>

      {/* Top Right: System Indicators & Clock */}
      <div className="pointer-events-auto bg-slate-950/85 border border-cyan-800/80 rounded-lg px-3 py-1.5 stark-glow-cyan flex items-center gap-4 text-xs font-mono text-cyan-300">
        {/* Battery */}
        <div className="flex items-center gap-1.5">
          {telemetry.isCharging ? (
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          ) : (
            <Battery className="w-4 h-4 text-cyan-400" />
          )}
          <span>{telemetry.batteryLevel !== null ? `${telemetry.batteryLevel}%` : 'AC'}</span>
        </div>

        {/* Network */}
        <div className="flex items-center gap-1.5">
          <Wifi className="w-4 h-4 text-cyan-400" />
          <span>{telemetry.online ? `${telemetry.pingMs}ms` : 'OFFLINE'}</span>
        </div>

        {/* Download Laptop Data / App Modal Trigger */}
        {onOpenDownloadModal && (
          <button
            onClick={onOpenDownloadModal}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-600/70 text-cyan-200 text-xs font-mono font-bold transition-all shadow-sm shadow-cyan-500/20"
            title="Download Laptop System Dossier & Standalone Desktop App"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">DOWNLOAD LAPTOP</span>
          </button>
        )}

        {/* Clock */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-cyan-900/60 text-cyan-100 font-bold">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentTime}</span>
        </div>
      </div>
    </header>
  );
};
