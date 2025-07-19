import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Sandbox } from '@e2b/sdk';
import { ModelFamily } from '../types';

import MarkdownRenderer from './MarkdownRenderer';
import CodeExecutionBlock from './CodeExecutionBlock';
import Spinner from './Spinner';
import WandIcon from './icons/WandIcon';
import UserIcon from './icons/UserIcon';

interface AIStudioProps {
  geminiApiKey: string;
  e2bApiKey: string;
  model: ModelFamily;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface MessagePart {
    type: 'text' | 'code';
    content: string;
    language?: string;
}

interface ExecutionState {
    output: string;
    error: string;
    isRunning: boolean;
    artifacts: any[];
}

const parseMessageContent = (content: string): MessagePart[] => {
    const parts: MessagePart[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]+?)\n```/g;
    let lastIndex = 0;
    let match;
  
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1]?.toLowerCase() || 'plaintext',
        content: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }
  
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.substring(lastIndex) });
    }
    
    return parts.filter(p => p.content.trim() !== '');
};


const AIStudio: React.FC<AIStudioProps> = ({ geminiApiKey, e2bApiKey, model }) => {
  const [systemPrompt, setSystemPrompt] = useState<string>('You are a helpful AI assistant specialized in software development.');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<Map<string, ExecutionState>>(new Map());

  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, executionState]);

  const initChat = useCallback(() => {
    setError(null);
    if (!geminiApiKey) {
        setError("Gemini API Key is not set. Please add it in the settings panel.");
        chatRef.current = null;
        return;
    }
    try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        chatRef.current = ai.chats.create({
            model: model,
            config: { systemInstruction: systemPrompt },
        });
    } catch (e: any) {
        console.error("Failed to initialize chat:", e);
        setError(`Failed to initialize AI Studio. Error: ${e.message}`);
    }
  }, [systemPrompt, geminiApiKey, model]);

  useEffect(() => {
    initChat();
  }, [initChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isLoading) return;

    if (!chatRef.current) {
        setError("Chat is not initialized. Please check your API key in settings.");
        return;
    }

    setError(null);
    setIsLoading(true);
    const newMessages: Message[] = [...messages, { role: 'user', content: trimmedInput }, { role: 'model', content: '' }];
    setMessages(newMessages);
    setUserInput('');
    
    try {
      const stream = await chatRef.current.sendMessageStream({ message: trimmedInput });

      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content = fullResponse;
            return updated;
        });
      }
    } catch (err: any) {
      const errorMessage = `An error occurred with the Gemini API: ${err.message}. Check your key and permissions.`;
      setError(errorMessage);
       setMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0) updated[updated.length - 1].content = `**Error:** ${errorMessage}`;
            return updated;
        });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunCode = async (messageIndex: number, partIndex: number, language: string, code: string) => {
    const blockId = `${messageIndex}-${partIndex}`;
    
    if (!e2bApiKey) {
        setError("E2B API Key is not set. Please add it in settings to execute code.");
        setExecutionState(prev => new Map(prev).set(blockId, { isRunning: false, output: '', error: 'E2B API Key not configured.', artifacts: [] }));
        return;
    }

    const interpreters: {[key: string]: {filename: string, command: string}} = {
      python: { filename: 'script.py', command: 'python' },
      javascript: { filename: 'script.js', command: 'node' },
      bash: { filename: 'script.sh', command: 'bash' },
      sh: { filename: 'script.sh', command: 'sh' },
    };

    const langConfig = interpreters[language];
    if (!langConfig) {
      setExecutionState(prev => new Map(prev).set(blockId, { isRunning: false, output: '', error: `Unsupported language for execution: ${language}`, artifacts: [] }));
      return;
    }

    setExecutionState(prev => new Map(prev).set(blockId, { isRunning: true, output: '', error: '', artifacts: [] }));

    let sandbox: Sandbox | null = null;
    try {
        sandbox = await Sandbox.create({ template: 'base', apiKey: e2bApiKey });

        await sandbox.fs.write(langConfig.filename, code);
        
        const proc = await sandbox.proc.start({
            cmd: `${langConfig.command} ${langConfig.filename}`,
            onStdout: (data) => setExecutionState(prev => new Map(prev).set(blockId, { ...prev.get(blockId)!, output: prev.get(blockId)!.output + data.line + '\n' })),
            onStderr: (data) => setExecutionState(prev => new Map(prev).set(blockId, { ...prev.get(blockId)!, error: prev.get(blockId)!.error + data.line + '\n' })),
        });

        await proc.wait;

    } catch (e: any) {
        console.error("E2B execution failed:", e);
        setExecutionState(prev => new Map(prev).set(blockId, { ...prev.get(blockId)!, error: `Execution failed: ${e.message}` }));
    } finally {
        if (sandbox) await sandbox.close();
        setExecutionState(prev => new Map(prev).set(blockId, { ...prev.get(blockId)!, isRunning: false }));
    }
  };
  
  const handleClearChat = () => {
    setMessages([]);
    setExecutionState(new Map());
    initChat();
  }

  return (
    <div className="flex flex-col h-[75vh] bg-gray-900/50 rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <label htmlFor="system-prompt" className="block text-sm font-medium text-gray-300 mb-1"> System Prompt </label>
          <div className="flex gap-2">
            <input id="system-prompt" type="text" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} onBlur={initChat} placeholder="e.g., You are a world-class Python developer..." className="flex-grow bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />
            <button onClick={handleClearChat} className="px-4 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-md transition text-sm font-medium"> Clear Chat </button>
          </div>
      </div>

      <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto custom-scrollbar">
        {messages.length === 0 && !error ? (
             <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <WandIcon className="h-16 w-16 mb-4 text-gray-600" />
                <h2 className="text-2xl font-bold text-gray-400">Welcome to AI Studio</h2>
                <p>Start a conversation to build, design, or execute code.</p>
            </div>
        ) : (
            <div className="space-y-6">
            {messages.map((msg, msgIndex) => {
                const parts = msg.role === 'model' ? parseMessageContent(msg.content) : [{type: 'text', content: msg.content}];
                return (
                    <div key={msgIndex} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && ( <div className="flex-shrink-0 h-8 w-8 rounded-full bg-cyan-900 flex items-center justify-center"> <WandIcon className="h-5 w-5 text-cyan-400" /> </div> )}
                        
                        <div className={`max-w-xl lg:max-w-2xl rounded-xl ${msg.role === 'user' ? 'bg-cyan-600 text-white px-4 py-3' : 'bg-transparent'}`}>
                          {parts.map((part, partIndex) => {
                            if (part.type === 'code' && part.language) {
                                const blockId = `${msgIndex}-${partIndex}`;
                                const state = executionState.get(blockId) || { isRunning: false, output: '', error: '', artifacts: []};
                                return <CodeExecutionBlock key={partIndex} language={part.language} code={part.content} onRun={() => handleRunCode(msgIndex, partIndex, part.language!, part.content)} {...state} />;
                            }
                            return <div key={partIndex} className={msg.role === 'model' ? 'bg-gray-700 text-gray-200 px-4 py-3 rounded-xl' : ''}>
                                <MarkdownRenderer content={part.content + (isLoading && msgIndex === messages.length - 1 && partIndex === parts.length - 1 ? '...' : '')} />
                            </div>;
                          })}
                        </div>

                         {msg.role === 'user' && ( <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center"> <UserIcon className="h-5 w-5 text-gray-200" /> </div> )}
                    </div>
                )
            })}
            </div>
        )}
         {error && <div className="mt-4 text-center p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300">{error}</div>}
      </div>

      <div className="p-4 border-t border-gray-700 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e as any); } }} placeholder="Ask me to design a component, write a function, or explain a concept..." rows={3} className="flex-grow resize-none bg-gray-800 border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition max-h-48" disabled={isLoading || !geminiApiKey} />
          <button type="submit" disabled={isLoading || !userInput.trim() || !geminiApiKey} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-cyan-800 disabled:cursor-not-allowed flex-shrink-0">
            {isLoading ? <Spinner className="h-5 w-5"/> : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIStudio;