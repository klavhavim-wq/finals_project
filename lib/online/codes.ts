/**
 * Lobby codes. Four characters, read aloud across a classroom, typed by a child
 * who may be seven.
 *
 * The alphabet leaves out *both* halves of every pair that gets misread or
 * misheard — I and 1, O and 0, S and 5, Z and 2. Because neither half can ever
 * appear in a real code, a misheard character is always an obvious error rather
 * than a silent trip into somebody else's game.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRTUVWXY346789";
export const CODE_LENGTH = 4;

export function makeCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Accepts what a child actually types — lower case, stray spaces, a dash they
 *  added themselves. Returns null if it cannot be a real code, so the caller can
 *  say "check that code" rather than guess at what was meant. */
export function normaliseCode(raw: string): string | null {
  const cleaned = raw.toUpperCase().replace(/[\s-]/g, "");
  if (cleaned.length !== CODE_LENGTH) return null;
  for (const ch of cleaned) if (!ALPHABET.includes(ch)) return null;
  return cleaned;
}
