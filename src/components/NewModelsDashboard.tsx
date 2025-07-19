
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ModelFamily } from '../types';
import Spinner from './Spinner';

interface NewModelsDashboardProps {
  onSelectModel: (repoId: string, filename: string) => void;
  geminiApiKey: string;
  model: ModelFamily;
}

interface NewModel {
  repoId: string;
  filename: string;
  description: string;
  parameterSize: number; // in billions
  releaseDate: string; // YYYY-MM-DD
}

const NewModelsDashboard: React.FC<NewModelsDashboardProps> = ({ onSelectModel, geminiApiKey, model }) => {
  const [models, setModels] = useState<NewModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewModels = async () => {
      setLoading(true);
      setError(null);
      if (!geminiApiKey) {
        setError("Gemini API Key is not set. Please add it in the settings panel.");
        setLoading(false);
        return;
      }

      try {
        const ai = new GoogleGenAI({apiKey: geminiApiKey});

        const responseSchema = {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                repoId: { type: Type.STRING, description: "The Hugging Face repository ID, e.g., 'TheBloke/New-Model-7B-GGUF'." },
                filename: { type: Type.STRING, description: "A recommended GGUF filename, e.g., 'new-model-7b.Q4_K_M.gguf'." },
                description: { type: Type.STRING, description: "A brief, one-sentence explanation of the model's purpose." },
                parameterSize: { type: Type.NUMBER, description: "The number of parameters in billions, e.g., 7.2" },
                releaseDate: { type: Type.STRING, description: "The release date in YYYY-MM-DD format." },
              },
              required: ["repoId", "filename", "description", "parameterSize", "releaseDate"],
            },
        };

        const systemInstruction = `You are an expert assistant for finding GGUF models. Your task is to find the top 5-7 newest, most popular, and highest quality small-to-medium GGUF models (under 15 billion parameters) released on Hugging Face within the last 7 days. For each model, provide its repo ID, a suitable GGUF filename (prefer Q4_K_M or similar), a short description, its parameter size in billions, and the release date. Return a valid JSON array matching the schema. Do not include markdown.`;

        const response = await ai.models.generateContent({
            model: model,
            contents: "List the newest popular GGUF models from the last 7 days.",
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
            }
        });

        const jsonText = response.text.trim();
        const parsedResults: NewModel[] = JSON.parse(jsonText);
        parsedResults.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        setModels(parsedResults);
      } catch (err: any) {
        console.error("Gemini API call failed:", err);
        setError(`Could not fetch new models. Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchNewModels();
  }, [geminiApiKey, model]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-64">
        <Spinner />
        <p className="text-gray-400">Searching for the latest models...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">{error}</div>;
  }
  
  if (models.length === 0) {
      return <div className="text-center p-4 text-gray-400">No new models found in the last 7 days. Check back later!</div>
  }

  const maxParamSize = Math.max(...models.map(m => m.parameterSize), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-xl font-semibold mb-4 text-center text-cyan-300">New Model Parameter Sizes (Billions)</h3>
        <div className="space-y-3 rounded-lg bg-gray-900/50 p-4 border border-gray-700">
          {models.map((model, index) => (
            <div key={index} className="flex items-center gap-3 group">
              <div className="w-1/3 text-xs font-mono text-gray-400 truncate text-right pr-2" title={model.repoId}>{model.repoId.split('/')[1] || model.repoId}</div>
              <div className="w-2/3 bg-gray-700 rounded-full h-6">
                <div
                  className="bg-cyan-600 group-hover:bg-cyan-500 h-6 rounded-full flex items-center justify-end px-2 text-sm font-bold text-white transition-all duration-300 transform group-hover:scale-x-105 origin-left"
                  style={{ width: `${(model.parameterSize / maxParamSize) * 100}%` }}
                >
                  {model.parameterSize}B
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-center text-cyan-300">Latest Model Releases</h3>
        <div className="space-y-4">
          {models.map((model, index) => (
            <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-200 hover:border-cyan-600/70 hover:shadow-lg hover:shadow-cyan-500/10 transform hover:scale-[1.02]">
              <div className="flex-grow">
                <p className="font-semibold text-cyan-400 font-mono">{model.repoId}</p>
                <p className="text-sm text-gray-400 font-mono mb-2">{model.filename}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                    <span className="bg-gray-700 px-2 py-1 rounded-md">{model.parameterSize}B Parameters</span>
                    <span className="bg-gray-700 px-2 py-1 rounded-md">Released: {model.releaseDate}</span>
                </div>
                <p className="text-gray-300">{model.description}</p>
              </div>
              <button
                onClick={() => onSelectModel(model.repoId, model.filename)}
                className="w-full sm:w-auto flex-shrink-0 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-cyan-400 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 transition"
              >
                Use this Model
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewModelsDashboard;
