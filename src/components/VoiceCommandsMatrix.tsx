import React, { useState } from 'react';
import {
  Mic,
  Volume2,
  Maximize2,
  Minimize2,
  Cpu,
  Battery,
  Shield,
  Zap,
  Terminal,
  Camera,
  Database,
  Folder,
  Sliders,
  Sparkles,
  Search,
  Check,
  Share2,
  Hand,
  Crosshair,
  Download,
} from 'lucide-react';
import { jarvisAudio } from './AudioSynthesizer';

export interface VoiceCommandDefinition {
  id: string;
  category: 'laptop' | 'workspace' | 'reactor' | 'knowledge';
  triggerPhrases: string[];
  actionDescription: string;
  icon: React.ReactNode;
  sampleExecution: string;
}

const COMMAND_CATALOG: VoiceCommandDefinition[] = [
  // LAPTOP & HARDWARE OS COMMANDS
  {
    id: 'cmd_fullscreen',
    category: 'laptop',
    triggerPhrases: ['"Jarvis, maximize screen"', '"जार्विस, फुलस्क्रीन करो" (HI)', '"जार्विस, फुलस्क्रीन करा" (MR)'],
    actionDescription: 'Toggles full-screen laptop display mode for maximum immersion.',
    icon: <Maximize2 className="w-4 h-4 text-cyan-400" />,
    sampleExecution: 'Jarvis, maximize screen',
  },
  {
    id: 'cmd_diagnostics',
    category: 'laptop',
    triggerPhrases: ['"Jarvis, run full laptop diagnostics"', '"जार्विस, डायग्नोस्टिक्स चलाओ" (HI)', '"जार्विस, डायग्नोस्टिक्स चालवा" (MR)'],
    actionDescription: 'Opens hardware monitor, scans battery health, CPU load, and memory telemetry.',
    icon: <Sliders className="w-4 h-4 text-cyan-400" />,
    sampleExecution: 'Jarvis, run full laptop diagnostics',
  },
  {
    id: 'cmd_battery',
    category: 'laptop',
    triggerPhrases: ['"Jarvis, check battery status"', '"जार्विस, बैटरी चेक करो" (HI)', '"जार्विस, बॅटरी तपासा" (MR)'],
    actionDescription: 'Polls real battery level (AC charging status, time estimate) via Battery API.',
    icon: <Battery className="w-4 h-4 text-emerald-400" />,
    sampleExecution: 'Jarvis, check battery status',
  },
  {
    id: 'cmd_optimize',
    category: 'laptop',
    triggerPhrases: ['"Jarvis, optimize laptop memory"', '"जार्विस, मेमोरी ऑप्टिमाइज़ करो" (HI)', '"जार्विस, मेमरी ऑप्टिमाइझ करा" (MR)'],
    actionDescription: 'Simulates memory purge, pins CPU thermal governors, and recalibrates clock speed.',
    icon: <Cpu className="w-4 h-4 text-amber-400" />,
    sampleExecution: 'Jarvis, optimize laptop memory',
  },
  {
    id: 'cmd_mute',
    category: 'laptop',
    triggerPhrases: ['"Jarvis, mute audio"', '"जार्विस, आवाज बंद करो" (HI)', '"जार्विस, आवाज म्यूट करा" (MR)'],
    actionDescription: 'Mutes or activates all Stark UI procedural sound effects and synthesizer outputs.',
    icon: <Volume2 className="w-4 h-4 text-rose-400" />,
    sampleExecution: 'Jarvis, mute audio',
  },
  {
    id: 'cmd_stealth',
    category: 'laptop',
    triggerPhrases: ['"Jarvis, engage stealth mode"', '"जार्विस, स्टेल्थ मोड चालू करो" (HI)', '"जार्विस, स्टेल्थ मोड सुरू करा" (MR)'],
    actionDescription: 'Activates indigo low-emission stealth HUD palette and dims reactor lighting.',
    icon: <Shield className="w-4 h-4 text-indigo-400" />,
    sampleExecution: 'Jarvis, engage stealth mode',
  },
  {
    id: 'cmd_wakelock',
    category: 'laptop',
    triggerPhrases: ['"Jarvis, prevent screen sleep"', '"जार्विस, स्क्रीन चालू रखो" (HI)', '"जार्विस, स्क्रीन चालू ठेवा" (MR)'],
    actionDescription: 'Requests Screen WakeLock API to keep the laptop display indefinitely awake.',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    sampleExecution: 'Jarvis, prevent screen sleep',
  },
  {
    id: 'cmd_download_laptop',
    category: 'laptop',
    triggerPhrases: [
      '"Jarvis, download my laptop"',
      '"Jarvis, download laptop system dossier"',
      '"जार्विस, लैपटॉप डाउनलोड करो" (HI)',
      '"जार्विस, लॅपटॉप डाउनलोड करा" (MR)',
    ],
    actionDescription: 'Generates real-time laptop telemetry snapshot (.JSON), tactical report (.MD), and launches standalone desktop installer.',
    icon: <Download className="w-4 h-4 text-cyan-400" />,
    sampleExecution: 'Jarvis, download my laptop',
  },

  // WORKSPACES & NAVIGATION
  {
    id: 'cmd_terminal',
    category: 'workspace',
    triggerPhrases: ['"Jarvis, open terminal console"', '"जार्विस, टर्मिनल खोलो" (HI)', '"जार्विस, टर्मिनल उघडा" (MR)'],
    actionDescription: 'Brings up the Stark Quantum Bash Console for executing shell commands.',
    icon: <Terminal className="w-4 h-4 text-cyan-400" />,
    sampleExecution: 'Jarvis, open terminal console',
  },
  {
    id: 'cmd_camera',
    category: 'workspace',
    triggerPhrases: ['"Jarvis, open optical camera tracker"', '"जार्विस, कैमरा ट्रैकर खोलो" (HI)', '"जार्विस, कॅमेरा ट्रॅकर उघडा" (MR)'],
    actionDescription: 'Launches real-time webcam optical processing for hand gesture controls.',
    icon: <Camera className="w-4 h-4 text-cyan-400" />,
    sampleExecution: 'Jarvis, open optical camera tracker',
  },
  {
    id: 'cmd_finger_pointer',
    category: 'workspace',
    triggerPhrases: [
      '"Jarvis, control pointer with finger"',
      '"Jarvis, activate finger mouse"',
      '"जार्विस, उंगली से माउस चलाओ" (HI)',
      '"जार्विस, फिंगर पॉइंटर चालू करो" (HI)',
      '"जार्विस, बोटाने माउस कंट्रोल सुरू करा" (MR)',
      '"जार्विस, फिंगर पॉइंटर सुरू करा" (MR)',
    ],
    actionDescription: 'Tracks index finger in webcam and steers holographic laser cursor with pinch & dwell clicks.',
    icon: <Hand className="w-4 h-4 text-cyan-400" />,
    sampleExecution: 'Jarvis, control pointer with finger',
  },
  {
    id: 'cmd_move_pointer',
    category: 'workspace',
    triggerPhrases: [
      '"Jarvis, move the pointer"',
      '"Jarvis, sweep holographic pointer"',
      '"जार्विस, पॉइंटर चलाओ" (HI)',
      '"जार्विस, पॉइंटर फिरवा" (MR)',
    ],
    actionDescription: 'Sweeps the holographic laser pointer smoothly across Arc Core and Mark 85 HUD quadrants.',
    icon: <Crosshair className="w-4 h-4 text-amber-400" />,
    sampleExecution: 'Jarvis, move the pointer',
  },
  {
    id: 'cmd_knowledge',
    category: 'workspace',
    triggerPhrases: ['"Jarvis, open knowledge codex"', '"जार्विस, नॉलेज कोडेक्स खोलो" (HI)', '"जार्विस, नॉलेज कोडेक्स उघडा" (MR)'],
    actionDescription: 'Opens universal intelligence dossiers with Gemini 3.8 Flash science search.',
    icon: <Database className="w-4 h-4 text-cyan-400" />,
    sampleExecution: 'Jarvis, open knowledge codex',
  },
  {
    id: 'cmd_schematics',
    category: 'workspace',
    triggerPhrases: ['"Jarvis, open schematics and files"', '"जार्विस, फाइल्स खोलो" (HI)', '"जार्विस, फाइल्स उघडा" (MR)'],
    actionDescription: 'Explores CAD designs, kernel scripts, and encrypted Stark protocol files.',
    icon: <Folder className="w-4 h-4 text-cyan-400" />,
    sampleExecution: 'Jarvis, open schematics and files',
  },
  {
    id: 'cmd_hud',
    category: 'workspace',
    triggerPhrases: ['"Jarvis, return to main HUD"', '"जार्विस, मुख्य स्क्रीन पर आओ" (HI)', '"जार्विस, मुख्य स्क्रीनवर या" (MR)'],
    actionDescription: 'Closes any active overlay and returns to the unobstructed 3D Arc Reactor viewport.',
    icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    sampleExecution: 'Jarvis, return to main HUD',
  },

  // 3D ARC REACTOR & HOLOGRAM
  {
    id: 'cmd_repulsor',
    category: 'reactor',
    triggerPhrases: ['"Jarvis, fire repulsor beam"', '"जार्विस, रिपल्सर फायर करो" (HI)', '"जार्विस, रिपल्सर फायर करा" (MR)'],
    actionDescription: 'Fires high-intensity repulsor conduit beam with energy charge audio.',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    sampleExecution: 'Jarvis, fire repulsor beam',
  },
  {
    id: 'cmd_expand',
    category: 'reactor',
    triggerPhrases: ['"Jarvis, expand the holographic core"', '"जार्विस, कोर को बड़ा करो" (HI)', '"जार्विस, कोर विस्तृत करा" (MR)'],
    actionDescription: 'Smoothly separates Arc Reactor gimbal rings along the Z-axis in 3D space.',
    icon: <Sliders className="w-4 h-4 text-cyan-400" />,
    sampleExecution: 'Jarvis, expand the holographic core',
  },
  {
    id: 'cmd_assemble',
    category: 'reactor',
    triggerPhrases: ['"Jarvis, assemble core"', '"जार्विस, कोर को समेटो" (HI)', '"जार्विस, कोर एकत्र करा" (MR)'],
    actionDescription: 'Draws all exploded Arc Reactor layers back into unified magnetic lock.',
    icon: <Check className="w-4 h-4 text-cyan-400" />,
    sampleExecution: 'Jarvis, assemble core',
  },
  {
    id: 'cmd_ambient',
    category: 'reactor',
    triggerPhrases: ['"Jarvis, play Stark lab ambient sound"', '"जार्विस, बैकग्राउंड साउंड चालू करो" (HI)', '"जार्विस, बॅकग्राउंड आवाज सुरू करा" (MR)'],
    actionDescription: 'Generates procedural low-frequency reactor resonance using Web Audio oscillators.',
    icon: <Volume2 className="w-4 h-4 text-emerald-400" />,
    sampleExecution: 'Jarvis, play Stark lab ambient sound',
  },
  {
    id: 'cmd_projection',
    category: 'reactor',
    triggerPhrases: [
      '"Jarvis, activate projection mode"',
      '"Jarvis, project system processes"',
      '"जार्विस, प्रोजेक्शन मोड चालू करो" (HI)',
      '"जार्विस, प्रोजेक्शन मोड सुरू करा" (MR)'
    ],
    actionDescription: 'Casts 10 floating 3D system process nodes into the Three.js scene with connecting laser lines.',
    icon: <Share2 className="w-4 h-4 text-amber-400" />,
    sampleExecution: 'Jarvis, activate projection mode',
  },

  // UNIVERSAL DEEP KNOWLEDGE
  {
    id: 'cmd_quantum',
    category: 'knowledge',
    triggerPhrases: ['"Jarvis, explain quantum entanglement"', '"जार्विस, क्वांटम फिजिक्स समझाओ" (HI)', '"जार्विस, क्वांटम कॉम्प्युटिंग समजावून सांगा" (MR)'],
    actionDescription: 'Delivers high-level scientific explanation of non-locality and quantum circuits.',
    icon: <Database className="w-4 h-4 text-cyan-400" />,
    sampleExecution: 'Jarvis, explain quantum entanglement',
  },
  {
    id: 'cmd_fusion',
    category: 'knowledge',
    triggerPhrases: ['"Jarvis, how does cold fusion work?"', '"जार्विस, कोल्ड फ्यूजन कैसे काम करता है?" (HI)', '"जार्विस, कोल्ड फ्यूजन कसे काम करते?" (MR)'],
    actionDescription: 'Briefs on magnetohydrodynamic energy extraction and synthetic element stability.',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    sampleExecution: 'Jarvis, how does cold fusion work?',
  },
  {
    id: 'cmd_speed_light',
    category: 'knowledge',
    triggerPhrases: ['"Jarvis, what is the speed of light in vacuum?"', '"जार्विस, प्रकाश की गति क्या है?" (HI)', '"जार्विस, प्रकाशाचा वेग किती आहे?" (MR)'],
    actionDescription: 'Returns exact metric constant (299,792,458 m/s) with relativistic context.',
    icon: <Zap className="w-4 h-4 text-cyan-400" />,
    sampleExecution: 'Jarvis, what is the speed of light in vacuum?',
  },
];

interface VoiceCommandsMatrixProps {
  onExecuteCommand: (cmd: string) => void;
  className?: string;
}

export const VoiceCommandsMatrix: React.FC<VoiceCommandsMatrixProps> = ({
  onExecuteCommand,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'laptop' | 'workspace' | 'reactor' | 'knowledge'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const filtered = COMMAND_CATALOG.filter((cmd) => {
    const matchesTab = activeTab === 'all' || cmd.category === activeTab;
    const matchesSearch =
      cmd.triggerPhrases.some((p) => p.toLowerCase().includes(searchFilter.toLowerCase())) ||
      cmd.actionDescription.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleTestCommand = (sample: string) => {
    jarvisAudio.playHudBeep(1600, 0.08);
    onExecuteCommand(sample);
  };

  return (
    <div
      className={`flex flex-col bg-slate-950/95 border border-cyan-800/80 rounded-xl p-4 stark-glow-cyan text-cyan-200 font-mono text-xs ${className}`}
    >
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-900/60 mb-3">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-cyan-400" />
          <span className="font-display font-bold text-sm tracking-widest text-cyan-100 uppercase">
            J.A.R.V.I.S. VOICE COMMAND DIRECTORY
          </span>
        </div>
        <span className="text-[10px] text-cyan-400/80 border border-cyan-800/60 px-2 py-0.5 rounded bg-cyan-950">
          WAKE WORD: "JARVIS"
        </span>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-cyan-500" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search voice commands (e.g. 'battery', 'terminal', 'repulsor', 'quantum')..."
            className="w-full bg-slate-900/80 border border-cyan-800/80 rounded-lg pl-9 pr-3 py-2 text-cyan-100 placeholder-cyan-600 focus:outline-none focus:border-cyan-400 text-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'laptop', label: 'Laptop OS' },
            { id: 'workspace', label: 'Workspaces' },
            { id: 'reactor', label: '3D Reactor' },
            { id: 'knowledge', label: 'Knowledge' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                jarvisAudio.playHudBeep(1200, 0.04);
              }}
              className={`px-2.5 py-1.5 rounded text-[11px] font-mono shrink-0 transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900/80 text-cyan-300 hover:bg-cyan-950/80 border border-cyan-900/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Commands Grid */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-80 min-h-60">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-mono">
            No voice commands matching "{searchFilter}"
          </div>
        ) : (
          filtered.map((cmd) => (
            <div
              key={cmd.id}
              className="bg-slate-900/70 border border-cyan-900/60 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded bg-slate-950 border border-cyan-800/60 mt-0.5">
                  {cmd.icon}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    {cmd.triggerPhrases.map((phrase, i) => (
                      <span
                        key={i}
                        className="text-xs font-bold text-cyan-100 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded"
                      >
                        {phrase}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {cmd.actionDescription}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleTestCommand(cmd.sampleExecution)}
                className="px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 hover:border-cyan-400 text-cyan-300 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 self-end sm:self-center"
                title="Execute this command with J.A.R.V.I.S."
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>SPEAK / TEST</span>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-cyan-900/60 flex items-center justify-between text-[11px] text-cyan-400/80">
        <span>💡 TIP: Say "Jarvis" followed by any question to query universal knowledge</span>
        <span>{filtered.length} COMMANDS AVAILABLE</span>
      </div>
    </div>
  );
};
