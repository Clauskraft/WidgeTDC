import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob } from '@google/genai';
import type { TranscriptEntry } from '../types';
import { Button } from '../components/ui/Button';

// --- Audio Utility Functions ---
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
// --- End Audio Utility Functions ---

const LiveConversationWidget: React.FC<{ widgetId: string }> = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState('Klar til at starte');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const sessionPromise = useRef<Promise<any> | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const inputAudioContext = useRef<AudioContext | null>(null);
  const outputAudioContext = useRef<AudioContext | null>(null);
  const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
  const nextStartTime = useRef(0);
  const audioSources = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const stopConversation = useCallback(() => {
    setStatusText('Stopper...');
    setIsRecording(false);

    sessionPromise.current?.then(session => session.close());
    sessionPromise.current = null;

    mediaStream.current?.getTracks().forEach(track => track.stop());
    mediaStream.current = null;

    scriptProcessor.current?.disconnect();
    scriptProcessor.current = null;

    inputAudioContext.current?.close();
    inputAudioContext.current = null;

    audioSources.current.forEach(source => source.stop());
    audioSources.current.clear();

    setStatusText('Klar til at starte');
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (isRecording) {
        stopConversation();
      }
    };
  }, [isRecording, stopConversation]);

  const startConversation = async () => {
    if (!process.env.API_KEY) {
      setStatusText('API nøgle mangler. Sæt den i secrets.');
      return;
    }

    setStatusText('Starter...');
    setTranscript([]);
    setIsRecording(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;

      // FIX: Cast `window` to `any` to access `webkitAudioContext` for older browsers without TypeScript errors.
      inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      nextStartTime.current = 0;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      sessionPromise.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setStatusText('Lytter...');
            const source = inputAudioContext.current!.createMediaStreamSource(stream);
            scriptProcessor.current = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);

            scriptProcessor.current.onaudioprocess = audioProcessingEvent => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob: GenAIBlob = {
                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.current?.then(session =>
                session.sendRealtimeInput({ media: pcmBlob })
              );
            };

            source.connect(scriptProcessor.current);
            scriptProcessor.current.connect(inputAudioContext.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle transcription
            if (message.serverContent?.inputTranscription) {
              // FIX: Property 'isFinal' does not exist on type 'Transcription'.
              // Infer finality from the `turnComplete` flag in the same server message.
              const { text } = message.serverContent.inputTranscription;
              const isFinal = !!message.serverContent.turnComplete;
              setTranscript(prev => {
                const last = prev[prev.length - 1];
                if (last?.speaker === 'user' && !last.isFinal) {
                  return [...prev.slice(0, -1), { speaker: 'user', text, isFinal }];
                }
                return [...prev, { speaker: 'user', text, isFinal }];
              });
            }
            if (message.serverContent?.outputTranscription) {
              // FIX: Property 'isFinal' does not exist on type 'Transcription'.
              // Infer finality from the `turnComplete` flag in the same server message.
              const { text } = message.serverContent.outputTranscription;
              const isFinal = !!message.serverContent.turnComplete;
              setTranscript(prev => {
                const last = prev[prev.length - 1];
                if (last?.speaker === 'model' && !last.isFinal) {
                  return [...prev.slice(0, -1), { speaker: 'model', text, isFinal }];
                }
                return [...prev, { speaker: 'model', text, isFinal }];
              });
            }

            // Handle audio playback
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContext.current) {
              setStatusText('Taler...');
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputAudioContext.current,
                24000,
                1
              );
              const sourceNode = outputAudioContext.current.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(outputAudioContext.current.destination);

              const currentTime = outputAudioContext.current.currentTime;
              const startTime = Math.max(currentTime, nextStartTime.current);
              sourceNode.start(startTime);
              nextStartTime.current = startTime + audioBuffer.duration;

              audioSources.current.add(sourceNode);
              sourceNode.onended = () => {
                audioSources.current.delete(sourceNode);
                if (audioSources.current.size === 0) {
                  setStatusText('Lytter...');
                }
              };
            }

            if (message.serverContent?.interrupted) {
              audioSources.current.forEach(source => source.stop());
              audioSources.current.clear();
              nextStartTime.current = 0;
            }
          },
          onclose: () => {
            setStatusText('Forbindelse lukket.');
            stopConversation();
          },
          onerror: (e: ErrorEvent) => {
            const errorMessage = e.message || 'En ukendt WebSocket-fejl opstod.';
            console.error('Live Conversation WebSocket error:', errorMessage, e);
            setStatusText(`Fejl i forbindelse: ${errorMessage}`);
            stopConversation();
          },
        },
      });
    } catch (error) {
      console.error('Could not start conversation:', error);
      setStatusText('Kunne ikke få adgang til mikrofon.');
      setIsRecording(false);
    }
  };

  const handleToggleConversation = () => {
    if (isRecording) {
      stopConversation();
    } else {
      startConversation();
    }
  };

  return (
    <div className="h-full flex flex-col -m-4">
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {transcript.map((entry, index) => (
          <div
            key={index}
            className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <p
              className={`p-2 rounded-lg max-w-[85%] text-sm ${
                entry.speaker === 'user'
                  ? 'bg-blue-100 dark:bg-blue-900/70'
                  : 'bg-gray-100 dark:bg-gray-700'
              } ${!entry.isFinal ? 'opacity-70' : ''}`}
            >
              {entry.text}
            </p>
          </div>
        ))}
        <div ref={transcriptEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2">
        <Button
          onClick={handleToggleConversation}
          variant={isRecording ? 'destructive' : 'success'}
          className="px-6 rounded-full"
        >
          {isRecording ? 'Stop Samtale' : 'Start Samtale'}
        </Button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{statusText}</p>
      </div>
    </div>
  );
};

export default LiveConversationWidget;
