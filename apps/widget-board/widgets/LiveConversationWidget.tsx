import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob } from "@google/genai";
import type { TranscriptEntry } from '../types';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { Mic, MicOff, Activity, Volume2 } from 'lucide-react';

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

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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
    const [statusText, setStatusText] = useState('Ready');
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
        setStatusText('Stopping...');
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

        setStatusText('Ready');
    }, []);

    useEffect(() => {
        return () => {
             // Cleanup on unmount
            if(isRecording) {
                stopConversation();
            }
        };
    }, [isRecording, stopConversation]);

    const startConversation = async () => {
        // Accessing env via window or a config object might be safer than process.env in Vite client
        const apiKey = (import.meta.env as Record<string, string | undefined>)?.VITE_GEMINI_API_KEY || ''; 
        
        if (!apiKey) {
            setStatusText("No API Key found.");
            return;
        }

        setStatusText('Initializing...');
        setTranscript([]);
        setIsRecording(true);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStream.current = stream;

            // FIX: Cast `window` to `any` to access `webkitAudioContext` for older browsers without TypeScript errors.
            inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTime.current = 0;

            const ai = new GoogleGenAI({ apiKey });
            
            sessionPromise.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    // @ts-ignore - Types might be outdated in the library
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        setStatusText('Listening...');
                        const source = inputAudioContext.current!.createMediaStreamSource(stream);
                        scriptProcessor.current = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessor.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: GenAIBlob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromise.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        
                        source.connect(scriptProcessor.current);
                        scriptProcessor.current.connect(inputAudioContext.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle transcription
                        const serverContent = message.serverContent;
                        if (serverContent?.inputTranscription) {
                           // Fix for missing properties by checking serverContent.turnComplete directly
                            // @ts-ignore
                            const text = serverContent.inputTranscription.text || "";
                             // @ts-ignore
                            const isFinal = !!serverContent.turnComplete;
                            
                            if(text) {
                                setTranscript(prev => {
                                    const last = prev[prev.length - 1];
                                    if (last?.speaker === 'user' && !last.isFinal) {
                                        return [...prev.slice(0, -1), { speaker: 'user', text, isFinal }];
                                    }
                                    return [...prev, { speaker: 'user', text, isFinal }];
                                });
                            }
                        }
                        
                        if (serverContent?.modelTurn) {
                             // @ts-ignore - The type definition might be missing text inside modelTurn parts sometimes
                            const text = serverContent.modelTurn.parts?.[0]?.text;
                             // @ts-ignore
                            const isFinal = !!serverContent.turnComplete;
                            
                            if (text) {
                                 setTranscript(prev => {
                                    const last = prev[prev.length - 1];
                                    if (last?.speaker === 'model' && !last.isFinal) {
                                        return [...prev.slice(0, -1), { speaker: 'model', text, isFinal }];
                                    }
                                    return [...prev, { speaker: 'model', text, isFinal }];
                                });
                            }
                        }
                        
                        // Handle audio playback
                        // @ts-ignore
                        const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContext.current) {
                            setStatusText('Speaking...');
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext.current, 24000, 1);
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
                                    setStatusText('Listening...');
                                }
                            };
                        }

                        if(serverContent?.interrupted) {
                            audioSources.current.forEach(source => source.stop());
                            audioSources.current.clear();
                            nextStartTime.current = 0;
                        }
                    },
                    onclose: () => {
                        setStatusText('Connection closed.');
                        stopConversation();
                    },
                    onerror: (e: ErrorEvent) => {
                        const errorMessage = e.message || 'Unknown WebSocket error.';
                        console.error('Live Conversation WebSocket error:', errorMessage, e);
                        setStatusText(`Connection error: ${errorMessage}`);
                        stopConversation();
                    },
                },
            });

        } catch (error) {
            console.error("Could not start conversation:", error);
            setStatusText('Microphone access failed.');
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
        <MatrixWidgetWrapper title="Gemini Live Voice">
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto space-y-3 p-1 custom-scrollbar">
                    {transcript.length === 0 && !isRecording && (
                         <div className="h-full flex flex-col items-center justify-center text-gray-500/40 gap-2">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                <Mic size={24} strokeWidth={1.5} />
                            </div>
                            <p className="text-xs text-center max-w-[200px]">Real-time voice conversation with Gemini 2.0 Flash</p>
                        </div>
                    )}
                    
                    {transcript.map((entry, index) => (
                        <div key={index} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-xl max-w-[85%] text-xs ${
                                entry.speaker === 'user' 
                                ? 'bg-[#00B5CB]/20 text-white border border-[#00B5CB]/30' 
                                : 'bg-white/5 text-gray-300 border border-white/10'
                            } ${!entry.isFinal ? 'opacity-70' : ''}`}>
                                {entry.text}
                            </div>
                        </div>
                    ))}
                     <div ref={transcriptEndRef} />
                </div>
                
                <div className="pt-4 mt-2 border-t border-white/5 flex flex-col items-center gap-3">
                    {/* Visualizer / Status */}
                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                        {isRecording && (
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                        <span>{statusText}</span>
                    </div>

                    {/* Controls */}
                    <button 
                        onClick={handleToggleConversation}
                        className={`
                            w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg
                            ${isRecording 
                                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500/30' 
                                : 'bg-[#00B5CB]/20 text-[#00B5CB] border-2 border-[#00B5CB]/50 hover:bg-[#00B5CB]/30 hover:scale-105'}
                        `}
                    >
                        {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                </div>
            </div>
        </MatrixWidgetWrapper>
    );
};

export default LiveConversationWidget;