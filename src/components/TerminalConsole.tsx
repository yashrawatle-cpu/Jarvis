import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Trash2, Cpu, Zap, CornerDownLeft } from 'lucide-react';
import { TerminalEntry } from '../types';
import { jarvisAudio } from './AudioSynthesizer';

interface TerminalConsoleProps {
  entries: TerminalEntry[];
  onExecuteCommand: (cmd: string) => void;
  onClear: () => void;
  className?: string;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  entries,
  onExecuteCommand,
  onClear,
  className = '',
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    jarvisAudio.playHudBeep(1300, 0.05);
    setHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);
    onExecuteCommand(cmd);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx < history.length) {
          setHistoryIdx(nextIdx);
          setInputVal(history[nextIdx]);
        } else {
          setHistoryIdx(-1);
          setInputVal('');
        }
      }
    }
  };

  return (
    <div
      className={`flex flex-col bg-slate-950/95 border border-cyan-800/80 rounded-xl p-4 stark-glow-cyan font-mono text-xs text-cyan-200 ${className}`}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-900/60 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-display font-bold text-sm tracking-widest text-cyan-100 uppercase">
            J.A.R.V.I.S. QUANTUM BASH CONSOLE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-cyan-400/70">STARK-KERNEL v85.4</span>
          <button
            onClick={onClear}
            className="p-1 rounded hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Clear Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Log Area */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-72 min-h-48 select-text">
        {entries.map((entry) => {
          let badgeColor = 'text-cyan-400';
          let border = 'border-cyan-900/40';

          if (entry.type === 'user') {
            badgeColor = 'text-amber-400 font-bold';
          } else if (entry.type === 'jarvis') {
            badgeColor = 'text-cyan-300';
          } else if (entry.type === 'error') {
            badgeColor = 'text-rose-400';
            border = 'border-rose-900/40';
          } else if (entry.type === 'success') {
            badgeColor = 'text-emerald-400';
            border = 'border-emerald-900/40';
          }

          return (
            <div
              key={entry.id}
              className={`p-2 rounded bg-slate-900/60 border ${border} flex flex-col gap-0.5`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className={badgeColor}>
                  {entry.type === 'user' ? 'USER@LAPTOP' : entry.type === 'jarvis' ? 'J.A.R.V.I.S.' : 'SYSTEM'}
                </span>
                <span>{entry.timestamp}</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-cyan-100">
                {entry.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick Shell Command Suggestions */}
      <div className="flex items-center gap-1.5 py-2 border-t border-cyan-900/60 mt-2 overflow-x-auto text-[10px] text-cyan-400/80">
        <span className="text-slate-500 shrink-0">EXEC:</span>
        {['help', 'sysinfo', 'battery', 'repulsor', 'scan', 'matrix', 'clear'].map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => onExecuteCommand(cmd)}
            className="px-2 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-800/60 text-cyan-300 transition-colors shrink-0"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Input Prompt */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2 pt-2 border-t border-cyan-900/60">
        <span className="text-cyan-400 font-bold select-none">stark@jarvis:~$</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command ('help', 'sysinfo', 'battery', 'ask ...')"
          className="flex-1 bg-transparent text-cyan-100 focus:outline-none placeholder-cyan-700 font-mono text-xs"
        />
        <button
          type="submit"
          className="p-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
