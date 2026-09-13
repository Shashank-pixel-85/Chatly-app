import { format, isToday, isYesterday, formatDistanceToNowStrict } from "date-fns";

export function formatMessageTime(ts: number): string {
  return format(new Date(ts), "h:mm a");
}

export function formatDayLabel(ts: number): string {
  const date = new Date(ts);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

export function formatLastSeen(ts: number): string {
  return `last seen ${formatDistanceToNowStrict(new Date(ts), { addSuffix: true })}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function sameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.toDateString() === db.toDateString();
}
