
import React from 'react';
import Spinner from './Spinner';
import TerminalIcon from './icons/TerminalIcon';
import MarkdownRenderer from './MarkdownRenderer';

interface CodeExecutionBlockProps {
  language: string;
  code: string;
  onRun: () => void;
  output?: string;
  error?: string;
  artifacts?: any[];
  isRunning: boolean;
}

const CodeExecutionBlock: React.FC<CodeExecutionBlockProps> = ({
  language,
  code,
  onRun,
  output,
  error,
  artifacts,
  isRunning,
}) => {
  const formattedCode = '```' + language + '\\n' + code + '\\n```';

  return (
    <div className="bg-gray-900/70 border border-gray-700 rounded-lg shadow-lg my-4">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="font-mono text-sm text-gray-400">{language}</span>
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
          aria-label="Run code"
        >
          {isRunning ? (
            <>
              <Spinner className="h-4 w-4" />
              Running...
            </>
          ) : (
            <>
              <TerminalIcon className="h-4 w-4" />
              Run Code
            </>
          )}
        </button>
      </div>
      <div className="p-4 bg-gray-800/30">
        <MarkdownRenderer content={formattedCode} />
      </div>
      {(output || error || (isRunning && !output && !error)) && (
        <div className="border-t border-gray-700 px-4 py-3 bg-black/30">
          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Output</h4>
          {isRunning && !output && !error && (
             <p className="text-sm text-gray-500 italic">Executing code in sandbox...</p>
          )}
          {output && (
            <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
              <code>{output}</code>
            </pre>
          )}
          {error && (
            <pre className="text-sm font-mono text-red-400 whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
              <code>{error}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeExecutionBlock;
