import React from 'react';

const TerminalOutput = ({ history }: { history: string[] }) => {
  return (
    <>
      {history.map((line, idx) => {
        // If it's a horizontal listing line (e.g., from 'ls')
        if (!line.includes('$') && line.includes('  ')) {
          return (
            <div key={idx}>
              {line.split('  ').map((item, i) => {
                const isFile = item.includes('.');
                const isYaml = item.endsWith('.yaml');
                const isMd = item.endsWith('.md');
                const colorClass = isFile
                  ? isYaml || isMd
                    ? 'text-yellow-400'
                    : 'text-white'
                  : 'text-cyan-400';

                return (
                  <span key={i} className={`${colorClass} mr-4`}>
                    {item}
                  </span>
                );
              })}
            </div>
          );
        }

        // All other outputs (commands, help, errors)
        return <div key={idx}>{line}</div>;
      })}
    </>
  );
};

export default TerminalOutput;
