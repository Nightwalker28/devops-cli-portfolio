import React from 'react';
import { HistoryEntry } from './TerminalShell'; // Assuming HistoryEntry is exported or defined here
import { LsOutputItem } from './CommandProcessor'; // Assuming LsOutputItem is exported
import { getPromptString } from '@/utils/terminalUtils';
import { linkify, LinkSegment } from '@/utils/linkify';

interface TerminalOutputProps {
  history: HistoryEntry[];
  onItemClick: (name: string, type: 'file' | 'folder') => Promise<void>;
}

const TerminalOutput = ({ history, onItemClick }: TerminalOutputProps) => {
  const renderLineWithLinks = (line: string, lineKey: string | number) => {
    const segments = linkify(line);
    return (
      <div key={lineKey}>
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
    <>
      {history.map((entry) => {
        switch (entry.type) {
          case 'prompt':
            return (
              <div key={entry.id} className="flex">
                <span className="pr-2">{getPromptString(entry.cwd)}</span>
                <span>{entry.command}</span>
              </div>
            );
          case 'ls':
            return (
              <div key={entry.id} className="flex flex-wrap">
                {entry.items.map((item, i) => {
                  const isFile = item.type === 'file';
                  const isYaml = item.ext === 'yaml';
                  const isMd = item.ext === 'md';
                  const isTxt = item.ext === 'txt';
                  const isInf = item.ext === 'inf';
                  let colorClass = 'text-cyan-400'; // Default for folder
                  if (isFile) {
                    colorClass = (isYaml || isMd) ? 'text-yellow-400' : 'text-white';
                  }
                  return (
                    <span
                      key={`${entry.id}-item-${i}`}
                      className={`${colorClass} mr-4 cursor-pointer hover:underline`}
                      onClick={() => onItemClick(item.name, item.type)}
                    >
                      {item.name}
                    </span>
                  );
                })}
              </div>
            );
          case 'output':
            const outputColorClass = entry.isRawFileOutput ? 'text-white' : ''; // Default inherits terminal green
            return (
              <div key={entry.id} className={`whitespace-pre-wrap ${outputColorClass}`}>
                {entry.lines.map((line, i) => (
                  renderLineWithLinks(line, `${entry.id}-line-${i}`) // Links within will still be blue
                ))}
              </div>
            );
          case 'message':
            let containerClasses = "";
            if (entry.isWelcome) {
              containerClasses = "mb-2"; // Standard margin for welcome messages
            }

            // Watermark is global, so messages just render their text.
            // The 'relative' positioning and margin for side-by-side image are removed.
            return (
              <div key={entry.id} className={containerClasses}>
                {Array.isArray(entry.text)
                  ? entry.text.map((line, index) => renderLineWithLinks(line, `${entry.id}-txt-${index}`))
                  : entry.text
                  ? renderLineWithLinks(entry.text, `${entry.id}-txt-0`)
                  : null}
              </div>
            );
          default:
            return null;
        }
      })}
    </>
  );
};

export default TerminalOutput;
