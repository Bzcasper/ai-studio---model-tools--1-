
import React, { useState, useCallback } from 'react';
import { DownloadMode, DownloadDestination } from './types';
import { useSettings } from './hooks/useSettings';
import HuggingFaceForm from './components/HuggingFaceForm';
import CustomUrlForm from './components/CustomUrlForm';
import ModelFinderForm from './components/ModelFinderForm';
import NewModelsDashboard from './components/NewModelsDashboard';
import LoraFinderForm from './components/LoraFinderForm';
import AIStudio from './components/AIStudio';
import CodeBlock from './components/CodeBlock';
import SettingsModal from './components/SettingsModal';
import PythonIcon from './components/icons/PythonIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import ChartBarIcon from './components/icons/ChartBarIcon';
import WandIcon from './components/icons/WandIcon';
import PuzzlePieceIcon from './components/icons/PuzzlePieceIcon';
import CogIcon from './components/icons/CogIcon';
import DestinationSelector from './components/DestinationSelector';
import { generateHfScript, generateCustomUrlScript } from './utils/scriptGenerator';


const App: React.FC = () => {
  const [mode, setMode] = useState<DownloadMode>(DownloadMode.AIStudio);
  const [pythonCode, setPythonCode] = useState<string>('');
  const [requirements, setRequirements] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<{ repoId: string, filename: string } | null>(null);
  const [destination, setDestination] = useState<DownloadDestination>(DownloadDestination.Local);
  const [gdriveFolderName, setGdriveFolderName] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { settings, saveSettings } = useSettings();

  const handleGenerateScripts = useCallback((
    type: 'huggingface' | 'custom_url',
    data: any
  ) => {
    let scriptOutput;
    if (type === 'huggingface') {
        scriptOutput = generateHfScript(data.repoId, data.filename, data.downloadDir, destination, gdriveFolderName);
    } else { // custom_url
        scriptOutput = generateCustomUrlScript(data.url, data.downloadDir, destination, gdriveFolderName);
    }
    
    setPythonCode(scriptOutput.code);
    setRequirements(scriptOutput.requirements);
    
    setTimeout(() => {
        const section = document.querySelector('.animate-fade-in');
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

  }, [destination, gdriveFolderName]);
  
  const handleModelSelect = useCallback((repoId: string, filename:string) => {
    const defaultDownloadDir = './models';
    setSelectedModel({ repoId, filename });
    setMode(DownloadMode.HuggingFace);
    const { code, requirements } = generateHfScript(repoId, filename, defaultDownloadDir, destination, gdriveFolderName);
    setPythonCode(code);
    setRequirements(requirements);
    setTimeout(() => {
        const section = document.querySelector('.animate-fade-in');
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [destination, gdriveFolderName]);

  const TabButton: React.FC<{
    currentMode: DownloadMode;
    targetMode: DownloadMode;
    onClick: (mode: DownloadMode) => void;
    children: React.ReactNode;
  }> = ({ currentMode, targetMode, onClick, children }) => {
    const isActive = currentMode === targetMode;
    return (
      <button
        onClick={() => {
            onClick(targetMode);
            setPythonCode('');
            setRequirements('');
            setSelectedModel(null);
        }}
        className={`flex-shrink-0 px-3 md:px-6 py-3 text-sm sm:text-base font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-400 flex items-center gap-2 ${
          isActive
            ? 'bg-gray-800 text-cyan-400 border-b-2 border-cyan-400'
            : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }`}
      >
        {children}
      </button>
    );
  };

  const showDestinationSelector = mode === DownloadMode.HuggingFace || mode === DownloadMode.CustomUrl;
  const showModelDownloaderUI = pythonCode && (mode === DownloadMode.HuggingFace || mode === DownloadMode.CustomUrl || selectedModel !== null);

  return (
    <>
    <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={settings}
        onSave={(newSettings) => {
            saveSettings(newSettings);
            setIsSettingsOpen(false);
        }}
    />
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8 relative">
          <button onClick={() => setIsSettingsOpen(true)} className="absolute top-0 right-0 p-2 text-gray-400 hover:text-cyan-400 transition-colors" aria-label="Open Settings">
            <CogIcon className="h-8 w-8" />
          </button>
          <div className="flex items-center justify-center gap-4 mb-2">
            <PythonIcon className="h-12 w-12 text-cyan-400"/>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              AI Studio & Model Tools
            </h1>
          </div>
          <p className="text-lg text-gray-400">
            Build with AI and find models to run locally.
          </p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-cyan-500/10 border border-gray-700">
          <div className="flex border-b border-gray-700 overflow-x-auto custom-scrollbar">
             <TabButton currentMode={mode} targetMode={DownloadMode.AIStudio} onClick={setMode}>
              <WandIcon className="h-5 w-5"/> AI Studio
            </TabButton>
             <TabButton currentMode={mode} targetMode={DownloadMode.ModelFinder} onClick={setMode}>
              <SparklesIcon className="h-5 w-5"/> Find a Model
            </TabButton>
            <TabButton currentMode={mode} targetMode={DownloadMode.LoraFinder} onClick={setMode}>
              <PuzzlePieceIcon className="h-5 w-5"/> LoRA Finder
            </TabButton>
             <TabButton currentMode={mode} targetMode={DownloadMode.NewModels} onClick={setMode}>
              <ChartBarIcon className="h-5 w-5"/> New Models
            </TabButton>
            <TabButton currentMode={mode} targetMode={DownloadMode.HuggingFace} onClick={setMode}>
              Hugging Face
            </TabButton>
            <TabButton currentMode={mode} targetMode={DownloadMode.CustomUrl} onClick={setMode}>
              Custom URL
            </TabButton>
          </div>
          
          <div className="p-6">
            {showDestinationSelector && (
              <DestinationSelector 
                destination={destination}
                setDestination={setDestination}
                gdriveFolderName={gdriveFolderName}
                setGdriveFolderName={setGdriveFolderName}
              />
            )}
            {mode === DownloadMode.AIStudio && <AIStudio geminiApiKey={settings.geminiApiKey} e2bApiKey={settings.e2bApiKey} model={settings.model} />}
            {mode === DownloadMode.ModelFinder && <ModelFinderForm onSelectModel={handleModelSelect} geminiApiKey={settings.geminiApiKey} model={settings.model} />}
            {mode === DownloadMode.LoraFinder && <LoraFinderForm geminiApiKey={settings.geminiApiKey} model={settings.model} />}
            {mode === DownloadMode.NewModels && <NewModelsDashboard onSelectModel={handleModelSelect} geminiApiKey={settings.geminiApiKey} model={settings.model} />}
            {mode === DownloadMode.HuggingFace && (
              <HuggingFaceForm onGenerate={(data) => handleGenerateScripts('huggingface', data)} initialModel={selectedModel} />
            )}
            {mode === DownloadMode.CustomUrl && (
              <CustomUrlForm onGenerate={(data) => handleGenerateScripts('custom_url', data)} />
            )}
          </div>
        </main>

        {showModelDownloaderUI && (
          <section className="mt-10 animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4 text-center text-cyan-300">Generated Scripts</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-3">
                <CodeBlock title="downloader.py" code={pythonCode} />
              </div>
              <div className="md:col-span-2">
                 <CodeBlock title="requirements.txt" code={requirements} />
              </div>
            </div>
            <p className="text-center text-gray-500 mt-6 max-w-2xl mx-auto">
                Run <code className="bg-gray-700 text-cyan-300 px-2 py-1 rounded-md text-sm">pip install -r requirements.txt</code> then <code className="bg-gray-700 text-cyan-300 px-2 py-1 rounded-md text-sm">python downloader.py</code> in your terminal.
            </p>
             {destination === DownloadDestination.GoogleDrive && (
                <p className="text-center text-yellow-400 bg-yellow-900/50 border border-yellow-700 p-3 rounded-lg text-sm mt-4 max-w-2xl mx-auto">
                    <strong>First time setup for Google Drive:</strong> Follow the instructions in the <code className="bg-gray-700 text-cyan-300 px-1 py-0.5 rounded-md text-xs">downloader.py</code> script to get your <code className="bg-gray-700 text-cyan-300 px-1 py-0.5 rounded-md text-xs">credentials.json</code> file.
                </p>
             )}
          </section>
        )}
      </div>
       <footer className="w-full max-w-4xl mx-auto text-center text-gray-600 mt-12 pb-4">
        <p>Built by a Senior Frontend React Engineer.</p>
      </footer>
    </div>
    </>
  );
};

export default App;
