import React, { useState } from 'react';
import { Folder, FileText, Download, Copy, Check, Shield, FileCode } from 'lucide-react';
import { jarvisAudio } from './AudioSynthesizer';

interface BlueprintFile {
  name: string;
  size: string;
  type: string;
  classification: string;
  content: string;
}

const FILES: BlueprintFile[] = [
  {
    name: 'arc_reactor_mark85.cad',
    size: '14.2 MB',
    type: 'CAD Schema',
    classification: 'TOP SECRET // STARK PROPRIETARY',
    content: `// STARK INDUSTRIES ARC REACTOR MK-85
[CONTAINMENT]
Magnetic Flux: 4.85 Tesla
Coil Segments: 10x Symmetrical Palladium Induction
Cathode Core: Vibranium-Synthesized Heavy Isotope Matrix
Operating Temperature: 298.15 K (Room Temperature Superconduction)
Peak Power Output: 3.2 Gigajoules/second

[PINOUT DIRECTIVES]
PIN_01: GND_BUS_CHASSIS
PIN_02: REPULSOR_LINE_ALPHA (350 kV Pulse)
PIN_03: FLIGHT_STABILIZER_L
PIN_04: FLIGHT_STABILIZER_R
PIN_05: SYNAPTIC_NEURAL_TELEMETRY_TX
PIN_06: TACTICAL_HUD_FEED_RX`,
  },
  {
    name: 'laptop_hardware_driver.sh',
    size: '4.8 KB',
    type: 'Shell Script',
    classification: 'STARK OS DRIVER',
    content: `#!/usr/bin/env bash
# J.A.R.V.I.S. High-Performance Laptop Power Profile
set -euo pipefail

echo "[J.A.R.V.I.S.] Hooking kernel thermal governors..."
echo "performance" | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Disable aggressive sleep timeouts
sudo systemctl mask sleep.target suspend.target hibernate.target

# Optimize network socket buffers
sudo sysctl -w net.core.rmem_max=16777216
sudo sysctl -w net.core.wmem_max=16777216

echo "[J.A.R.V.I.S.] Laptop optimization completed. All cores pinned to 4.80 GHz."`,
  },
  {
    name: 'quantum_gps_spacetime.json',
    size: '22.1 KB',
    type: 'JSON Matrix',
    classification: 'CLASSIFIED // AVENGERS INITIATIVE',
    content: `{
  "navigation_system": "Quantum Space-Time Geodesic Sync",
  "eigenvalues": [
    0.70710678118,
    -0.70710678118,
    1.41421356237
  ],
  "mobius_strip_configuration": {
    "inverted": true,
    "boundary_conditions": "Dirichlet-Cauchy",
    "temporal_variance": "±0.0000000001 ps"
  },
  "containment_integrity": 1.0,
  "status": "CALIBRATED_AND_LOCKED"
}`,
  },
];

export const FilesExplorer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [selectedFile, setSelectedFile] = useState<BlueprintFile>(FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    jarvisAudio.playHudBeep(1600, 0.05);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    a.click();
    URL.revokeObjectURL(url);
    jarvisAudio.playHudBeep(1400, 0.08);
  };

  return (
    <div
      className={`flex flex-col bg-slate-950/95 border border-cyan-800/80 rounded-xl p-4 stark-glow-cyan text-cyan-200 font-mono text-xs ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-cyan-900/60 mb-3">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-cyan-400" />
          <span className="font-display font-bold text-sm tracking-widest text-cyan-100 uppercase">
            STARK ARCHIVES & SCHEMATICS
          </span>
        </div>
        <span className="text-[10px] text-amber-400/90 border border-amber-800/60 px-2 py-0.5 rounded bg-amber-950/40">
          SECURE STORAGE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-60">
        {/* File List */}
        <div className="space-y-1.5 border-r border-cyan-900/40 pr-2">
          {FILES.map((file) => (
            <button
              key={file.name}
              onClick={() => {
                setSelectedFile(file);
                jarvisAudio.playHudBeep(1200, 0.05);
              }}
              className={`w-full text-left p-2 rounded border transition-all flex items-start gap-2 ${
                selectedFile.name === file.name
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-100 font-bold'
                  : 'bg-slate-900/60 hover:bg-cyan-950/40 border-cyan-900/40 text-cyan-300'
              }`}
            >
              <FileCode className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="overflow-hidden">
                <div className="truncate text-xs">{file.name}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>{file.size}</span>
                  <span>•</span>
                  <span>{file.type}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Content Preview */}
        <div className="md:col-span-2 flex flex-col bg-slate-900/80 border border-cyan-900/60 rounded-lg p-3">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-900/60 mb-2">
            <div>
              <div className="text-xs font-bold text-cyan-100">{selectedFile.name}</div>
              <div className="text-[10px] text-amber-400">{selectedFile.classification}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleDownload}
                className="p-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60"
                title="Download blueprint"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <pre className="flex-1 overflow-auto bg-slate-950 p-2.5 rounded border border-cyan-950 text-cyan-200 text-[11px] leading-relaxed max-h-48 font-mono select-text">
            {selectedFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
