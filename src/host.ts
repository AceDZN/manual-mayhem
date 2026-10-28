/** Workbook version1 bridge. Standalone play sends no messages. */
export type HostMessage =
  | { type: "ready" }
  | { type: "level-start"; level: number }
  | { type: "level-complete"; level: number; durationMs: number }
  | { type: "error"; message: string };

export function isWorkbookParentOrigin(origin: string): boolean {
  return /^(https:\/\/([a-z0-9-]+\.)*workbook\.co\.il|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/.test(origin);
}
export function parseLevelParam(search: string, levelCount: number): number | null {
  if (!Number.isInteger(levelCount) || levelCount < 1) return null;
  const raw = new URLSearchParams(search).get("level");
  if (raw === null || !/^\d+$/.test(raw)) return null;
  const level = Number(raw);
  return level >= 1 && level <= levelCount ? level : null;
}
let slug = "", target: string | null = null;
export function initHost(gameSlug: string): void {
  slug = gameSlug;
  target = null;
  if (window.parent === window) return;
  let origin = window.location.ancestorOrigins?.[0] || "";
  if (!origin && document.referrer) {
    try { origin = new URL(document.referrer).origin; } catch { /* No parent origin. */ }
  }
  target = isWorkbookParentOrigin(origin) ? origin : null;
  if (!target) return;
  window.addEventListener("error", (event) => postToHost({ type: "error", message: String(event.message).slice(0, 200) }));
  window.addEventListener("unhandledrejection", (event) => postToHost({ type: "error", message: String(event.reason).slice(0, 200) }));
}
export function postToHost(message: HostMessage): void {
  if (target) window.parent.postMessage({ source: "workbook-game", version: 1, slug, ...message }, target);
}
export class WorkbookSession {
  private ready = false;
  private active: number | null = null;
  private completed = false;
  private pending: HostMessage[] = [];
  constructor(private send: (message: HostMessage) => void, private levelCount = 30) {}
  private valid(level: number) { return Number.isInteger(level) && level >= 1 && level <= this.levelCount; }
  private emit(message: HostMessage) {
    if (this.ready) this.send(message);
    else this.pending.push(message);
  }
  markReady() {
    if (this.ready) return;
    this.ready = true;
    this.send({ type: "ready" });
    for (const message of this.pending) this.send(message);
    this.pending = [];
  }
  startLevel(level: number) {
    if (!this.valid(level) || this.active === level) return;
    this.active = level;
    this.completed = false;
    this.emit({ type: "level-start", level });
  }
  completeLevel(level: number, durationMs: number) {
    if (!this.valid(level) || this.active !== level || this.completed || !Number.isFinite(durationMs) || durationMs < 0) return;
    this.completed = true;
    this.emit({ type: "level-complete", level, durationMs: Math.round(durationMs) });
  }
  resetLevel() { this.active = null; this.completed = false; }
}
