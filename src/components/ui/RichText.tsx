import { Fragment } from "react";

const TOKEN = /(<b>.*?<\/b>|<i>.*?<\/i>)/g;

/**
 * Renders dictionary strings with inline <b>…</b> / <i>…</i> emphasis
 * as React elements — no raw HTML injection.
 */
export function RichText({ text }: { text: string }) {
  return text.split(TOKEN).map((part, index) => {
    if (part.startsWith("<b>")) return <strong key={index}>{part.slice(3, -4)}</strong>;
    if (part.startsWith("<i>")) return <em key={index}>{part.slice(3, -4)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}
