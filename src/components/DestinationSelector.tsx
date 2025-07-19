
import React from 'react';
import { DownloadDestination } from '../types';

interface DestinationSelectorProps {
    destination: DownloadDestination;
    setDestination: (destination: DownloadDestination) => void;
    gdriveFolderName: string;
    setGdriveFolderName: (name: string) => void;
}

const DestinationSelector: React.FC<DestinationSelectorProps> = ({
    destination,
    setDestination,
    gdriveFolderName,
    setGdriveFolderName
}) => {
    const isGoogleDrive = destination === DownloadDestination.GoogleDrive;

    return (
        <div className="mb-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">Save Destination</h3>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label
                        className={`flex items-center p-3 rounded-md border-2 cursor-pointer transition ${
                            !isGoogleDrive ? 'bg-cyan-900/50 border-cyan-500' : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                        }`}
                    >
                        <input
                            type="radio"
                            name="destination"
                            value={DownloadDestination.Local}
                            checked={!isGoogleDrive}
                            onChange={() => setDestination(DownloadDestination.Local)}
                            className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-500 focus:ring-cyan-500"
                        />
                        <span className="ml-3 text-gray-200">Local Machine</span>
                    </label>
                </div>
                <div className="flex-1">
                    <label
                        className={`flex items-center p-3 rounded-md border-2 cursor-pointer transition ${
                            isGoogleDrive ? 'bg-cyan-900/50 border-cyan-500' : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                        }`}
                    >
                        <input
                            type="radio"
                            name="destination"
                            value={DownloadDestination.GoogleDrive}
                            checked={isGoogleDrive}
                            onChange={() => setDestination(DownloadDestination.GoogleDrive)}
                            className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-500 focus:ring-cyan-500"
                        />
                        <span className="ml-3 text-gray-200">Google Drive</span>
                    </label>
                </div>
            </div>

            {isGoogleDrive && (
                <div className="mt-4 animate-fade-in">
                    <label htmlFor="gdrive-folder" className="block text-sm font-medium text-gray-300 mb-1">
                        Google Drive Folder Name (Optional)
                    </label>
                    <input
                        type="text"
                        id="gdrive-folder"
                        value={gdriveFolderName}
                        onChange={(e) => setGdriveFolderName(e.target.value)}
                        placeholder="e.g., My AI Models"
                        className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    />
                    <p className="mt-2 text-sm text-gray-500">If left empty, the model will be saved in the root of your 'My Drive'.</p>
                </div>
            )}
        </div>
    );
};

export default DestinationSelector;
