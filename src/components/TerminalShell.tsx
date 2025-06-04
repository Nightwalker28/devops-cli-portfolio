'use client';

import { useEffect, useState } from 'react';
import TerminalOutput from './TerminalOutput';
import TerminalPrompt from './TerminalPrompt';
import TerminalInput from './TerminalInput';
import { processCommand, fileTree } from './CommandProcessor';

const TerminalShell = () => {
  const [cwd, setCwd] = useState<string>('/');
  const [history, setHistory] = useState<string[]>([
    'Welcome to Nightwalker’s DevOps CLI Portfolio.',
    'Type `help` to get started.',
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [nanoContent, setNanoContent] = useState<string[] | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (nanoContent && e.ctrlKey && e.key === 'x') {
        setNanoContent(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nanoContent]);

  const handleCommand = async (input: string) => {
    const { output, newCwd, nano } = await processCommand(input, cwd);
    const prompt = `nightwalker28@nightwalkerslenovo:${cwd === '/' ? '~' : `~${cwd}`}$ ${input}`;
    setHistory((prev) => [...prev, prompt, ...output]);
    setCommandHistory((prev) => [...prev, input]);
    if (newCwd !== undefined) setCwd(newCwd);
    if (nano) setNanoContent(nano);
  };

  return (
    <div className="bg-black text-green-400 font-mono p-4 h-screen overflow-y-auto">
      {nanoContent ? (
        <div className="border border-green-400 p-4 mb-4">
          <div className="mb-2">-- NANO: {nanoContent[0]}</div>
          <pre className="whitespace-pre-wrap">
            {nanoContent.slice(1).map((line, idx) => (
              <div key={idx} className="text-white">{line}</div>
            ))}
          </pre>
          <div className="mt-4 text-yellow-400">(Press Ctrl+X to exit nano)</div>
        </div>
      ) : (
        <>
          <TerminalOutput history={history} />
          <TerminalPrompt cwd={cwd}>
            <TerminalInput
              onSubmit={handleCommand}
              commandHistory={commandHistory}
              cwd={cwd}
              suggestions={fileTree[cwd]?.map((f) => f.name) || []}
            />
          </TerminalPrompt>
        </>
      )}
    </div>
  );
};

export default TerminalShell;
