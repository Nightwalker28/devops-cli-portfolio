import React from 'react';

const TerminalOutput = ({ history }: { history: string[] }) => {
  return (
    <>
      {history.map((line, idx) => {
        if (line.includes('/') && !line.includes('$')) {
          return (
            <div key={idx} className="text-cyan-400">{line}</div>
          );
        }
        if (line.includes('.md') || line.includes('.yaml')) {
          return (
            <div key={idx} className="text-yellow-400">{line}</div>
          );
        }
        return <div key={idx}>{line}</div>;
      })}
    </>
  );
};

export default TerminalOutput;