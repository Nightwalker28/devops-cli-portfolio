import React from 'react';
import { getPromptString } from '@/utils/terminalUtils';

const TerminalPrompt = ({ cwd, children }: { cwd: string; children: React.ReactNode }) => {
  return (
    <div className="flex">
      <span className="pr-2">{getPromptString(cwd)}</span>
      {children}
    </div>
  );
};

export default TerminalPrompt;