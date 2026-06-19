const OLD_SOURCE_PATTERN = /\b(?:geopolitika(?:\.news)?|meter(?:ov\w*)?|zoran)\b/i;

export function isOldSourceText(value: string | null) {
  return Boolean(value && OLD_SOURCE_PATTERN.test(value));
}

export function hideOldSourceText(value: string | null) {
  if (!isOldSourceText(value)) return value;
  return "Stari zapis iz prethodne verzije agenta.";
}
