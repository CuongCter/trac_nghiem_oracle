import dayjs from "dayjs";
import "dayjs/locale/vi";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale("vi");

export function formatDate(value?: string | Date | null, pattern = "DD/MM/YYYY") {
  if (!value) return "—";
  return dayjs(value).format(pattern);
}

export function formatDateTime(
  value?: string | Date | null,
  pattern = "DD/MM/YYYY HH:mm",
) {
  if (!value) return "—";
  return dayjs(value).format(pattern);
}

export function formatTime(value?: string | Date | null, pattern = "HH:mm") {
  if (!value) return "—";
  return dayjs(value).format(pattern);
}

export function formatScore(value: number | string | null | undefined, max = 10) {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(2)} / ${max}`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`;
}

/** Format milliseconds as MM:SS */
export function formatCountdown(ms: number) {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Format ms as "1h 5m" or "5m 30s" */
export function formatMs(ms: number) {
  if (ms <= 0) return "0s";
  const d = dayjs.duration(ms);
  const days = d.days();
  const hours = d.hours();
  const minutes = d.minutes();
  const seconds = d.seconds();

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function fromNow(value?: string | Date | null) {
  if (!value) return "—";
  return dayjs(value).fromNow();
}

export { dayjs };
