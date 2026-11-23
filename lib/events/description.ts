export function descriptionToPlainText(description: string) {
  return description
    .replace(/\[([^\]\n]{1,200})\]\((https?:\/\/[^\s)]+)\)/gi, "$1 ($2)")
    .replace(/\+\+([^+\n]+)\+\+/g, "$1")
    .replace(/~~([^~\n]+)~~/g, "$1")
    .replace(/^- /gm, "• ");
}
