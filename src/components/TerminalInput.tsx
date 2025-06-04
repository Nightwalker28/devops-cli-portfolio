'use client';

import { useEffect, useRef, useState } from 'react';

interface TerminalInputProps {
  onSubmit: (cmd: string) => void;
  commandHistory: string[];
  cwd: string;
  suggestions: string[];
}

const TerminalInput = ({ onSubmit, commandHistory, cwd, suggestions }: TerminalInputProps) => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit(input);
      setInput('');
      setHistoryIndex(null);
    } else if (e.key === 'ArrowUp') {
      const newIndex = historyIndex === null ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setInput(commandHistory[newIndex] || '');
      setHistoryIndex(newIndex);
    } else if (e.key === 'ArrowDown') {
      if (historyIndex === null) return;
      const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
      setInput(commandHistory[newIndex] || '');
      setHistoryIndex(newIndex);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.split(' ');
      const base = parts.slice(0, -1).join(' ');
      const lastWord = parts[parts.length - 1];
      const match = suggestions.find((s) => s.startsWith(lastWord));
      if (match) setInput(`${base} ${match}`.trim());
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      className="bg-black text-green-400 outline-none w-full"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
};

export default TerminalInput;
