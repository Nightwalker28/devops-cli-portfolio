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
      name: 'about_me.txt',
      type: 'file',
      ext: 'txt',
      content: [
        "Hey, I'm Maad 👋",
        "",
        "I’m a DevOps engineer from Colombo, Sri Lanka, and my journey into tech didn’t start in a server room — ",
        "it started with curiosity. First came the love for tech, then the thrill of programming — writing lines of code ",
        "that actually did things. Useful things.",
        "",
        "During my internship, I stumbled into the world of DevOps, quite literally. One day I was just maintaining ",
        "WordPress pages, and the next I was configuring live Linux servers, writing deployment scripts, and learning ",
        "the hard way why mail servers hate static IPs (yes, I got blacklisted on every spam list in the galaxy 🌌).",
        "",
        "That moment — setting up my first real server, alone, from scratch — was when it clicked: this is what ",
        "I want to do. Automating boring stuff. Building systems that just *work*. Because honestly? Repeating ",
        "the same thing twice makes me want to bash my head against a Bash script.",
        "",
        "Since then, I’ve been the one-man tech army at a B2B firm trying to turn into a tech company. I wear ",
        "many hats (most of them DevOps-flavored) — from Docker wizardry to CI/CD pipelines, from email ",
        "verifiers to EDM tools. I built https://thevalid8.com solo, learned Redis, Celery, Postfix, and got humbled by ",
        "DNS configs I thought I understood.",
        "",
        "Outside work, I'm a scuba diver 🐠. Not a weekend hobbyist — I’m PADI Advanced, and diving is ",
        "how I reset. It’s quiet, it’s weightless, it’s a different world where it’s just me and the ocean. ",
        "It’s also where I steal all my metaphors from:",
        "",
        '  "Life’s like scuba diving — sometimes you just gotta dive in head first, roll with the currents, and embrace the unknown."',
        "",
        "I also love gaming, watching esports, exploring networking gear, and building personal projects ",
        "like my current baby: a DIY NAS. I tend to fall head-first into new obsessions (read: side quests), ",
        "learn everything I can, then hop onto the next — call me a jack of all tech trades.",
        "",
        "Let’s connect if you're into servers, ocean stuff, esports tactics, or just wanna chat about ",
        "why mail servers are still stuck in 1999.",
        "",
        "Links:",
        "- GitHub: https://github.com/Nightwalker28",
        "- LinkedIn: https://www.linkedin.com/in/maad-mustafa/",
        "- Dev.to: https://dev.to/nightwalker28",
        "- Website: https://maad.dev",
        "- Insta (if you're curious): https://www.instagram.com/maad_4570/",
      ],
    },
    {
      name: 'resume.yaml',
      type: 'file',
      ext: 'yaml',
      content: [
        "name: Maad Mustafa",
        "title: DevOps Engineer",
        "location: Colombo, Sri Lanka",
        "email: maadmustafa28@gmail.com",
        "links:",
        "  github: https://github.com/Nightwalker28",
        "  linkedin: https://linkedin.com/in/maad-mustafa",
        "  devto: https://dev.to/nightwalker28",
        "  website: https://maad.dev",
         "summary: >",
        "  Junior DevOps Engineer with a strong foundation in Computer Science",
        "  and experience in AWS, Docker, Kubernetes, and automation tools",
        "  like Jenkins and Terraform. Focused on building scalable",
        "  infrastructure and optimizing systems.",
        "experience:",
        "  - role: Junior DevOps Engineer",
        "    company: Acumen Intelligence",
        "    duration: Jan 2024 – Present",
        "    highlights:",
        "      - Built and launched thevalid8.com, an email verification platform.",
        "      - Managed server configurations and network optimization.",
        "      - Developed an EDM tool to streamline marketing.",
        "      - Set up automated deployments using Docker and GitHub Actions.",

        "  - role: Campaign Executive",
        "    company: Acumen Intelligence",
        "    duration: Feb 2023 – Jan 2024",
        "    highlights:",
        "      - Executed and optimized email marketing campaigns.",
        "      - Contributed to overall marketing strategy and growth.",

        "skills:",
        "  cloud_devops: [AWS, Docker, Kubernetes, Terraform, Ansible, Jenkins, GitHub Actions]",
        "  languages: [Python, JavaScript, Java, SQL, Bash]",
        "  frameworks: [Flask, Node.js, React]",
        "  databases: [MySQL, PostgreSQL, Redis, Celery]",
        "  systems: [Linux Server Administration, NGINX, SSL]",

        "education:",
        "  degree: BEng in Computer Science",
        "  institution: University of Westminster",
        "  duration: Sept 2021 – Jun 2026",
      ],
    },
  ],
  '/projects': [
    { name: 'terraform-aws', type: 'folder' },
    { name: 'cicd-pipeline', type: 'folder' },
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

  if (trimmed === 'help') {
    const helpEntries = [
      { cmd: 'cd <dir>', desc: 'Change directory' },
      { cmd: 'ls', desc: 'List directory contents' },
      { cmd: 'cat <file>', desc: 'View file content' },
      { cmd: 'nano <file>', desc: 'Open file in nano view' },
      { cmd: 'view <file>', desc: 'Open file visually in browser' },
      { cmd: 'clear', desc: 'Clear the screen' },
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

    if (file?.content) {
      if (commandType === 'nano') {
        nano = [file.name, ...file.content];
      } else if (commandType === 'view' && file.blogUrl) {
        if (typeof window !== 'undefined') {
          window.open(file.blogUrl, '_blank');
        }
        outputLines = [`Opening ${file.name} in a new tab...`];
      } else if (commandType === 'cat' && file.blogUrl) {
         // If 'cat' is used on a blog file, suggest 'view' instead
         outputLines = [`This is a blog post. Use \`view ${file.name}\` to open it in a new tab.`];
      } else {
        outputLines = file.content;
      }
    } else {
      outputLines = [`${commandType}: ${targetFileName}: No such file or directory`];
    }
  } else if (trimmed === 'clear') {
    // outputLines remains empty
    return {
      outputLines: [],
      newCwd,
      nano,
      shouldClearHistory: true,
    };
  } else {
    outputLines = [`Command not found: ${cmd}`];
  }

  return { outputLines, lsItems, newCwd, nano };
};