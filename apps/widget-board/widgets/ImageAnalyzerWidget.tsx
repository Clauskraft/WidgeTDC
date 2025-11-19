import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button } from '../components/ui/Button';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const ImageAnalyzerWidget: React.FC<{ widgetId: string }> = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>("Hvad er der på dette billede?");
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setAnalysis('');
            setError(null);
        }
    };
    
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setAnalysis('');
            setError(null);
        }
    }, []);

    const handleAnalyze = async () => {
        if (!imageFile || !process.env.API_KEY) {
            setError("Vælg venligst en fil og sørg for at API nøglen er sat.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const base64Data = await fileToBase64(imageFile);
            
            const imagePart = {
                inlineData: {
                    mimeType: imageFile.type,
                    data: base64Data,
                },
            };
            const textPart = { text: prompt };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });

            setAnalysis(response.text);

        } catch (err) {
            console.error("Image analysis failed:", err);
            setError("Analyse fejlede. Se konsollen for detaljer.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-full flex flex-col -m-4">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div 
                    onDrop={handleDrop} 
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400"
                >
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="image-upload" />
                    {imagePreview ? (
                        <img src={imagePreview} alt="Forhåndsvisning" className="max-h-48 mx-auto rounded-md" />
                    ) : (
                        <label htmlFor="image-upload" className="ms-focusable cursor-pointer">
                            <p>Træk og slip et billede her, eller klik for at vælge</p>
                            <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
                        </label>
                    )}
                </div>

                {imageFile && (
                    <div className="space-y-2">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Stil et spørgsmål om billedet..."
                            rows={2}
                            className="ms-focusable w-full p-2 rounded-lg border bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                        <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
                            {isLoading ? 'Analyserer...' : 'Analyser Billede'}
                        </Button>
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

export default ImageAnalyzerWidget;