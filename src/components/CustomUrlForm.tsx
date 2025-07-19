
import React, { useState } from 'react';

interface CustomUrlFormProps {
    onGenerate: (data: { url: string; downloadDir: string; }) => void;
}

const CustomUrlForm: React.FC<CustomUrlFormProps> = ({ onGenerate }) => {
  const [url, setUrl] = useState<string>('');
  const [downloadDir, setDownloadDir] = useState<string>('./models');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     if (!isUrlValid || !downloadDir) {
      alert("A valid URL and download directory are required.");
      return;
    }
    onGenerate({ url, downloadDir });
  };
  
  const handleDirectDownload = () => {
    if (!isUrlValid) {
        alert("Please enter a valid URL.");
        return;
    }
    try {
        const filename = new URL(url).pathname.split('/').pop() || 'model.gguf';
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch(e) {
        console.error("Failed to initiate download:", e)
        alert("Could not initiate download. Please check the URL and browser console.")
    }
  }
  
  const isUrlValid = (() => {
      try {
          new URL(url);
          return true;
      } catch {
          return false;
      }
  })();

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
        type="url"
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
      />
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <InputField
        label="Direct Model URL"
        id="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://huggingface.co/..../resolve/main/model.gguf"
        description="The full, direct URL to the .gguf file."
      />
      <InputField
        label="Local Download Directory (for script)"
        id="downloadDir"
        value={downloadDir}
        onChange={(e) => setDownloadDir(e.target.value)}
        placeholder="./models"
        description="The local folder where the model will be saved when using the Python script."
      />
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={handleDirectDownload}
          disabled={!isUrlValid}
          className="w-full flex justify-center py-3 px-4 border border-cyan-500 rounded-md shadow-sm text-lg font-medium text-cyan-300 bg-cyan-900/50 hover:bg-cyan-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-transform transform hover:scale-105 disabled:bg-gray-700 disabled:text-gray-500 disabled:border-gray-600 disabled:scale-100 disabled:cursor-not-allowed"
        >
          Download Now
        </button>
        <button
          type="submit"
          disabled={!isUrlValid || !downloadDir}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-transform transform hover:scale-105 disabled:bg-cyan-800 disabled:scale-100 disabled:cursor-not-allowed"
        >
          Generate Script
        </button>
      </div>
    </form>
  );
};

export default CustomUrlForm;
