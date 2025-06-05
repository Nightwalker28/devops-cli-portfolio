// File: components/CommandProcessor.ts
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
    {
      name: 'resume.yaml',
      type: 'file',
      ext: 'yaml',
      content: [
        'name: Nightwalker28',
        'title: DevOps Engineer',
        'location: Sri Lanka',
        'stack:',
        '  - Docker',
        '  - Kubernetes',
        '  - Ansible',
        '  - GitHub Actions',
      ],
    },
  ],
  '/projects': [
    { name: 'terraform-aws', type: 'folder' },
    { name: 'cicd-pipeline', type: 'folder' },
  ],
  '/blogs': [],
};

export const processCommand = async (cmd: string, cwd: string) => {
  const trimmed = cmd.trim();
  let output: string[] = [];
  let newCwd: string | undefined;
  let nano: string[] | null = null;

  const getFullPath = (target: string) => {
    if (target === '..') {
      const segments = cwd.split('/').filter(Boolean);
      segments.pop();
      return '/' + segments.join('/');
    } else {
      return cwd === '/' ? `/${target}` : `${cwd}/${target}`;
    }
  };

  if (trimmed === 'help') {
    output = [
      'Available commands:',
      '  cd <dir>           - Change directory',
      '  ls                 - List directory contents',
      '  cat <file>         - View file content',
      '  nano <file>        - Open file in nano view',
      '  view <file>        - Open file visually in browser',
      '  clear              - Clear the screen',
      '  help               - Show this help',
    ];
  } else if (trimmed === 'ls') {
    const entries = fileTree[cwd] || [];
    const line = entries.map(e => e.name).join('  ');
    output = [line || '(empty)'];
  } else if (trimmed.startsWith('cd ')) {
    const target = trimmed.slice(3).trim().replace(/\/$/, '');
    const fullPath = getFullPath(target);
    if (fileTree[fullPath]) {
      newCwd = fullPath;
      if (fullPath === '/blogs' && fileTree['/blogs'].length === 0) {
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
                ...detail.body_markdown?.split('\n') || ['(No content)'],
                '',
                `Read more: ${article.url}`,
              ],
            });
          }

          fileTree['/blogs'] = blogFiles;
        } catch (e: any) {
          output = [`Failed to fetch blogs from Dev.to: ${e.message}`];
        }
      }
    } else {
      output = [`cd: ${target}: Not a directory`];
    }
  } else if (trimmed.startsWith('cat ') || trimmed.startsWith('nano ') || trimmed.startsWith('view ')) {
    const isNano = trimmed.startsWith('nano ');
    const isView = trimmed.startsWith('view ');
    const target = trimmed.slice(isNano ? 5 : isView ? 5 : 4).trim();
    const entries = fileTree[cwd] || [];
    const file = entries.find((f) => f.name === target && f.type === 'file');
    if (file?.content) {
      if (isNano) {
        nano = [file.name, ...file.content];
      } else if (isView && file.blogUrl) {
        if (typeof window !== 'undefined') {
          window.open(file.blogUrl, '_blank');
        }
        output = [];
      } else {
        output = file.content;
      }
    } else {
      output = [`${isNano ? 'nano' : isView ? 'view' : 'cat'}: ${target}: No such file`];
    }
  } else if (trimmed === 'clear') {
    output = [];
  } else {
    output = [`Command not found: ${cmd}`];
  }

  return { output, newCwd, nano };
};