// File: components/CommandProcessor.ts
export type FileEntry = {
  name: string;
  type: 'file' | 'folder';
  ext?: string;
  content?: string[];
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
          const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;
          const res = await fetchFn('https://dev.to/api/articles?username=nightwalker28', {
            headers: { 'accept': 'application/json' },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const articles = await res.json();
          const blogFiles = articles.map((article: any): FileEntry => ({
            name: `${article.slug}.md`,
            type: 'file',
            ext: 'md',
            content: [
              `# ${article.title}`,
              '',
              ...article.body_markdown.split('\n').slice(0, 20),
              '',
              `Read more: ${article.url}`,
            ],
          }));
          fileTree['/blogs'] = blogFiles;
        } catch (e: any) {
          output = [`Failed to fetch blogs from Dev.to: ${e.message}`];
        }
      }
    } else {
      output = [`cd: ${target}: Not a directory`];
    }
  } else if (trimmed.startsWith('cat ') || trimmed.startsWith('nano ')) {
    const isNano = trimmed.startsWith('nano ');
    const target = trimmed.slice(isNano ? 5 : 4).trim();
    const entries = fileTree[cwd] || [];
    const file = entries.find((f) => f.name === target && f.type === 'file');
    if (file?.content) {
      if (isNano) {
        nano = [file.name, ...file.content];
      } else {
        output = file.content;
      }
    } else {
      output = [`${isNano ? 'nano' : 'cat'}: ${target}: No such file`];
    }
  } else if (trimmed === 'clear') {
    output = [];
  } else {
    output = [`Command not found: ${cmd}`];
  }

  return { output, newCwd, nano };
};
