'use client';

import { useEffect, useState, useMemo } from 'react';
import TerminalOutput from './TerminalOutput';
import TerminalPrompt from './TerminalPrompt';
import TerminalInput from './TerminalInput';
import { processCommand, fileTree } from './CommandProcessor';
import type { CommandResult, LsOutputItem } from './CommandProcessor';
import { getPromptString } from '@/utils/terminalUtils';
import { linkify } from '@/utils/linkify';

export type HistoryEntry =
  | { type: 'prompt'; id: string; cwd: string; command: string }
  | { type: 'output'; id: string; lines: string[]; command?: string; isRawFileOutput?: boolean }
  | { type: 'ls'; id: string; items: LsOutputItem[]; path: string }
  | {
      type: 'message';
      id: string;
      text?: string | string[]; // Can be a single line or multiple lines
      isWelcome?: boolean; // imageUrl is no longer needed here for the watermark
      // imageUrl?: string; // Removed as watermark is global
      imageAlt?: string;
    };

const TerminalShell = () => {
  const [cwd, setCwd] = useState<string>('/');
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const initialEntries: HistoryEntry[] = [
      {
        type: 'message',
        id: 'logo-image',
        text: [ // All welcome text now part of this single message entry
          "Welcome to my CLI Portfolio!",
          "This is a CLI-based portfolio project.",
          "Click on file/folder names or use commands like `cd`, `ls`, `cat`, `view`, `nano`.",
          "It's primarily designed for developers and best viewed on desktop/laptop devices.",
          "Type `help` to get started.",
        ],
        // imageUrl: '/acsiart.png', // Watermark is now handled globally
        // imageAlt: 'Portfolio Logo',
        isWelcome: true
      }
    ];
    return initialEntries;
  });
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
      const { lsItems, outputLines } = await processCommand('ls', '/');
      const initialHistory: HistoryEntry[] = [];
      if (lsItems) {
        initialHistory.push({ type: 'ls', id: 'init-ls', items: lsItems, path: '/' });
      } else if (outputLines && outputLines.length > 0) {
        initialHistory.push({ type: 'output', id: 'init-output', lines: outputLines });
      }
      setHistory((prev) => [...prev, ...initialHistory]);
    };
    init();
  }, []);

  const handleCommand = async (input: string) => {
    const result = await processCommand(input, cwd);
    const { outputLines, newCwd, nano, shouldClearHistory, lsItems, isRawFileOutput } = result;

    if (shouldClearHistory) {
      setHistory([]); // Set history to an empty array to clear the screen
      // By returning here, 'clear' is not added to the commandHistory (for arrow keys)
      return;
    }

    // For commands other than 'clear':
    const nextHistoryEntries: HistoryEntry[] = [];
    const commandId = Date.now().toString();

    nextHistoryEntries.push({
      type: 'prompt',
      id: commandId + '-prompt',
      cwd,
      command: input,
    });

    if (lsItems && lsItems.length > 0) {
      nextHistoryEntries.push({ type: 'ls', id: commandId + '-ls', items: lsItems, path: cwd });
    } else if (outputLines && outputLines.length > 0) {
      nextHistoryEntries.push({
        type: 'output',
        id: commandId + '-output',
        lines: outputLines,
        command: input,
        isRawFileOutput: isRawFileOutput,
      });
    }

    if (newCwd && newCwd !== cwd) {
      const lsResult = await processCommand('ls', newCwd);
      if (lsResult.lsItems) {
        nextHistoryEntries.push({ type: 'ls', id: commandId + '-cd-ls', items: lsResult.lsItems, path: newCwd });
      } else if (lsResult.outputLines && lsResult.outputLines.length > 0) {
        // This case might be for an error during ls after cd, or an empty dir message
        nextHistoryEntries.push({ type: 'output', id: commandId + '-cd-ls-out', lines: lsResult.outputLines });
      }
    }

    setHistory(prev => [...prev, ...nextHistoryEntries]);
    setCommandHistory((prev) => [...prev, input]);
    if (newCwd !== undefined) setCwd(newCwd);
    if (nano) setNanoContent(nano);
  };

  const handleLsItemClick = async (name: string, type: 'file' | 'folder') => {
    if (nanoContent) return;

    if (type === 'folder') {
      await handleCommand(`cd ${name}`);
    } else if (type === 'file') {
      // Default click action for files, e.g., 'view' or 'cat'
      // For this portfolio, 'view' makes sense for blog posts, 'cat' for others.
      // We can refine this if needed, e.g. based on extension.
      const fileEntry = fileTree[cwd]?.find(f => f.name === name);
      if (fileEntry?.blogUrl) {
         await handleCommand(`view ${name}`);
      } else {
         await handleCommand(`cat ${name}`);
      }
    }
  };

  const suggestions = useMemo(() => {
    return fileTree[cwd]?.map((f) => f.name) || [];
  }, [cwd, fileTree[cwd]]); // Recompute if cwd changes or contents of fileTree[cwd] change

  const renderNanoLineWithLinks = (line: string, lineKey: string | number) => {
    const segments = linkify(line);
    return (
      <div key={lineKey} className="text-white"> {/* Nano lines are typically white */}
        {segments.map((segment, segIdx) =>
          segment.type === 'link' ? (
            <a
              key={`${lineKey}-seg-${segIdx}`}
              href={segment.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline" // Consistent link styling
            >
              {segment.content}
            </a>
          ) : (
            <span key={`${lineKey}-seg-${segIdx}`}>{segment.content}</span>
          )
        )}
      </div>
    );
  };
  return (
    <div
      className="relative bg-black text-green-400 font-mono p-4 h-screen overflow-y-auto" // Added relative
    >
      {/* Watermark Image */}
      <img
        src="/acsiart.png" // Path to your image in the public folder
        alt="Watermark Logo"
        className="
          fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          max-w-[70%] max-h-[70%] w-auto h-auto 
          opacity-40 hover:opacity-30 transition-opacity duration-300 ease-in-out 
          pointer-events-none z-0 filter invert(1)
        "
      />

      {nanoContent ? (
        <div className="border border-green-400 p-4 mb-4">
          <div className="mb-2">-- NANO: {nanoContent[0]}</div>
          <pre className="whitespace-pre-wrap">
            {nanoContent.slice(1).map((line, idx) => renderNanoLineWithLinks(line, idx))}
          </pre>
          <div className="mt-4 text-yellow-400">(Press Ctrl+X or tap anywhere to exit nano)</div>
        </div>
      ) : (
        <>
          <TerminalOutput history={history} onItemClick={handleLsItemClick} />
          <TerminalPrompt cwd={cwd}>
            <TerminalInput
              onSubmit={handleCommand}
              commandHistory={commandHistory}
              cwd={cwd}
              suggestions={suggestions}
            />
          </TerminalPrompt>
        </>
      )}
    </div>
  );
};

export default TerminalShell;
