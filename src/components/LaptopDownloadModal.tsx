import React, { useState, useEffect } from 'react';
import {
  Download,
  Laptop,
  X,
  FileCode,
  FileText,
  Shield,
  CheckCircle2,
  Copy,
  Cpu,
  Battery,
  HardDrive,
  Share2,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';
import { SystemTelemetry } from '../types';
import { jarvisAudio } from './AudioSynthesizer';

interface LaptopDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: SystemTelemetry;
}

export const LaptopDownloadModal: React.FC<LaptopDownloadModalProps> = ({
  isOpen,
  onClose,
  telemetry,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'installer' | 'report'>('telemetry');

  // Listen for beforeinstallprompt for PWA native desktop install
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  // Build complete laptop telemetry snapshot
  const generateTelemetryPayload = () => {
    return {
      title: 'STARK INDUSTRIES MARK 85 LAPTOP SYSTEM DOSSIER',
      classification: 'LEVEL 7 TACTICAL CLEARANCE // AUTHORIZED USER ONLY',
      timestamp: new Date().toISOString(),
      systemArchitecture: {
        platform: (navigator as any).userAgentData?.platform || navigator.platform || 'Unknown OS',
        hardwareThreads: navigator.hardwareConcurrency || 8,
        deviceMemoryGB: (navigator as any).deviceMemory || '16+ GB',
        viewport: `${window.innerWidth} x ${window.innerHeight}`,
        devicePixelRatio: `${window.devicePixelRatio}x`,
        screenResolution: `${window.screen.width} x ${window.screen.height}`,
        colorDepth: `${window.screen.colorDepth}-bit`,
        language: navigator.language,
        onlineStatus: navigator.onLine ? 'ONLINE' : 'OFFLINE',
        userAgent: navigator.userAgent,
      },
      laptopTelemetryMetrics: {
        batteryLevel: telemetry.batteryLevel !== null ? `${telemetry.batteryLevel}%` : 'AC Direct',
        batteryCharging: telemetry.isCharging ? 'Charging' : 'On Battery',
        powerCellType: 'Lithium-Palladium Superconductive Cell',
        cpuUtilization: `${telemetry.cpuLoad}%`,
        ramAllocation: `${telemetry.memoryUsage}%`,
        networkLatencyMs: `${telemetry.pingMs} ms`,
        screenMode: telemetry.isFullscreen ? 'Fullscreen Tactical HUD' : 'Windowed',
        wakeLockState: telemetry.wakeLockActive ? 'Active' : 'Standby',
        stealthMode: telemetry.stealthMode ? 'Indigo Stealth' : 'Stark Cyan Active',
      },
      starkCoreProtocols: {
        tacticalIntelligence: 'J.A.R.V.I.S. (Just A Rather Very Intelligent System)',
        neuralFoundationModel: 'Gemini 3.8 Flash Tactical Engine',
        opticalInterface: '3D Procedural Three.js Arc Reactor & Optical Finger Laser Pointer',
        audioSynthesisEngine: 'Procedural Web Audio Dual-Oscillator Lattice',
        integrityHash: '0x8F9A-4C21-B88D-STARK-MARK85',
      },
    };
  };

  // 1. Download JSON File
  const handleDownloadJSON = () => {
    const data = generateTelemetryPayload();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stark-mark85-laptop-telemetry-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    jarvisAudio.playDownloadChime();
    setDownloadSuccess('JSON Telemetry Dossier downloaded successfully');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // 2. Download Markdown Tactical Report
  const handleDownloadMarkdown = () => {
    const data = generateTelemetryPayload();
    const md = `# STARK INDUSTRIES MARK 85 - LAPTOP SYSTEM DOSSIER
**Classification:** ${data.classification}  
**Timestamp:** ${data.timestamp}  
**Integrity Hash:** ${data.starkCoreProtocols.integrityHash}

---

## 1. HARDWARE SPECIFICATIONS & ENVIRONMENT
- **Operating System:** ${data.systemArchitecture.platform}
- **Processor Concurrency:** ${data.systemArchitecture.hardwareThreads} Parallel Compute Threads
- **System Memory:** ${data.systemArchitecture.deviceMemoryGB} Quantum L3 Superconductive Cache
- **Screen Resolution:** ${data.systemArchitecture.screenResolution} (${data.systemArchitecture.colorDepth}, ${data.systemArchitecture.devicePixelRatio})
- **Active Viewport:** ${data.systemArchitecture.viewport}
- **Network Status:** ${data.systemArchitecture.onlineStatus}

---

## 2. REAL-TIME LAPTOP TELEMETRY
- **Battery Charge:** ${data.laptopTelemetryMetrics.batteryLevel} (${data.laptopTelemetryMetrics.batteryCharging})
- **Power Source:** ${data.laptopTelemetryMetrics.powerCellType}
- **CPU Load:** ${data.laptopTelemetryMetrics.cpuUtilization}
- **RAM Utilization:** ${data.laptopTelemetryMetrics.ramAllocation}
- **Tactical Latency:** ${data.laptopTelemetryMetrics.networkLatencyMs}
- **Display State:** ${data.laptopTelemetryMetrics.screenMode}

---

## 3. STARK J.A.R.V.I.S. PROTOCOLS
- **Core Intelligence:** ${data.starkCoreProtocols.tacticalIntelligence}
- **Model Engine:** ${data.starkCoreProtocols.neuralFoundationModel}
- **Optical Laser System:** ${data.starkCoreProtocols.opticalInterface}
- **Audio Synthesizer:** ${data.starkCoreProtocols.audioSynthesisEngine}

*Report generated by J.A.R.V.I.S. Neural Core & Laptop Operator.*
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stark-laptop-tactical-report-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    jarvisAudio.playDownloadChime();
    setDownloadSuccess('Markdown Tactical Report downloaded successfully');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // 3. Download Self-Contained Interactive HTML Dossier
  const handleDownloadHTML = () => {
    const data = generateTelemetryPayload();
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>STARK MARK 85 - Laptop System Dossier</title>
  <style>
    body {
      background: #020617;
      color: #00f0ff;
      font-family: 'Courier New', monospace;
      padding: 30px;
      margin: 0;
    }
    .card {
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid #00f0ff;
      border-radius: 12px;
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
      box-shadow: 0 0 30px rgba(0, 240, 255, 0.2);
    }
    h1 { margin-top: 0; color: #fff; text-shadow: 0 0 10px #00f0ff; }
    .badge { background: #0891b2; color: #020617; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
    .metric { background: #0f172a; border: 1px solid #1e293b; padding: 12px; border-radius: 8px; }
    .val { font-size: 20px; color: #38bdf8; font-weight: bold; }
    .lbl { color: #94a3b8; font-size: 11px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h1>STARK INDUSTRIES MARK 85</h1>
      <span class="badge">OFFLINE DOSSIER</span>
    </div>
    <p style="color:#94a3b8;">${data.classification} // GENERATED: ${data.timestamp}</p>
    <div class="grid">
      <div class="metric"><div class="lbl">OPERATING SYSTEM</div><div class="val">${data.systemArchitecture.platform}</div></div>
      <div class="metric"><div class="lbl">PROCESSOR CORES</div><div class="val">${data.systemArchitecture.hardwareThreads} Threads</div></div>
      <div class="metric"><div class="lbl">BATTERY STATUS</div><div class="val">${data.laptopTelemetryMetrics.batteryLevel}</div></div>
      <div class="metric"><div class="lbl">CPU UTILIZATION</div><div class="val">${data.laptopTelemetryMetrics.cpuUtilization}</div></div>
      <div class="metric"><div class="lbl">MEMORY ALLOCATION</div><div class="val">${data.laptopTelemetryMetrics.ramAllocation}</div></div>
      <div class="metric"><div class="lbl">SCREEN RESOLUTION</div><div class="val">${data.systemArchitecture.screenResolution}</div></div>
    </div>
    <div style="margin-top:24px; padding-top:16px; border-top:1px solid #334155; font-size:12px; color:#64748b;">
      Integrity Checksum: ${data.starkCoreProtocols.integrityHash} | J.A.R.V.I.S. OS Core
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stark-system-dossier-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    jarvisAudio.playDownloadChime();
    setDownloadSuccess('Interactive HTML Dossier downloaded successfully');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // 4. Trigger PWA Native Laptop App Install Prompt
  const handleTriggerInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        jarvisAudio.playDownloadChime();
      }
      setInstallPrompt(null);
    } else {
      // In browsers where beforeinstallprompt isn't fired yet
      alert(
        'To install J.A.R.V.I.S. on your laptop:\n\n1. In Chrome/Edge: Click the (Install) icon in your browser address bar.\n2. Or click the Browser Menu (⋮) -> "Install J.A.R.V.I.S. to Laptop".'
      );
    }
  };

  // 5. Copy JSON to clipboard
  const handleCopyJSON = () => {
    const data = generateTelemetryPayload();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopied(true);
      jarvisAudio.playTargetHover();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-cyan-500 rounded-2xl shadow-2xl stark-glow-cyan p-5 sm:p-6 text-cyan-200 overflow-hidden">
        {/* Stark Scanlines & Cyber Background Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-900/60 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-600 shadow-md shadow-cyan-500/20">
              <Laptop className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="font-display font-bold text-sm sm:text-base text-cyan-100 uppercase tracking-wider flex items-center gap-2">
                STARK LAPTOP DATA & DESKTOP SUITE
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[10px] font-mono text-cyan-400/80">
                OFFLINE TELEMETRY DOSSIER & STANDALONE DESKTOP INSTALLER
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              jarvisAudio.playHudBeep(900, 0.08);
            }}
            className="p-1.5 rounded-lg hover:bg-rose-950 text-rose-400 hover:text-rose-200 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-4 bg-slate-900/80 p-1 rounded-lg border border-cyan-900/60 text-xs font-mono relative z-10">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'telemetry'
                ? 'bg-cyan-600 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-cyan-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Download Data (.JSON)</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'report'
                ? 'bg-cyan-600 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-cyan-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Reports (.HTML / .MD)</span>
          </button>
          <button
            onClick={() => setActiveTab('installer')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'installer'
                ? 'bg-cyan-600 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-cyan-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Install App on Laptop</span>
          </button>
        </div>

        {/* Success Banner */}
        {downloadSuccess && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* TAB 1: DOWNLOAD TELEMETRY JSON */}
        {activeTab === 'telemetry' && (
          <div className="flex flex-col gap-4 relative z-10">
            <div className="bg-slate-900/90 border border-cyan-900/80 rounded-xl p-3.5 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-cyan-900/60 mb-2">
                <span className="text-[11px] text-cyan-400 font-bold">LIVE LAPTOP SNAPSHOT SUMMARY:</span>
                <button
                  onClick={handleCopyJSON}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied!' : 'Copy Payload'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="bg-slate-950/70 p-2 rounded border border-cyan-900/40">
                  <div className="text-[9px] text-slate-400">BATTERY POWER</div>
                  <div className="text-emerald-400 font-bold">
                    {telemetry.batteryLevel !== null ? `${telemetry.batteryLevel}%` : 'AC Power'}
                    {telemetry.isCharging ? ' [⚡ Charging]' : ''}
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded border border-cyan-900/40">
                  <div className="text-[9px] text-slate-400">CPU UTILIZATION</div>
                  <div className="text-cyan-300 font-bold">
                    {telemetry.cpuLoad}% ({navigator.hardwareConcurrency || 8} Threads)
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded border border-cyan-900/40">
                  <div className="text-[9px] text-slate-400">RAM ALLOCATION</div>
                  <div className="text-amber-400 font-bold">
                    {telemetry.memoryUsage}% ({(navigator as any).deviceMemory || 16} GB)
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded border border-cyan-900/40">
                  <div className="text-[9px] text-slate-400">DISPLAY RESOLUTION</div>
                  <div className="text-cyan-300 font-bold">
                    {window.screen.width} x {window.screen.height}
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded border border-cyan-900/40">
                  <div className="text-[9px] text-slate-400">NETWORK LATENCY</div>
                  <div className="text-emerald-400 font-bold">{telemetry.pingMs} ms (Online)</div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded border border-cyan-900/40">
                  <div className="text-[9px] text-slate-400">STARK PROTOCOL</div>
                  <div className="text-indigo-400 font-bold">0x8F9A-MARK85</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] font-mono text-slate-400">
                Exports complete machine profile, battery diagnostics, and OS parameters.
              </span>

              <button
                onClick={handleDownloadJSON}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD LAPTOP DOSSIER (.JSON)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: REPORTS (.HTML / .MD) */}
        {activeTab === 'report' && (
          <div className="flex flex-col gap-4 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* HTML Dossier Card */}
              <div className="bg-slate-900/90 border border-cyan-800 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-cyan-300 font-bold font-mono text-sm mb-1">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <span>Self-Contained HTML Dossier</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">
                    A standalone, offline interactive cyber dashboard styled with Stark Mark 85 dark theme. Can be opened in any web browser without internet.
                  </p>
                </div>
                <button
                  onClick={handleDownloadHTML}
                  className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .HTML Dossier</span>
                </button>
              </div>

              {/* Markdown Tactical Report Card */}
              <div className="bg-slate-900/90 border border-cyan-800 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-amber-300 font-bold font-mono text-sm mb-1">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Markdown Tactical Report</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">
                    Clean, structured technical audit document containing hardware inventory, security hashes, and benchmark telemetry for documentation.
                  </p>
                </div>
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .MD Report</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INSTALL APP ON LAPTOP (PWA) */}
        {activeTab === 'installer' && (
          <div className="flex flex-col gap-4 relative z-10 font-mono text-xs">
            <div className="bg-slate-900/90 border border-cyan-900/80 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
                  <Laptop className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="font-bold text-cyan-100 text-sm">
                    {isInstalled ? 'J.A.R.V.I.S. INSTALLED ON LAPTOP' : 'INSTALL J.A.R.V.I.S. STANDALONE APP'}
                  </div>
                  <div className="text-[10px] text-cyan-400/80">
                    {isInstalled
                      ? 'Running in standalone desktop mode with native OS window'
                      : 'Progressive Web App (PWA) // Chrome, Edge, Safari, Firefox'}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                Install J.A.R.V.I.S. Mark 85 directly to your laptop desktop or dock. Launches in a dedicated borderless window with offline caching, high-performance WebGL graphics, and fast hotkey integration.
              </p>

              <div className="bg-slate-950 p-3 rounded-lg border border-cyan-900/50 space-y-2 text-[10px] text-slate-400">
                <div className="text-cyan-300 font-bold">QUICK DESKTOP INSTALLATION STEPS:</div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <span><strong>Chrome / Edge:</strong> Click the <span className="text-cyan-300 font-bold">Install</span> icon in the top URL address bar, or click Menu (⋮) &rarr; "Install J.A.R.V.I.S.".</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <span><strong>macOS Safari:</strong> Click File &rarr; "Add to Dock" to launch as a native Mac app.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <span><strong>Windows / Linux:</strong> Pin to Taskbar or Desktop for immediate 1-click boot.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleTriggerInstall}
                className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Zap className="w-4 h-4 text-amber-950" />
                <span>{isInstalled ? 'RE-LAUNCH DESKTOP APP' : 'INSTALL J.A.R.V.I.S. TO LAPTOP'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-cyan-900/60 mt-4 flex items-center justify-between text-[10px] font-mono text-slate-400 relative z-10">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>STARK PROTOCOL 10.4.1 // SECURE ENCLAVE EXPORT</span>
          </div>
          <div>PRESS [ESC] TO CLOSE</div>
        </div>
      </div>
    </div>
  );
};
