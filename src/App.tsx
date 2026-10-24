import React, { useState, useEffect, useCallback } from 'react';
import { ThreeCanvas } from './components/ThreeCanvas';
import { HUDHeader } from './components/HUDHeader';
import { VoiceController } from './components/VoiceController';
import { CollapsibleDock } from './components/CollapsibleDock';
import { SystemMonitor } from './components/SystemMonitor';
import { TerminalConsole } from './components/TerminalConsole';
import { HandGestureVision } from './components/HandGestureVision';
import { KnowledgeCodex } from './components/KnowledgeCodex';
import { FilesExplorer } from './components/FilesExplorer';
import { VoiceCommandsMatrix } from './components/VoiceCommandsMatrix';
import { VirtualHolographicPointer } from './components/VirtualHolographicPointer';
import { LaptopDownloadModal } from './components/LaptopDownloadModal';
import { jarvisAudio } from './components/AudioSynthesizer';
import {
  ActiveApp,
  HologramReaction,
  RecognizedGesture,
  SystemTelemetry,
  TerminalEntry,
  KnowledgeArticle,
  JarvisResponse,
  WakeWordState,
  SupportedLanguage,
} from './types';
import { X, Sparkles, MessageSquare, Shield, Zap } from 'lucide-react';

export default function App() {
  // Telemetry state
  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    batteryLevel: null,
    isCharging: null,
    isFullscreen: false,
    isMuted: false,
    volume: 100,
    online: navigator.onLine,
    activeApp: 'hud',
    wakeLockActive: false,
    cpuLoad: 24,
    memoryUsage: 42,
    pingMs: 18,
    stealthMode: false,
  });

  // 3D Scene Reactive State
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [hologramReaction, setHologramReaction] = useState<HologramReaction>('idle');
  const [explodedSeparation, setExplodedSeparation] = useState<number>(0);
  const [activeGesture, setActiveGesture] = useState<RecognizedGesture>('NONE');
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);
  const [wakeState, setWakeState] = useState<WakeWordState>('standby');
  const [wakeCountdown, setWakeCountdown] = useState<number>(0);
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isProjectionMode, setIsProjectionMode] = useState<boolean>(false);
  const [isFingerPointerActive, setIsFingerPointerActive] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // Jarvis Processing & Terminal State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastReplyText, setLastReplyText] = useState<string | null>(
    'Greetings, Sir. J.A.R.V.I.S. neural core online. All laptop sub-systems and optical gesture controls are fully operational.'
  );
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([
    {
      id: 'init-1',
      type: 'system',
      text: 'J.A.R.V.I.S. QUANTUM KERNEL v85.4 INITIALIZED\nARC REACTOR MARK-85: ONLINE (3.2 GJ/s)\nALL LAPTOP PERIPHERALS BOUND TO STARK OS',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'init-2',
      type: 'jarvis',
      text: 'Good day, Sir. I am listening for your voice commands, or you may utilize the optical gesture tracker for workspace navigation.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [activeKnowledgeArticle, setActiveKnowledgeArticle] = useState<KnowledgeArticle | null>(null);

  // 1. Hook into Laptop Battery Telemetry
  useEffect(() => {
    let batteryObj: any = null;

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryObj = battery;
        const updateBattery = () => {
          setTelemetry((prev) => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            isCharging: battery.charging,
          }));
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }

    // Network status listener
    const handleOnline = () => setTelemetry((prev) => ({ ...prev, online: true }));
    const handleOffline = () => setTelemetry((prev) => ({ ...prev, online: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodically simulate subtle CPU fluctuation
    const cpuInterval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        cpuLoad: Math.min(95, Math.max(12, prev.cpuLoad + (Math.floor(Math.random() * 9) - 4))),
        pingMs: Math.max(12, Math.min(48, prev.pingMs + (Math.floor(Math.random() * 5) - 2))),
      }));
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(cpuInterval);
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', () => {});
        batteryObj.removeEventListener('chargingchange', () => {});
      }
    };
  }, []);

  // Update telemetry helper
  const updateTelemetry = (patch: Partial<SystemTelemetry>) => {
    setTelemetry((prev) => ({ ...prev, ...patch }));
  };

  // 2. Action Executor: Executes parsed laptop commands
  const executeLaptopAction = useCallback((actionName: string, value?: any) => {
    jarvisAudio.playHudBeep(1500, 0.08);

    switch (actionName) {
      case 'fullscreen_toggle':
      case 'fullscreen':
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          updateTelemetry({ isFullscreen: true });
        } else {
          document.exitFullscreen().catch(() => {});
          updateTelemetry({ isFullscreen: false });
        }
        break;

      case 'volume_mute':
        setTelemetry((prev) => {
          const next = !prev.isMuted;
          jarvisAudio.setSoundEffectsEnabled(!next);
          return { ...prev, isMuted: next };
        });
        break;

      case 'open_terminal':
        updateTelemetry({ activeApp: 'terminal' });
        break;

      case 'open_knowledge':
        updateTelemetry({ activeApp: 'knowledge' });
        break;

      case 'open_diagnostics':
        updateTelemetry({ activeApp: 'diagnostics' });
        break;

      case 'open_camera_vision':
        updateTelemetry({ activeApp: 'camera_vision' });
        break;

      case 'open_files':
        updateTelemetry({ activeApp: 'files' });
        break;

      case 'repulsor_charge':
      case 'repulsor':
        setHologramReaction('repulsor_burst');
        jarvisAudio.playRepulsorCharge(0.9);
        break;

      case 'stealth_mode':
        updateTelemetry({ stealthMode: true });
        setHologramReaction('stealth_blue');
        break;

      case 'screen_wakelock':
        if ('wakeLock' in navigator) {
          (navigator as any).wakeLock.request('screen').catch(() => {});
          updateTelemetry({ wakeLockActive: true });
        }
        break;

      case 'clear_console':
        setTerminalEntries([]);
        break;

      case 'open_commands':
        updateTelemetry({ activeApp: 'commands' });
        break;

      case 'return_hud':
      case 'close_overlay':
        updateTelemetry({ activeApp: 'hud' });
        break;

      case 'expand_core':
      case 'explode_core':
        setExplodedSeparation(0.75);
        setHologramReaction('pulse');
        break;

      case 'assemble_core':
      case 'close_core':
        setExplodedSeparation(0.0);
        break;

      case 'ambient_sound_toggle':
      case 'toggle_ambient':
        setIsAmbientPlaying(jarvisAudio.toggleAmbientReactorHum());
        break;

      case 'optimize_system':
        updateTelemetry({ cpuLoad: 16, memoryUsage: 32 });
        jarvisAudio.playRepulsorCharge(0.7);
        break;

      case 'projection_toggle':
      case 'projection_mode':
      case 'toggle_projection':
      case 'projection':
        setIsProjectionMode((prev) => {
          const next = typeof value === 'boolean' ? value : !prev;
          jarvisAudio.playHudBeep(next ? 1600 : 900, 0.08);
          return next;
        });
        break;

      case 'finger_pointer_toggle':
      case 'finger_pointer':
      case 'finger_mouse':
        setIsFingerPointerActive((prev) => {
          const next = typeof value === 'boolean' ? value : !prev;
          jarvisAudio.playHudBeep(next ? 1600 : 900, 0.08);
          return next;
        });
        break;

      case 'finger_pointer_enable':
        setIsFingerPointerActive(true);
        jarvisAudio.playHudBeep(1600, 0.08);
        break;

      case 'finger_pointer_disable':
        setIsFingerPointerActive(false);
        jarvisAudio.playHudBeep(900, 0.08);
        break;

      case 'move_pointer':
      case 'finger_pointer_move':
      case 'pointer_move':
      case 'sweep_pointer':
        setIsFingerPointerActive(true);
        jarvisAudio.playPointerEngage();
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('jarvis:move_pointer', {
              detail: { target: value || 'sweep' },
            })
          );
        }, 120);
        break;

      case 'download_laptop':
      case 'download_system':
      case 'download_telemetry':
      case 'install_app':
      case 'backup_laptop':
      case 'export_laptop':
        setIsDownloadModalOpen(true);
        jarvisAudio.playDownloadChime();
        try {
          const payload = {
            dossier: 'STARK INDUSTRIES MARK 85 TACTICAL LAPTOP TELEMETRY',
            classification: 'LEVEL 7 TACTICAL CLEARANCE // AUTHORIZED USER ONLY',
            timestamp: new Date().toISOString(),
            systemTelemetry: {
              batteryLevel: telemetry.batteryLevel !== null ? `${telemetry.batteryLevel}%` : 'AC Power',
              isCharging: telemetry.isCharging,
              powerCellType: 'Lithium-Palladium Superconductive Cell',
              cpuUtilization: `${telemetry.cpuLoad}%`,
              ramAllocation: `${telemetry.memoryUsage}%`,
              networkLatencyMs: `${telemetry.pingMs} ms`,
              screenMode: telemetry.isFullscreen ? 'Fullscreen' : 'Windowed',
            },
            hostEnvironment: {
              platform: navigator.platform,
              hardwareThreads: navigator.hardwareConcurrency || 8,
              screenResolution: `${window.screen.width} x ${window.screen.height}`,
              activeViewport: `${window.innerWidth} x ${window.innerHeight}`,
            },
            starkProtocols: {
              integrityHash: '0x8F9A-4C21-B88D-STARK-MARK85',
              coreStatus: 'ARC REACTOR MARK-85 OPERATIONAL',
            },
          };
          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `stark-mark85-laptop-telemetry-${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch {}
        break;

      default:
        console.log('Laptop action executed:', actionName, value);
        break;
    }
  }, [telemetry]);

  // 3. Process Command with J.A.R.V.I.S. AI Backend (Gemini 3.8 Flash)
  const handleSendCommand = useCallback(
    async (commandText: string) => {
      if (!commandText.trim() || isProcessing) return;

      const userEntry: TerminalEntry = {
        id: `user-${Date.now()}`,
        type: 'user',
        text: commandText,
        timestamp: new Date().toLocaleTimeString(),
      };
      setTerminalEntries((prev) => [...prev, userEntry]);
      setIsProcessing(true);
      setHologramReaction('analyzing');
      jarvisAudio.playHudBeep(1600, 0.08);

      try {
        const response = await fetch('/api/jarvis/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: commandText,
            language: language,
            clientSystemState: telemetry,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data: JarvisResponse = await response.json();

        // 1. Set vocal reply (triggers TTS / SpeechSynthesis)
        setLastReplyText(data.reply);

        // 2. Set hologram 3D reaction
        if (data.hologramReaction) {
          setHologramReaction(data.hologramReaction);
        }

        // 3. Log reply in terminal
        const jarvisEntry: TerminalEntry = {
          id: `jarvis-${Date.now()}`,
          type: 'jarvis',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString(),
        };
        setTerminalEntries((prev) => [...prev, jarvisEntry]);

        // 4. Execute all attached laptop actions
        if (data.laptopActions && data.laptopActions.length > 0) {
          data.laptopActions.forEach((act) => {
            executeLaptopAction(act.action, act.value);
            setTerminalEntries((prev) => [
              ...prev,
              {
                id: `act-${Date.now()}-${Math.random()}`,
                type: 'success',
                text: `[LAPTOP_OS] EXECUTED: ${act.feedback}`,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          });
        }

        // 5. If knowledge briefing is returned, update knowledge codex
        if (data.knowledgeTitle || data.knowledgeSummary) {
          const article: KnowledgeArticle = {
            id: `query-${Date.now()}`,
            title: data.knowledgeTitle || 'Intelligence Briefing',
            category: 'Stark Tactical Database',
            classification: 'LEVEL 8 // VERIFIED',
            summary: data.knowledgeSummary || data.reply,
            keyPoints: data.keyDataPoints || [],
          };
          setActiveKnowledgeArticle(article);
        }
      } catch (err: any) {
        console.error('Jarvis command failed:', err);
        const errorReply =
          'My apologies, Sir. A communication delay occurred with the core network. Local hardware diagnostics remain fully operational.';
        setLastReplyText(errorReply);
        setTerminalEntries((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            type: 'error',
            text: `[ERROR] ${err.message || 'System offline'}`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        setHologramReaction('alert');
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, telemetry, executeLaptopAction]
  );

  // 4. Optical Hand Gesture Event Handler
  const handleGestureDetected = useCallback(
    (gesture: RecognizedGesture, description: string) => {
      setActiveGesture(gesture);

      // Log in terminal
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `gesture-${Date.now()}`,
          type: 'system',
          text: `[OPTICAL_SENSOR] DETECTED: ${gesture} -> ${description}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      // Handle gesture actions
      if (gesture === 'OPEN_PALM') {
        setExplodedSeparation(0.65);
        setHologramReaction('pulse');
      } else if (gesture === 'CLOSED_FIST') {
        setExplodedSeparation(0.0);
        executeLaptopAction('repulsor_charge');
      } else if (gesture === 'SWIPE_RIGHT') {
        // Next workspace app
        const appOrder: ActiveApp[] = [
          'hud',
          'diagnostics',
          'terminal',
          'camera_vision',
          'knowledge',
          'files',
        ];
        const nextIdx = (appOrder.indexOf(telemetry.activeApp) + 1) % appOrder.length;
        updateTelemetry({ activeApp: appOrder[nextIdx] });
      } else if (gesture === 'SWIPE_LEFT') {
        // Prev workspace app
        const appOrder: ActiveApp[] = [
          'hud',
          'diagnostics',
          'terminal',
          'camera_vision',
          'knowledge',
          'files',
        ];
        const prevIdx =
          (appOrder.indexOf(telemetry.activeApp) - 1 + appOrder.length) % appOrder.length;
        updateTelemetry({ activeApp: appOrder[prevIdx] });
      } else if (gesture === 'POINT_UP') {
        executeLaptopAction('fullscreen_toggle');
      } else if (gesture === 'PEACE_SIGN') {
        updateTelemetry({ activeApp: 'knowledge' });
      }

      // Reset gesture indicator after 1.8s
      setTimeout(() => {
        setActiveGesture('NONE');
      }, 1800);
    },
    [telemetry.activeApp, executeLaptopAction]
  );

  // 5. Terminal CLI Command Interpreter
  const handleExecuteTerminalCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const parts = trimmed.split(' ');
    const root = parts[0].toLowerCase();

    if (root === 'clear') {
      setTerminalEntries([]);
    } else if (root === 'help') {
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `help-${Date.now()}`,
          type: 'system',
          text: `AVAILABLE STARK COMMANDS:
  help        - Display command matrix
  sysinfo     - Laptop hardware & OS telemetry
  battery     - Detailed power subsystem
  repulsor    - Fire Arc Reactor repulsor burst
  matrix      - Quantum lattice pulse
  stealth     - Engage stealth visual protocol
  scan        - Scan network bandwidth & ports
  cat [file]  - Read schematic files
  ask [query] - Query J.A.R.V.I.S. intelligence`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } else if (root === 'sysinfo') {
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `sysinfo-${Date.now()}`,
          type: 'system',
          text: `SYSTEM HARDWARE OVERVIEW:
  CPU: Stark Nanite Core @ 4.80 GHz (${navigator.hardwareConcurrency || 8} Threads)
  RAM: ${(navigator as any).deviceMemory || 16} GB Quantum Superconductive L3
  OS: Stark-Kernel Linux / J.A.R.V.I.S. Tactical Shell
  Display: ${window.innerWidth} x ${window.innerHeight} (${window.devicePixelRatio}x Pixel Ratio)
  Power: ${telemetry.batteryLevel ?? 'AC'}% [${telemetry.isCharging ? 'Charging' : 'Battery'}]`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } else if (root === 'battery') {
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `bat-${Date.now()}`,
          type: 'system',
          text: `BATTERY TELEMETRY:
  Charge Level: ${telemetry.batteryLevel ?? 100}%
  Status: ${telemetry.isCharging ? 'AC Powered (Charging)' : 'Discharging'}
  Cell Chemistry: Lithium-Palladium Stark Cell`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } else if (root === 'repulsor') {
      executeLaptopAction('repulsor_charge');
    } else if (root === 'stealth') {
      executeLaptopAction('stealth_mode');
    } else if (root === 'project' || root === 'projection') {
      const sub = parts[1]?.toLowerCase();
      let nextState = !isProjectionMode;
      if (sub === 'on') nextState = true;
      if (sub === 'off') nextState = false;
      setIsProjectionMode(nextState);
      jarvisAudio.playHudBeep(nextState ? 1600 : 900, 0.08);
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `proj-${Date.now()}`,
          type: 'system',
          text: `HOLOGRAPHIC 3D PROCESS PROJECTION: ${nextState ? 'ENGAGED' : 'DISENGAGED'}\nCasting complex system telemetry nodes & neural topology into 3D orbital space.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } else if (root === 'finger' || root === 'pointer') {
      const sub = parts[1]?.toLowerCase();
      if (sub === 'move' || sub === 'sweep') {
        setIsFingerPointerActive(true);
        executeLaptopAction('move_pointer', parts[2] || 'sweep');
        setTerminalEntries((prev) => [
          ...prev,
          {
            id: `ptr-mv-${Date.now()}`,
            type: 'system',
            text: `[HOLOGRAPHIC_POINTER] EXECUTING AUTONOMOUS TRAJECTORY SWEEP ACROSS TACTICAL HUD COORDINATES...`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        return;
      }
      let nextState = !isFingerPointerActive;
      if (sub === 'on') nextState = true;
      if (sub === 'off') nextState = false;
      setIsFingerPointerActive(nextState);
      jarvisAudio.playHudBeep(nextState ? 1600 : 900, 0.08);
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `ptr-${Date.now()}`,
          type: 'system',
          text: `STARK HOLOGRAPHIC FINGER MOUSE: ${nextState ? 'ENGAGED' : 'DISENGAGED'}\nOptical camera will track index fingertip coordinates and map to screen cursor. Pinch or dwell to click.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } else if (root === 'move' && (parts[1]?.toLowerCase() === 'pointer' || parts[1]?.toLowerCase() === 'mouse')) {
      setIsFingerPointerActive(true);
      executeLaptopAction('move_pointer', parts[2] || 'sweep');
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `ptr-mv-${Date.now()}`,
          type: 'system',
          text: `[HOLOGRAPHIC_POINTER] EXECUTING AUTONOMOUS TRAJECTORY SWEEP ACROSS TACTICAL HUD COORDINATES...`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } else if (root === 'sweep') {
      setIsFingerPointerActive(true);
      executeLaptopAction('move_pointer', parts[1] || 'sweep');
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `ptr-mv-${Date.now()}`,
          type: 'system',
          text: `[HOLOGRAPHIC_POINTER] SWEEPING TACTICAL WAYPOINTS ACROSS HUD...`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } else if (root === 'download' || root === 'export' || root === 'backup' || root === 'install') {
      executeLaptopAction('download_laptop');
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `dl-${Date.now()}`,
          type: 'system',
          text: `[STARK_ENCLAVE] EXPORTING LAPTOP SYSTEM TELEMETRY & LAUNCHING DESKTOP SUITE...`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } else if (root === 'ask') {
      const q = parts.slice(1).join(' ');
      if (q) handleSendCommand(q);
    } else {
      // Pass other commands directly to Jarvis AI
      handleSendCommand(trimmed);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-cyan-100 select-none">
      {/* Background Stark Scanlines Grid */}
      <div className="absolute inset-0 stark-scanlines z-10 pointer-events-none" />

      {/* 3D Arc Reactor WebGL Canvas (Full Bleed 100vw x 100vh) */}
      <ThreeCanvas
        audioLevel={audioLevel}
        hologramReaction={hologramReaction}
        gestureState={activeGesture}
        explodedSeparation={explodedSeparation}
        projectionMode={isProjectionMode}
      />

      {/* Minimal Top HUD Header */}
      <HUDHeader
        telemetry={telemetry}
        activeGesture={activeGesture}
        isProcessing={isProcessing}
        wakeState={wakeState}
        wakeCountdown={wakeCountdown}
        language={language}
        onLanguageChange={setLanguage}
        onOpenVoiceCommands={() => updateTelemetry({ activeApp: 'commands' })}
        isFingerPointerActive={isFingerPointerActive}
        onToggleFingerPointer={() => setIsFingerPointerActive((prev) => !prev)}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
      />

      {/* Floating Tactical Briefing Speech Box (Shown in HUD mode) */}
      {telemetry.activeApp === 'hud' && lastReplyText && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-[min(720px,92vw)] pointer-events-auto">
          <div className="bg-slate-950/80 border border-cyan-500/70 rounded-xl p-3 stark-glow-cyan shadow-xl flex items-start gap-3 backdrop-blur-none">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-0.5">
                <span className="font-bold">J.A.R.V.I.S. VOCAL TRANSMISSION</span>
                <span className="text-slate-400 text-[10px]">REAL-TIME SPEECH</span>
              </div>
              <p className="text-xs font-mono text-cyan-100 leading-relaxed">
                "{lastReplyText}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Center Modal / Overlay for Active Apps */}
      {telemetry.activeApp !== 'hud' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-8 pointer-events-none">
          <div className="relative w-full max-w-4xl pointer-events-auto max-h-[calc(100vh-170px)] flex flex-col">
            {/* Close back to 3D HUD Button */}
            <button
              onClick={() => {
                updateTelemetry({ activeApp: 'hud' });
                jarvisAudio.playHudBeep(1000, 0.05);
              }}
              className="absolute -top-3 -right-3 z-40 p-1.5 rounded-full bg-slate-900 border border-cyan-400 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-950 shadow-lg transition-colors"
              title="Return to 3D Arc Reactor View"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Active Sub-module View */}
            {telemetry.activeApp === 'diagnostics' && (
              <SystemMonitor
                telemetry={telemetry}
                onUpdateTelemetry={updateTelemetry}
                onTriggerAction={executeLaptopAction}
              />
            )}

            {telemetry.activeApp === 'terminal' && (
              <TerminalConsole
                entries={terminalEntries}
                onExecuteCommand={handleExecuteTerminalCommand}
                onClear={() => setTerminalEntries([])}
              />
            )}

            {telemetry.activeApp === 'camera_vision' && (
              <HandGestureVision
                onGestureDetected={handleGestureDetected}
                activeGesture={activeGesture}
                isFingerPointerActive={isFingerPointerActive}
                onLaunchFingerPointer={() => setIsFingerPointerActive((prev) => !prev)}
              />
            )}

            {telemetry.activeApp === 'knowledge' && (
              <KnowledgeCodex
                onSearchQuery={(q) => handleSendCommand(`Jarvis, provide detailed scientific knowledge on: ${q}`)}
                onReadAloud={(txt) => setLastReplyText(txt)}
                activeArticle={activeKnowledgeArticle}
              />
            )}

            {telemetry.activeApp === 'files' && <FilesExplorer />}

            {telemetry.activeApp === 'commands' && (
              <VoiceCommandsMatrix onExecuteCommand={handleSendCommand} />
            )}
          </div>
        </div>
      )}

      {/* Voice Command & Dictation Input Bar (Pinned Above Dock) */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
        style={{
          bottom: '105px',
          width: 'min(780px, 92vw)',
        }}
      >
        <VoiceController
          onSendCommand={handleSendCommand}
          isProcessing={isProcessing}
          onAudioLevelChange={setAudioLevel}
          lastReplyText={lastReplyText}
          language={language}
          onLanguageChange={setLanguage}
          onWakeStateChange={(state, countdown) => {
            setWakeState(state);
            setWakeCountdown(countdown);
            if (state === 'awake_listening_command') {
              setHologramReaction('accelerating');
            }
          }}
        />
      </div>

      {/* Sleek Collapsible Bottom Dock (Consolidating All Navigation & 3D Controls) */}
      <CollapsibleDock
        activeApp={telemetry.activeApp}
        onSelectApp={(app) => updateTelemetry({ activeApp: app })}
        explodedSeparation={explodedSeparation}
        onChangeExploded={setExplodedSeparation}
        onTriggerReaction={(react) => setHologramReaction(react)}
        isAmbientPlaying={isAmbientPlaying}
        onToggleAmbient={() => {
          const next = jarvisAudio.toggleAmbientReactorHum();
          setIsAmbientPlaying(next);
        }}
        isProjectionActive={isProjectionMode}
        onToggleProjection={() => setIsProjectionMode((prev) => !prev)}
        isFingerPointerActive={isFingerPointerActive}
        onToggleFingerPointer={() => setIsFingerPointerActive((prev) => !prev)}
      />

      {/* Stark Virtual Holographic Laser Pointer & Optical Finger Mouse */}
      <VirtualHolographicPointer
        isActive={isFingerPointerActive}
        onToggleActive={() => setIsFingerPointerActive((prev) => !prev)}
      />

      {/* Stark Laptop Telemetry Downloader & Standalone App Installer Modal */}
      <LaptopDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        telemetry={telemetry}
      />
    </div>
  );
}
