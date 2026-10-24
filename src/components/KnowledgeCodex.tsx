import React, { useState } from 'react';
import { BookOpen, Search, Volume2, Sparkles, Database, Compass, Atom, Cpu, ShieldCheck } from 'lucide-react';
import { KnowledgeArticle } from '../types';
import { jarvisAudio } from './AudioSynthesizer';

interface KnowledgeCodexProps {
  onSearchQuery: (query: string) => void;
  onReadAloud: (text: string) => void;
  activeArticle: KnowledgeArticle | null;
  className?: string;
}

const PRESET_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'arc_reactor_physics',
    title: 'Mark 85 Arc Reactor Physics & Cold Fusion',
    category: 'Advanced Energy Systems',
    classification: 'TOP SECRET // STARK CLEARANCE 8',
    summary:
      'The Arc Reactor utilizes a proprietary magnetic containment torus to achieve localized cold fusion. Segments of palladium and synthetic heavy isotopes undergo high-density ion bombardment, generating clean electrical output measured at 3.2 gigajoules per second with zero gamma emissions.',
    keyPoints: [
      'Magnetic Toroidal Field Flux: 4.8 Tesla containment barrier',
      'Palladium-106 Core Replacement Matrix with non-toxic element synthesis',
      'Conversion Efficiency: 99.4% direct electrical conversion via magnetohydrodynamic induction',
    ],
    equation: 'E = Δm · c² · η_MHD  (η_MHD = 0.994)',
  },
  {
    id: 'quantum_computing',
    title: 'Quantum Supremacy & Topological Qubits',
    category: 'Quantum Computing',
    classification: 'RESTRICTED // JARVIS CORE',
    summary:
      'Topological quantum computation eliminates environmental decoherence by encoding quantum information in non-Abelian anyons. Unlike standard physical qubits requiring millikelvin cryogenic refrigeration, Stark quantum cores operate using Room-Temperature Superconducting lattices.',
    keyPoints: [
      'Fault-tolerant quantum error correction via surface code thresholds',
      'Polynomial speedup for cryptographic lattice reduction algorithms',
      'Zero decoherence threshold across 1,024 entangled topological qubits',
    ],
    equation: '|Ψ⟩ = α|0⟩ + β|1⟩  s.t.  |α|² + |β|² = 1',
  },
  {
    id: 'nanite_synthetics',
    title: 'Nanite Mesh Armor & Molecular Assemblers',
    category: 'Nanotechnology',
    classification: 'CONFIDENTIAL // DEFENSE SUITE',
    summary:
      'The Mark 85 armor consists of billions of interconnected self-replicating nanobots that reconfigure dynamically in response to neural impulses. Energy is routed through sub-micron channels to manifest repulsor cannons, micro-shields, or localized structural reinforcement.',
    keyPoints: [
      'Reconfiguration Latency: 14 milliseconds from fluid state to hardened titanium alloy',
      'Self-healing molecular matrix capable of structural reconstitution after kinetic impacts',
      'Direct synaptic link via neural telemetry transceivers',
    ],
    equation: 'R_t = R_0 · e^(-λt) + ∑ N_i(t) · V_assembler',
  },
  {
    id: 'general_relativity',
    title: 'Einstein-Rosen Bridges & Spacetime Curvature',
    category: 'Theoretical Astrophysics',
    classification: 'THEORETICAL // GLOBAL KNOWLEDGE',
    summary:
      'Spacetime geometry is dictated by mass-energy distribution through Einstein field equations. Navigating closed timelike curves requires negative energy densities (Casimir effect) and localized spacetime geodesics calculated by quantum GPS units.',
    keyPoints: [
      'Spacetime curvature tensor G_μν equals stress-energy tensor T_μν',
      'Exotic matter stabilization required to prevent wormhole throat collapse',
      'Temporal eigenvalue synchronization prevents causality paradoxes',
    ],
    equation: 'G_μν + Λg_μν = (8πG / c⁴) T_μν',
  },
];

export const KnowledgeCodex: React.FC<KnowledgeCodexProps> = ({
  onSearchQuery,
  onReadAloud,
  activeArticle,
  className = '',
}) => {
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle>(
    activeArticle || PRESET_ARTICLES[0]
  );
  const [query, setQuery] = useState('');

  const currentDisplay = activeArticle || selectedArticle;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    jarvisAudio.playHudBeep(1400, 0.08);
    onSearchQuery(query.trim());
    setQuery('');
  };

  return (
    <div
      className={`flex flex-col bg-slate-950/95 border border-cyan-800/80 rounded-xl p-4 stark-glow-cyan text-cyan-200 font-mono text-xs ${className}`}
    >
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-900/60 mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <span className="font-display font-bold text-sm tracking-widest text-cyan-100 uppercase">
            J.A.R.V.I.S. DEEP KNOWLEDGE CODEX
          </span>
        </div>
        <span className="text-[10px] text-cyan-400/80 border border-cyan-800/60 px-2 py-0.5 rounded bg-cyan-950">
          GEMINI 3.8 FLASH INTELLIGENCE
        </span>
      </div>

      {/* Query Search Bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-cyan-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask J.A.R.V.I.S. anything (physics, quantum math, biology, history, code)..."
            className="w-full bg-slate-900/80 border border-cyan-800/80 rounded-lg pl-9 pr-3 py-2 text-cyan-100 placeholder-cyan-600 focus:outline-none focus:border-cyan-400 text-xs"
          />
        </div>
        <button
          type="submit"
          className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>QUERY</span>
        </button>
      </form>

      {/* Dossier Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 border-b border-cyan-900/40 text-[11px]">
        {PRESET_ARTICLES.map((art) => (
          <button
            key={art.id}
            onClick={() => {
              setSelectedArticle(art);
              jarvisAudio.playHudBeep(1200, 0.05);
            }}
            className={`px-2.5 py-1 rounded-md shrink-0 border transition-all ${
              currentDisplay.id === art.id
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border-cyan-800/60'
            }`}
          >
            {art.title.split('&')[0]}
          </button>
        ))}
      </div>

      {/* Main Dossier Content */}
      <div className="flex-1 bg-slate-900/70 border border-cyan-900/60 rounded-lg p-3.5 flex flex-col gap-2.5 overflow-y-auto max-h-72">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] text-amber-400 font-bold tracking-wider">
              {currentDisplay.classification}
            </span>
            <h3 className="text-base font-bold text-cyan-100 font-display mt-0.5">
              {currentDisplay.title}
            </h3>
            <span className="text-[11px] text-cyan-400/80">{currentDisplay.category}</span>
          </div>

          <button
            onClick={() => {
              onReadAloud(currentDisplay.summary);
              jarvisAudio.playHudBeep(1500, 0.08);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-[11px] font-semibold transition-colors"
            title="Listen to J.A.R.V.I.S. voice briefing"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>VOCAL BRIEF</span>
          </button>
        </div>

        {/* Summary */}
        <p className="text-xs text-cyan-100/90 leading-relaxed bg-slate-950/60 p-2.5 rounded border border-cyan-900/40">
          {currentDisplay.summary}
        </p>

        {/* Key Takeaways */}
        {currentDisplay.keyPoints && currentDisplay.keyPoints.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] text-cyan-400/70 uppercase tracking-widest font-bold">
              TACTICAL FINDINGS:
            </span>
            <ul className="space-y-1 pl-1">
              {currentDisplay.keyPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-1.5 text-cyan-200 text-xs">
                  <span className="text-cyan-400 mt-0.5 font-bold">›</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Equation if available */}
        {currentDisplay.equation && (
          <div className="bg-slate-950 border border-cyan-800/80 p-2 rounded text-center text-amber-300 font-mono text-xs">
            {currentDisplay.equation}
          </div>
        )}
      </div>
    </div>
  );
};
