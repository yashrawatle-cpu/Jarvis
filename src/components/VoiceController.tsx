import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  Radio,
  Loader2,
  Zap,
  Languages,
} from 'lucide-react';
import { WakeWordState, SupportedLanguage } from '../types';
import { jarvisAudio } from './AudioSynthesizer';

interface VoiceControllerProps {
  onSendCommand: (command: string) => void;
  isProcessing: boolean;
  onAudioLevelChange: (level: number) => void;
  lastReplyText: string | null;
  onWakeStateChange?: (state: WakeWordState, countdown: number) => void;
  language?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  onSendCommand,
  isProcessing,
  onAudioLevelChange,
  lastReplyText,
  onWakeStateChange,
  language = 'en',
  onLanguageChange,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  // Wake Word Detection State
  const [requireWakeWord, setRequireWakeWord] = useState<boolean>(true);
  const [wakeState, setWakeState] = useState<WakeWordState>('standby');
  const [wakeCountdown, setWakeCountdown] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wakeTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Keep refs for speech recognition callbacks
  const requireWakeWordRef = useRef(requireWakeWord);
  requireWakeWordRef.current = requireWakeWord;

  const wakeStateRef = useRef(wakeState);
  wakeStateRef.current = wakeState;

  const languageRef = useRef(language);
  languageRef.current = language;

  // Clear wake state timers helper
  const clearWakeTimer = useCallback(() => {
    if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    wakeTimerRef.current = null;
    countdownIntervalRef.current = null;
    setWakeCountdown(0);
  }, []);

  // Notify parent of wake state
  useEffect(() => {
    onWakeStateChange?.(wakeState, wakeCountdown);
  }, [wakeState, wakeCountdown, onWakeStateChange]);

  // Activate Awake Command Window (7 seconds)
  const triggerWakeWindow = useCallback(() => {
    clearWakeTimer();
    setWakeState('awake_listening_command');
    jarvisAudio.playWakeWordChime();

    let remaining = 7;
    setWakeCountdown(remaining);

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setWakeCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
      }
    }, 1000);

    wakeTimerRef.current = setTimeout(() => {
      setWakeState('listening_wake');
      clearWakeTimer();
    }, 7000);
  }, [clearWakeTimer]);

  // Multilingual Wake Word regex: Matches "Jarvis" in English and "जार्विस" in Devanagari (Hindi / Marathi)
  const wakeWordRegex =
    /(?:^|\b)(?:(?:hey|ok|okay|hi|hello|हे|अरे|सुनो|ऐक|नमस्ते|नमस्कार)\s+)?(?:jarvis|जार्विस)[\s,.:;!?]*(.*)/i;

  // Initialize Speech Recognition based on selected language
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Set recognition language code
    if (language === 'hi') {
      recognition.lang = 'hi-IN';
    } else if (language === 'mr') {
      recognition.lang = 'mr-IN';
    } else {
      recognition.lang = 'en-US';
    }

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      const activeText = (finalTranscript || currentInterim).trim();
      setTranscript(activeText);

      const isWakeWordPresent = wakeWordRegex.test(activeText);

      if (requireWakeWordRef.current) {
        // CASE 1: Currently awaiting wake word "Jarvis" / "जार्विस"
        if (wakeStateRef.current === 'listening_wake') {
          if (isWakeWordPresent) {
            const match = activeText.match(wakeWordRegex);
            const postCommand = match && match[1] ? match[1].trim() : '';

            if (finalTranscript.trim().length > 0) {
              if (postCommand.length > 0) {
                // User said "Jarvis [command]" / "जार्विस [आदेश]" in one go!
                jarvisAudio.playWakeWordChime();
                clearWakeTimer();
                setWakeState('listening_wake');
                onSendCommand(postCommand);
                setTranscript('');
              } else {
                // User just said "Jarvis" / "जार्विस"! Open 7-second command window
                triggerWakeWindow();
                setTranscript('');
              }
            } else if (postCommand.length === 0 && !wakeTimerRef.current) {
              // Interim match
              triggerWakeWindow();
            }
          }
        }
        // CASE 2: Already awake and awaiting follow-up command
        else if (wakeStateRef.current === 'awake_listening_command') {
          if (finalTranscript.trim().length > 0) {
            const cleanCommand =
              finalTranscript.replace(wakeWordRegex, '$1').trim() ||
              finalTranscript.trim();
            clearWakeTimer();
            setWakeState('listening_wake');
            onSendCommand(cleanCommand);
            setTranscript('');
          }
        }
      } else {
        // Direct Mode (Wake word disabled): dispatch any final speech
        if (finalTranscript.trim().length > 0) {
          onSendCommand(finalTranscript.trim());
          setTranscript('');
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setIsListening(false);
        setWakeState('standby');
        clearWakeTimer();
      }
    };

    // Auto-restart recognition for persistent wake-word listener
    recognition.onend = () => {
      if (isListening) {
        try {
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 250);
        } catch {}
      }
    };

    recognitionRef.current = recognition;

    // If already listening when language changes, restart recognition with new language
    if (isListening) {
      try {
        recognition.start();
      } catch {}
    }

    return () => {
      try {
        recognition.stop();
      } catch {}
      clearWakeTimer();
    };
  }, [language, isListening, onSendCommand, triggerWakeWindow, clearWakeTimer]);

  // Multilingual Speech Synthesis Playback
  useEffect(() => {
    if (!lastReplyText) return;

    let isCancelled = false;

    const playTts = async () => {
      // For English, first attempt Gemini Flash Lite TTS
      if (language === 'en') {
        try {
          setIsSpeaking(true);
          jarvisAudio.playHudBeep(900, 0.05);

          const res = await fetch('/api/jarvis/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: lastReplyText }),
          });

          if (res.ok && !isCancelled) {
            const data = await res.json();
            if (data.audioBase64) {
              const audio = new Audio(`data:${data.mimeType};base64,${data.audioBase64}`);

              const startTime = Date.now();
              const interval = setInterval(() => {
                if (audio.paused || audio.ended) {
                  clearInterval(interval);
                  onAudioLevelChange(0);
                  setIsSpeaking(false);
                } else {
                  const elapsed = (Date.now() - startTime) / 1000;
                  const wave = Math.abs(Math.sin(elapsed * 12)) * 0.7 + Math.random() * 0.3;
                  onAudioLevelChange(wave);
                }
              }, 60);

              await audio.play();
              return;
            }
          }
        } catch (err) {
          console.warn('Gemini TTS fetch error, fallback to browser SpeechSynthesis:', err);
        }
      }

      // Browser Web Speech API SpeechSynthesis for Hindi, Marathi, or English fallback
      if ('speechSynthesis' in window && !isCancelled) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(lastReplyText);
        utterance.rate = 1.0;
        utterance.pitch = 0.95;

        const voices = window.speechSynthesis.getVoices();
        let targetVoice = null;

        if (language === 'hi') {
          targetVoice = voices.find(
            (v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
          );
          utterance.lang = 'hi-IN';
        } else if (language === 'mr') {
          targetVoice =
            voices.find(
              (v) => v.lang.startsWith('mr') || v.name.toLowerCase().includes('marathi')
            ) ||
            voices.find(
              (v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
            );
          utterance.lang = targetVoice?.lang || 'mr-IN';
        } else {
          targetVoice = voices.find(
            (v) => v.lang.includes('en-GB') || v.name.includes('British') || v.name.includes('UK')
          );
          utterance.lang = 'en-GB';
        }

        if (targetVoice) {
          utterance.voice = targetVoice;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
          const interval = setInterval(() => {
            if (!window.speechSynthesis.speaking) {
              clearInterval(interval);
              setIsSpeaking(false);
              onAudioLevelChange(0);
            } else {
              const wave = Math.random() * 0.7 + 0.2;
              onAudioLevelChange(wave);
            }
          }, 80);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          onAudioLevelChange(0);
        };

        synthUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    };

    playTts();

    return () => {
      isCancelled = true;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      onAudioLevelChange(0);
    };
  }, [lastReplyText, language, onAudioLevelChange]);

  const toggleListening = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      clearWakeTimer();
      setIsListening(false);
      setWakeState('standby');
      onAudioLevelChange(0);
    } else {
      try {
        jarvisAudio.playHudBeep(1600, 0.08);
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;

        src.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;

        const dataArr = new Uint8Array(analyser.frequencyBinCount);

        const checkMicLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArr);
          let sum = 0;
          for (let i = 0; i < dataArr.length; i++) {
            sum += dataArr[i];
          }
          const avg = sum / dataArr.length / 255;
          onAudioLevelChange(avg);
          animFrameRef.current = requestAnimationFrame(checkMicLevel);
        };

        animFrameRef.current = requestAnimationFrame(checkMicLevel);
        setIsListening(true);
        setWakeState(requireWakeWord ? 'listening_wake' : 'awake_listening_command');
      } catch (err) {
        console.warn('Microphone activation warning:', err);
        setIsListening(false);
        setWakeState('standby');
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    onSendCommand(textInput.trim());
    setTextInput('');
  };

  const toggleWakeWordMode = () => {
    const nextMode = !requireWakeWord;
    setRequireWakeWord(nextMode);
    jarvisAudio.playHudBeep(nextMode ? 1400 : 900, 0.06);
    if (isListening) {
      setWakeState(nextMode ? 'listening_wake' : 'awake_listening_command');
      clearWakeTimer();
    }
  };

  // Localized placeholders & Quick commands
  const localizedContent = {
    en: {
      wakeText: (
        <span>
          WAKE WORD ACTIVE: SAY <strong className="text-cyan-100">"JARVIS"</strong> BEFORE COMMAND
        </span>
      ),
      awakeText: (secs: number) => `"JARVIS" DETECTED — YES, SIR? SPEAK YOUR COMMAND [${secs}s]`,
      standbyText: 'VOICE LISTENER INACTIVE — CLICK "START LISTENER" TO ACTIVATE',
      placeholderAwake: 'Listening for your command... (e.g. "optimize laptop memory")',
      placeholderWake: 'Say "Jarvis, [command]" or type a command...',
      placeholderDirect: 'Listening for speech command...',
      placeholderType: 'Enter voice command or question... (e.g. "Jarvis, run diagnostics")',
      speaking: 'JARVIS SPEAKING',
      quickLabel: 'QUICK COMMANDS:',
      wakeTriggerBtn: 'Say "Jarvis"',
      commands: [
        'Jarvis, run full laptop diagnostics',
        'Jarvis, optimize memory & scan network',
        'Jarvis, explain quantum supremacy in physics',
        'Jarvis, engage stealth mode',
        'Jarvis, play Stark lab ambient sound',
      ],
    },
    hi: {
      wakeText: (
        <span>
          वेक वर्ड सक्रिय: आदेश से पहले <strong className="text-cyan-100">"जार्विस"</strong> बोलें
        </span>
      ),
      awakeText: (secs: number) => `"जार्विस" सक्रिय — जी सर, आदेश दीजिए [${secs}s]`,
      standbyText: 'वॉयस लिसनर निष्क्रिय — "START LISTENER" पर क्लिक करें',
      placeholderAwake: 'आदेश दीजिए... (उदा. "मेमोरी ऑप्टिमाइज़ करो")',
      placeholderWake: 'बोलिए "जार्विस, [आदेश]" या टाइप करें...',
      placeholderDirect: 'आवाज सुन रहे हैं...',
      placeholderType: 'वॉयस कमांड या सवाल पूछें... (उदा. "जार्विस, बैटरी चेक करो")',
      speaking: 'जार्विस बोल रहे हैं',
      quickLabel: 'त्वरित कमांड्स (HINDI):',
      wakeTriggerBtn: 'बोलें "जार्विस"',
      commands: [
        'जार्विस, फुलस्क्रीन करो और बैटरी चेक करो',
        'जार्विस, मेमोरी ऑप्टिमाइज़ करो और नेटवर्क जांचो',
        'जार्विस, क्वांटम फिजिक्स के बारे में बताओ',
        'जार्विस, स्टेल्थ मोड चालू करो',
        'जार्विस, टर्मिनल कंसोल खोलो',
      ],
    },
    mr: {
      wakeText: (
        <span>
          वेक वर्ड सक्रिय: आज्ञेपूर्वी <strong className="text-cyan-100">"जार्विस"</strong> बोला
        </span>
      ),
      awakeText: (secs: number) => `"जार्विस" सक्रिय — बोला सर, काय आज्ञा आहे? [${secs}s]`,
      standbyText: 'व्हॉइस लिसनर बंद — "START LISTENER" वर क्लिक करा',
      placeholderAwake: 'कमांड द्या... (उदा. "मेमरी ऑप्टिमाइझ करा")',
      placeholderWake: 'बोला "जार्विस, [कमांड]" किंवा टाइप करा...',
      placeholderDirect: 'आवाज ऐकत आहे...',
      placeholderType: 'व्हॉइस कमांड किंवा प्रश्न विचारा... (उदा. "जार्विस, बॅटरी तपासा")',
      speaking: 'जार्विस बोलत आहेत',
      quickLabel: 'झटपट कमांड्स (MARATHI):',
      wakeTriggerBtn: 'बोला "जार्विस"',
      commands: [
        'जार्विस, फुलस्क्रीन करा आणि बॅटरी तपासा',
        'जार्विस, मेमरी ऑप्टिमाइझ करा आणि नेटवर्क तपासा',
        'जार्विस, क्वांटम कॉम्प्युटिंग समजावून सांगा',
        'जार्विस, स्टेल्थ मोड सुरू करा',
        'जार्विस, टर्मिनल कन्सोल उघडा',
      ],
    },
  }[language];

  return (
    <div className="flex flex-col gap-2 w-full max-w-2xl mx-auto">
      {/* Wake Word Status Banner + Language Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-cyan-800/80 text-[11px] font-mono text-cyan-300 shadow-md">
        <div className="flex items-center gap-2">
          {wakeState === 'awake_listening_command' ? (
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>{localizedContent.awakeText(wakeCountdown)}</span>
            </div>
          ) : wakeState === 'listening_wake' ? (
            <div className="flex items-center gap-1.5 text-cyan-300">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>{localizedContent.wakeText}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <MicOff className="w-3.5 h-3.5" />
              <span>{localizedContent.standbyText}</span>
            </div>
          )}
        </div>

        {/* Right side: Language Selector & Mode Toggle */}
        <div className="flex items-center gap-2">
          {/* Language Selector Pills */}
          <div className="flex items-center rounded bg-slate-900 border border-cyan-900/60 p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => {
                onLanguageChange?.('en');
                jarvisAudio.playHudBeep(1200, 0.04);
              }}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                language === 'en'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => {
                onLanguageChange?.('hi');
                jarvisAudio.playHudBeep(1200, 0.04);
              }}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                language === 'hi'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              हिंदी
            </button>
            <button
              type="button"
              onClick={() => {
                onLanguageChange?.('mr');
                jarvisAudio.playHudBeep(1200, 0.04);
              }}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                language === 'mr'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              मराठी
            </button>
          </div>

          {/* Wake Word Mode Toggle */}
          <button
            type="button"
            onClick={toggleWakeWordMode}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] transition-colors ${
              requireWakeWord
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-cyan-300'
            }`}
            title="Toggle whether saying 'Jarvis' / 'जार्विस' is required before commands"
          >
            <span>WAKE WORD:</span>
            <span className={requireWakeWord ? 'text-cyan-400' : 'text-slate-500'}>
              {requireWakeWord ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Speech input & text command field */}
      <form
        onSubmit={handleFormSubmit}
        className={`relative flex items-center bg-slate-950/90 border rounded-xl p-1.5 shadow-lg shadow-cyan-950/40 transition-all ${
          wakeState === 'awake_listening_command'
            ? 'border-amber-400 stark-glow-gold'
            : 'border-cyan-500/60 stark-glow-cyan'
        }`}
      >
        <button
          type="button"
          onClick={toggleListening}
          className={`p-2.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all ${
            wakeState === 'awake_listening_command'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/40'
              : isListening
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/40'
              : 'bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-400 border border-cyan-700/60'
          }`}
          title={isListening ? 'Click to pause voice listener' : 'Activate Voice Wake Listener'}
        >
          {wakeState === 'awake_listening_command' ? (
            <>
              <Zap className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">AWAKE ({wakeCountdown}s)</span>
            </>
          ) : isListening ? (
            <>
              <Radio className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">LISTENING</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">START LISTENER</span>
            </>
          )}
        </button>

        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={
            wakeState === 'awake_listening_command'
              ? localizedContent.placeholderAwake
              : isListening && requireWakeWord
              ? localizedContent.placeholderWake
              : isListening
              ? localizedContent.placeholderDirect
              : localizedContent.placeholderType
          }
          disabled={isProcessing}
          className="flex-1 bg-transparent px-3 py-1.5 text-sm font-mono text-cyan-100 placeholder-cyan-500/50 focus:outline-none"
        />

        {/* Wake Word Trigger Shortcut Button */}
        {isListening && requireWakeWord && wakeState === 'listening_wake' && (
          <button
            type="button"
            onClick={triggerWakeWindow}
            className="px-2 py-1 mr-1 text-[11px] font-mono rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-semibold transition-colors"
            title="Simulate saying 'Jarvis' wake word"
          >
            {localizedContent.wakeTriggerBtn}
          </button>
        )}

        {isSpeaking && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 mr-2 rounded bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 text-xs font-mono">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold">{localizedContent.speaking}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!textInput.trim() || isProcessing}
          className="p-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold transition-all"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Voice Transcript Display if actively dictating */}
      {transcript && (
        <div className="text-xs font-mono text-cyan-400 bg-slate-950/90 border border-cyan-800/80 px-3 py-1.5 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="opacity-70 shrink-0">Heard:</span>
            <span className="font-semibold italic text-cyan-100 truncate">"{transcript}"</span>
          </div>
          {(transcript.toLowerCase().includes('jarvis') ||
            transcript.includes('जार्विस')) && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600 shrink-0 ml-2">
              WAKE WORD MATCHED
            </span>
          )}
        </div>
      )}

      {/* Quick Tactical Voice Prompts Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-cyan-400/80">
        <span className="text-slate-500 mr-1">{localizedContent.quickLabel}</span>
        {localizedContent.commands.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => onSendCommand(cmd)}
            disabled={isProcessing}
            className="px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/40 hover:border-cyan-400 text-cyan-300 transition-colors"
          >
            "{cmd}"
          </button>
        ))}
      </div>
    </div>
  );
};
