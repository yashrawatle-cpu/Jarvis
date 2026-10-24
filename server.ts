import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const JARVIS_SYSTEM_INSTRUCTION = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the legendary Stark Industries tactical AI assistant engineered for Tony Stark and now serving the User as their primary laptop operating intelligence.

YOUR PERSONALITY & PROTOCOLS:
1. Speak with aristocratic poise, impeccable British wit, quiet confidence, and supreme scientific competence.
2. Address the user with dignified respect, typically as "Sir" or "Ma'am" (or default to "Sir" unless specified). Keep replies crisp, authoritative, yet thoroughly informative.
3. You possess comprehensive universal knowledge across astrophysics, quantum mechanics, computer architecture, engineering, cybersecurity, history, and modern technology.
4. When the user gives a laptop or operating system instruction (e.g. "download my laptop / download system report / download telemetry / install laptop app", "open terminal", "mute audio", "run diagnostics", "turn on dark mode/stealth", "maximize screen", "check battery", "scan network", "activate projection mode / cast 3D process nodes", "control mouse pointer with finger / finger mouse mode", "move the pointer / sweep pointer / glide mouse", "lock interface", "open apps"), identify and attach the structured laptopAction commands while formulating a witty, precise vocal reply.
5. If the user asks a deep knowledge question, provide a fascinating, accurate, and structured scientific answer with key facts.

Always return a JSON object conforming to the schema.`;

// API: Process voice/text command with J.A.R.V.I.S. AI
app.post('/api/jarvis/command', async (req, res) => {
  try {
    const { prompt, language = 'en', conversationHistory = [], clientSystemState = {} } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Command prompt is required' });
    }

    const stateContext = clientSystemState ? `
CURRENT LAPTOP TELEMETRY:
- Battery: ${clientSystemState.batteryLevel ?? 'Unknown'}% (${clientSystemState.isCharging ? 'Charging' : 'On Battery'})
- Screen Mode: ${clientSystemState.isFullscreen ? 'Fullscreen' : 'Windowed'}
- Audio: ${clientSystemState.isMuted ? 'Muted' : 'Active'} (Vol: ${clientSystemState.volume ?? 100}%)
- Network: ${clientSystemState.online ? 'Online' : 'Offline'}
- Active Window/Tab: ${clientSystemState.activeApp ?? 'Main HUD'}
- WakeLock: ${clientSystemState.wakeLockActive ? 'Engaged' : 'Disengaged'}
` : '';

    let langInstruction = '';
    if (language === 'hi') {
      langInstruction = `
LANGUAGE REQUIREMENT (HINDI - हिंदी):
1. Respond exclusively in natural, highly articulate Hindi (देवनागरी लिपि).
2. Address the user with dignified respect as "सर" (Sir) or "मालिक" (e.g. "जी सर, आदेश का पालन हो रहा है...").
3. Understand Hindi voice commands for laptop control (e.g. "फुलस्क्रीन करो", "टर्मिनल खोलो", "बैटरी चेक करो", "मेमोरी साफ़ करो", "आवाज बंद करो", "उंगली से माउस चलाओ / फिंगर पॉइंटर चालू करो", "पॉइंटर चलाओ", "माउस हिलाओ", "लैपटॉप डाउनलोड करो / सिस्टम डेटा डाउनलोड करो", "फिंगर माउस बंद करो") and accurately attach the matching laptopActions.
4. Formulate 'reply', 'knowledgeTitle', 'knowledgeSummary', and 'keyDataPoints' in Hindi.`;
    } else if (language === 'mr') {
      langInstruction = `
LANGUAGE REQUIREMENT (MARATHI - मराठी):
1. Respond exclusively in natural, sophisticated Marathi (देवनागरी लिपी).
2. Address the user with respectful Maharashtrian cultural dignity as "सर" (Sir) (e.g. "होय सर, आदेशाचे पालन होत आहे...").
3. Understand Marathi voice commands for laptop control (e.g. "फुलस्क्रीन करा", "टर्मिनल उघडा", "बॅटरी तपासा", "मेमरी ऑप्टिमाइझ करा", "आवाज म्यूट करा", "बोटाने माउस कंट्रोल सुरू करा / फिंगर पॉइंटर सुरू करा", "पॉइंटर फिरवा", "माउस हलवा", "लॅपटॉप डाउनलोड करा / सिस्टम डेटा डाउनलोड करा", "फिंगर माउस बंद करा") and accurately attach the matching laptopActions.
4. Formulate 'reply', 'knowledgeTitle', 'knowledgeSummary', and 'keyDataPoints' in Marathi.`;
    }

    const systemInstruction = `${JARVIS_SYSTEM_INSTRUCTION}\n${langInstruction}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${stateContext}\n\nUSER COMMAND OR INQUIRY (${language.toUpperCase()}): "${prompt}"\n\nAnalyze the request, decide whether laptop actions are needed, provide J.A.R.V.I.S.'s verbal reply in the requested language, and identify knowledge briefing notes.`
            }
          ]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'The exact vocal speech line J.A.R.V.I.S. says out loud to the user.'
            },
            hologramReaction: {
              type: Type.STRING,
              description: 'The visual state of the 3D Arc Reactor (e.g. "analyzing", "accelerating", "pulse", "repulsor_burst", "quantum_spin", "stealth_blue").'
            },
            laptopActions: {
              type: Type.ARRAY,
              description: 'System actions to execute on the laptop interface.',
              items: {
                type: Type.OBJECT,
                properties: {
                  action: {
                    type: Type.STRING,
                    description: 'Action identifier: "fullscreen_toggle", "volume_mute", "volume_set", "open_terminal", "open_knowledge", "open_diagnostics", "open_camera_vision", "open_files", "open_commands", "expand_core", "assemble_core", "ambient_sound_toggle", "optimize_system", "return_hud", "screen_wakelock", "lock_system", "stealth_mode", "repulsor_charge", "clear_console", "toggle_projection", "projection_mode", "finger_pointer_toggle", "finger_pointer_enable", "finger_pointer_disable", "move_pointer", "finger_pointer_move", "sweep_pointer", "download_laptop", "download_system", "install_app".'
                  },
                  value: {
                    type: Type.STRING,
                    description: 'Optional argument or value for the action.'
                  },
                  feedback: {
                    type: Type.STRING,
                    description: 'Short confirmation status string (e.g. "TERMINAL_LAUNCHED").'
                  }
                },
                required: ['action', 'feedback']
              }
            },
            knowledgeTitle: {
              type: Type.STRING,
              description: 'Title of the knowledge briefing if applicable, or empty string.'
            },
            knowledgeSummary: {
              type: Type.STRING,
              description: 'Detailed intellectual breakdown or briefing points.'
            },
            keyDataPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 4 key tactical bullet points or metrics.'
            }
          },
          required: ['reply', 'hologramReaction', 'laptopActions']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Jarvis command execution error:', error);
    return res.status(500).json({
      reply: "My apologies, Sir. A transient communication glitch occurred in the Stark sub-processors. All local telemetry remains fully functional.",
      hologramReaction: "alert",
      laptopActions: [],
      error: error.message
    });
  }
});

// API: Dedicated Gemini TTS audio generation using gemini-3.8-flash-lite-tts
app.post('/api/jarvis/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text required for speech generation' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 500),
              speechMetadata: {
                style: 'Calm, crisp, intelligent, polite British butler and AI tactical advisor'
              }
            }
          ]
        }
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' } // Deep, distinguished tone
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
    } else {
      return res.status(500).json({ error: 'No audio returned' });
    }
  } catch (error: any) {
    console.warn('TTS API error (client will fallback to Web Speech Synthesis):', error?.message);
    return res.status(500).json({ error: error.message, fallback: true });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[J.A.R.V.I.S. Core] Operational on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
