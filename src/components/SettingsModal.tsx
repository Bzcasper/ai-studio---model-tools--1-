
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../hooks/useSettings';
import { ModelFamily } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings, onSave }) => {
    const [settings, setSettings] = useState<AppSettings>(currentSettings);

    useEffect(() => {
        setSettings(currentSettings);
    }, [currentSettings, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(settings);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-cyan-500/10 w-full max-w-md p-6 m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="geminiApiKey" className="block text-sm font-medium text-gray-300 mb-1">
                            Gemini API Key
                        </label>
                        <input
                            type="password"
                            id="geminiApiKey"
                            name="geminiApiKey"
                            value={settings.geminiApiKey}
                            onChange={handleInputChange}
                            placeholder="Enter your Google Gemini API Key"
                            className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="e2bApiKey" className="block text-sm font-medium text-gray-300 mb-1">
                            E2B API Key
                        </label>
                        <input
                            type="password"
                            id="e2bApiKey"
                            name="e2bApiKey"
                            value={settings.e2bApiKey}
                            onChange={handleInputChange}
                            placeholder="Enter your E2B Code Interpreter API Key"
                            className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                         <p className="mt-2 text-xs text-gray-500">Only needed for code execution in the AI Studio.</p>
                    </div>
                    <div>
                        <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">
                            AI Model
                        </label>
                        <select
                            id="model"
                            name="model"
                            value={settings.model}
                            onChange={handleInputChange}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {Object.values(ModelFamily).map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-md text-white bg-cyan-600 hover:bg-cyan-700 transition"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
