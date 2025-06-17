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
  | { type: 'prompt'; id: string; cwd?: string; command: string; customPromptText?: string } // cwd is optional, customPromptText added
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

// New types for contact form
type ContactMode =
  | 'inactive'
  | 'awaiting_name'
  | 'awaiting_email'
  | 'awaiting_message'
  | 'confirming'
  | 'sending'
  | 'sent'
  | 'error_sending';

interface ContactData { name: string; email: string; message: string; }
const initialContactData: ContactData = { name: '', email: '', message: '' };

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
  // State for contact form
  const [contactMode, setContactMode] = useState<ContactMode>('inactive');
  const [contactData, setContactData] = useState<ContactData>(initialContactData);

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

  const addHistoryEntry = (entry: HistoryEntry) => {
    setHistory(prev => [...prev, entry]);
  };

  const resetContactMode = () => {
    setContactMode('inactive');
    setContactData(initialContactData);
  };

  const handleCommand = async (input: string) => {
    const commandId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const trimmedInput = input.trim();

    if (contactMode !== 'inactive') {
      if (trimmedInput.toLowerCase() === 'cancel' || trimmedInput.toLowerCase() === 'exit') {
        addHistoryEntry({ type: 'prompt', id: `${commandId}-input`, customPromptText: getCurrentContactPrompt(), command: input });
        addHistoryEntry({ type: 'output', id: `${commandId}-cancel`, lines: ["Contact process cancelled."] });
        resetContactMode();
        setCommandHistory((prev) => [...prev, input]);
        return;
      }

      let nextPrompt = "";
      let currentStepPrompt = getCurrentContactPrompt();

      addHistoryEntry({ type: 'prompt', id: `${commandId}-input`, customPromptText: currentStepPrompt, command: input });

      switch (contactMode) {
        case 'awaiting_name':
          setContactData(prev => ({ ...prev, name: trimmedInput }));
          setContactMode('awaiting_email');
          nextPrompt = "Enter your email (required):";
          addHistoryEntry({ type: 'output', id: `${commandId}-email-prompt`, lines: [nextPrompt] });
          break;
        case 'awaiting_email':
          if (!/.+@.+\..+/.test(trimmedInput)) {
            addHistoryEntry({ type: 'output', id: `${commandId}-email-error`, lines: ["Invalid email format. Please try again.", "Enter your email (required):"] });
            // Stays in 'awaiting_email'
          } else {
            setContactData(prev => ({ ...prev, email: trimmedInput }));
            setContactMode('awaiting_message');
            nextPrompt = "Enter your message (required):";
            addHistoryEntry({ type: 'output', id: `${commandId}-message-prompt`, lines: [nextPrompt] });
          }
          break;
        case 'awaiting_message':
          if (!trimmedInput) {
             addHistoryEntry({ type: 'output', id: `${commandId}-msg-error`, lines: ["Message cannot be empty.", "Enter your message (required):"] });
            // Stays in 'awaiting_message'
          } else {
            setContactData(prev => ({ ...prev, message: trimmedInput }));
            setContactMode('confirming');
            addHistoryEntry({
              type: 'output',
              id: `${commandId}-confirm-prompt`,
              lines: [
                "--- Review Your Message ---",
                `Name: ${contactData.name || '(not provided)'}`,
                `Email: ${contactData.email}`, // Correctly interpolate the email
                `Message: ${trimmedInput}`, // Use the current input for message
                "---------------------------",
                "Send this message? (yes/no):"
              ]
            });
          }
          break;
        case 'confirming':
          if (trimmedInput.toLowerCase() === 'yes') {
            setContactMode('sending');
            addHistoryEntry({ type: 'output', id: `${commandId}-sending`, lines: ["Sending message..."] });
            try {
              const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: contactData.name,
                  email: contactData.email,
                  message: contactData.message // This should be correct from previous step
                }),
              });
              const result = await response.json();
              if (response.ok) {
                addHistoryEntry({ type: 'output', id: `${commandId}-sent`, lines: [result.success || "Message sent!"] });
                setContactMode('sent'); // Or directly reset
              } else {
                addHistoryEntry({ type: 'output', id: `${commandId}-send-error`, lines: [`Error: ${result.error || "Failed to send."}`, "Contact process terminated."] });
                setContactMode('error_sending'); // Or directly reset
              }
            } catch (error) {
              addHistoryEntry({ type: 'output', id: `${commandId}-fetch-error`, lines: ["Network error. Could not send message.", "Contact process terminated."] });
              setContactMode('error_sending'); // Or directly reset
            } finally {
              resetContactMode();
            }
          } else if (trimmedInput.toLowerCase() === 'no') {
            addHistoryEntry({ type: 'output', id: `${commandId}-no-send`, lines: ["Message not sent. Contact process cancelled."] });
            resetContactMode();
          } else {
            addHistoryEntry({ type: 'output', id: `${commandId}-confirm-invalid`, lines: ["Invalid input. Type 'yes' or 'no'."] });
            // Stays in 'confirming'
          }
          break;
      }
      setCommandHistory((prev) => [...prev, input]);
    } else {
      // Regular command processing
      const result = await processCommand(input, cwd);
      const { outputLines, newCwd, nano, shouldClearHistory, lsItems, isRawFileOutput, startContactMode } = result;

      if (shouldClearHistory) {
        setHistory([]);
        return; // 'clear' is not added to commandHistory
      }

      const currentCommandHistoryEntry: HistoryEntry = { type: 'prompt', id: `${commandId}-prompt`, cwd, command: input };
      setHistory(prev => [...prev, currentCommandHistoryEntry]);

      if (startContactMode) {
        setContactMode('awaiting_name');
        setContactData(initialContactData);
        if (outputLines && outputLines.length > 0) {
          addHistoryEntry({ type: 'output', id: `${commandId}-contact-start`, lines: outputLines });
        }
        addHistoryEntry({ type: 'output', id: `${commandId}-name-prompt`, lines: ["Enter your name (optional, press Enter to skip, or type 'cancel' to exit):"] });
      } else {
        if (lsItems && lsItems.length > 0) {
          addHistoryEntry({ type: 'ls', id: `${commandId}-ls`, items: lsItems, path: newCwd || cwd });
        } else if (outputLines && outputLines.length > 0) {
          addHistoryEntry({
            type: 'output',
            id: `${commandId}-output`,
            lines: outputLines,
            command: input,
            isRawFileOutput: isRawFileOutput,
          });
        }

        if (newCwd && newCwd !== cwd) {
          const lsResult = await processCommand('ls', newCwd);
          if (lsResult.lsItems) {
            addHistoryEntry({ type: 'ls', id: `${commandId}-cd-ls`, items: lsResult.lsItems, path: newCwd });
          } else if (lsResult.outputLines && lsResult.outputLines.length > 0) {
            addHistoryEntry({ type: 'output', id: `${commandId}-cd-ls-out`, lines: lsResult.outputLines });
          }
        }
      }

      setCommandHistory((prev) => [...prev, input]);
      if (newCwd !== undefined) setCwd(newCwd);
      if (nano) setNanoContent(nano);
    }
  };

  const getCurrentContactPrompt = (): string => {
    switch (contactMode) {
      case 'awaiting_name': return "Name: ";
      case 'awaiting_email': return "Email: ";
      case 'awaiting_message': return "Message: ";
      case 'confirming': return "Confirm (yes/no): ";
      default: return "$ "; // Fallback, should not be reached often
    }
  };

  const handleLsItemClick = async (name: string, type: 'file' | 'folder') => {
    if (nanoContent || contactMode !== 'inactive') return; // Disable clicks during nano or contact mode

    if (type === 'folder') {
      await handleCommand(`cd ${name}`);
    } else if (type === 'file') {
      const fileEntry = fileTree[cwd]?.find(f => f.name === name);
      if (fileEntry?.blogUrl) {
         await handleCommand(`view ${name}`);
      } else if (fileEntry?.name === 'contact' && fileEntry?.ext === 'cmd') { // Allow clicking 'contact'
         await handleCommand(`contact`);
      } else {
         await handleCommand(`cat ${name}`);
      }
    }
  };

  const suggestions = useMemo(() => {
    if (contactMode !== 'inactive') return []; // No suggestions in contact mode
    return fileTree[cwd]?.map((f) => f.name) || [];
  }, [cwd, fileTree, contactMode]); // Added contactMode and fileTree to dependencies

  const renderNanoLineWithLinks = (line: string, lineKey: string | number) => {
    const segments = linkify(line);
    return (
      <div key={lineKey} className="text-white">
        {segments.map((segment, segIdx) =>
          segment.type === 'link' ? (
            <a
              key={`${lineKey}-seg-${segIdx}`}
              href={segment.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
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
      className="relative bg-black text-green-400 font-mono p-4 h-screen overflow-y-auto"
    >
      <img
        src="/acsiart.png"
        alt="Watermark Logo"
        className="
          fixed bottom-4 right-6 max-w-[180px] max-h-[180px] w-260 h-260
          opacity-100 hover:opacity-100 transition-opacity duration-300 ease-in-out
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
          {contactMode !== 'inactive' ? (
            <TerminalPrompt customPrompt={getCurrentContactPrompt()}>
              <TerminalInput
                onSubmit={handleCommand}
                commandHistory={commandHistory}
                cwd={cwd} // Still pass cwd, though not directly used for prompt text here
                suggestions={[]} // No suggestions in contact mode
              />
            </TerminalPrompt>
          ) : (
            <TerminalPrompt cwd={cwd}>
              <TerminalInput
                onSubmit={handleCommand}
                commandHistory={commandHistory}
                cwd={cwd}
                suggestions={suggestions}
              />
            </TerminalPrompt>
          )}
        </>
      )}
    </div>
  );
};

export default TerminalShell;
