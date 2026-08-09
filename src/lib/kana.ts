// Converts hiragana characters to katakana so search input typed in
// either script can match names stored in katakana (e.g. champion names).
export function toKatakana(s: string): string {
  return s.replace(/[ぁ-ゖ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}
