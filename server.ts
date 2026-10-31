import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import apiRouter from './server/routes/api.ts';
import { ai, hasGeminiKey } from './server/services/gemini.ts';
import { Modality } from '@google/genai';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount REST API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'NEXORA – Subscription & Revenue Intelligence Platform',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);

  // Setup WebSocket bridge for Gemini Live API (gemini-3.8-live)
  const wss = new WebSocketServer({ server, path: '/ws/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Live API] Client connected to live audio stream.');

    if (!hasGeminiKey()) {
      clientWs.send(
        JSON.stringify({
          info: 'Gemini Live simulated session ready. Connect GEMINI_API_KEY in Secrets for live neural voice response.',
        })
      );
      clientWs.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.text || parsed.audio) {
            clientWs.send(
              JSON.stringify({
                text: 'Simulated voice reply from NEXORA Live Assistant: Your subscription ARR is healthy and zero leakage is detected.',
              })
            );
          }
        } catch (e) {
          // ignore
        }
      });
      return;
    }

    try {
      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction:
            'You are NEXORA Voice Intelligence, an enterprise subscription financial and billing assistant. Speak concisely, clearly, and authoritatively about SaaS recurring metrics, revenue leakage, invoice statuses, and subscriber retention.',
        },
        callbacks: {
          onmessage: (message: any) => {
            for (const part of message.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onerror: (err: any) => {
            console.error('[Live API] Session error:', err);
            clientWs.send(JSON.stringify({ error: err?.message || 'Live session error' }));
          },
          onclose: () => {
            clientWs.send(JSON.stringify({ closed: true }));
          },
        },
      });

      clientWs.on('message', (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          }
        } catch (err) {
          console.error('[Live API] Error forwarding audio to session:', err);
        }
      });

      clientWs.on('close', () => {
        try {
          session.close();
        } catch (e) {
          // ignore
        }
      });
    } catch (err: any) {
      console.error('[Live API] Failed to connect to Gemini Live session:', err);
      clientWs.send(JSON.stringify({ error: err.message || 'Could not connect to Gemini Live' }));
      clientWs.close();
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`NEXORA Platform running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
