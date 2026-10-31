import { NextResponse } from 'next/server';
import { loadSystemPrompt } from '@/lib/maya/callMaya';
import { isFirebaseConfigured } from '@/lib/firebase/client';

export async function GET() {
  let promptLoaded = false;
  let promptLength = 0;
  let promptPreview = '';

  try {
    const prompt = await loadSystemPrompt();
    promptLoaded = true;
    promptLength = prompt.length;
    promptPreview = prompt.slice(0, 100);
  } catch (err) {
    console.error('Health check failed to load system prompt:', err);
  }

  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL);

  return NextResponse.json({
    status: 'ok',
    app: 'Made in Heaven',
    systemPrompt: {
      loaded: promptLoaded,
      characters: promptLength,
      preview: promptPreview,
    },
    services: {
      geminiConfigured,
      geminiModel: process.env.GEMINI_MODEL || 'not_set',
      geminiChatModel: process.env.GEMINI_CHAT_MODEL || 'not_set',
      firebaseConfigured: isFirebaseConfigured(),
      storageDriver: process.env.STORAGE_DRIVER || 'local',
    },
    version: '0ff7814',
    storageDriver: process.env.STORAGE_DRIVER || 'local',
    timestamp: new Date().toISOString(),
  });
}
