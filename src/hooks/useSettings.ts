
import { useState, useEffect } from 'react';
import { ModelFamily } from '../types';

export interface AppSettings {
    geminiApiKey: string;
    e2bApiKey: string;
    model: ModelFamily;
}

const SETTINGS_KEY = 'ai_studio_settings';

export const useSettings = () => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const storedSettings = localStorage.getItem(SETTINGS_KEY);
            if (storedSettings) {
                return JSON.parse(storedSettings);
            }
        } catch (error) {
            console.error("Could not parse settings from localStorage", error);
        }
        // Default settings
        return {
            geminiApiKey: '',
            e2bApiKey: '',
            model: ModelFamily.Gemini25Flash,
        };
    });

    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error("Could not save settings to localStorage", error);
        }
    }, [settings]);

    const saveSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
    };

    return { settings, saveSettings };
};
