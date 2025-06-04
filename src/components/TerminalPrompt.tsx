import React from 'react';

const TerminalPrompt = ({ cwd, children }: { cwd: string; children: React.ReactNode }) => {
  return (
    <div className="flex">
      <span className="pr-2">
        nightwalker28@nightwalkerslenovo:{cwd === '/' ? '~' : `~${cwd}`}$
      </span>
      {children}
    </div>
  );
};

export default TerminalPrompt;