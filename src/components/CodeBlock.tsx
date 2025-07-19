
import React, { useState } from 'react';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';

interface CodeBlockProps {
  title: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ title, code }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-900/70 border border-gray-700 rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h3 className="font-mono text-sm text-gray-300">{title}</h3>
        <button
          onClick={handleCopy}
          className={`p-1.5 rounded-md transition-colors ${
            isCopied
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
          } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
          aria-label={isCopied ? 'Copied' : 'Copy code'}
        >
          {isCopied ? (
            <CheckIcon className="h-5 w-5" />
          ) : (
            <CopyIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto h-full custom-scrollbar">
        <pre className="text-sm font-mono text-gray-200 whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
