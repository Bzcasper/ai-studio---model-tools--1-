
import React, { useState, useEffect } from 'react';

interface HuggingFaceFormProps {
  onGenerate: (data: { repoId: string; filename: string; downloadDir: string }) => void;
  initialModel?: { repoId: string; filename: string } | null;
}

const HuggingFaceForm: React.FC<HuggingFaceFormProps> = ({ onGenerate, initialModel }) => {
  const [repoId, setRepoId] = useState<string>('TheBloke/Mistral-7B-Instruct-v0.2-GGUF');
  const [filename, setFilename] = useState<string>('mistral-7b-instruct-v0.2.Q4_K_M.gguf');
  const [downloadDir, setDownloadDir] = useState<string>('./models');

  useEffect(() => {
    if (initialModel) {
        setRepoId(initialModel.repoId);
        setFilename(initialModel.filename);
    }
  }, [initialModel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoId || !filename || !downloadDir) {
      alert("All fields are required.");
      return;
    }
    onGenerate({ repoId, filename, downloadDir });
  };
  
  const handleDirectDownload = () => {
     if (!repoId || !filename) {
      alert("Repo ID and Filename are required for direct download.");
      return;
    }
    const url = `https://huggingface.co/${repoId}/resolve/main/${filename}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const InputField: React.FC<{
    label: string;
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    description: string;
  }> = ({ label, id, value, onChange, placeholder, description }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
      />
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
  
  const formIsValid = repoId && filename;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <InputField
        label="Hugging Face Repository ID"
        id="repoId"
        value={repoId}
        onChange={(e) => setRepoId(e.target.value)}
        placeholder="e.g., TheBloke/Mistral-7B-Instruct-v0.2-GGUF"
        description="The user/organization and model name on Hugging Face."
      />
      <InputField
        label="GGUF Filename"
        id="filename"
        value={filename}
        onChange={(e) => setFilename(e.target.value)}
        placeholder="e.g., mistral-7b-instruct-v0.2.Q4_K_M.gguf"
        description="The exact name of the .gguf file to download from the repo."
      />
      <InputField
        label="Local Download Directory (for script)"
        id="downloadDir"
        value={downloadDir}
        onChange={(e) => setDownloadDir(e.target.value)}
        placeholder="e.g., ./models"
        description="The local folder where the model file will be saved when using the Python script."
      />
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={handleDirectDownload}
          disabled={!formIsValid}
          className="w-full flex justify-center py-3 px-4 border border-cyan-500 rounded-md shadow-sm text-lg font-medium text-cyan-300 bg-cyan-900/50 hover:bg-cyan-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-transform transform hover:scale-105 disabled:bg-gray-700 disabled:text-gray-500 disabled:border-gray-600 disabled:scale-100 disabled:cursor-not-allowed"
        >
          Download Now
        </button>
        <button
          type="submit"
          disabled={!formIsValid || !downloadDir}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-transform transform hover:scale-105 disabled:bg-cyan-800 disabled:scale-100 disabled:cursor-not-allowed"
        >
          Generate Script
        </button>
      </div>
    </form>
  );
};

export default HuggingFaceForm;
