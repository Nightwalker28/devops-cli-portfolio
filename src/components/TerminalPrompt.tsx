import React from 'react';
import { getPromptString } from '@/utils/terminalUtils';

interface TerminalPromptProps {
  cwd?: string; // Make cwd optional for custom prompts
  customPrompt?: string;
  children: React.ReactNode;
}

const TerminalPrompt = ({ cwd, customPrompt, children }: TerminalPromptProps) => {
  const promptText = customPrompt !== undefined ? customPrompt : (cwd ? getPromptString(cwd) : '> ');
  return (
    <div className="flex">
      <span className="pr-2 text-green-400">{promptText}</span> {/* Ensure prompt text has consistent color */}
      {children}
    </div>
  );
};

export default TerminalPrompt;