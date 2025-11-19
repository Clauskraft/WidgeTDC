import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button } from '../components/ui/Button';

const AudioTranscriberWidget: React.FC<{ widgetId: string }> = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleToggleRecording = () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
        } else {
            startRecording();
        }
    };

    const startRecording = async () => {
        if (!process.env.API_KEY) {
            setError("API nøgle mangler.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            setTranscription('');
            setError(null);

            mediaRecorderRef.current.addEventListener("dataavailable", event => {
                audioChunksRef.current.push(event.data);
            });

            mediaRecorderRef.current.addEventListener("stop", handleStop);
            
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Kunne ikke få adgang til mikrofon.");
        }
    };
    
    const handleStop = async () => {
        setIsRecording(false);
        setIsLoading(true);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Data = (reader.result as string).split(',')[1];
                const audioPart = {
                    inlineData: {
                        mimeType: audioBlob.type,
                        data: base64Data
                    }
                };
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [audioPart, { text: "Transcribe this audio." }] }
                });
                setTranscription(response.text);
                setIsLoading(false);
            };
        } catch (err) {
            console.error("Transcription failed:", err);
            setError("Transskription fejlede.");
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-full flex flex-col items-center justify-center text-center -m-4">
            <Button
                onClick={handleToggleRecording}
                variant={isRecording ? 'destructive' : 'primary'}
                className={`px-8 py-4 rounded-full transition-all duration-300 ${isRecording ? 'animate-pulse' : ''}`}
            >
                {isRecording ? 'Stopper Optagelse...' : 'Start Optagelse'}
            </Button>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {isRecording ? 'Taler...' : 'Klik for at starte optagelse'}
            </p>
            
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

            {isLoading && <p className="text-sm mt-4">Transskriberer...</p>}

            {transcription && (
                 <div className="w-full p-4 mt-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 text-left">
                        <h4 className="font-semibold mb-2">Transskription:</h4>
                        <p className="text-sm">{transcription}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AudioTranscriberWidget;