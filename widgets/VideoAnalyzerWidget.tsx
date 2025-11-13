import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const VideoAnalyzerWidget: React.FC<{ widgetId: string }> = () => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                setError("Filen er for stor. Maksimal størrelse er 50MB.");
                return;
            }
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
            setAnalysis('');
            setError(null);
        } else {
            setError("Vælg venligst en gyldig videofil.");
        }
    };
    
    const handleAnalyze = async () => {
        if (!videoFile || !process.env.API_KEY) {
            setError("Vælg en videofil og sørg for, at API-nøglen er sat.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const base64Data = await fileToBase64(videoFile);
            
            const videoPart = {
                inlineData: {
                    mimeType: videoFile.type,
                    data: base64Data,
                },
            };
            const textPart = { text: "Beskriv detaljeret, hvad der sker i denne video." };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: { parts: [videoPart, textPart] },
            });

            setAnalysis(response.text);

        } catch (err) {
            console.error("Video analysis failed:", err);
            setError("Videoanalyse fejlede. Filen kan være for stor eller i et format, der ikke understøttes. Se konsollen for detaljer.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-full flex flex-col -m-4">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" id="video-upload" />
                    <label htmlFor="video-upload" className="cursor-pointer">
                        <p>Klik for at vælge en video</p>
                        <p className="text-xs text-gray-500">MP4, WEBM, etc. (Maks 50MB)</p>
                    </label>
                </div>

                {videoPreview && (
                    <div className="space-y-4">
                         <video src={videoPreview} controls className="w-full rounded-md max-h-64" />
                         <button onClick={handleAnalyze} disabled={isLoading || !videoFile} className="w-full py-2 px-4 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:bg-gray-400">
                            {isLoading ? 'Analyserer...' : 'Analyser Video'}
                        </button>
                    </div>
                )}
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                {analysis && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold mb-2">Analyse Resultat:</h4>
                        <p className="text-sm whitespace-pre-wrap">{analysis}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoAnalyzerWidget;
