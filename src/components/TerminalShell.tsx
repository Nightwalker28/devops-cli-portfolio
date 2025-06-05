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

    const handleTouch = () => {
      if (nanoContent) {
        setNanoContent(null);
      }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('touchstart', handleTouch);

    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [nanoContent]);

  useEffect(() => {
    const init = async () => {
      const { output } = await processCommand('ls', '/');
      setHistory((prev) => [...prev, ...output]);
    };
    init();
  }, []);

  const handleCommand = async (input: string) => {
    const { output, newCwd, nano } = await processCommand(input, cwd);
    const prompt = `nightwalker28@nightwalkerslenovo:${cwd === '/' ? '~' : `~${cwd}`}$ ${input}`;
    let nextHistory = [...history, prompt, ...output];

    if (newCwd && newCwd !== cwd) {
      const lsResult = await processCommand('ls', newCwd);
      nextHistory = [...nextHistory, ...lsResult.output];
    }

    setHistory(nextHistory);
    setCommandHistory((prev) => [...prev, input]);
    if (newCwd !== undefined) setCwd(newCwd);
    if (nano) setNanoContent(nano);
  };

  const handleTouchOutput = async (text: string) => {
    if (!text || nanoContent) return;

    const segments = text.trim().split(/\s+/);
    for (const seg of segments) {
      if (fileTree[cwd]?.some(f => f.name === seg)) {
        const fileObj = fileTree[cwd].find(f => f.name === seg);
        if (fileObj?.type === 'folder') {
          await handleCommand(`cd ${seg}`);
        } else if (fileObj?.type === 'file') {
          await handleCommand(`view ${seg}`);
        }
      }
    }
  };

  return (
    <div
      className="bg-black text-green-400 font-mono p-4 h-screen overflow-y-auto"
      onClick={(e) => {
        const text = (e.target as HTMLElement).innerText;
        handleTouchOutput(text);
      }}
    >
      {nanoContent ? (
        <div className="border border-green-400 p-4 mb-4">
          <div className="mb-2">-- NANO: {nanoContent[0]}</div>
          <pre className="whitespace-pre-wrap">
            {nanoContent.slice(1).map((line, idx) => (
              <div key={idx} className="text-white">{line}</div>
            ))}
          </pre>
          <div className="mt-4 text-yellow-400">(Press Ctrl+X or tap anywhere to exit nano)</div>
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
