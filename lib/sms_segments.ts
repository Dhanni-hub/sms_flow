import type { SmsSegmentInfo } from "@/types";

const GSM_7_BASIC = [
  "@", "\u00a3", "$", "\u00a5", "\u00e8", "\u00e9", "\u00f9", "\u00ec",
  "\u00f2", "\u00c7", "\n", "\u00d8", "\u00f8", "\r", "\u00c5", "\u00e5",
  "\u0394", "_", "\u03a6", "\u0393", "\u039b", "\u03a9", "\u03a0", "\u03a8",
  "\u03a3", "\u0398", "\u039e", "\u00c6", "\u00e6", "\u00df", "\u00c9", " ",
  "!", "\"", "#", "\u00a4", "%", "&", "'", "(", ")", "*", "+", ",", "-",
  ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";",
  "<", "=", ">", "?", "\u00a1", "A", "B", "C", "D", "E", "F", "G", "H",
  "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V",
  "W", "X", "Y", "Z", "\u00c4", "\u00d6", "\u00d1", "\u00dc", "\u00a7",
  "\u00bf", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l",
  "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
  "\u00e4", "\u00f6", "\u00f1", "\u00fc", "\u00e0",
];

const GSM_7_EXTENDED = ["^", "{", "}", "\\", "[", "~", "]", "|", "\u20ac"];

const GSM_7_SET = new Set(GSM_7_BASIC);
const GSM_7_EXT_SET = new Set(GSM_7_EXTENDED);

function isGsm7Compatible(text: string): boolean {
  for (const ch of text) {
    if (!GSM_7_SET.has(ch) && !GSM_7_EXT_SET.has(ch)) return false;
  }
  return true;
}

function gsm7Length(text: string): number {
  let len = 0;
  for (const ch of text) {
    len += GSM_7_EXT_SET.has(ch) ? 2 : 1;
  }
  return len;
}

export function calculateSmsSegments(text: string): SmsSegmentInfo {
  if (text.length === 0) {
    return { characterCount: 0, charLimit: 160, segments: 0, encoding: "GSM-7" };
  }

  const gsm7 = isGsm7Compatible(text);
  const encoding: SmsSegmentInfo["encoding"] = gsm7 ? "GSM-7" : "UCS-2";
  const effectiveLength = gsm7 ? gsm7Length(text) : Array.from(text).length;
  const singleLimit = gsm7 ? 160 : 70;
  const concatLimit = gsm7 ? 153 : 67;

  return {
    characterCount: effectiveLength,
    charLimit: effectiveLength <= singleLimit ? singleLimit : concatLimit,
    segments: effectiveLength <= singleLimit ? 1 : Math.ceil(effectiveLength / concatLimit),
    encoding,
  };
}

export function extractTemplateVariables(body: string): string[] {
  const matches = body.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) ?? [];
  const names = matches.map((match) => match.replace(/\{\{\s*|\s*\}\}/g, ""));
  return Array.from(new Set(names));
}

export function renderTemplate(body: string, values: Record<string, string>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => values[key] ?? `{{${key}}}`);
}
