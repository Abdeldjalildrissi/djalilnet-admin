import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format } from "date-fns"
import DOMPurify from "isomorphic-dompurify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return ""
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: Date | string | null): string {
  if (!date) return ""
  return format(new Date(date), "MMM d, yyyy")
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return ""
  return format(new Date(date), "MMM d, yyyy 'at' HH:mm")
}

export function mergeTemplateVariables(
  html: string,
  variables: Record<string, string>
): string {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match
  })
}

export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim()
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + "..."
}

export function sanitize(html: string): string {
  if (!html) return ""
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "strike",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "blockquote", "code", "pre",
      "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
      "hr", "span", "div",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "class", "target", "rel", "title", "width", "height"],
    ALLOW_DATA_ATTR: false,
  })
}

export function computeReadingTime(html: string): number {
  const text = htmlToText(html)
  const wordCount = text.split(/\s+/).length
  return Math.ceil(wordCount / 200) // 200 wpm average
}
