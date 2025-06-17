// File: components/CommandProcessor.ts
import { aboutMeContent } from './fileData/aboutMeContent';
import { resumeContent } from './fileData/resumeContent';
import { ansibleSummary } from './fileData/ansible/Summary';
import { ansibleStack } from './fileData/ansible/Stack';
import { ansibleOutcome } from './fileData/ansible/Outcome';
import { ansibleNotes } from './fileData/ansible/Notes';
import { valid8Summary } from './fileData/valid8/Summary';

export type FileEntry = {
  name: string;
  type: 'file' | 'folder';
  ext?: string;
  content?: string[];
  blogUrl?: string; // for visual view toggle
};

export const fileTree: Record<string, FileEntry[]> = {
  '/': [
    { name: 'projects', type: 'folder' },
    { name: 'blogs', type: 'folder' },
    {name: 'about_me.txt', type: 'file', ext: 'txt', content: aboutMeContent,},
    {name: 'contact_me', type: 'file', ext: 'cmd'}, // No content needed, it's a command
    {name: 'resume.yaml', type: 'file', ext: 'yaml', content: resumeContent,},
  ],
  '/projects': [
    { name: 'ansible-automation.inf', type: 'file', ext: 'inf', content: ansibleSummary},
    { name: 'ansible-automation', type: 'folder' },
    { name: 'valid8.inf', type: 'file', ext: 'txt', content: valid8Summary,},
    { name: 'valid8', type: 'folder' },
  ],
  '/projects/ansible-automation': [
    {name: 'stack.yaml', type: 'file', ext: 'yaml', content:ansibleStack,},
    {name: 'outcome.md', type: 'file', ext: 'md', content:ansibleOutcome,},
    {name: 'notes.txt', type: 'file', ext: 'txt', content:ansibleNotes,},
  ],
  '/projects/valid8': [
    {name: 'stack.yaml', type: 'file', ext: 'yaml', content:ansibleStack,},
    {name: 'outcome.md', type: 'file', ext: 'md', content:ansibleOutcome,},
    {name: 'notes.txt', type: 'file', ext: 'txt', content:ansibleNotes,},
  ],
  '/blogs': [],
};

export type LsOutputItem = { name: string; type: 'file' | 'folder'; ext?: string };

export type CommandResult = {
  outputLines: string[];
  lsItems?: LsOutputItem[];
  newCwd: string | undefined;
  nano: string[] | null;
  shouldClearHistory?: boolean;
  isRawFileOutput?: boolean;
  startContactMode?: boolean; // Signal to TerminalShell
};

const getFullPath = (currentDirectory: string, targetPath: string): string => {
  targetPath = targetPath.replace(/\/$/, ''); // Remove trailing slash for consistency

  if (targetPath.startsWith('/')) {
    // Absolute path
    const segments = targetPath.split('/').filter(Boolean);
    return '/' + segments.join('/') || '/'; // Ensure root is '/'
  }

  const currentSegments = currentDirectory.split('/').filter(Boolean);
  const targetSegments = targetPath.split('/').filter(Boolean);
  
  let newPathSegments = [...currentSegments];

  for (const segment of targetSegments) {
    if (segment === '..') {
      newPathSegments.pop();
    } else if (segment !== '.' && segment !== '') {
      newPathSegments.push(segment);
    }
  }
  return '/' + newPathSegments.join('/') || '/'; // Ensure root is '/'
};


export const processCommand = async (cmd: string, cwd: string): Promise<CommandResult> => {
  const trimmed = cmd.trim();
  let outputLines: string[] = [];
  let newCwd: string | undefined;
  let nano: string[] | null = null;
  let lsItems: LsOutputItem[] | undefined;
  let isRawFileOutput: boolean | undefined = undefined;
  let shouldClearHistory: boolean = false;

  if (trimmed === 'help') {
    const helpEntries = [
      { cmd: 'cd    <dir>', desc: 'Change directory' },
      { cmd: 'ls', desc: 'List directory contents' },
      { cmd: 'cat   <file>', desc: 'View file content' },
      { cmd: 'nano  <file>', desc: 'Open file in nano view' },
      { cmd: 'view  <file>', desc: 'Open file visually in browser' },
      { cmd: 'clear', desc: 'Clear the screen' },
      { cmd: 'contact', desc: 'Send me a message' },
      { cmd: 'help', desc: 'Show this help' },
    ];

    let maxCmdLength = 0;
    helpEntries.forEach(entry => {
      if (entry.cmd.length > maxCmdLength) {
        maxCmdLength = entry.cmd.length;
      }
    });

    outputLines = ['Available commands:'];
    helpEntries.forEach(entry => {
      const paddedCmd = entry.cmd.padEnd(maxCmdLength + 2); // +2 for a little extra space before '-'
      outputLines.push(`  ${paddedCmd} - ${entry.desc}`);
    });

  } else if (trimmed === 'ls') {
    const entries = fileTree[cwd] || [];
    if (entries.length > 0) {
      lsItems = entries.map(e => ({ name: e.name, type: e.type, ext: e.ext }));
    } else {
      // If directory is empty, still check if it's /blogs to potentially show a hint
      if (cwd === '/blogs') {
         outputLines.push('Fetching blogs...'); // Indicate that fetching is happening
      }
      outputLines = ['(empty)'];
    }
  } else if (trimmed.startsWith('cd ')) {
    const target = trimmed.substring('cd '.length).trim();
    if (target === '~') {
      newCwd = '/';
    } else {
      const resolvedPath = getFullPath(cwd, target);
      // If resolvedPath is a key in fileTree, it's a directory we can cd into.
      if (typeof fileTree[resolvedPath] !== 'undefined') {
        newCwd = resolvedPath;
        if (resolvedPath === '/blogs' && fileTree['/blogs'].length === 0) {
          try {
            const res = await fetch('/api/devto');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const articles = await res.json();
            const blogFiles: FileEntry[] = [];

            for (const article of articles) {
              const detailRes = await fetch(`https://dev.to/api/articles/${article.id}`);
              if (!detailRes.ok) continue;
              const detail = await detailRes.json();

              blogFiles.push({
                name: `${article.slug}.md`,
                type: 'file',
                ext: 'md',
                blogUrl: article.url,
                content: [
                  `# ${article.title}`,
                  '',
                  ...(detail.body_markdown?.split('\n') || ['(No content)']),
                  '',
                  `Read more: ${article.url}`,
                ],
              });
            }

            fileTree['/blogs'] = blogFiles;
          } catch (e: any) {
            outputLines = [`Failed to fetch blogs from Dev.to: ${e.message}`];
          }
        }
        // After successful cd, if it's /blogs, add a hint
        if (newCwd === '/blogs') {
           // This hint will be added *after* the ls output for the new directory
           outputLines.push('Hint: Use `view <filename.md>` to open blog posts in a new tab.');
        }
      } else {
        // More specific error messages
        const entriesInCwd = fileTree[cwd] || [];
        const targetEntry = entriesInCwd.find(entry => entry.name === target);
        if (targetEntry && targetEntry.type === 'file') {
          outputLines = [`cd: ${target}: Not a directory`];
        } else {
          outputLines = [`cd: ${target}: No such file or directory`];
        }
      }
    }
  } else if (trimmed.startsWith('cat ') || trimmed.startsWith('nano ') || trimmed.startsWith('view ')) {
    let commandType: 'cat' | 'nano' | 'view' = 'cat';
    let targetFileName: string = '';

    if (trimmed.startsWith('nano ')) {
      commandType = 'nano';
      targetFileName = trimmed.substring('nano '.length).trim();
    } else if (trimmed.startsWith('view ')) {
      commandType = 'view';
      targetFileName = trimmed.substring('view '.length).trim();
    } else { // cat
      commandType = 'cat';
      targetFileName = trimmed.substring('cat '.length).trim();
    }

    const entries = fileTree[cwd] || [];
    const file = entries.find((f) => f.name === targetFileName && f.type === 'file');

    if (!file) {
      outputLines = [`${commandType}: ${targetFileName}: No such file or directory`];
    } else {
      // File exists
      if (commandType === 'nano') {
        if (file.content && file.content.length > 0) {
          nano = [file.name, ...file.content];
        } else {
          // Open nano with filename even if content is empty/undefined
          nano = [file.name, ''];
        }
      } else if (commandType === 'view') {
        if (file.blogUrl) {
          if (typeof window !== 'undefined') {
            window.open(file.blogUrl, '_blank');
          }
          outputLines = [`Opening ${file.name} in a new tab...`];
        } else {
          // 'view' on a non-blog file, suggest other commands
          outputLines = [`view: This is not a blog post. Use 'cat ${targetFileName}' or 'nano ${targetFileName}'.`];
        }
      } else if (commandType === 'cat') {
        if (file.blogUrl) {
          // If 'cat' is used on a blog file, suggest 'view' instead
          outputLines = [`This is a blog post. Use \`view ${file.name}\` to open it in a new tab or use \'nano ${file.name}\` to open it within the terminal.`];
        } else if (file.content && file.content.length > 0) {
          outputLines = file.content;
          isRawFileOutput = true; // This is raw file content from cat
        } else {
          // Catting an empty file (undefined content or empty array) results in no output lines
          outputLines = [];
        }
      }
    }
  } else if (trimmed === 'clear') {
    // outputLines remains empty
    return {
      outputLines: [],
      newCwd,
      nano,
      isRawFileOutput, // ensure all return paths include it
      shouldClearHistory: true,
    };
  } else if (trimmed === 'contact_me') {
    outputLines = ["Initiating contact sequence...", "You can type 'cancel' at any step to exit."];
    return { outputLines, newCwd, nano, isRawFileOutput, shouldClearHistory, startContactMode: true };

  } else {
    outputLines = [`Command not found: ${cmd}`];
  }

  return { outputLines, lsItems, newCwd, nano, isRawFileOutput, shouldClearHistory };
};