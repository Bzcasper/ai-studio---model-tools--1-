
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ModelFamily } from '../types';
import Spinner from './Spinner';

interface LoraFinderFormProps {
    geminiApiKey: string;
    model: ModelFamily;
}

interface LoraRecommendation {
  repoId: string;
  filename: string;
  description: string;
}

const LoraFinderForm: React.FC<LoraFinderFormProps> = ({ geminiApiKey, model }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LoraRecommendation[]>([]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Please describe the LoRA you're looking for.");
      return;
    }

    if (!geminiApiKey) {
        setError("Gemini API Key is not set. Please add it in the settings panel.");
        return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const ai = new GoogleGenAI({apiKey: geminiApiKey});

      const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            repoId: {
              type: Type.STRING,
              description: "The Hugging Face repository ID, e.g., 'stabilityai/stable-diffusion-xl-base-1.0'.",
            },
            filename: {
              type: Type.STRING,
              description: "The specific LoRA filename, which must end in .safetensors.",
            },
            description: {
              type: Type.STRING,
              description: "A brief, one-sentence explanation of what this LoRA does or what style it creates.",
            },
          },
          required: ["repoId", "filename", "description"],
        },
      };

      const systemInstruction = "You are an expert assistant for finding LoRA (Low-Rank Adaptation) files on Hugging Face. The user will describe a style or character. Find 3-5 relevant LoRA models. It is critical that the filename you provide is a `.safetensors` file. Strictly return a valid JSON array matching the provided schema. Do not include markdown formatting or any text outside the JSON array.";

      const response = await ai.models.generateContent({
        model: model,
        contents: `Find LoRA models (.safetensors files) on Hugging Face that match this description: "${prompt}".`,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });
      
      const jsonText = response.text.trim();
      const parsedResults = JSON.parse(jsonText);
      setResults(parsedResults);

    } catch (err: any) {
      console.error("Gemini API call failed:", err);
      setError(`Sorry, something went wrong while finding LoRAs. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDownload = (repoId: string, filename: string) => {
    const url = `https://huggingface.co/${repoId}/resolve/main/${filename}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="lora-description" className="block text-sm font-medium text-gray-300 mb-1">
            Describe the LoRA style or character you need
          </label>
          <textarea
            id="lora-description"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='e.g., "a LoRA for a watercolor painting style" or "a character LoRA for a knight in armor"'
            className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            aria-describedby="lora-prompt-description"
          />
           <p className="mt-2 text-sm text-gray-500" id="lora-prompt-description">Our AI assistant will find the best LoRA (.safetensors) for you on Hugging Face.</p>
        </div>
        <div>
          <button
            type="submit"
            disabled={loading || !geminiApiKey}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-transform transform hover:scale-105 disabled:bg-cyan-800 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? <> <Spinner/> Finding LoRAs... </> : 'Find LoRAs'}
          </button>
        </div>
      </form>
      
      {error && <div className="text-center p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">{error}</div>}

      {results.length > 0 && (
        <div className="space-y-4 animate-fade-in">
           <h3 className="text-xl font-semibold text-center text-cyan-300">Recommended LoRA Adapters</h3>
           {results.map((lora, index) => (
             <div key={index} className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div className="flex-grow">
                 <p className="font-semibold text-cyan-400 font-mono">{lora.repoId}</p>
                 <p className="text-sm text-gray-400 font-mono mb-2">{lora.filename}</p>
                 <p className="text-gray-300">{lora.description}</p>
               </div>
               <button
                 onClick={() => handleDirectDownload(lora.repoId, lora.filename)}
                 className="w-full sm:w-auto flex-shrink-0 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-cyan-400 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 transition"
               >
                 Download Now
               </button>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default LoraFinderForm;
