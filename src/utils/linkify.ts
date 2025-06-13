// src/utils/linkify.ts

export type LinkSegment =
  | { type: 'text'; content: string }
  | { type: 'link'; href: string; content: string };

/**
 * Parses a string and returns an array of segments,
 * distinguishing between plain text and detected URLs/mailto links.
 * @param text The input string to parse.
 * @returns An array of LinkSegment objects.
 */
export const linkify = (text: string): LinkSegment[] => {
  // Regex to find URLs (http, https, ftp, file) and mailto links
  const urlRegex = /(\b(?:https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]|\bmailto:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/ig;
  const segments: LinkSegment[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    const index = match.index;

    if (index > lastIndex) {
      segments.push({ type: 'text', content: text.substring(lastIndex, index) });
    }
    segments.push({ type: 'link', href: url, content: url });
    lastIndex = index + url.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
};