// src/utils/terminalUtils.ts
export const getPromptString = (cwd: string, user: string = "nightwalker28", host: string = "nightwalkerslenovo"): string => {
  const pathDisplay = cwd === '/' ? '~' : `~${cwd}`;
  return `${user}@${host}:${pathDisplay}$`;
};